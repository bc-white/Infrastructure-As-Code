const TRIGGER_DEFINITIONS = {
  // Falls and Accidents
  Fall: { outcomes: ["Fall"] },
  "Fall with Injury": { outcomes: ["Fall", "Injury"] },
  "Fall with Major Injury": { outcomes: ["Fall", "MajorInjury"] },
  "Falls (L)": { outcomes: ["Fall"] },
  "Falls w/Maj Injury (L)": { outcomes: ["Fall", "MajorInjury"] },
  F: { outcomes: ["Fall"] },
  FI: { outcomes: ["Fall", "Injury"] },
  FMI: { outcomes: ["Fall", "MajorInjury"] },

  // Pressure Ulcers
  "Pressure Ulcer/Injury": { outcomes: ["PressureUlcer"] },
  "Pressure Ulcers": { outcomes: ["PressureUlcer"] },
  "Pressure Ulcers (L)": { outcomes: ["PressureUlcer"] },

  // Medications - High Risk
  Insulin: { medications: ["Insulin"] },
  Anticoagulant: { medications: ["Anticoagulant"] },
  Diuretic: { medications: ["Diuretic"] },
  Opioid: { medications: ["Opioid"] },
  I: { medications: ["Insulin"] },
  AC: { medications: ["Anticoagulant"] },
  D: { medications: ["Diuretic"] },
  O: { medications: ["Opioid"] },

  // Medications - Psychotropic
  Antipsychotic: { medications: ["Psychotropic"], diagnoses: ["Behavioral"] },
  Antidepressant: { medications: ["Psychotropic"] },
  Antianxiety: { medications: ["Psychotropic"] },
  Hypnotic: { medications: ["Psychotropic"] },
  "Antipsych Med (L)": { medications: ["Psychotropic"], diagnoses: ["Behavioral"] },
  "Antipsych Med (S)": { medications: ["Psychotropic"], diagnoses: ["Behavioral"] },
  "Antianxiety/Hypnotic Prev (L)": { medications: ["Psychotropic"] },
  "Antianxiety/Hypnotic % (L)": { medications: ["Psychotropic"] },
  AP: { medications: ["Psychotropic"], diagnoses: ["Behavioral"] },
  AD: { medications: ["Psychotropic"] },
  AA: { medications: ["Psychotropic"] },
  H: { medications: ["Psychotropic"] },

  // Medications - Other
  Antibiotic: { medications: ["Antibiotic"] },
  Respiratory: { medications: ["Respiratory"] },
  ABX: { medications: ["Antibiotic"] },
  RESP: { medications: ["Respiratory"] },

  // Cognitive and Behavioral
  "Alzheimer's / Dementia": { diagnoses: ["Dementia"] },
  "Behav Sx affect Others (L)": { diagnoses: ["Behavioral"] },
  "New or Worsened B/B (L)": { diagnoses: ["Behavioral"] },
  "Depress Sx (L)": { diagnoses: ["Depression"] },
  "PTSD / Trauma": { diagnoses: ["Trauma"] },

  // Nutrition and Hydration
  "Excessive Weight Loss": { outcomes: ["WeightLoss"] },
  "Excess Wt Loss (L)": { outcomes: ["WeightLoss"] },
  "Tube Feeding": { outcomes: ["TubeFeeding"] },
  Dehydration: { outcomes: ["Dehydration"] },

  // Infections
  "Transmission-Based Precautions": { infectionControl: true },
  FLU: { outcomes: ["Infection"] },
  "UTI (L)": { outcomes: ["Infection", "UTI"] },
  UTI: { outcomes: ["Infection", "UTI"] },
  MRSA: { infectionControl: true, outcomes: ["Infection"] },
  "Wound Infection": { outcomes: ["Infection"], outcomes: ["PressureUlcer"] },
  Pneumonia: { outcomes: ["Infection"] },
  Tuberculosis: { infectionControl: true, outcomes: ["Infection"] },
  "Viral Hepatitis": { infectionControl: true, outcomes: ["Infection"] },
  "Clostridium Difficile": { infectionControl: true, outcomes: ["Infection"] },
  "Urinary Tract Infection": { outcomes: ["Infection", "UTI"] },
  Sepsis: { outcomes: ["Infection"] },
  Scabies: { infectionControl: true, outcomes: ["Infection"] },
  "Gastrointestinal Infection": { outcomes: ["Infection"] },
  "COVID-19": { infectionControl: true, outcomes: ["Infection"] },
  M: { infectionControl: true, outcomes: ["Infection"] },
  WI: { outcomes: ["Infection", "PressureUlcer"] },
  P: { outcomes: ["Infection"] },
  TB: { infectionControl: true, outcomes: ["Infection"] },
  VH: { infectionControl: true, outcomes: ["Infection"] },
  C: { infectionControl: true, outcomes: ["Infection"] },
  SEP: { outcomes: ["Infection"] },
  SCA: { infectionControl: true, outcomes: ["Infection"] },
  GI: { outcomes: ["Infection"] },
  COVID: { infectionControl: true, outcomes: ["Infection"] },

  // Restraints and Safety
  "Physical Restraints": { outcomes: ["Restraints"] },
  "Phys restraints (L)": { outcomes: ["Restraints"] },

  // Catheters and Devices
  "Indwelling Catheter": { outcomes: ["Catheter"] },
  "Cath Insert/Left Bladder (L)": { outcomes: ["Catheter"] },
  "IV Therapy": { outcomes: ["IVTherapy"] },
  Tracheostomy: { outcomes: ["Tracheostomy"] },
  Ventilator: { outcomes: ["Ventilator"] },

  // ADL and Mobility
  "Incr ADL Help (L)": { outcomes: ["ADLDecline"] },
  "Move Indep Worsens (L)": { outcomes: ["MobilityDecline"] },
  "Discharge Function Score": { outcomes: ["FunctionalDecline"] },

  // Special Care
  Dialysis: { outcomes: ["Dialysis"] },
  Hospice: { outcomes: ["Hospice"] },
  "End of Life Care": { outcomes: ["EndOfLife"] },
  Offsite: { outcomes: ["Offsite"] },
  Abuse: { outcomes: ["Abuse"] },
  Death: { outcomes: ["Death"] },
};

