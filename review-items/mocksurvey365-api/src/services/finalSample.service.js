const CONSTANTS = require("../constants/constants");
const { OpenAI } = require("openai");

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: CONSTANTS.OPENAI_API_KEY,
});

class FinalSampleService {
  static async generatingfinalsampleResident(survey, residents) {
    try {
      if (!survey || Object.keys(survey).length === 0) {
        return {
          success: false,
          statusCode: 400,
          message: "Survey data is missing",
        };
      }

      if (!Array.isArray(residents) || residents.length === 0) {
        return {
          success: false,
          statusCode: 400,
          message: "No residents provided",
        };
      }

      /* -------------------------------
         STEP 1: Normalize residents
         (KEEP ALL ORIGINAL DATA)
      -------------------------------- */
      const normalizedResidents = residents.map((r) =>
        this.normalizeResident(r)
      );

      /* -------------------------------
         STEP 2: Hard Exclusions
      -------------------------------- */
      const hardExcluded = normalizedResidents.filter(
        (r) => r.included === false
      );

      /* -------------------------------
         STEP 3: Mandatory Inclusions
      -------------------------------- */
      const mandatoryIncluded = normalizedResidents.filter(
        (r) =>
          (r.included === true || r.source === "manually_added") &&
          r.included !== false
      );

      /* -------------------------------
         STEP 4: Candidate Pool
      -------------------------------- */
      const hardExcludedSet = new Set(hardExcluded);
      const mandatorySet = new Set(mandatoryIncluded);
      const candidatePool = normalizedResidents.filter(
        (r) => !hardExcludedSet.has(r) && !mandatorySet.has(r)
      );

      /* -------------------------------
         STEP 5: OpenAI-assisted analysis
      -------------------------------- */
      const aiInsights =
        candidatePool.length > 0 ? await this.runAIAnalysis(candidatePool) : [];

      const enrichedCandidates = this.mergeAIInsights(
        candidatePool,
        aiInsights
      );

      /* -------------------------------
         STEP 6: Rank candidates
      -------------------------------- */
      enrichedCandidates.sort((a, b) => b.qualityScore - a.qualityScore);

      /* -------------------------------
         STEP 7: Enforce finalSample size
      -------------------------------- */
      const finalSampleResidents = this.enforceFinalSampleSize(
        survey.finalSample,
        mandatoryIncluded,
        enrichedCandidates
      );

      /* -------------------------------
         STEP 8: CMS Exclusion Rule
      -------------------------------- */
      const selectedIds = new Set(
        finalSampleResidents.map((r) => this.getResidentId(r))
      );

      /* -------------------------------
         STEP 9: Risk Grouping (Final Sample)
      -------------------------------- */
      const cleanFinalSample = finalSampleResidents.map(this.sanitizeResident);
      // const cleanExcluded = excludedResidents.map(this.sanitizeResident);

      return {
        finalSample: cleanFinalSample,
        riskSummary: this.buildRiskSummary(cleanFinalSample),
      };
    } catch (error) {
      console.error("Final sample resident generation failed:", error);

      return {
        success: false,
        statusCode: 500,
        message: error.message || "Final sample resident extraction failed",
      };
    }
  }

  static normalizeResident(resident) {
    if (!resident) {
      throw new Error("Resident object is required");
    }

    const HIGH_RISK = [
      "Pressure Ulcers",
      "Fall with Injury",
      "Dialysis",
      "IV Therapy",
      "Indwelling Catheter",
      "Transmission-Based Precautions",
      "Excessive Weight Loss",
      "Dehydration",
      "End of Life Care",
    ];

    const MODERATE_RISK = [
      "Fall",
      "Antidepressant",
      "Antianxiety",
      "Respiratory",
      "Insulin",
      "Dementia",
    ];

    const riskNames = (resident.risks || []).map((r) => r.name);

    const hasHighRisk = riskNames.some((r) => HIGH_RISK.includes(r));

    const moderateRiskCount = riskNames.filter((r) =>
      MODERATE_RISK.includes(r)
    ).length;

    const interviewConcerns =
      resident.interviews?.some((i) => i.answer === "No") || false;

    const observationConcerns =
      resident.observations?.some((o) => o.answer === "No") || false;

    const qualityScore =
      (hasHighRisk ? 3 : 0) +
      moderateRiskCount +
      (interviewConcerns ? 2 : 0) +
      (observationConcerns ? 2 : 0) +
      (resident.isNewAdmission ? 2 : 0) +
      (resident.qualityMeasureCount || 0);

    return {
      ...resident, // 🔴 preserve everything
      hasHighRisk,
      moderateRiskCount,
      interviewConcerns,
      observationConcerns,
      qualityScore,
      supportsCorroboration: false,
      patternSupport: false,
    };
  }

