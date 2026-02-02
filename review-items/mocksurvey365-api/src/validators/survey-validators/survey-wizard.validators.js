const Joi = require("joi");

// request email validator
const requestEmailValidation = (data) => {
  const schema = Joi.object({
    to: Joi.string().required().messages({
      "string.base": "to must be a string value",
      "any.required": "to is required",
    }),
    subject: Joi.string().required().messages({
      "string.base": "subject must be a string value",
      "any.required": "subject is required",
    }),
    message: Joi.string().required().messages({
      "string.base": "message must be a string value",
      "any.required": "message is required",
    }),
    fileUrl: Joi.string().allow(null, "").default(null),
  });

  return schema.validate(data);
};

// risk based setup
const riskBasedSetupValidation = (data) => {
  const schema = Joi.object({
    surveyMode: Joi.string().required().messages({
      "string.base": "surveyMode must be a string value",
      "any.required": "surveyMode is required",
    }),
    surveyCreationDate: Joi.string().required().messages({
      "string.base": "surveyCreationDate must be a string value",
      "any.required": "surveyCreationDate is required",
    }),
    surveyCategory: Joi.string().required().messages({
      "string.base": "surveyCategory must be a string value",
      "any.required": "surveyCategory is required",
    }),

    facilityId: Joi.string().required().messages({
      "string.base": "facilityId must be a string value",
      "any.required": "facilityId is required",
    }),
    facilityInfo: Joi.object().required().messages({
      "object.base": "facilityInfo must be an object",
      "any.required": "facilityInfo is required",
    }),
    teamMembers: Joi.array().required().messages({
      "array.base": "teamMembers must be an array",
      "any.required": "teamMembers is required",
    }),
    teamCoordinator: Joi.string().required().messages({
      "string.base": "teamCoordinator must be a string value",
      "any.required": "teamCoordinator is required",
    }),

    assignments: Joi.object().required().messages({
      "object.base": "assignments must be an object",
      "any.required": "assignments is required",
    }),

    status: Joi.string().required().messages({
      "string.base": "status must be a string value",
      "any.required": "status is required",
    }),

    riskBasedProcessSetup: Joi.object().required().messages({
      "object.base": "riskBasedProcessSetup must be an object",
      "any.required": "riskBasedProcessSetup is required",
    }),
  });

  return schema.validate(data, { abortEarly: false });
};

// update risk based
const updateRiskBasedSetupValidation = (data) => {
  const schema = Joi.object({
    id: Joi.string().required().messages({
      "string.base": "id must be a string value",
      "any.required": "id is required",
    }),
    surveyMode: Joi.string().required().messages({
      "string.base": "surveyMode must be a string value",
      "any.required": "surveyMode is required",
    }),
    surveyCreationDate: Joi.string().required().messages({
      "string.base": "surveyCreationDate must be a string value",
      "any.required": "surveyCreationDate is required",
    }),
    surveyCategory: Joi.string().required().messages({
      "string.base": "surveyCategory must be a string value",
      "any.required": "surveyCategory is required",
    }),

    facilityId: Joi.string().required().messages({
      "string.base": "facilityId must be a string value",
      "any.required": "facilityId is required",
    }),
    facilityInfo: Joi.object().required().messages({
      "object.base": "facilityInfo must be an object",
      "any.required": "facilityInfo is required",
    }),
    teamMembers: Joi.array().required().messages({
      "array.base": "teamMembers must be an array",
      "any.required": "teamMembers is required",
    }),
    teamCoordinator: Joi.string().required().messages({
      "string.base": "teamCoordinator must be a string value",
      "any.required": "teamCoordinator is required",
    }),

    assignments: Joi.object().required().messages({
      "object.base": "assignments must be an object",
      "any.required": "assignments is required",
    }),

    status: Joi.string().required().messages({
      "string.base": "status must be a string value",
      "any.required": "status is required",
    }),

    riskBasedProcessSetup: Joi.object().required().messages({
      "object.base": "riskBasedProcessSetup must be an object",
      "any.required": "riskBasedProcessSetup is required",
    }),
  });

  return schema.validate(data, { abortEarly: false });
};


module.exports.requestEmailValidation = requestEmailValidation;
module.exports.riskBasedSetupValidation = riskBasedSetupValidation;
module.exports.updateRiskBasedSetupValidation = updateRiskBasedSetupValidation;
