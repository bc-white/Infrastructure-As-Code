const User = require("../../models/user-model/user.model");
const Role = require("../../models/user-model/role.model");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const CONSTANTS = require("../../constants/constants");
const {
  adminSignupRequestValidation,
} = require("../../validators/auth-validators/admin_auth.validator");
const { generateUniqueReferralCode } = require("../../helpers/generateOtpCode");
const auditLogger = require("../../helpers/logger");

const admin_signup = async (req, res) => {
  try {
    const { error } = adminSignupRequestValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const {
      fullName,
      email,
      phoneNumber,
      roleId,
      password,
      country,
      permissions,
    } = req.body;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: `Email is already in use so update user details`,
      });
    }

    const phoneNumberRegex = /^[1-9]\d{1,3}(?!0)\d{6,12}$/;
    if (!phoneNumberRegex.test(phoneNumber)) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "Invalid phone number format. Ensure it includes the country code (e.g., 233549118813).",
      });
    }

    const existingPhoneNumber = await User.findOne({ phoneNumber });
    if (existingPhoneNumber) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Phone number is already in use. so update user details",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const createResponse = await axios.get(
      "https://api.db-ip.com/v2/free/self"
    );

    const referralCode = await generateUniqueReferralCode(fullName);

    // Create new user
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
      phoneNumber,
      roleId,
      ipAddress: createResponse?.data?.ipAddress,
      continentCode: createResponse?.data?.continentCode,
      continentName: createResponse?.data?.continentName,
      countryCode: createResponse?.data?.countryCode,
      countryName: country,
      stateProv: createResponse?.data?.stateProv,
      city: createResponse?.data?.city,
      src: "cpanel",
      referralCode,
      permissions: permissions,
    });
    await newUser.save();

    // await sendSMS(
    //   phoneNumber,
    //   `Hi ${fullName}, your email:${email} and password: ${password} to access ${CONSTANTS.CP_URL}`
    // );

    // log the activity
    auditLogger(
      "cpanel signup",
      `${newUser.email} cpanel signing up`,
      "AdminActivity",
      newUser._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message:
        "Signup successful. Please your email and password has been sent to your phone number",
    });
  } catch (error) {
    auditLogger(
      "cpanel signup Error",
      `cpanel signing up encounted an error: ${error.message}`,
      "AdminActivity"
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during cpanel signup: ${error.message}`,
    });
  }
};

// roles
const roles_all = async (req, res) => {
  try {
    const roles = await Role.find({
      status: true,
      _id: { $ne: "6896375fdb9e2674c11bab32" },
    });

    // log the activity
    auditLogger("Role Data", " Reterieving all roles ", "AdminActivity");

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "All Roles.",
      data: roles,
    });
  } catch (error) {
    auditLogger(
      "Role Data Error",
      `Reterieving all roles encounted an error: ${error.message}`,
      "AdminActivity"
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during Reterieving all roles: ${error.message}`,
    });
  }
};

const me = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId)
      .select(
        "_id firstName lastName email agreementConfirmation isSubscribed emailNotification weeklyReportNotification surveyResponsesNotification ipAddress continentCode continentName countryCode countryName stateProv city photo phoneNumber roleId isSubscribed lastSignIn organization isEmailVerified  refreshToken fcmToken  src isLocked permissions subscription isMfaActive createdAt "
      )
      .populate({
        path: "roleId",
        select: "_id name",
      });

    // log the activity
    auditLogger("User Data", " Reterieving a user data ", "UserActivity");

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "My profile.",
      data: user,
    });
  } catch (error) {
    auditLogger(
      "User Data Error",
      `Reterieving a user data encounted an error: ${error.message}`,
      "UserActivity"
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during Reterieving a user data: ${error.message}`,
    });
  }
};

module.exports = {
  admin_signup,
  roles_all,
  me,
};
