const {
  TextractClient,
  StartDocumentAnalysisCommand,
  GetDocumentAnalysisCommand,
} = require("@aws-sdk/client-textract");
const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require("crypto");
const CONSTANTS = require("../constants/constants");
const textract = new TextractClient({ 
  region: CONSTANTS.AWS_REGION,
  credentials: {
    accessKeyId: CONSTANTS.AWS_ACCESS_KEY_ID,
    secretAccessKey: CONSTANTS.AWS_SECRET_KEY_ID,
  }
});
const s3Client = new S3Client({ 
  region: CONSTANTS.AWS_REGION,
  credentials: {
    accessKeyId: CONSTANTS.AWS_ACCESS_KEY_ID,
    secretAccessKey: CONSTANTS.AWS_SECRET_KEY_ID,
  }
});
const { OpenAI } = require("openai");

const {
  ResidentValidation,
} = require("../validators/survey-validators/survey.validators");

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: CONSTANTS.OPENAI_API_KEY,
});
class InitialPoolService {
  // initial pool of resident generation
  static async generatingInitialResident(survey, documentsToUpload, residents) {
    try {
      // 1️⃣ Guard clauses
      if (!survey || Object.keys(survey).length === 0) {
        return {
          success: false,
          statusCode: 400,
          message: "Survey data is missing",
        };
      }

      if (!Array.isArray(documentsToUpload) || documentsToUpload.length === 0) {
        return {
          success: false,
          statusCode: 400,
          message: "No documents provided",
        };
      }

      const extractedResidents = [];

      // 2️⃣ Process each document deterministically
      for (const doc of documentsToUpload) {
        if (!doc?.docUrl) {
          throw new Error("Invalid document URL");
        }

        console.log(
          `Processing document type: ${doc.type || "form802"} - ${doc.docUrl}`
        );

        if (!CONSTANTS.AWS_BUCKET_NAME) {
          throw new Error("AWS_BUCKET_NAME environment variable is not set");
        }

        // Extract object key from full S3 URL
        let objectKey;
        try {
          const url = new URL(doc.docUrl);
          // The pathname starts with '/', remove it
          objectKey = url.pathname.replace(/^\/+/, "");
          console.log("Processing file:", objectKey);
        } catch (err) {
          throw new Error(`Invalid S3 URL: ${doc.docUrl}`);
        }

        // Check file metadata
        try {
          const headCommand = new HeadObjectCommand({
            Bucket: CONSTANTS.AWS_BUCKET_NAME,
            Key: objectKey,
          });
          const metadata = await s3Client.send(headCommand);
          const fileSizeMB = (metadata.ContentLength / (1024 * 1024)).toFixed(
            2
          );
          console.log(
            `File size: ${fileSizeMB}MB, Content-Type: ${metadata.ContentType}`
          );
        } catch (error) {
          if (error.name === "NotFound") {
            throw new Error(`File not found in S3: ${objectKey}`);
          }
          console.warn(`Could not check file metadata: ${error.message}`);
        }

        // Start async document analysis
        console.log(`Starting Textract analysis for: ${objectKey}`);
        const startCommand = new StartDocumentAnalysisCommand({
          DocumentLocation: {
            S3Object: {
              Bucket: CONSTANTS.AWS_BUCKET_NAME,
              Name: objectKey,
            },
          },
          FeatureTypes: ["TABLES"],
        });

        const { JobId } = await textract.send(startCommand);
        console.log(`Textract JobId: ${JobId}`);

        // Poll for job completion
        const blocks = await this.pollTextractJob(JobId);

        if (!blocks || blocks.length === 0) {
          throw new Error(`No extractable content in ${doc.docUrl}`);
        }

        // Extract residents based on document type
        let residentsFromDoc;
        if (doc.type === "casperQmIqies") {
          console.log("Extracting CasperQmIqies format...");
          residentsFromDoc = this.extractCasperQmIqiesFromTextract(blocks);
        } else {
          console.log("Extracting Form 802 format...");
          residentsFromDoc = this.extractForm802FromTextract(blocks);
        }

        if (residentsFromDoc.length === 0) {
          throw new Error(`No residents found in ${doc.docUrl}`);
        }

        extractedResidents.push(...residentsFromDoc);
      }

      // 3️⃣ Merge duplicate residents by name
      const mergedResidents = this.mergeDuplicateResidents(extractedResidents);
      //console.log(`Merged ${extractedResidents.length} residents into ${mergedResidents.length} unique residents`);

      // 4️⃣ Add manually added residents (after merging)
      if (residents && residents.length > 0) {
        const manualResidents = residents.map((r) => {
          let cleanResident = r.toObject ? r.toObject() : { ...r };
          return {
            name: cleanResident?.name,
            room: cleanResident?.room,
            admissionDate: cleanResident?.admissionDate,
            providerAndPasarr: cleanResident?.providerAndPasarr ?? "",
            medications: cleanResident?.specialTypes ?? [],
            patientNeeds: cleanResident?.specialTypesOthers ?? [],
            isNewAdmission: cleanResident?.isNewAdmission ?? false,
            diagnosis: cleanResident?.diagnosis ?? "",
            surveyorNotes: cleanResident?.surveyorNotes ?? "",
            included: cleanResident?.included ?? false,
            source: "manually_added",
          };
        });
        mergedResidents.push(...manualResidents);
        console.log(`Added ${manualResidents.length} manually added residents`);
      }

      // 5️⃣ Validate final output
      this.validateResidentsStrict(mergedResidents);

      // 6️⃣ Select initial pool using AI agent
      const selectionResult = await this.selectInitialPoolSize(
        survey,
        mergedResidents
      );

      return selectionResult.selectedResidents;
    } catch (error) {
      console.error("Resident generation failed:", error);

      return {
        success: false,
        statusCode: 500,
        message: error.message || "Resident extraction failed",
      };
    }
  }

