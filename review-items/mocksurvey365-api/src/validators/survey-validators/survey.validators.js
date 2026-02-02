const Joi = require("joi");

const addSurveyFirstPage = (data) => {
  const schema = Joi.object({
    surveyCreationDate: Joi.date().required().messages({
      "date.base": "Survey Creation Date must be a date value",
      "any.required": "Survey Creation Date is required",
    }),
    surveyCategory: Joi.string().required().messages({
      "string.base": "Survey Category must be a string value",
      "any.required": "Survey Category is required",
    }),
    census: Joi.number().integer().min(0).required().messages({
      "number.base": "census must be a number value",
      "number.integer": "census must be an integer",
      "number.min": "census must be at least 0",
      "any.required": "census is required",
    }),
    initialPool: Joi.alternatives()
      .try(Joi.string(), Joi.number())
      .allow(null, "")
      .optional(),
    finalSample: Joi.alternatives()
      .try(Joi.string(), Joi.number())
      .allow(null, "")
      .optional(),
    facilityId: Joi.string().required().messages({
      "string.base": "facility Id must be a string value",
      "any.required": "facility Id is required",
    }),
    status: Joi.string().allow(null, "").default("setup"),
    teamMembers: Joi.array().optional().default([]),
    // preSurveyRequirements: Joi.array().optional().default([]),
  });

  return schema.validate(data);
};
const updateSurveyFirstPage = (data) => {
  const schema = Joi.object({
    surveyId: Joi.string().required().messages({
      "string.base": "Survey Id must be a string value",
      "any.required": "Survey Id is required",
    }),
    surveyCreationDate: Joi.date().required().messages({
      "date.base": "survey Creation Date must be a date value",
      "any.required": "survey Creation Date is required",
    }),
    surveyCategory: Joi.string().required().messages({
      "string.base": "survey Category must be a string value",
      "any.required": "surveyCategory is required",
    }),
    census: Joi.number().integer().min(0).required().messages({
      "number.base": "census must be a number value",
      "number.integer": "census must be an integer",
      "number.min": "census must be at least 0",
      "any.required": "census is required",
    }),
    initialPool: Joi.alternatives()
      .try(Joi.string(), Joi.number())
      .allow(null, "")
      .optional(),
    finalSample: Joi.alternatives()
      .try(Joi.string(), Joi.number())
      .allow(null, "")
      .optional(),
    facilityId: Joi.string().required().messages({
      "string.base": "facility Id must be a string value",
      "any.required": "facility Id is required",
    }),
    status: Joi.string().allow(null, "").default("setup"),
    teamMembers: Joi.array().optional().default([]),
    // preSurveyRequirements: Joi.array().optional().default([]),
  });

  return schema.validate(data);
};

const removeTeammemberValidation = (data) => {
  const schema = Joi.object({
    teamMemberUserId: Joi.string().required().messages({
      "string.base": "TeamMember UserId must be a string value",
      "any.required": "TeamMember UserId is required",
    }),
    surveyId: Joi.string().required().messages({
      "string.base": "Survey Id must be a string value",
      "any.required": "Survey Id is required",
    }),
  });

  return schema.validate(data);
};

const removeAssignedFacilityFromATeamMemberValidation = (data) => {
  const schema = Joi.object({
    assignedFacilityId: Joi.string().required().messages({
      "string.base": "Assigned Facility Id must be a string value",
      "any.required": "Assigned Facility Id is required",
    }),
    surveyId: Joi.string().required().messages({
      "string.base": "Survey Id must be a string value",
      "any.required": "Survey Id is required",
    }),
  });

  return schema.validate(data);
};

const addSurveySecondPage = (data) => {
  const schema = Joi.object({
    surveyId: Joi.string().required().messages({
      "string.base": "Survey Id must be a string value",
      "any.required": "Survey Id is required",
    }),
    preSurveyRequirements: Joi.array().optional().default([]),
    status: Joi.string().allow(null, ""),
    offsiteChecklist: Joi.array().optional().default([]),
  });

  return schema.validate(data);
};