const CARE_DOMAIN_RULES = [
  {
    domain: "MedicationManagement",
    match: (ctx) => ctx.medications.length > 0,
    pathways: [
      "Unnecessary Medications, Psychotropic Medications, and Medication",
    ],
  },
  {
    domain: "RespiratoryCare",
    match: (ctx) => ctx.medications.includes("Respiratory"),
    pathways: ["Respiratory Care"],
  },
  {
    domain: "Dialysis",
    match: (ctx) => ctx.outcomes.includes("Dialysis"),
    pathways: ["Dialysis"],
  },
   {
    domain: "Abuse",
    match: (ctx) => ctx.outcomes.includes("Abuse"),
    pathways: ["Abuse"],
  },
   {
    domain: "Death",
    match: (ctx) => ctx.outcomes.includes("Death"),
    pathways: ["Death"],
  },

   {
    domain: "TubeFeeding",
    match: (ctx) => ctx.outcomes.includes("TubeFeeding"),
    pathways: ["Tube Feeding Status"],
  },
  {
    domain: "AccidentPrevention",
    match: (ctx) => ctx.outcomes.includes("Fall"),
    pathways: ["Accidents", "Activities of Daily Living (ADL)"],
  },
  {
    domain: "DementiaCare",
    match: (ctx) => ctx.diagnoses.includes("Dementia"),
    pathways: ["Dementia Care", "Behavioral and Emotional Status"],
  },
  {
    domain: "BehavioralHealth",
    match: (ctx) =>
      ctx.diagnoses.includes("Behav Sx affect Others (L)") ||
      ctx.diagnoses.includes("Behavioral") ||
      ctx.diagnoses.includes("Depression") ||
      ctx.diagnoses.includes("Trauma"),
    pathways: ["Behavioral and Emotional Status"],
  },
  {
    domain: "InfectionControl",
    match: (ctx) =>
      ctx.infectionControl === true || ctx.outcomes.includes("Infection"),
    pathways: ["Infections"],
  },
  {
    domain: "SkinIntegrity",
    match: (ctx) => ctx.outcomes.includes("PressureUlcer"),
    pathways: ["Pressure Ulcer/Injury"],
  },
  {
    domain: "NutritionHydration",
    match: (ctx) =>
      ctx.outcomes.includes("WeightLoss") ||
      ctx.outcomes.includes("Dehydration"),
    pathways: ["Nutrition","Hydration"],
  },
  {
    domain: "RestraintsAndSafety",
    match: (ctx) => ctx.outcomes.includes("Restraints"),
    pathways: ["Physical Restraints", "Accidents"],
  },
  {
    domain: "CatheterCare",
    match: (ctx) =>
      ctx.outcomes.includes("Catheter") || ctx.outcomes.includes("UTI"),
    pathways: ["Urinary Catheter or Urinary Tract Infection", "Infections"],
  },
  {
    domain: "ADLAndMobility",
    match: (ctx) =>
      ctx.outcomes.includes("ADLDecline") ||
      ctx.outcomes.includes("MobilityDecline") ||
      ctx.outcomes.includes("FunctionalDecline"),
    pathways: ["Activities of Daily Living (ADL)","Positioning, Mobility and Range of Motion (ROM)"],
  },
  {
    domain: "SpecializedCare",
    match: (ctx) =>
      ctx.outcomes.includes("Tracheostomy") ||
      ctx.outcomes.includes("Ventilator") ||
      ctx.outcomes.includes("IVTherapy"),
    pathways: ["Respiratory Care"],
  },
  {
    domain: "EndOfLifeCare",
    match: (ctx) =>
      ctx.outcomes.includes("Hospice") || ctx.outcomes.includes("EndOfLife"),
    pathways: ["Hospice and End of Life Care and Services"],
  },
];

