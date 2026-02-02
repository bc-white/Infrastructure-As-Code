const Joi = require("joi");

const adminSignupRequestValidation = (data) => {
  const schema = Joi.object({
    fullName: Joi.string().min(1).required().messages({
      "string.empty": "Full name is required",
      "any.required": "Full name is required",
    }),

    email: Joi.string().email().required().messages({
      "string.empty": "Email is required",
      "any.required": "Email is required",
      "string.email": "Invalid email format",
    }),

    phoneNumber: Joi.string()
      .regex(/^[1-9]\d{1,3}(?!0)\d{6,12}$/) // Removed + from regex
      .required()
      .messages({
        "string.empty": "Phone number is required",
        "any.required": "Phone number is required",
        "string.pattern.base":
          "Invalid phone number format (e.g., 233549118813). Avoid leading zeroes after the country code.",
      }),

    roleId: Joi.string().min(1).required().messages({
      "string.empty": "Role Id is required",
      "any.required": "Role Id is required",
    }),

    country: Joi.string().min(1).required().messages({
      "string.empty": "Country is required",
      "any.required": "Country is required",
    }),

    password: Joi.string().min(1).required().messages({
      "string.empty": "Password is required",
      "any.required": "Password is required",
    }),

    permissions: Joi.object().allow(null, "").messages({
      "object.base": "permissions is not required",
    }),
  });

  return schema.validate(data);
};


const blockUnblockRequestValidation = (data) => {
  const schema = Joi.object({
    userId: Joi.string().required().messages({
      "string.empty": "user id is required",
      "any.required": "user id is required",
    }),
    isLocked: Joi.boolean().required().messages({
      "boolean.base": "isLocked must be a boolean value",
      "any.required": "isLocked is required",
    }),
  });

  return schema.validate(data);
};

const sendRequestValidation = (data) => {
  const schema = Joi.object({
    message: Joi.string().required().messages({
      "string.empty": "Message is required",
      "any.required": "Message is required",
    }),

    phoneNumbers: Joi.array()
      .items(
        Joi.string()
          .regex(/^[1-9]\d{1,3}(?!0)\d{6,12}$/)
          .messages({
            "string.pattern.base":
              "Invalid phone number format (e.g., 233549118813). Avoid leading zeroes after the country code.",
          })
      )
      .required()
      .messages({
        "array.base": "Phone numbers must be an array",
        "any.required": "Phone numbers are required",
      }),

    messageType: Joi.string()
      .valid("PushNotification", "SmS")
      .required()
      .messages({
        "any.required": "Message type is required",
        "any.only": "Message type must be either 'PushNotification' or 'SmS'",
      }),

    recipientType: Joi.string()
      .valid("RegisteredNumbers", "ImportedNumbers")
      .required()
      .messages({
        "any.required": "Recipient type is required",
        "any.only":
          "Recipient type must be either 'RegisteredNumbers' or 'ImportedNumbers'",
      }),
  });

  return schema.validate(data);
};

module.exports.adminSignupRequestValidation = adminSignupRequestValidation;
module.exports.blockUnblockRequestValidation = blockUnblockRequestValidation;
module.exports.sendRequestValidation = sendRequestValidation;