  static isLikelyResidentName(value) {
    if (!value) return false;
    const name = String(value).trim();
    if (name.length < 2 || name.length > 80) return false;

    if (!/[a-z]/i.test(name)) return false;

    const normalized = name.replace(/\s+/g, " ");
    return /^[A-Za-z][A-Za-z\s,'\-.]*\(?\d*\)?$/.test(normalized);
  }

  static normalizeResidentNameForKey(value) {
    if (!value) return "";
    return String(value)
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\s*\(\d+\)\s*$/g, "")
      .replace(/\s*,\s*/g, ",")
      .toLowerCase();
  }

  static normalizeResidentNameForDisplay(value) {
    if (!value) return "";
    return String(value)
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\s*,\s*/g, ", ");
  }

  static async selectInitialPoolSize(survey, residents) {
    try {
      // 1️⃣ Guard clauses
      if (!Array.isArray(residents) || residents.length === 0) {
        return {
          success: false,
          statusCode: 400,
          message: "No residents provided for selection",
        };
      }

      console.log(
        `Starting initial pool selection for ${residents.length} residents`
      );

      // 2️⃣ Categorize residents by tier (for AI context)
      const categorizedResidents = this.categorizeResidentsByTier(residents);

      // 3️⃣ Build AI prompt with strict anti-hallucination rules
      const systemPrompt = `You are a CMS survey preparation assistant specializing in Initial Pool selection.

CRITICAL RULES - NEVER VIOLATE:
1. Each selected resident MUST have at least one documented trigger from the data provided
2. DO NOT select residents with identical risk profiles unless needed for coverage
3. DO NOT infer or assume undocumented clinical events
4. Apply selection criteria consistently across all residents
5. ONLY use data explicitly provided - NO hallucination
6. Return ONLY residents that exist in the input data with their EXACT names and attributes

TIERED SELECTION CRITERIA:

🔴 Tier 1 — Mandatory Inclusion (ALWAYS include if present):
• Manually added residents (source === "manually_added" AND included === true)
• New admissions within past 30 days (isNewAdmission === true)
• High-Risk Clinical Indicators:
  - Pressure ulcers (any stage)
  - Tube feeding
  - Tracheostomy
  - Ventilator
  - Dialysis
  - IV Therapy
  - Transmission-based precautions
• Safety / Abuse / Neglect Risk:
  - Physical restraints
  - Recurrent falls (Fall with Injury / Fall w/Major Injury)
  - Dehydration
  - Excessive weight loss
• Infection Control:
  - Any infection present (UTI, COVID, Sepsis, TB, MRSA, etc.)

🟠 Tier 2 — Strong Inclusion Signals (Include unless explicitly excluded):
• Hospice OR End-of-life care
• Antipsychotic medication
• Anticoagulant + Falls
• Opioids + Cognitive impairment (Alzheimer's/Dementia)

🟡 Tier 3 — CASPER-Driven Risk:
• qualityMeasureCount >= 2
• patientNeeds includes: Pressure Ulcers (L), Falls (L), Antipsych Med (L), UTI (L), Excess Wt Loss (L)

🧑‍⚕️ Tier 4 — Manual Overrides (ALWAYS include):
• source === "manually_added"
• included === true (manual flag)

OUTPUT FORMAT:
Return a JSON object with:
{
  "selectedResidents": [
    {
      "name": "exact name from input",
      "selectionReason": "specific tier and trigger that qualified this resident",
      "tier": "Tier 1|Tier 2|Tier 3|Tier 4",
      "triggers": ["list of specific triggers found in data"]
    }
  ],
  "summary": {
    "totalSelected": number,
    "tier1Count": number,
    "tier2Count": number,
    "tier3Count": number,
    "tier4Count": number,
    "reasoning": "brief explanation of selection strategy"
  }
}`;

      const userPrompt = `Survey Context:
- Requested Initial Pool Size: ${survey?.initialPool ?? "not specified"}
- Total Residents Available: ${residents.length}

Resident Data (ONLY use this data - DO NOT invent):
${JSON.stringify(categorizedResidents, null, 2)}

Task: Select residents for the Initial Pool based on the tiered criteria. Each selected resident MUST have documented triggers from the data above.`;

      // 4️⃣ Call OpenAI with strict JSON mode
      console.log("Calling OpenAI for resident selection...");
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1, // Low temperature for deterministic selection
        response_format: { type: "json_object" },
      });

      const aiResponse = completion.choices[0].message.content;
      console.log("OpenAI response received");

      // 5️⃣ Parse and validate AI response
      let selectionResult;
      try {
        selectionResult = JSON.parse(aiResponse);
      } catch (parseError) {
        throw new Error(`Failed to parse AI response: ${parseError.message}`);
      }

      // 6️⃣ Validate that AI didn't hallucinate residents
      const validatedSelection = this.validateAISelection(
        selectionResult,
        residents
      );

      // 7️⃣ Map selected residents back to clean formatted objects
      const selectedResidentObjects = validatedSelection.selectedResidents.map(
        (selected) => {
          const fullResident = residents.find(
            (r) => r.name?.trim() === selected.name?.trim()
          );
          return this.formatResidentForResponse(fullResident);
        }
      );

      console.log(
        `Successfully selected ${selectedResidentObjects.length} residents for initial pool`
      );

      return {
        success: true,
        statusCode: 200,
        selectedResidents: selectedResidentObjects,
        // summary: validatedSelection.summary,
      };
    } catch (error) {
      console.error("Initial pool size selection failed:", error);

      return {
        success: false,
        statusCode: 500,
        message: error.message || "Initial pool size selection failed",
      };
    }
  }

  static categorizeResidentsByTier(residents) {
    return residents.map((resident) => {
      // Extract only relevant fields for AI analysis
      return {
        name: resident.name,
        room: resident.room,
        source: resident.source,
        included: resident.included,
        isNewAdmission: resident.isNewAdmission,
        admissionDate: resident.admissionDate,

        // Tier 1 indicators
        pressureUlcers: resident.pressureUlcers,
        tubeFeeding: resident.tubeFeeding,
        tracheostomy: resident.tracheostomy,
        ventilator: resident.ventilator,
        dialysis: resident.dialysis,
        ivTherapy: resident.ivTherapy,
        transmissionPrecautions: resident.transmissionPrecautions,
        physicalRestraints: resident.physicalRestraints,
        falls: resident.falls,
        dehydration: resident.dehydration,
        excessiveWeightLoss: resident.excessiveWeightLoss,
        infections: resident.infections,

        // Tier 2 indicators
        hospice: resident.hospice,
        endOfLifeCare: resident.endOfLifeCare,
        medications: resident.medications,
        Alzheimers_or_Dementia: resident.Alzheimers_or_Dementia,

        // Tier 3 indicators (CASPER)
        qualityMeasureCount: resident.qualityMeasureCount,
        patientNeeds: resident.patientNeeds,

        // Other relevant fields
        indwellingCatheter: resident.indwellingCatheter,
        ptsdTrauma: resident.ptsdTrauma,
        providerAndPasarr: resident.providerAndPasarr,
      };
    });
  }

  static formatResidentForResponse(resident) {
    if (!resident) return null;

    // Helper function to safely extract string value
    const extractString = (value) => {
      if (!value) return null;
      if (typeof value === 'string') return value.trim();
      if (typeof value === 'object' && value.name) return extractString(value.name);
      return null;
    };

    // Merge medications, falls, infections, and patient needs into risk array
    const risks = [];

    // Add medications to risk
    if (Array.isArray(resident.medications) && resident.medications.length > 0) {
      resident.medications.forEach((med) => {
        const medName = extractString(med);
        if (medName) {
          risks.push({ name: medName });
        }
      });
    }

    // Add falls to risk
    if (Array.isArray(resident.falls) && resident.falls.length > 0) {
      resident.falls.forEach((fall) => {
        const fallName = extractString(fall);
        if (fallName) {
          risks.push({ name: fallName });
        }
      });
    }

    // Add infections to risk
    if (Array.isArray(resident.infections) && resident.infections.length > 0) {
      resident.infections.forEach((infection) => {
        const infectionName = extractString(infection);
        if (infectionName) {
          risks.push({ name: infectionName });
        }
      });
    }

    // Add patient needs to risk
    if (Array.isArray(resident.patientNeeds) && resident.patientNeeds.length > 0) {
      resident.patientNeeds.forEach((need) => {
        const needName = extractString(need);
        if (needName) {
          risks.push({ name: needName });
        }
      });
    }

    // Map boolean fields to human-readable names
    const booleanFieldMap = {
      Alzheimers_or_Dementia: "Alzheimer's / Dementia",
      excessiveWeightLoss: 'Excessive Weight Loss',
      tubeFeeding: 'Tube Feeding',
      dehydration: 'Dehydration',
      physicalRestraints: 'Physical Restraints',
      indwellingCatheter: 'Indwelling Catheter',
      dialysis: 'Dialysis',
      hospice: 'Hospice',
      endOfLifeCare: 'End of Life Care',
      tracheostomy: 'Tracheostomy',
      ventilator: 'Ventilator',
      transmissionPrecautions: 'Transmission-Based Precautions',
      ivTherapy: 'IV Therapy',
      ptsdTrauma: 'PTSD / Trauma',
    };

    // Add boolean flags to risks array with human-readable names
    Object.keys(booleanFieldMap).forEach((field) => {
      if (resident[field] === true) {
        risks.push({ name: booleanFieldMap[field] });
      }
    });

    // Normalize and deduplicate risks
    const normalizeRiskName = (name) => {
      if (!name) return null;
      
      // Normalization rules to handle different naming conventions
      const normalizations = {
        // Falls variations
        'Falls (L)': 'Fall',
        'Fall with Injury': 'Fall with Injury',
        'Falls w/Maj Injury (L)': 'Fall with Major Injury',
        
        // Weight loss variations
        'Excess Wt Loss (L)': 'Excessive Weight Loss',
        'Excessive Weight Loss': 'Excessive Weight Loss',
        
        // Pressure ulcer variations
        'Pressure Ulcers (L)': 'Pressure Ulcers (L)',
        'Pressure Ulcers': 'Pressure Ulcers',
        
        // Antipsychotic variations
        'Antipsych Med (L)': 'Antipsych Med (L)',
        'Antipsych Med (S)': 'Antipsych Med (S)',
        'Antipsychotic': 'Antipsychotic',
        
        // UTI variations
        'UTI (L)': 'UTI (L)',
        'A': 'FLU A',
        'FLU': 'FLU',
        'FLU A': 'FLU A',
        
        // Behavioral variations
        'Behav Sx affect Others (L)': 'Behav Sx affect Others (L)',
        'New or Worsened B/B (L)': 'New or Worsened B/B (L)',
        
        // ADL variations
        'Incr ADL Help (L)': 'Incr ADL Help (L)',
        
        // Physical restraints variations
        'Phys restraints (L)': 'Physical Restraints',
        'Physical Restraints': 'Physical Restraints',
      };
      
      return normalizations[name] || name;
    };

    // Normalize all risk names and remove duplicates
    const normalizedRisks = risks
      .map(risk => {
        const normalized = normalizeRiskName(risk.name);
        return normalized ? { name: normalized } : null;
      })
      .filter(risk => risk !== null);

    // Remove duplicates by creating a Set of unique names
    const uniqueRiskNames = new Set();
    const deduplicatedRisks = normalizedRisks.filter(risk => {
      if (uniqueRiskNames.has(risk.name)) {
        return false;
      }
      uniqueRiskNames.add(risk.name);
      return true;
    });

    // Build clean response object
    return {
      generatedId: crypto.randomUUID(),
      name: resident.name || null,
      room: resident.room || null,
      admissionDate: resident.admissionDate || null,
      isNewAdmission: resident.isNewAdmission || false,
      included: resident.included || true,
      pressureUlcers: resident.pressureUlcers || null,
      risks: deduplicatedRisks.length > 0 ? deduplicatedRisks : [],
      qualityMeasureCount: resident.qualityMeasureCount || 0,
    };
  }

  static validateAISelection(selectionResult, originalResidents) {
    if (
      !selectionResult.selectedResidents ||
      !Array.isArray(selectionResult.selectedResidents)
    ) {
      throw new Error("AI response missing selectedResidents array");
    }

    // Validate each selected resident exists in original data
    const validatedResidents = [];
    const originalNames = new Set(
      originalResidents.map((r) => r.name?.trim().toLowerCase())
    );

    for (const selected of selectionResult.selectedResidents) {
      const normalizedName = selected.name?.trim().toLowerCase();

      if (!originalNames.has(normalizedName)) {
        console.warn(
          `AI hallucinated resident: "${selected.name}" - EXCLUDING from selection`
        );
        continue;
      }

      // Validate that triggers are non-empty
      if (!selected.triggers || selected.triggers.length === 0) {
        console.warn(
          `Resident "${selected.name}" has no documented triggers - EXCLUDING from selection`
        );
        continue;
      }

      validatedResidents.push(selected);
    }

    console.log(
      `Validated ${validatedResidents.length}/${selectionResult.selectedResidents.length} AI-selected residents`
    );

    return {
      selectedResidents: validatedResidents,
      summary: {
        ...selectionResult.summary,
        totalSelected: validatedResidents.length,
      },
    };
  }

  static extractForm802FromTextract(blocks) {
    const blockMap = {};
    blocks.forEach((b) => (blockMap[b.Id] = b));

    const residents = [];

    const tables = blocks.filter((b) => b.BlockType === "TABLE");
    console.log(`Found ${tables.length} tables in document`);

    for (const table of tables) {
      const cells =
        table.Relationships?.find((r) => r.Type === "CHILD")
          ?.Ids.map((id) => blockMap[id])
          .filter((b) => b.BlockType === "CELL") || [];

      console.log(`Table has ${cells.length} cells`);

      const rows = {};

      for (const cell of cells) {
        rows[cell.RowIndex] ||= {};

        // Extract text from child WORD blocks
        let cellText = "";
        if (cell.Relationships) {
          const wordRelation = cell.Relationships.find(
            (r) => r.Type === "CHILD"
          );
          if (wordRelation) {
            const words = wordRelation.Ids.map((id) => blockMap[id])
              .filter((b) => b.BlockType === "WORD")
              .map((w) => w.Text)
              .join(" ");
            cellText = words.trim();
          }
        }

        // Debug: Log cells with SELECTION_ELEMENT (checkboxes)
        if (cell.Relationships) {
          const selectionRelation = cell.Relationships.find(
            (r) => r.Type === "CHILD"
          );
          if (selectionRelation) {
            const selections = selectionRelation.Ids.map(
              (id) => blockMap[id]
            ).filter((b) => b.BlockType === "SELECTION_ELEMENT");
            if (selections.length > 0) {
              // console.log(`Cell [${cell.RowIndex}, ${cell.ColumnIndex}] has SELECTION_ELEMENT: ${selections[0].SelectionStatus}`);
              // Use SELECTED status as checkmark
              if (selections[0].SelectionStatus === "SELECTED") {
                cellText = "✓"; // Mark as checked
              }
            }
          }
        }

        rows[cell.RowIndex][cell.ColumnIndex] = cellText;
      }
      // console.log(`Extracted ${Object.keys(rows).length} rows from table`);

      for (const row of Object.values(rows)) {
        if (!row[1]) continue; // no resident name

        // Skip header rows
        const name = row[1].trim();
        if (!this.isLikelyResidentName(name)) {
          continue;
        }
        if (
          name === "Resident Name" ||
          name === "Unit: Station" ||
          name.includes("Unit:")
        ) {
          continue;
        }

        //    console.log(`Found resident: ${name}`);
        residents.push(this.mapRowToResident(row));
      }
    }

    console.log(`Total residents extracted: ${residents.length}`);
    return residents;
  }

  static extractCasperQmIqiesFromTextract(blocks) {
    const blockMap = {};
    blocks.forEach((b) => (blockMap[b.Id] = b));

    const residents = [];
    const qualityMeasureHeaders = [
      "Pressure Ulcers (L)",
      "Phys restraints (L)",
      "Falls (L)",
      "Falls w/Maj Injury (L)",
      "Antipsych Med (S)",
      "Antipsych Med (L)",
      "Antianxiety/Hypnotic Prev (L)",
      "Antianxiety/Hypnotic % (L)",
      "Behav Sx affect Others (L)",
      "Depress Sx (L)",
      "UTI (L)",
      "Cath Insert/Left Bladder (L)",
      "New or Worsened B/B (L)",
      "Excess Wt Loss (L)",
      "Incr ADL Help (L)",
      "Move Indep Worsens (L)",
      "Discharge Function Score",
    ];

    const tables = blocks.filter((b) => b.BlockType === "TABLE");
    console.log(`Found ${tables.length} tables in CasperQmIqies document`);

    for (const table of tables) {
      const cells =
        table.Relationships?.find((r) => r.Type === "CHILD")
          ?.Ids.map((id) => blockMap[id])
          .filter((b) => b.BlockType === "CELL") || [];

      console.log(`Table has ${cells.length} cells`);

      const rows = {};

      for (const cell of cells) {
        rows[cell.RowIndex] ||= {};

        let cellText = "";
        if (cell.Relationships) {
          const wordRelation = cell.Relationships.find(
            (r) => r.Type === "CHILD"
          );
          if (wordRelation) {
            const words = wordRelation.Ids.map((id) => blockMap[id])
              .filter((b) => b.BlockType === "WORD")
              .map((w) => w.Text)
              .join(" ");
            cellText = words.trim();
          }
        }

        rows[cell.RowIndex][cell.ColumnIndex] = cellText;
      }

      console.log(`Extracted ${Object.keys(rows).length} rows from table`);

      for (const row of Object.values(rows)) {
        if (!row[1]) continue;

        const name = row[1].trim();
        if (
          name === "Resident Name" ||
          name === "Resident NameResident IDA0310A/B/F" ||
          name.includes("MDS 3.0") ||
          name.includes("iQIES")
        ) {
          continue;
        }

        const residentId = row[2]?.trim();
        const assessmentType = row[3]?.trim();

        if (!residentId || !/^\d{6,10}$/.test(residentId)) {
          continue;
        }

        const patientNeeds = [];
        let qualityMeasureCount = 0;

        for (let i = 4; i <= 19; i++) {
          const marker = row[i]?.trim();
          if (marker === "X" || marker === "x") {
            const headerIndex = i - 4;
            if (headerIndex < qualityMeasureHeaders.length) {
              patientNeeds.push(qualityMeasureHeaders[headerIndex]);
              qualityMeasureCount++;
            }
          }
        }

        const resident = {
          name: name,
          residentId: residentId,
          assessmentType: assessmentType || null,
          patientNeeds: patientNeeds,
          qualityMeasureCount: qualityMeasureCount,
          source: "casperQmIqies",
        };

        residents.push(resident);
        console.log(
          `Found CasperQmIqies resident: ${name} (${residentId}) - ${patientNeeds.length} patient needs`
        );
      }
    }

    console.log(`Total CasperQmIqies residents extracted: ${residents.length}`);
    return residents;
  }

  static mergeDuplicateResidents(residents) {
    const residentMap = new Map();

    for (const resident of residents) {
      const rawName = resident.name?.trim();
      if (!rawName) continue;

      const keyName = this.normalizeResidentNameForKey(rawName);
      const displayName = this.normalizeResidentNameForDisplay(rawName);

      if (residentMap.has(keyName)) {
        const existing = residentMap.get(keyName);

        // Keep the cleaner name (without parentheses)
        if (!existing.name.includes("(") && rawName.includes("(")) {
          // Keep existing name
        } else if (existing.name.includes("(") && !rawName.includes("(")) {
          existing.name = displayName;
        } else if (existing.name && existing.name !== displayName) {
          existing.name = existing.name.length <= displayName.length ? existing.name : displayName;
        }

        // Merge patient needs
        const mergedPatientNeeds = [
          ...(existing.patientNeeds || []),
          ...(resident.patientNeeds || []),
        ];
        existing.patientNeeds = [...new Set(mergedPatientNeeds)];

        // Merge sources
        const existingSources = existing.source
          ? existing.source.split(", ")
          : [];
        const newSource = resident.source || "";
        if (newSource && !existingSources.includes(newSource)) {
          existingSources.push(newSource);
        }
        existing.source = existingSources.join(", ");

        // Keep first non-null values
        existing.room = existing.room || resident.room;
        existing.admissionDate =
          existing.admissionDate || resident.admissionDate;
        existing.residentId = existing.residentId || resident.residentId;
        existing.assessmentType =
          existing.assessmentType || resident.assessmentType;

        // Sum quality measure count
        existing.qualityMeasureCount =
          (existing.qualityMeasureCount || 0) +
          (resident.qualityMeasureCount || 0);

        // Merge other fields
        for (const key in resident) {
          if (
            key === "name" ||
            key === "source" ||
            key === "patientNeeds" ||
            key === "qualityMeasureCount"
          )
            continue;

          if (
            !existing[key] &&
            resident[key] !== undefined &&
            resident[key] !== null
          ) {
            existing[key] = resident[key];
          } else if (
            Array.isArray(existing[key]) &&
            Array.isArray(resident[key])
          ) {
            existing[key] = [...new Set([...existing[key], ...resident[key]])];
          }
        }
      } else {
        const cleanedResident = { ...resident };
        cleanedResident.name = displayName;
        residentMap.set(keyName, cleanedResident);
      }
    }

    return Array.from(residentMap.values());
  }

  static parseCodes(value) {
    if (!value) return [];

    const codeMap = {
      // Medications
      I: "Insulin",
      AC: "Anticoagulant",
      ABX: "Antibiotic",
      D: "Diuretic",
      O: "Opioid",
      H: "Hypnotic",
      AA: "Antianxiety",
      AP: "Antipsychotic",
      AD: "Antidepressant",
      RESP: "Respiratory",
      F: "Fall",
      FI: "Fall with Injury",
      FMI: "Fall w/Major Injury",

      // Infections
      M: "MRSA",
      WI: "Wound Infection",
      P: "Pneumonia",
      TB: "Tuberculosis",
      VH: "Viral Hepatitis",
      C: "Clostridium Difficile",
      UTI: "Urinary Tract Infection",
      SEP: "Sepsis",
      SCA: "Scabies",
      GI: "Gastrointestinal Infection",
      COVID: "COVID-19",
      O: "Offsite",
      A: "FLU A"
    };

    return value
      .split(/[, ]+/)
      .map((v) => {
        const code = v.trim().toUpperCase();
        return codeMap[code] || code; // Return full name if found, otherwise return original code
      })
      .filter(Boolean);
  }

  static isChecked(value) {
    if (!value) return false;
    let trimmed = value.trim();

    // Debug: Log the actual value and its character codes
    if (trimmed.length > 0 && trimmed.length <= 3) {
      console.log(
        `Checkmark value: "${trimmed}", char codes: ${[...trimmed]
          .map((c) => c.charCodeAt(0))
          .join(",")}`
      );
    }

    // Check for X, checkmarks, or any non-empty value that indicates checked
    return (
      trimmed === "X" ||
      trimmed === "✓" ||
      trimmed === "☑" ||
      (trimmed.length > 0 && trimmed !== " ")
    );
  }

  static mapRowToResident(row) {
    return {
      name: row[1] ?? null, // Resident Name
      room: row[2] ?? null, // Room
      admissionDate: row[3] ?? null, // Admission Date
      Alzheimers_or_Dementia: this.isChecked(row[4]), // Alzheimer's/Dementia
      providerAndPasarr: row[5] ?? null, // Provider & PASRR
      medications: this.parseCodes(row[6]), // Medications
      // I, AC, ABX, D, O, H, AA, AP, AD, RESP

      pressureUlcers: row[7] ?? null, // Pressure Ulcers
      // I, II, III, IV, U

      excessiveWeightLoss: this.isChecked(row[8]), // Excessive Weight Loss

      tubeFeeding: row[9] ?? null, // Tube Feeding
      // E or P

      dehydration: this.isChecked(row[10]), // Dehydration

      physicalRestraints: this.isChecked(row[11]), // Physical Restraints

      falls: this.parseCodes(row[12]), // Falls
      // F, FI, FMI

      indwellingCatheter: this.isChecked(row[13]), // Indwelling Catheter

      dialysis: this.isChecked(row[14]), // Dialysis
      // P, H, F, O

      hospice: this.isChecked(row[15]), // Hospice

      endOfLifeCare: this.isChecked(row[16]), // End of Life Care

      tracheostomy: this.isChecked(row[17]), // Tracheostomy

      ventilator: this.isChecked(row[18]), // Ventilator

      transmissionPrecautions: this.isChecked(row[19]), // Transmission Precautions

      ivTherapy: this.isChecked(row[20]), // IV Therapy

      infections: this.parseCodes(row[21]), // Infections
      // M, WI, P, TB, VH, C, UTI, SEP, SCA, GI, COVID, O

      ptsdTrauma: this.isChecked(row[22]), // PTSD/Trauma
      source: "form802",
    };
  }

  static async pollTextractJob(jobId) {
    const maxAttempts = 60; // 5 minutes max (5 seconds * 60)
    let attempts = 0;
    let allBlocks = [];

    while (attempts < maxAttempts) {
      attempts++;

      const getCommand = new GetDocumentAnalysisCommand({ JobId: jobId });
      const response = await textract.send(getCommand);

      console.log(
        `Textract job status: ${response.JobStatus} (attempt ${attempts}/${maxAttempts})`
      );

      if (response.JobStatus === "SUCCEEDED") {
        // Collect blocks from this page
        allBlocks.push(...(response.Blocks || []));

        // Handle multi-page results
        let nextToken = response.NextToken;
        while (nextToken) {
          const nextCommand = new GetDocumentAnalysisCommand({
            JobId: jobId,
            NextToken: nextToken,
          });
          const nextResponse = await textract.send(nextCommand);
          allBlocks.push(...(nextResponse.Blocks || []));
          nextToken = nextResponse.NextToken;
          console.log(
            `Retrieved additional page, total blocks: ${allBlocks.length}`
          );
        }

        console.log(
          `Textract job completed. Total blocks: ${allBlocks.length}`
        );
        return allBlocks;
      }

      if (response.JobStatus === "FAILED") {
        throw new Error(
          `Textract job failed: ${response.StatusMessage || "Unknown error"}`
        );
      }

      if (response.JobStatus === "PARTIAL_SUCCESS") {
        console.warn(
          `Textract job partially succeeded: ${response.StatusMessage}`
        );
        allBlocks.push(...(response.Blocks || []));
        return allBlocks;
      }

      // Job still in progress, wait before next poll
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
    }

    throw new Error(`Textract job timed out after ${maxAttempts * 5} seconds`);
  }

  static validateResidentsStrict(residents) {
    if (!Array.isArray(residents) || residents.length === 0) {
      throw new Error("No valid residents extracted");
    }

    for (const resident of residents) {
      const { error } = ResidentValidation(resident);

      if (error) {
        throw new Error(`Resident validation failed: ${error.message}`);
      }
    }
  }
}

module.exports = InitialPoolService;
