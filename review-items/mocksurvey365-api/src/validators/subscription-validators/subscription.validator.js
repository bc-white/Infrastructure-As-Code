const Joi = require("joi");

const addSubscriptionRequestValidation = (data) => {
  const schema = Joi.object({
    plan: Joi.string().required().messages({
      "string.base": "plan must be a string value",
      "any.required": "plan is required",
    }),
    pricingModel: Joi.string().required().messages({
      "string.base": "pricing model must be a string value",
      "any.required": "pricing model is required",
    }),
    yearlyPrice: Joi.number().allow(null, "").default(null),
    usageLimit: Joi.string().allow(null, "").default(null),
    additionalSurvey: Joi.string().allow(null, "").default(null),
    included: Joi.array().optional().default([]),
    restrictions: Joi.array().optional().default([])
  });

  return schema.validate(data);
};


const updateSubscriptionRequestValidation = (data) => {
  const schema = Joi.object({
    id: Joi.string().required().messages({
      "string.base": "id must be a string value",
      "any.required": "id is required",
    }),
    plan: Joi.string().required().messages({
      "string.base": "plan must be a string value",
      "any.required": "plan is required",
    }),
    pricingModel: Joi.string().required().messages({
      "string.base": "pricing model must be a string value",
      "any.required": "pricing model is required",
    }),
    yearlyPrice: Joi.number().allow(null, "").default(null),
    usageLimit: Joi.string().allow(null, "").default(null),
    additionalSurvey: Joi.string().allow(null, "").default(null),
    included: Joi.array().optional().default([]),
    restrictions: Joi.array().optional().default([])
  });

  return schema.validate(data);
};


// gama validations
const gammaValidation = (data) => {
  const schema = Joi.object({
    inputText: Joi.string().required().messages({
      "string.base": "inputText must be a string value",
      "any.required": "inputText is required",
    }),
    textMode: Joi.string().optional().default("generate"),
    format: Joi.string().optional().default("presentation"),
    themeName: Joi.string().optional().default("Oasis"),
    numCards: Joi.number().optional().default(10),
    cardSplit: Joi.string().optional().default("auto"),
    additionalInstructions: Joi.string().optional().default(""),
    exportAs: Joi.string().optional().default("pptx"),
    textOptions: Joi.object({
      amount: Joi.string().optional().default("detailed"),
      tone: Joi.string().optional().default("professional, inspiring"),
      audience: Joi.string().optional().default(""),
      language: Joi.string().optional().default("en"),
    }).required(),
    imageOptions: Joi.object({
      source: Joi.string().optional().default("aiGenerated"),
      model: Joi.string().optional().default(""),
      style: Joi.string().optional().default(""),
    }).optional(),
    cardOptions: Joi.object({
      dimensions: Joi.string().optional().default(""),
    }).optional(),
  });

  return schema.validate(data);
};


module.exports.addSubscriptionRequestValidation =
  addSubscriptionRequestValidation;

module.exports.updateSubscriptionRequestValidation =
  updateSubscriptionRequestValidation;

module.exports.gammaValidation = gammaValidation;
  
