const Joi = require("joi");

const customerSignupRequestValidation = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().min(1).required().messages({
      "string.empty": "First name is required",
      "any.required": "First name is required",
    }),

    lastName: Joi.string().min(1).required().messages({
      "string.empty": "Last name is required",
      "any.required": "Last name is required",
    }),

    email: Joi.string().email().allow("").messages({
      "string.email": "Invalid email format",
    }),

    organization: Joi.string().required().messages({
      "string.empty": "Organization is required",
      "any.required": "Organization is required",
    }),

    phoneNumber: Joi.string()
      .regex(/^(\+?[1-9]\d{0,3})?[1-9]\d{4,14}$/) // Updated regex for international numbers
      .allow("") // Allow empty string
      .optional() // Make field optional
      .messages({
        "string.pattern.base":
          "Invalid phone number format. Use international format (e.g., +1234567890 or 1234567890).",
      }),

    agreementConfirmation: Joi.boolean().required().valid(true).messages({
      "boolean.base": "Agreement confirmation must be a boolean value",
      "any.required": "Agreement confirmation is required",
      "any.only": "You must agree to the terms and conditions",
    }),

    src: Joi.string().min(1).required().messages({
      "string.empty": "src is required",
      "any.required": "src is required",
    }),

    roleId: Joi.string().required().messages({
      "string.empty": "Role id is required",
      "any.required": "Role id is required",
    }),
  });

  return schema.validate(data);
};

const otpRequestValidation = (data) => {
  const schema = Joi.object({
    otp: Joi.string().required().messages({
      "string.empty": "Otp code is required",
      "any.required": "Otp code is required",
    }),
    rememberMe: Joi.boolean().allow(null, "").default(true),
  });

  return schema.validate(data);
};


const codeRequestValidation = (data) => {
  const schema = Joi.object({
    code: Joi.string().required().messages({
      "string.empty": "Code is required",
      "any.required": "Code is required",
    }),
    email: Joi.string().required().messages({
      "string.empty": "Email is required",
      "any.required": "Email is required",
    }),
  });

  return schema.validate(data);
};

const reset2FARequestValidation = (data) => {
  const schema = Joi.object({
    isMfaActive: Joi.boolean().required().messages({
      "boolean.base": "isMfaActive must be a boolean value",
      "any.required": "isMfaActive is required",
    }),
  });

  return schema.validate(data);
};

const loginRequestValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.empty": "Email is required",
      "any.required": "Email is required",
      "string.email": "Invalid email format",
    }),
  });

  return schema.validate(data);
};

const resendOtpRequestValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.empty": "Email is required",
      "any.required": "Email is required",
      "string.email": "Invalid email format",
    }),
  });

  return schema.validate(data);
};

const updateProfileRequestValidation = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().min(1).required().messages({
      "string.empty": "First name is required",
      "any.required": "First name is required",
    }),

    lastName: Joi.string().min(1).required().messages({
      "string.empty": "Last name is required",
      "any.required": "Last name is required",
    }),

    phoneNumber: Joi.string()
      .regex(/^(\+?[1-9]\d{0,3})?[1-9]\d{4,14}$/) // Updated regex for international numbers
      .allow("") // Allow empty string
      .optional() // Make field optional
      .messages({
        "string.pattern.base":
          "Invalid phone number format. Use international format (e.g., +1234567890 or 1234567890).",
      }),

    organization: Joi.string().allow("").messages({
      "string.empty": "Organization is required",
      "any.required": "Organization is required",
    }),
  });

  return schema.validate(data);
};

const changePasswordRequestValidation = (data) => {
  const schema = Joi.object({
    currentPassword: Joi.string().required().messages({
      "string.empty": "Current password is required",
      "any.required": "Current password is required",
    }),

    newPassword: Joi.string().required().messages({
      "string.empty": "New password is required",
      "any.required": "New password is required",
    }),

    confirmPassword: Joi.string().required().messages({
      "string.empty": "Confirm password is required",
      "any.required": "Confirm password is required",
    }),
  });

  return schema.validate(data);
};

const fcmTokenValidation = (data) => {
  const schema = Joi.object({
    fcmtoken: Joi.string().required().messages({
      "string.empty": "fcm token is required",
      "any.required": "fcm token is required",
    }),
  });

  return schema.validate(data);
};

const updatePreferencesRequestValidation = (data) => {
  const schema = Joi.object({
    emailNotification: Joi.boolean().optional().messages({
      "boolean.base": "Email notification must be a boolean value",
      "any.required": "Email notification is required",
    }),
    surveyResponsesNotification: Joi.boolean().optional().messages({
      "boolean.base": "Survey responses notification must be a boolean value",
      "any.required": "Survey responses notification is required",
    }),
    weeklyReportNotification: Joi.boolean().optional().messages({
      "boolean.base": "Weekly report notification must be a boolean value",
      "any.required": "Weekly report notification is required",
    }),
  });
};

const forgetPasswordRequestValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.empty": "Email is required",
      "any.required": "Email is required",
      "string.email": "Invalid email format",
    }),
  });

  return schema.validate(data);
};

const resetPasswordRequestValidation = (data) => {
  const schema = Joi.object({
    otp: Joi.string().required().messages({
      "string.empty": "otp is required",
      "any.required": "otp is required",
    }),

    newPassword: Joi.string().required().messages({
      "string.empty": "New password is required",
      "any.required": "New password is required",
    }),
    confirmPassword: Joi.string().required().messages({
      "string.empty": "Confirm password is required",
      "any.required": "Confirm password is required",
    }),
  });
  return schema.validate(data);
};


const setInVitedValidation = (data) => {
  const schema = Joi.object({
    userId: Joi.string().required().messages({
      "string.empty": "userId is required",
      "any.required": "userId is required",
    }),

    invited: Joi.boolean().required().messages({
      "boolean.base": "invited must be a boolean value",
      "any.required": "invited is required",
    }),
  });
  return schema.validate(data);
};


module.exports.customerSignupRequestValidation =
  customerSignupRequestValidation;

module.exports.otpRequestValidation = otpRequestValidation;
module.exports.loginRequestValidation = loginRequestValidation;
module.exports.updateProfileRequestValidation = updateProfileRequestValidation;
module.exports.changePasswordRequestValidation =
  changePasswordRequestValidation;
module.exports.fcmTokenValidation = fcmTokenValidation;
module.exports.resendOtpRequestValidation = resendOtpRequestValidation;
module.exports.updatePreferencesRequestValidation =
  updatePreferencesRequestValidation;
module.exports.forgetPasswordRequestValidation =
  forgetPasswordRequestValidation;

module.exports.resetPasswordRequestValidation = resetPasswordRequestValidation;
module.exports.setInVitedValidation = setInVitedValidation;
module.exports.codeRequestValidation = codeRequestValidation;
module.exports.reset2FARequestValidation = reset2FARequestValidation;