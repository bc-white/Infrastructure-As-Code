const Joi = require("joi");

const addResidentValidation = (data) => {
  const schema = Joi.object({
    name: Joi.string().required().messages({
      "string.base": "Name must be a string value",
      "any.required": "Name is required",
    }),
    room: Joi.string().required().messages({
      "string.base": "Room must be a string value",
      "any.required": "Room is required",
    }),
    age: Joi.number().allow(null, "").default(null),
    admissionDate: Joi.date().required().messages({
      "date.base": "Admission date must be a valid date",
      "any.required": "Admission date is required",
    }),
    primaryDiagnosis: Joi.string().allow(null, "").default(""),
    careLevel: Joi.string().allow(null, "").default(""),
    familyContact: Joi.string().allow(null, "").default(""),
    familyPhone: Joi.string().allow(null, "").default(""),
    specialNeeds: Joi.array().items(Joi.string()).optional().default([]),
    notes: Joi.string().allow(null, "").default(""),
    interviewable: Joi.boolean().default(true),
    facilityId: Joi.string().required().messages({
      "string.base": "Facility ID must be a string value",
      "any.required": "Facility ID is required",
    }),
  });

  return schema.validate(data);
};

const updateResidentValidation = (data) => {
  const schema = Joi.object({
    id: Joi.string().required().messages({
      "string.base": "ID must be a string value",
      "any.required": "ID is required",
    }),
    name: Joi.string().required().messages({
      "string.base": "Name must be a string value",
      "any.required": "Name is required",
    }),
    room: Joi.string().required().messages({
      "string.base": "Room must be a string value",
      "any.required": "Room is required",
    }),
    age: Joi.number().allow(null, "").default(null),
    admissionDate: Joi.date().required().messages({
      "date.base": "Admission date must be a valid date",
      "any.required": "Admission date is required",
    }),
    primaryDiagnosis: Joi.string().allow(null, "").default(""),
    careLevel: Joi.string().allow(null, "").default(""),
    status: Joi.string().valid("active", "discharged", "transferred").default("active"),
    familyContact: Joi.string().allow(null, "").default(""),
    familyPhone: Joi.string().allow(null, "").default(""),
    specialNeeds: Joi.array().items(Joi.string()).optional().default([]),
    notes: Joi.string().allow(null, "").default(""),
    interviewable: Joi.boolean().default(true),
  });

  return schema.validate(data);
};

module.exports = {
  addResidentValidation,
  updateResidentValidation,
};