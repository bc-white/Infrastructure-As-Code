const InitialAssessmentEntrance = require("../models/surveyModels/initialAssessmentEntrance.model");
const FacilityMandatoryTask = require("../models/surveyModels/mandatoryFacilityTask.model");
const InvestigationData = require("../models/surveyModels/Investigation.model");
const Survey = require("../models/surveyModels/survey.model");
const { predictAgent } = require("../helpers/predictAgent");
const { OpenAI } = require("openai");
const CONSTANTS = require("../constants/constants");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableCell,
  TableRow,
  WidthType,
  AlignmentType,
  HeadingLevel,
} = require("docx");
const path = require("path");
const fs = require("fs");

const openai = new OpenAI({ apiKey: CONSTANTS.OPENAI_API_KEY });

class CitationReportService {
  static async generateCitationReport(surveyId) {
    try {
      console.log(`📋 Starting citation report generation for survey: ${surveyId}`);

      let faciltyProbesData = [];
      let notesData = [];
      let mandatoryProbesData = [];
      let investigateProbesData = [];

      const surveyData = await Survey.findOne({ _id: surveyId })
        .select(
          "_id surveyCreationDate surveyCategory census initialPool finalSample facilityId status uniqueOrgCode createdBy createdAt updatedAt"
        )
        .populate("facilityId", "_id name providerNumber address lastSurvey");

      if (!surveyData) {
        throw new Error("Survey not found");
      }

      let initialAssessmentEntrance = await InitialAssessmentEntrance.find({
        surveyId: surveyId,
      });
      let facilityMandatoryTask = await FacilityMandatoryTask.find({
        surveyId: surveyId,
      });
      let investigation = await InvestigationData.find({ surveyId: surveyId });

      // facility entrance
      // faciltyEntrace.kitchenQuickVisit.probeList (list of objects)
      // faciltyEntrace.facilityEnvironmentalTour.probeList (list of objects)
      if (initialAssessmentEntrance.length > 0) {
        await Promise.all(
          initialAssessmentEntrance.map(async (arr) => {
            let data1 = arr.probeList;
            if (data1 && typeof data1 === "object") {
              Object.keys(data1).forEach((key) => {
                const item = data1[key];
                if (item.probe && item.status && item.compliant === false) {
                  faciltyProbesData.push({
                    question: item.probe,
                    answer: item.status,
                    ftag: item.fTag,
                    citation: item.citation,
                    explanation: item.explanation,
                  });
                }
              });
            }
            notesData.push({
              type: arr.type,
              note: arr.notes || "",
            });
          })
        );
      }

      // facility Mandatory Task
      if (facilityMandatoryTask.length > 0) {
        await Promise.all(
          facilityMandatoryTask.map(async (arr) => {
            if (arr?.probe && arr?.status && arr.compliant === false) {
              mandatoryProbesData.push({
                question: arr.probe,
                answer: arr.status,
                ftag: arr.fTag,
                citation: arr.citation,
                explanation: arr.explanation,
                note: arr.note || "",
              });
            }
          })
        );
      }

      // investigation
      if (investigation.length > 0) {
        await Promise.all(
          investigation.map(async (investigationDoc) => {
            if (
              investigationDoc.investigations &&
              Array.isArray(investigationDoc.investigations)
            ) {
              investigationDoc.investigations.forEach((item) => {
                if (
                  item.title &&
                  item.surveyorStatus &&
                  item.surveyorStatus === "Not Met"
                ) {
                  let transformedAnswer =
                    item.surveyorStatus === "Met" ? "Yes" : "No";
                  investigateProbesData.push({
                    question: `${item.title} for ${investigationDoc.name}`,
                    answer: transformedAnswer,
                    note: item?.overallNotes || "",
                    name: investigationDoc.name,
                    room: investigationDoc.room,
                    admissionDate: investigationDoc.admissionDate,
                    risks: investigationDoc.risks || [],
                  });
                }
              });
            }
          })
        );
      }

      console.log(
        `📊 Collected data: ${faciltyProbesData.length} facility probes, ${mandatoryProbesData.length} mandatory probes, ${investigateProbesData.length} investigation probes`
      );

      const citationPromises = investigateProbesData.map(async (arr) => {
        let agentResponse = await predictAgent(arr?.question, arr?.answer);
        return {
          question: arr?.question,
          answer: arr?.answer,
          ftag: agentResponse.ftag,
          citation: agentResponse.citation,
          explanation: agentResponse.explanation,
          note: arr?.note,
          name: arr.name,
          room: arr.room,
          admissionDate: arr.admissionDate,
          risks: arr.risks,
        };
      });

      const investigateReports = await Promise.all(citationPromises);

      console.log(`✅ Generated ${investigateReports.length} investigation reports`);

      const allCitations = [
        ...faciltyProbesData,
        ...mandatoryProbesData,
        ...investigateReports,
      ];

      const groupedCitations = this.groupCitationsByFTag(allCitations, notesData);
      console.log(`📑 Grouped into ${groupedCitations.length} unique F-tags`);

      const professionalFindings = await this.generateProfessionalFindings(
        groupedCitations,
        surveyData.facilityId.name
      );

      // const doc = await this.createWordDocument(
      //   surveyData,
      //   professionalFindings,
      //   notesData
      // );

      // const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      // const filename = `citationReport-${timestamp}.docx`;
      // const directory = path.join(__dirname, "../../public/citationReport");
      // const filepath = path.join(directory, filename);

      // if (!fs.existsSync(directory)) {
      //   fs.mkdirSync(directory, { recursive: true });
      // }

      // if (fs.existsSync(filepath)) {
      //   await fs.promises.unlink(filepath);
      // }

      // const buffer = await Packer.toBuffer(doc);
      // await fs.promises.writeFile(filepath, buffer);

      // const docUrl = `${CONSTANTS.API_BASE_URL}/public/citationReport/${filename}`;
      // console.log(`✅ Citation report generated: ${docUrl}`);

      return {
        success: true,
        statusCode: 200,
        message: "Citation report generated successfully",
        // docUrl,
        // filename,
        totalFTags: groupedCitations.length,
        totalFindings: professionalFindings.length,
        surveyData,
        professionalFindings,
        
      };
    } catch (error) {
      console.error("❌ Citation report generation failed:", error);
      return {
        success: false,
        statusCode: 500,
        message: error.message || "Citation report generation failed",
      };
    }
  }