  /**
   * OpenAI analysis (advisory only)
   */
  static async runAIAnalysis(candidates) {
    try {
      const prompt = `
You are assisting a CMS surveyor.

For each resident, return an array of:
- residentId
- supportsCorroboration (boolean)
- patternSupport (boolean)
- reason (string)

Return ONLY valid JSON.

Residents:
${JSON.stringify(
  candidates.map((r) => ({
    _id: r._id,
    risks: r.risks,
    room: r.room,
    interviews: r.interviews,
    observations: r.observations,
    hasHighRisk: r.hasHighRisk,
    qualityScore: r.qualityScore,
  })),
  null,
  2
)}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      });

      const rawText = response.choices[0].message.content;

      const parsed = this.safeJsonParse(rawText);

      if (!Array.isArray(parsed)) {
        throw new Error(
          `AI response is not an array. Received: ${JSON.stringify(
            parsed
          ).substring(0, 200)}`
        );
      }

      return parsed;
    } catch (error) {
      console.error("AI analysis failed:", error.message);
      // Return empty array as fallback - don't block final sample generation
      return [];
    }
  }

  static safeJsonParse(text) {
    if (!text || typeof text !== "string") {
      throw new Error("Invalid input for JSON parsing");
    }

    try {
      return JSON.parse(text);
    } catch {
      try {
        const cleaned = text
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();
        return JSON.parse(cleaned);
      } catch (error) {
        throw new Error(
          `Failed to parse JSON: ${error.message}. Text: ${text.substring(
            0,
            100
          )}`
        );
      }
    }
  }

  /**
   * Merge AI output (cannot override rules)
   */
  static mergeAIInsights(candidates, aiResults) {
    const map = new Map(aiResults.map((r) => [r.residentId, r]));

    return candidates.map((resident) => {
      const residentId = this.getResidentId(resident);
      const ai = map.get(residentId);

      if (!ai) return resident;

      return {
        ...resident,
        supportsCorroboration: ai.supportsCorroboration,
        patternSupport: ai.patternSupport,
        aiReason: ai.reason,
      };
    });
  }

  static getResidentId(resident) {
    if (!resident) return null;

    return (
      resident._id?.toString?.() || resident.generatedId || resident.id || null
    );
  }
  /**
   * Enforce final sample size (number or range)
   */
  static enforceFinalSampleSize(finalSample, mandatory, candidates) {
    const selected = [...mandatory];

    const maxSize = this.resolveFinalSampleSize(finalSample);

    // Sort candidates by priority first (create copy to avoid mutation)
    const sortedCandidates = [...candidates].sort(
      (a, b) => b.qualityScore - a.qualityScore
    );

    for (const candidate of sortedCandidates) {
      if (selected.length >= maxSize) break;
      selected.push(candidate);
    }

    return selected;
  }

  static resolveFinalSampleSize(finalSample) {
    if (typeof finalSample === "number") return finalSample;

    if (typeof finalSample === "string" && finalSample.includes("-")) {
      const [min, max] = finalSample.split("-").map(Number);
      if (isNaN(min) || isNaN(max)) {
        console.warn(`Invalid range format: ${finalSample}, using default`);
        return 30;
      }
      // Use max value for deterministic behavior in production
      return max;
    }

    const parsed = Number(finalSample);
    return isNaN(parsed) ? 30 : parsed; // Default fallback
  }

 static buildRiskSummary(finalSampleResidents) {
  if (!Array.isArray(finalSampleResidents)) {
    return [];
  }

  // ---------------------------
  // 1. Normalization helper
  // ---------------------------
  const normalize = (value = "") =>
    value
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .trim();

  // ---------------------------
  // 2. Risk group definitions
  // ---------------------------
  const RISK_GROUPS = {
    Medications: [
      "INSULIN",
      "ANTICOAGULANT",
      "ANTIBIOTIC",
      "DIURETIC",
      "OPIOID",
      "HYPNOTIC",
      "ANTIANXIETY",
      "ANTIPSYCHOTIC",
      "ANTIDEPRESSANT",
      "RESPIRATORY",
      "ANTIPSYCH MED S",
      "ANTIPSYCH MED L",
      "ANTIANXIETY HYPNOTIC PREV L",
      "ANTIANXIETY HYPNOTIC PERCENT L",
    ],

    BehaviouralSxOthers: ["BEHAV SX AFFECT OTHERS L"],

    IncreaseADLHelp: [
      "INCR ADL HELP L",
      "MOVE INDEP WORSENS L",
    ],

    PressureUlcers: [
      "PRESSURE ULCER",
      "PRESSURE ULCER I",
      "PRESSURE ULCER II",
      "PRESSURE ULCER III",
      "PRESSURE ULCER IV",
      "PRESSURE ULCER U",
      "PRESSURE ULCER S",
      "PRESSURE ULCERS L",
    ],

    WeightLoss: [
      "EXCESSIVE WEIGHT LOSS",
      "EXCESS WT LOSS L",
      "EXCESSIVE WEIGHT LOSS WITHOUT PRESCRIBED WEIGHT LOSS PROGRAM",
    ],

    TubeFeeding: [
      "TUBE FEEDING ENTERAL E",
      "TUBE FEEDING PARENTERAL P",
    ],

    Dehydration: ["DEHYDRATION"],

    PhysicalRestraints: [
      "PHYSICAL RESTRAINTS",
      "PHYS RESTRAINTS L",
    ],

    Falls: [
      "FALL",
      "FALL WITH INJURY",
      "FALL WITH MAJOR INJURY",
      "FALLS L",
      "FALLS W MAJ INJURY L",
    ],

    IndwellingCatheter: ["INDWELLING CATHETER"],

    IVTherapy: ["IV THERAPY", "INTRAVENOUS THERAPY"],

    Dialysis: [
      "DIALYSIS",
      "DIALYSIS PERITONEAL",
      "DIALYSIS HEMO H",
      "DIALYSIS IN FACILITY",
      "DIALYSIS OFFSITE",
    ],

    Hospice: ["HOSPICE"],

    EndOfLifeCare: [
      "END OF LIFE CARE",
      "COMFORT CARE",
      "PALLIATIVE CARE",
    ],

    TransmissionBasedPrecautions: [
      "TRANSMISSION BASED PRECAUTIONS",
    ],

    Tracheostomy: ["TRACHEOSTOMY"],

    Ventilator: ["VENTILATOR"],

    NewOrWorsenedBB: ["NEW OR WORSENED BB L"],

    Infections: [
      "INFECTION",
      "UTI",
      "SEPSIS",
      "GI INFECTION",
      "COVID",
      "FLU",
      "FLU A",
      "MRSA",
      "SCA",
    ],

    PTSDTrauma: ["PTSD", "TRAUMA"],

    AlzheimerDementia: ["ALZHEIMERS", "DEMENTIA"],

    PASARR: ["MD", "ID", "RC", "NO PAS ARR LEVEL II"],
  };


  // ---------------------------
  // 3. Normalize risk keywords
  // ---------------------------
  const NORMALIZED_GROUPS = Object.fromEntries(
    Object.entries(RISK_GROUPS).map(([group, keywords]) => [
      group,
      keywords.map(normalize),
    ])
  );

  // ---------------------------
  // 4. Initialize counters
  // ---------------------------
  const summary = Object.fromEntries(
    Object.keys(NORMALIZED_GROUPS).map((group) => [group, 0])
  );

  // ---------------------------
  // 5. Count residents per group
  // ---------------------------
  for (const resident of finalSampleResidents) {
    const residentRisks = (resident?.risks || [])
      .map((r) => normalize(r?.name))
      .filter(Boolean);

    for (const [groupName, keywords] of Object.entries(NORMALIZED_GROUPS)) {
      const hasGroupRisk = residentRisks.some((risk) =>
        keywords.some((keyword) => risk.includes(keyword))
      );

      if (hasGroupRisk) {
        summary[groupName] += 1;
      }
    }
  }

  // ---------------------------
  // 6. Return formatted output
  // ---------------------------
  return Object.entries(summary)
    .filter(([, count]) => count > 0)
    .map(([riskName, residentCount]) => ({
      riskName,
      residentCount,
    }));
}


  static sanitizeResident(resident) {
    if (!resident) return null;
    if (resident._doc) return { ...resident._doc }; // Mongoose document
    return { ...resident }; // Plain object
  }
}

module.exports = FinalSampleService;