const addSurveyThirdPage = (data) => {
  const schema = Joi.object({
    surveyId: Joi.string().required().messages({
      "string.base": "Survey Id must be a string value",
      "any.required": "Survey Id is required",
    }),
    status: Joi.string().allow(null, ""),
    entranceTime: Joi.string().allow(null, ""),
    entranceDate: Joi.date().allow(null, ""),
    entranceAttendees: Joi.object().allow(null, "").default({}),
    facilityId: Joi.string().allow(null, ""),
    customItems: Joi.array().optional().default([]),
    isGenerated: Joi.boolean().allow(null, "").default(false),
    isEditing: Joi.boolean().allow(null, "").default(false),
    entranceNotes: Joi.string().allow(null, ""),
    entranceAgenda: Joi.array().optional().default([]),
    bindingArbitration: Joi.object().allow(null, "").default({}),
    residents: Joi.array().optional().default([]),
    documentsToUpload: Joi.array().optional().default([]),
    requestedEntranceItems: Joi.array().optional().default([]),
    initialAssessments: Joi.array().optional().default([]),
  });

  return schema.validate(data);
};

const removeFacilityEntranceResidentValidation = (data) => {
  const schema = Joi.object({
    residentId: Joi.string().required().messages({
      "string.base": "Resident Id must be a string value",
      "any.required": "Resident Id is required",
    }),
    surveyId: Joi.string().required().messages({
      "string.base": "Survey Id must be a string value",
      "any.required": "Survey Id is required",
    }),
  });

  return schema.validate(data);
};

const removeTeamMemberInitialPoolResidentValidation = (data) => {
  const schema = Joi.object({
    surveyId: Joi.string().required().messages({
      "string.base": "Survey Id must be a string value",
      "any.required": "Survey Id is required",
    }),
    generatedId: Joi.string().required().messages({
      "string.base": "generatedId must be a string value",
      "any.required": "generatedId is required",
    }),
  });

  return schema.validate(data);
};

const ResidentValidation = (data) => {
  const schema = Joi.object({
    name: Joi.any(),

    room: Joi.any(),

    admissionDate: Joi.any(),

    providerAndPasarr: Joi.any(),

    Alzheimers_or_Dementia: Joi.any(),

    medications: Joi.any(),

    pressureUlcers: Joi.any(),

    excessiveWeightLoss: Joi.any(),

    tubeFeeding: Joi.any(),

    dehydration: Joi.any(),

    physicalRestraints: Joi.any(),

    falls: Joi.any(),

    indwellingCatheter: Joi.any(),

    dialysis: Joi.any(),

    hospice: Joi.any(),

    endOfLifeCare: Joi.any(),

    tracheostomy: Joi.any(),

    ventilator: Joi.any(),

    transmissionPrecautions: Joi.any(),

    ivTherapy: Joi.any(),

    infections: Joi.any(),

    ptsdTrauma: Joi.any(),
    residentId: Joi.any(),
    patientNeeds: Joi.any(),
    qualityMeasureCount: Joi.any(),
    assessmentType: Joi.any(),
    source: Joi.any(),
    isNewAdmission: Joi.any(),
    diagnosis: Joi.any(),
    surveyorNotes: Joi.any(),
    included: Joi.any(),
  });

  return schema.validate(data);
};

const addInitialPool = (data) => {
  const schema = Joi.object({
    surveyId: Joi.string().required().messages({
      "string.base": "Survey Id must be a string value",
      "any.required": "Survey Id is required",
    }),
    status: Joi.string().allow(null, ""),
    residents: Joi.array().required(),
  });

  return schema.validate(data);
};