  static groupCitationsByFTag(citations, notesData = []) {
    const grouped = {};

    citations.forEach((citation) => {
      const ftag = citation.ftag;
      if (!ftag) {
        console.warn(`⚠️ Skipping citation without F-tag:`, citation.question);
        return;
      }

      if (!grouped[ftag]) {
        grouped[ftag] = {
          ftag: ftag,
          citation: citation.citation || "",
          explanation: citation.explanation || "",
          issues: [],
          residents: [],
          notes: [],
          surveyorNotes: [],
        };
      }

      if (citation.citation && !grouped[ftag].citation) {
        grouped[ftag].citation = citation.citation;
      }
      if (citation.explanation && !grouped[ftag].explanation) {
        grouped[ftag].explanation = citation.explanation;
      }

      grouped[ftag].issues.push({
        question: citation.question,
        answer: citation.answer,
        note: citation.note || "",
      });

      if (citation.name) {
        const residentExists = grouped[ftag].residents.some(
          (r) => r.name === citation.name
        );
        if (!residentExists) {
          // Ensure risks are properly formatted as strings
          let risks = citation.risks || [];
          if (Array.isArray(risks)) {
            risks = risks.map(risk => {
              if (typeof risk === 'object' && risk !== null) {
                return risk.name || risk.type || risk.description || JSON.stringify(risk);
              }
              return String(risk);
            });
          }
          
          grouped[ftag].residents.push({
            name: citation.name,
            room: citation.room || "",
            admissionDate: citation.admissionDate || "",
            risks: risks,
          });
        }
      }

      if (citation.note && citation.note.trim()) {
        const noteExists = grouped[ftag].notes.includes(citation.note.trim());
        if (!noteExists) {
          grouped[ftag].notes.push(citation.note.trim());
        }
      }
    });

    // Add surveyor notes from notesData to relevant F-tags
    notesData.forEach((noteItem) => {
      if (noteItem.note && noteItem.note.trim()) {
        // Try to extract F-tag from note or type
        const ftagMatch = (noteItem.note + " " + noteItem.type).match(/F-?(\d{3,4})/i);
        if (ftagMatch) {
          const ftag = `F${ftagMatch[1]}`;
          if (grouped[ftag]) {
            const noteExists = grouped[ftag].surveyorNotes.some(
              (n) => n.note === noteItem.note.trim()
            );
            if (!noteExists) {
              grouped[ftag].surveyorNotes.push({
                type: noteItem.type,
                note: noteItem.note.trim(),
              });
            }
          }
        }
        // DO NOT add general notes to all F-tags - only add if F-tag is explicitly mentioned
      }
    });

    const uniqueFTags = Object.values(grouped).sort((a, b) => {
      const aNum = parseInt(a.ftag.replace(/\D/g, ""));
      const bNum = parseInt(b.ftag.replace(/\D/g, ""));
      return aNum - bNum;
    });

    console.log(`📊 Unique F-tags identified: ${uniqueFTags.map(f => f.ftag).join(", ")}`);
    uniqueFTags.forEach(f => {
      console.log(`   ${f.ftag}: ${f.issues.length} issues, ${f.residents.length} residents, ${f.surveyorNotes.length} surveyor notes`);
    });
    
    return uniqueFTags;
  }