class InvestigationService {
  /**
   * Build resident clinical context from risks
   */
  static buildResidentContext(risks) {
    const context = {
      medications: [],
      diagnoses: [],
      outcomes: [],
      infectionControl: false,
    };

    for (const risk of risks || []) {
      const definition = TRIGGER_DEFINITIONS[risk.name];
      if (!definition) continue;

      if (definition.medications)
        context.medications.push(...definition.medications);
      if (definition.diagnoses) context.diagnoses.push(...definition.diagnoses);
      if (definition.outcomes) context.outcomes.push(...definition.outcomes);
      if (definition.infectionControl) context.infectionControl = true;
    }

    return context;
  }

  /**
   * Determine matching pathways based on resident context
   */
  static determinePathways(context) {
    const pathwayNames = new Set();

    for (const rule of CARE_DOMAIN_RULES) {
      if (rule.match(context)) {
        rule.pathways.forEach((pathway) => pathwayNames.add(pathway));
      }
    }

    return [...pathwayNames];
  }

  /**
   * Format question with subquestions
   */
  static formatQuestion(questionData, index) {
    const mainQuestion = `${index}. ${questionData.questionText}`;

    if (!questionData.subQuestion || questionData.subQuestion.length === 0) {
      return mainQuestion;
    }

    const romanNumerals = [
      "i",
      "ii",
      "iii",
      "iv",
      "v",
      "vi",
      "vii",
      "viii",
      "ix",
      "x",
    ];
    const subQuestions = questionData.subQuestion
      .map(
        (sub, idx) =>
          `   ${romanNumerals[idx] || `${idx + 1}`}. ${sub.question}`
      )
      .join("\n");

    return `${mainQuestion}\n${subQuestions}`;
  }