const addFinalSample = (data) => {
  const schema = Joi.object({
    surveyId: Joi.string().required().messages({
      "string.base": "Survey Id must be a string value",
      "any.required": "Survey Id is required",
    }),
    status: Joi.string().allow(null, ""),
    residents: Joi.array().required(),
    riskSummary: Joi.array().required(),
  });

  return schema.validate(data);
};

const addInvestigation = (data) => {
  const schema = Joi.object({
    surveyId: Joi.string().required().messages({
      "string.base": "Survey Id must be a string value",
      "any.required": "Survey Id is required",
    }),
    residents: Joi.array().required(),
    status: Joi.string().allow(null, ""),
  });

  return schema.validate(data);
};

const addTeamMemberInitialPool = (data) => {
  const schema = Joi.object({
    surveyId: Joi.string().required().messages({
      "string.base": "Survey Id must be a string value",
      "any.required": "Survey Id is required",
    }),
    residents: Joi.array().required(),
  });

  return schema.validate(data);
};

const teamMemberInitialPoolResidentValidation = (data) => {
  const schema = Joi.object({
    surveyId: Joi.string().required().messages({
      "string.base": "Survey Id must be a string value",
      "any.required": "Survey Id is required",
    }),
    generatedId: Joi.string().required().messages({
      "string.base": "GeneratedId must be a string value",
      "any.required": "GeneratedId is required",
    }),
  });

  return schema.validate(data);
};

const addTeamMemberInvestigations = (data) => {
  const schema = Joi.object({
    surveyId: Joi.string().required().messages({
      "string.base": "Survey Id must be a string value",
      "any.required": "Survey Id is required",
    }),
    residents: Joi.array().required(),
  });

  return schema.validate(data);
};

const addMandatoryFacilityTask = (data) => {
  const schema = Joi.object({
    surveyId: Joi.string().required().messages({
      "string.base": "Survey Id must be a string value",
      "any.required": "Survey Id is required",
    }),
    facilityTasks: Joi.array().required(),
    status: Joi.string().allow(null).allow("").optional(),
  });

  return schema.validate(data);
};

const addTeamMemberMandatoryFacilityTask = (data) => {
  const schema = Joi.object({
    surveyId: Joi.string().required().messages({
      "string.base": "Survey Id must be a string value",
      "any.required": "Survey Id is required",
    }),
    facilityTasks: Joi.array().required(),
  });

  return schema.validate(data);
};

const addTeamMeeting = (data) => {
  const schema = Joi.object({
    surveyId: Joi.string().required().messages({
      "string.base": "Survey Id must be a string value",
      "any.required": "Survey Id is required",
    }),
    status: Joi.string().allow(null).allow("").optional(),
    ethicsComplianceConcerns: Joi.boolean().optional(),
    dailyMeetingAgenda: Joi.object().optional(),
    teamDeterminations: Joi.array().optional(),
    openingStatements: Joi.object().optional(),
    investigations: Joi.array().optional(),
    dailyMeetings: Joi.array().optional(),
  });

  return schema.validate(data);
};

const addMemberTeamMeeting = (data) => {
  const schema = Joi.object({
    surveyId: Joi.string().required().messages({
      "string.base": "Survey Id must be a string value",
      "any.required": "Survey Id is required",
    }),
    teamDeterminations: Joi.array().optional(),
    investigations: Joi.array().optional(),
  });

  return schema.validate(data);
};

const addClosure = (data) => {
  const schema = Joi.object({
    surveyId: Joi.string().required().messages({
      "string.base": "Survey Id must be a string value",
      "any.required": "Survey Id is required",
    }),
    status: Joi.string().allow(null).allow("").optional(),
    surveyClosed: Joi.boolean().optional(),
    closureNotes: Joi.string().allow(null).allow("").optional(),
    closureSignature: Joi.object().optional(),
    surveyCompleted: Joi.boolean().optional(),
  });

  return schema.validate(data);
};