  static async generateProfessionalFindings(
    groupedCitations,
    facilityName
  ) {
    try {
      console.log(
        `🤖 Generating professional findings for ${groupedCitations.length} F-tags...`
      );

      const systemPrompt = `You are an expert CMS nursing home survey inspector writing official citation report findings.

**CRITICAL: Write detailed narrative paragraphs that describe specific record reviews, interviews, and observations - NOT investigation titles or question lists.**

**CORRECT FINDINGS FORMAT (Follow this narrative style, but use ONLY actual data from the survey):**

✅ "A record review of the Admission Record revealed Resident 3 had admitted on 11/3/20 to the facility. The record review of the MDS (Minimum Data Set, a comprehensive assessment of each resident's functional capabilities) revealed Resident 3 had a BIMS (Brief Interview for Mental Status, a test used to get a quick snapshot of a resident's cognitive function, scored from 0-15, the higher the score, the higher the cognitive function) score of 15."

✅ "A record review of the Medication Administration Record (MAR) dated November 2020 revealed that the enteral tube feeding for Resident 3 had not been given on the following dates: 11/3/20, 11/4/20, 11/5/20 and 4 doses on 11/6/20."

**CRITICAL: These are STYLE examples only. DO NOT copy these examples. DO NOT invent staff interviews, specific dates, or clinical details not in the actual survey data provided below.**

**WRONG FINDINGS FORMAT (DO NOT DO THIS):**

❌ "Behavioral and Emotional Status Investigation for WONG, YUET"
❌ "Accidents Investigation for KELLING, MIN"
❌ "Survey question: Was care plan updated? Finding: No."

**TRANSFORMATION RULES:**

1. **Start with Document Type**: "A record review of the [document name]...", "An interview with the [staff title]...", "An observation during [location/activity]..."

2. **Include ONLY Details from Actual Survey Data**:
   - Document names: Use generic terms (Care Plan, clinical record, facility documentation)
   - Staff titles: DO NOT invent staff interviews unless explicitly in survey data
   - Dates: Use "[date]" placeholder - DO NOT invent specific dates
   - Resident identifiers: Use actual names and room numbers from data
   - Clinical details: Use ONLY risks and details provided in the survey data
   - **FORBIDDEN**: Do not invent staff confirmations, specific dates, or interview details

3. **Expand Acronyms on First Use**: MDS (Minimum Data Set), BIMS (Brief Interview for Mental Status), MAR (Medication Administration Record), DON (Director of Nursing)

4. **Create Cohesive Narratives**: Each finding should be a complete paragraph describing what was reviewed, what was found, and what was deficient

5. **Integrate Surveyor Notes**: Weave notes naturally into the narrative, not as separate bullet points

**SECTIONS TO GENERATE:**

1. **Regulatory Requirement**: Extract EXACTLY from "citation" field
2. **Intent**: General explanation of regulation purpose
3. **Deficiency Statement**: High-level summary of facility failure
4. **Findings**: Detailed narrative paragraphs (3-5 sentences each) describing specific record reviews, interviews, and observations
5. **Recommendations**: Generic, evidence-based corrective actions

**OUTPUT FORMAT:**
{
  "findings": [
    {
      "ftag": "F689",
      "title": "Accidents",
      "regulatoryRequirement": "42 CFR §483.25(d)...",
      "intent": "To ensure resident environment remains free of accident hazards...",
      "deficiencyStatement": "Based on record review and staff interviews, the facility failed to ensure adequate accident investigation and prevention measures for residents with documented fall risks.",
      "detailedFindings": [
        "A record review of Resident WONG, YUET's clinical record (Room 1st 204-B) revealed the resident was identified as high risk for falls. The resident's risk assessment documented fall risk factors including anticoagulant therapy. A review of the accident investigation documentation revealed that following a fall incident, the required accident investigation was not completed as per facility policy.",
        "A review of facility accident investigation protocols revealed that multiple residents with documented fall risks did not have completed accident investigations following fall incidents. The facility's documentation did not demonstrate consistent implementation of the accident investigation policy."
      ],
      "recommendations": [
        "Implement comprehensive accident investigation protocol for all fall incidents",
        "Provide staff training on accident investigation procedures",
        "Review all residents with fall risk for adequate supervision and interventions",
        "Integrate findings into QAPI for ongoing monitoring"
      ]
    }
  ]
}

**KEY PRINCIPLE: Write detailed, professional narrative paragraphs that describe specific documents reviewed, interviews conducted, and observations made - exactly like official CMS citation reports.**

**IMPORTANT: Return your response as valid JSON following the output format specified above.**`;

      const userPrompt = `Facility: ${facilityName}

**SURVEY DATA TO TRANSFORM:**
${JSON.stringify(groupedCitations, null, 2)}

**INSTRUCTIONS: Create detailed narrative findings for each F-tag**

For each F-tag, write findings as detailed narrative paragraphs (3-5 sentences each) that describe:

1. **What document was reviewed**: "A record review of the [Care Plan/MDS/MAR/Admission Record]..."
2. **What was found in the document**: Specific details about the resident, dates, clinical information
3. **What was deficient**: What was missing, incomplete, or not done
4. **Staff interviews**: "An interview with the [DON/Nurse/Administrator] on [date] revealed..."
5. **Observations**: "An observation during [tour/visit] revealed..."

**REMEMBER: Use the narrative style shown above, but transform ONLY the actual survey data provided. Do NOT copy examples. Do NOT invent staff interviews or specific dates not in the data.**`;

      // Log prompt size for debugging
      const totalPromptLength = systemPrompt.length + userPrompt.length;
      console.log(`📝 Prompt size: ${totalPromptLength} characters (${Math.round(totalPromptLength / 4)} estimated tokens)`);
      
      // Process in batches if too many F-tags to avoid token limits
      const BATCH_SIZE = 8; // Process 8 F-tags at a time
      let allFindings = [];
      
      for (let i = 0; i < groupedCitations.length; i += BATCH_SIZE) {
        const batch = groupedCitations.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(groupedCitations.length / BATCH_SIZE);
        
        console.log(`📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} F-tags: ${batch.map(c => c.ftag).join(', ')})`);
        
        const batchUserPrompt = `Facility: ${facilityName}

**SURVEY DATA TO TRANSFORM:**
${JSON.stringify(batch, null, 2)}

**INSTRUCTIONS: Create detailed narrative findings for each F-tag**

For each F-tag, write findings as detailed narrative paragraphs (3-5 sentences each) that describe:

1. **What document was reviewed**: "A record review of the [Care Plan/clinical record/facility documentation]..."
2. **What was found in the document**: Specific details about the resident, clinical information from actual data
3. **What was deficient**: What was missing, incomplete, or not done based on actual survey findings
4. **DO NOT invent**: Staff interviews, specific dates, or details not in the survey data

**CRITICAL REQUIREMENTS:**
- Each finding must be 3-5 sentences describing specific record reviews or observations
- Start each finding with "A record review of..." or "A review of facility documentation..."
- Include resident names, room numbers, and clinical details ONLY when provided in data
- Expand acronyms on first use (MDS, BIMS, MAR, DON, etc.)
- DO NOT invent staff interviews or confirmations
- DO NOT copy the style examples verbatim
- Use ONLY actual data from the survey provided above
- Create cohesive narrative paragraphs that tell the story of what was found

**NOW GENERATE DETAILED NARRATIVE FINDINGS FOR ALL F-TAGS IN THIS BATCH.**`;
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          temperature: 0.1,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: batchUserPrompt },
          ],
          max_tokens: 16000,
        });
        
        const raw = completion.choices?.[0]?.message?.content || "{}";
        const parsed = JSON.parse(raw);
        const batchFindings = parsed.findings || [];
        
        console.log(`   ✅ Generated ${batchFindings.length} findings for batch ${batchNum}`);
        allFindings = allFindings.concat(batchFindings);
        
        // Small delay between batches to avoid rate limits
        if (i + BATCH_SIZE < groupedCitations.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const findings = allFindings;

      findings.forEach((finding) => {
        if (!finding.title || finding.title === finding.ftag) {
          const originalCitation = groupedCitations.find(
            (c) => c.ftag === finding.ftag
          );
          if (originalCitation?.citation) {
            const titleMatch = originalCitation.citation.match(
              /F\d+\s*[-–—:]\s*([^.\n]+)/i
            );
            if (titleMatch && titleMatch[1]) {
              finding.title = titleMatch[1].trim();
            }
          }
        }

        if (!finding.regulatoryRequirement) {
          finding.regulatoryRequirement = "Regulatory requirement not available";
        }
        if (!finding.intent || finding.intent === "Intent of regulation not available") {
          // Extract intent from citation if available
          const originalCitation = groupedCitations.find(
            (c) => c.ftag === finding.ftag
          );
          if (originalCitation?.explanation) {
            finding.intent = originalCitation.explanation;
          } else {
            finding.intent = "To ensure resident safety, dignity, and quality of care in accordance with regulatory standards.";
          }
        }
        if (!finding.deficiencyStatement) {
          finding.deficiencyStatement = "Deficiency statement not available";
        }
        if (!finding.detailedFindings || finding.detailedFindings.length === 0) {
          finding.detailedFindings = ["Findings not available"];
        }
        // if (!finding.recommendations || finding.recommendations.length === 0) {
        //   finding.recommendations = ["Review and implement corrective actions"];
        // }
        // if (!finding.residentsCited) {
        //   finding.residentsCited = [];
        // }
      });

      console.log(`✅ Generated professional findings for ${findings.length} unique F-tags`);
      findings.forEach(f => {
        console.log(`   ${f.ftag} - ${f.title}: ${f.detailedFindings.length} findings`);
      });
      
      return findings;
    } catch (error) {
      console.error("❌ Error generating professional findings:", error.message || error);
      console.log("⚠️ Using fallback findings generation (basic format)");
      
      // Enhanced fallback: Create better narrative findings even without AI
      return groupedCitations.map((citation) => {
        const detailedFindings = [];
        
        // Group issues by resident
        const residentIssues = {};
        citation.issues.forEach((issue) => {
          const residentName = citation.residents.find(r => 
            issue.question.includes(r.name)
          )?.name || "facility";
          
          if (!residentIssues[residentName]) {
            residentIssues[residentName] = [];
          }
          residentIssues[residentName].push(issue);
        });
        
        // Create narrative findings for each resident
        Object.keys(residentIssues).forEach((residentName) => {
          const issues = residentIssues[residentName];
          const resident = citation.residents.find(r => r.name === residentName);
          
          if (resident) {
            const roomInfo = resident.room ? ` (Room ${resident.room})` : "";
            // Ensure risks are strings before joining
            const risks = resident.risks || [];
            const riskStrings = risks.map(risk => {
              if (typeof risk === 'object' && risk !== null) {
                return risk.name || risk.type || risk.description || 'documented risk';
              }
              return String(risk);
            });
            const riskInfo = riskStrings.length > 0 
              ? ` The resident has documented risk factors including ${riskStrings.join(", ")}.` 
              : "";
            
            const finding = `A record review of Resident ${residentName}'s clinical record${roomInfo} revealed deficiencies in ${citation.ftag} compliance.${riskInfo} The review identified that ${issues.map(i => i.question.toLowerCase()).join(", and ")}.`;
            detailedFindings.push(finding);
          } else {
            issues.forEach(issue => {
              detailedFindings.push(`A review of facility documentation revealed that ${issue.question.toLowerCase()}.`);
            });
          }
        });
        
        // Add surveyor notes if available
        if (citation.surveyorNotes && citation.surveyorNotes.length > 0) {
          citation.surveyorNotes.forEach(note => {
            detailedFindings.push(`During the ${note.type}, the surveyor noted: ${note.note}`);
          });
        }
        
        return {
          ftag: citation.ftag,
          title: citation.ftag,
          regulatoryRequirement: citation.citation || "Regulatory requirement not available",
          intent: citation.explanation || "To ensure resident safety, dignity, and quality of care in accordance with regulatory standards.",
          deficiencyStatement: citation.explanation || "Based on record review and observation, the facility failed to ensure compliance with regulatory requirements.",
          detailedFindings: detailedFindings.length > 0 ? detailedFindings : ["Findings not available"],
          // recommendations: [
          //   "Review and implement corrective actions to ensure compliance",
          //   "Provide staff training on regulatory requirements",
          //   "Integrate findings into QAPI for ongoing monitoring",
          // ],
          // residentsCited: citation.residents.map((r) => r.name),
          // scope: "",
          // severity: "",
        };
      });
    }
  }

  static async createWordDocument(survey, findings, notesData) {
    const sections = [];

    sections.push(
      new Paragraph({
        text: "STATEMENT OF DEFICIENCIES AND PLAN OF CORRECTION",
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );

    sections.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Date Printed: ", bold: true }),
          new TextRun(new Date().toLocaleDateString()),
        ],
        alignment: AlignmentType.RIGHT,
        spacing: { after: 200 },
      })
    );

    const facilityInfoTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "PROVIDER NUMBER:", bold: true })],
              width: { size: 30, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [new Paragraph(survey?.facilityId?.providerNumber || "")],
              width: { size: 70, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({ text: "DATE SURVEY COMPLETED:", bold: true }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph(new Date(survey?.updatedAt).toLocaleDateString()),
              ],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  text: "NAME OF PROVIDER OR SUPPLIER:",
                  bold: true,
                }),
              ],
            }),
            new TableCell({
              children: [new Paragraph(survey?.facilityId?.name || "")],
            }),
          ],
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  text: "STREET ADDRESS, CITY, STATE, ZIP CODE:",
                  bold: true,
                }),
              ],
            }),
            new TableCell({
              children: [
                new Paragraph(
                  `${survey?.facilityId?.address?.street || ""} ${
                    survey?.facilityId?.address?.city || ""
                  } ${survey?.facilityId?.address?.state || ""} ${
                    survey?.facilityId?.address?.zipCode || ""
                  }`
                ),
              ],
            }),
          ],
        }),
      ],
    });

    sections.push(facilityInfoTable);
    sections.push(new Paragraph({ text: "", spacing: { after: 200 } }));

    sections.push(
      new Paragraph({
        text: "INITIAL COMMENTS",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Census: ", bold: true }),
          new TextRun(survey?.census?.toString() || ""),
        ],
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Purpose of Visit: ", bold: true }),
          new TextRun(survey?.surveyCategory || ""),
        ],
        spacing: { after: 50 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Entrance: ", bold: true }),
          new TextRun(new Date(survey?.surveyCreationDate).toLocaleDateString()),
        ],
        spacing: { after: 100 },
      })
    );

    if (notesData && notesData.length > 0) {
      notesData.forEach((note) => {
        if (note.note && note.note.trim()) {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${note.type}: `, bold: true }),
                new TextRun(note.note),
              ],
              spacing: { after: 50 },
            })
          );
        }
      });
    }

    sections.push(
      new Paragraph({
        text: "Common Abbreviations:",
        bold: true,
        spacing: { before: 100, after: 50 },
      })
    );

    const abbreviations = [
      { abbr: "ADON", full: "Assistant Director of Nursing" },
      { abbr: "BIMS", full: "Brief interview of mental status" },
      { abbr: "CNA", full: "Certified Nurse Aide" },
      { abbr: "DON", full: "Director of Nursing" },
      { abbr: "Dx", full: "Diagnosis" },
      { abbr: "LVN", full: "Licensed Vocational Nurse" },
      { abbr: "MD", full: "Medical Doctor" },
      { abbr: "MDS", full: "Minimum Data Set" },
      { abbr: "PRN", full: "as needed" },
      { abbr: "RP", full: "Responsible Party" },
    ];

    abbreviations.forEach((item) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${item.abbr}: `, bold: true }),
            new TextRun(item.full),
          ],
          spacing: { after: 30 },
        })
      );
    });

    sections.push(new Paragraph({ text: "", spacing: { after: 200 } }));

    findings.forEach((finding) => {
      sections.push(
        new Paragraph({
          text: `${finding?.ftag || ""} - ${finding?.title || ""}`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 100 },
        })
      );

      if (finding?.regulatoryRequirement) {
        sections.push(
          new Paragraph({
            text: "Regulatory Requirement:",
            bold: true,
            spacing: { before: 100, after: 50 },
          }),
          new Paragraph({
            text: finding.regulatoryRequirement,
            spacing: { after: 100 },
          })
        );
      }

      if (finding?.intent) {
        sections.push(
          new Paragraph({
            text: "Intent of the Regulation:",
            bold: true,
            spacing: { before: 100, after: 50 },
          }),
          new Paragraph({
            text: finding.intent,
            spacing: { after: 100 },
          })
        );
      }

      if (finding?.deficiencyStatement) {
        sections.push(
          new Paragraph({
            text: "Deficiency Statement:",
            bold: true,
            spacing: { before: 100, after: 50 },
          }),
          new Paragraph({
            text: finding.deficiencyStatement,
            spacing: { after: 100 },
          })
        );
      }

      if (finding?.detailedFindings && finding.detailedFindings.length > 0) {
        sections.push(
          new Paragraph({
            text: "Findings:",
            bold: true,
            spacing: { before: 100, after: 50 },
          })
        );
        finding.detailedFindings.forEach((detail) => {
          sections.push(
            new Paragraph({
              text: detail,
              spacing: { after: 50 },
              indent: { left: 360 },
            })
          );
        });
      }

      // Residents are already mentioned in the detailed findings narratives
      // No need for separate "Residents Cited" section

      // if (finding?.recommendations && finding.recommendations.length > 0) {
      //   sections.push(
      //     new Paragraph({
      //       text: "Recommendations / FYIs:",
      //       bold: true,
      //       spacing: { before: 100, after: 50 },
      //     })
      //   );
      //   finding.recommendations.forEach((rec) => {
      //     sections.push(
      //       new Paragraph({
      //         text: `• ${rec}`,
      //         spacing: { after: 50 },
      //         indent: { left: 360 },
      //       })
      //     );
      //   });
      // }
    });

    sections.push(
      new Paragraph({
        text:
          "Any deficiency statement ending with an asterisk (*) denotes a deficiency which the institution may be excused from correcting providing it is determined that other safeguards provide sufficient protection to the patients. (See instructions.) Except for nursing homes, the findings stated above are disclosable 90 days following the date of survey whether or not a plan of correction is provided. For nursing homes, the above findings and plans of correction are disclosable 14 days following the date these documents are made available to the facility. If deficiencies are cited, an approved plan of correction is requisite to continued program participation.",
        spacing: { before: 300, after: 100 },
        size: 18,
      })
    );

    return new Document({
      sections: [
        {
          properties: {},
          children: sections,
        },
      ],
    });
  }
}

module.exports = CitationReportService;