  /**
   * Group questions by section with proper formatting
   */
  static groupQuestionsBySection(questions) {
    const sections = {
      ReviewInAdvance: [],
      Observations: [],
      Interviews: [],
      RecordReview: [],
    };

    const sectionTitles = {};

    for (const question of questions) {
      const section = question.section;

      if (!sections[section]) continue;

      if (!sectionTitles[section] && question.title) {
        sectionTitles[section] = question.title;
      }

      sections[section].push(question);
    }

    const formattedSections = {};

    for (const [sectionKey, sectionQuestions] of Object.entries(sections)) {
      if (sectionQuestions.length === 0) continue;

      const title = sectionTitles[sectionKey] || sectionKey;

      formattedSections[title] = sectionQuestions.map((q, idx) => ({
        question: this.formatQuestion(q, idx + 1),
      }));
    }

    return formattedSections;
  }

  /**
   * Build investigation for a single pathway
   */
  static buildPathwayInvestigation(pathwayName, questions) {
    const CE_pathway_questions = this.groupQuestionsBySection(questions);

    return {
      title: `${pathwayName} Investigation`,
      status: "Not Started",
      required: true,
      pathwayName: pathwayName,
      CE_pathway_questions: CE_pathway_questions,
    };
  }

  /**
   * Generate investigation report for all residents
   */
  static async generateInvestigationReport(finalSampleArray, allQuestions) {
    try {
      if (!Array.isArray(finalSampleArray) || finalSampleArray.length === 0) {
        console.warn("No residents provided for investigation generation");
        return [];
      }

      if (!Array.isArray(allQuestions) || allQuestions.length === 0) {
        console.warn("No questions available in database");
        return [];
      }

      console.log(`\n=== Starting Investigation Generation ===`);
      console.log(`Residents: ${finalSampleArray.length}`);
      console.log(`Total Questions Available: ${allQuestions.length}`);

      const results = [];

      for (const resident of finalSampleArray) {
        console.log(`\n--- Processing Resident: ${resident.name} ---`);

        const context = this.buildResidentContext(resident.risks);
        const matchingPathways = this.determinePathways(context);

        console.log(`Context: ${JSON.stringify(context)}`);
        console.log(`Matching Pathways: ${matchingPathways.join(", ")}`);

        if (matchingPathways.length === 0) {
          console.warn(`No pathways matched for resident ${resident.name}`);
          results.push({
            _id: resident?._id,
            generatedId: resident?.generatedId,
            name: resident?.name,
            room: resident?.room,
            admissionDate: resident?.admissionDate,
            isNewAdmission: resident?.isNewAdmission,
            included: resident?.included,
            risks: resident?.risks,
            surveyId: resident?.surveyId,
            teamMemberUserId: resident?.teamMemberUserId,
            createdAt: resident?.createdAt,
            // ...resident.toObject ? resident.toObject() : resident,
            investigations: [],
          });
          continue;
        }

        const investigations = [];

        for (const pathwayName of matchingPathways) {
          const pathwayQuestions = allQuestions.filter(
            (q) => q.pathwayName === pathwayName
          );

          if (pathwayQuestions.length === 0) {
            console.warn(`No questions found for pathway: ${pathwayName}`);
            continue;
          }

          console.log(
            `  Pathway: ${pathwayName} - ${pathwayQuestions.length} questions`
          );

          const investigation = this.buildPathwayInvestigation(
            pathwayName,
            pathwayQuestions
          );

          investigations.push(investigation);
        }

        console.log(`Total Investigations: ${investigations.length}`);

        results.push({
          _id: resident?._id,
          generatedId: resident?.generatedId,
          name: resident?.name,
          room: resident?.room,
          admissionDate: resident?.admissionDate,
          isNewAdmission: resident?.isNewAdmission,
          included: resident?.included,
          risks: resident?.risks,
          surveyId: resident?.surveyId,
          teamMemberUserId: resident?.teamMemberUserId,
          createdAt: resident?.createdAt,
          investigations: investigations,
          // ...resident.toObject ? resident.toObject() : resident,
        });
      }

      console.log(`\n=== Investigation Generation Complete ===`);
      console.log(`Total Residents Processed: ${results.length}`);
      console.log(
        `Total Investigations Generated: ${results.reduce(
          (sum, r) => sum + r.investigations.length,
          0
        )}`
      );

      return results;
    } catch (error) {
      console.error("Investigation generation failed:", error);
      throw error;
    }
  }
}

module.exports = InvestigationService;