const addExistConference = (data) => {
  const schema = Joi.object({
    surveyId: Joi.string().required().messages({
      "string.base": "Survey Id must be a string value",
      "any.required": "Survey Id is required",
    }),
    status: Joi.string().allow(null).allow("").optional(),
    exitDate: Joi.string().optional(),
    exitTime: Joi.string().optional(),
    exitConference: Joi.object().optional(),
  });

  return schema.validate(data);
};

const addCitationReport = (data) => {
  const schema = Joi.object({
    surveyId: Joi.string().required().messages({
      "string.base": "Survey Id must be a string value",
      "any.required": "Survey Id is required",
    }),
    status: Joi.string().allow(null).allow("").optional(),
    totalFTags: Joi.number().optional(),
    totalFindings: Joi.number().optional(),
    surveyData: Joi.object().optional(),
    professionalFindings: Joi.array().optional(),
    citationReportGenerated: Joi.boolean().optional(),
    disclaimer: Joi.string().allow(null).allow("").optional(),
  });

  return schema.validate(data);
};

const viewResidentTeamMember = (data) => {
  const schema = Joi.object({
    surveyId: Joi.string().required().messages({
      "string.base": "Survey Id must be a string value",
      "any.required": "Survey Id is required",
    }),
    teamMemberUserId: Joi.string().required().messages({
      "string.base": "Team Member Id must be a string value",
      "any.required": "Team Member Id is required",
    }),
  });

  return schema.validate(data);
};

const addplanofCorrectionValidation = (data) => {
  const schema = Joi.object({
    pdfurl: Joi.string().allow(null, "").default(null),
    surveyId: Joi.string().allow(null, "").default(null),
  });

  return schema.validate(data);
};

const addUpdatePlanCorrection = (data) => {
  const schema = Joi.object({
    surveyId: Joi.string().allow(null, "").default(null),
    status: Joi.string().allow(null).allow("").optional(),
    summary: Joi.object().allow(null, "").default({}),
    plansOfCorrection: Joi.array().allow(null, "").default([]),
    education: Joi.object().allow(null, "").default({}),
    disclaimer: Joi.string().allow(null).allow("").optional(),
  });

  return schema.validate(data);
};

module.exports.addSurveyFirstPage = addSurveyFirstPage;
module.exports.updateSurveyFirstPage = updateSurveyFirstPage;
module.exports.removeTeammemberValidation = removeTeammemberValidation;
module.exports.removeAssignedFacilityFromATeamMemberValidation =
  removeAssignedFacilityFromATeamMemberValidation;
module.exports.addSurveySecondPage = addSurveySecondPage;
module.exports.addSurveyThirdPage = addSurveyThirdPage;
module.exports.removeFacilityEntranceResidentValidation =
  removeFacilityEntranceResidentValidation;
module.exports.ResidentValidation = ResidentValidation;
module.exports.addInitialPool = addInitialPool;
module.exports.removeTeamMemberInitialPoolResidentValidation =
  removeTeamMemberInitialPoolResidentValidation;
module.exports.addTeamMemberInitialPool = addTeamMemberInitialPool;
module.exports.teamMemberInitialPoolResidentValidation =
  teamMemberInitialPoolResidentValidation;
module.exports.addFinalSample = addFinalSample;
module.exports.addInvestigation = addInvestigation;
module.exports.addTeamMemberInvestigations = addTeamMemberInvestigations;
module.exports.addMandatoryFacilityTask = addMandatoryFacilityTask;
module.exports.addTeamMemberMandatoryFacilityTask =
  addTeamMemberMandatoryFacilityTask;
module.exports.addTeamMeeting = addTeamMeeting;
module.exports.addClosure = addClosure;
module.exports.addExistConference = addExistConference;
module.exports.addCitationReport = addCitationReport;
module.exports.addplanofCorrectionValidation = addplanofCorrectionValidation;
module.exports.addUpdatePlanCorrection = addUpdatePlanCorrection;
module.exports.addMemberTeamMeeting = addMemberTeamMeeting;
module.exports.viewResidentTeamMember = viewResidentTeamMember;
