const User = require("../../models/user-model/user.model");
const Role = require("../../models/user-model/role.model");
const Facility = require("../../models/configs/facility.model");
const axios = require("axios");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const verifyEmailHtml = require("../../utils/html/verifyEmail");
const verifyLoginHtml = require("../../utils/html/verifyLogin");
const forgotPasswordHtml = require("../../utils/html/passwordReset");
const {
  customerSignupRequestValidation,
  otpRequestValidation,
  loginRequestValidation,
  updateProfileRequestValidation,
  fcmTokenValidation,
  resendOtpRequestValidation,
  changePasswordRequestValidation,
  updatePreferencesRequestValidation,
  forgetPasswordRequestValidation,
  resetPasswordRequestValidation,
  codeRequestValidation,
  reset2FARequestValidation,
} = require("../../validators/auth-validators/customer_auth.vaildator");
const CONSTANTS = require("../../constants/constants");
const { generateUniqueOtp } = require("../../helpers/generateOtpCode");
const { generateUniqueReferralCode } = require("../../helpers/generateOtpCode");
const auditLogger = require("../../helpers/logger");
const { sendEmail } = require("../../helpers/sendEmail");

const customer_signup = async (req, res) => {
  try {
    const { error } = customerSignupRequestValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const {
      firstName,
      lastName,
      email,
      organization,
      phoneNumber,
      agreementConfirmation,
      src,
      roleId,
    } = req.body;

    let ems = email.toLowerCase();

    const existingEmail = await User.findOne({ email: ems });
    if (existingEmail) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: `Email is already in use.`,
      });
    }

    const otp = await generateUniqueOtp();

    const createResponse = await axios.get(
      "https://api.db-ip.com/v2/free/self"
    );

    // const hashedPassword = await bcrypt.hash(password, 10);

    const uniqueCode = await generateUniqueReferralCode(organization);

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email: ems,
      organization,
      phoneNumber,
      agreementConfirmation,
      roleId,
      otpExpires: Date.now() + 1000 * 60 * 60 * 24, // 24 hours (1 day)
      ipAddress: createResponse?.data?.ipAddress,
      continentCode: createResponse?.data?.continentCode,
      continentName: createResponse?.data?.continentName,
      countryCode: createResponse?.data?.countryCode,
      countryName: createResponse?.data?.countryName,
      stateProv: createResponse?.data?.stateProv,
      city: createResponse?.data?.city,
      otp,
      src,
      uniqueCode,
    });
    await newUser.save();

    await sendEmail(
      ems,
      "Verify your email",
      verifyEmailHtml({ firstName, otp })
    );

    auditLogger(
      "user signup",
      `${newUser.ems} user signing up`,
      "UserActivity",
      newUser._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message:
        "Signup successful. Please your one time OTP has been sent to your email",
    });
  } catch (error) {
    auditLogger(
      "user signup Error",
      `user signing up encounted an error: ${error.message}`,
      "UserActivity"
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during user signup: ${error.message}`,
    });
  }
};

// verify otp
const verifyOtp = async (req, res) => {
  try {
    const { error } = otpRequestValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }
    const { otp, rememberMe } = req.body;

    const user = await User.findOne({ otp });

    // Check if OTP exists
    if (!user?.otp) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "No OTP found for this user.",
      });
    }

    // Check if OTP is expired
    if (Date.now() > user?.otpExpires) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "OTP has expired.",
      });
    }

    // Check if the OTP matches
    if (user?.otp !== otp) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Invalid OTP.",
      });
    }
    // If OTP is correct and not expired, you can mark the phone number as verified, etc.
    user.isEmailVerified = true;
    user.rememberMe = rememberMe;
    user.otp = null; // Clear OTP after successful verification
    user.otpExpires = null; // Clear OTP expiration
    await user.save();

    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.roleId,
    };
    const token = jwt.sign(tokenPayload, CONSTANTS.JWT_SECRET, {
      expiresIn: "14d", // Token expires in 14 days
    });

    const refreshToken = jwt.sign(tokenPayload, CONSTANTS.JWT_SECRET, {
      expiresIn: "60d", // Refresh token expires in 60 days
    });

    user.lastSignIn = new Date();
    user.refreshToken = refreshToken;
    await user.save();
    const userInfo = await User.findOne({ _id: user?._id })
      .select(
        "_id firstName lastName  email agreementConfirmation ipAddress continentCode continentName countryCode countryName stateProv city photo phoneNumber roleId organization lastSignIn  isEmailVerified isLocked lockoutTime permissions isSubscribed fcmToken createdAt createdAt rememberMe"
      )
      .populate({ path: "roleId", select: "_id name" });

    // log the activity
    auditLogger(
      "user verify otp",
      `${user.email} user verify otp`,
      "UserActivity",
      user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Otp verified successfully.",
      data: userInfo,
      accessToken: token,
      refreshToken: refreshToken,
    });
  } catch (error) {
    auditLogger(
      "user verify otp Error",
      `user verify otp encounted an error: ${error.message}`,
      "UserActivity"
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during user verify otp: ${error.message}`,
    });
  }
};

// login
const login = async (req, res) => {
  try {
    const { error } = loginRequestValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }
    const { email } = req.body;

    let ems = email.toLowerCase();

    const user = await User.findOne({ email: ems });
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Account does not exist kindly sign up...",
      });
    }

    if (user.isLocked) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "Your account is Locked. Please contact the admin to recover it.",
      });
    }

    if (user?.isMfaActive == true) {
      auditLogger(
        "user login",
        `${user.phoneNumber} user login`,
        "UserActivity",
        user._id
      );

      return res.status(200).json({
        status: true,
        statusCode: 200,
        message:
          "User Login successfully. Kindly Enter the 6-digit verification code generated by your authenticator app to login",
        isMfaActive: true,
      });
    } else {
      const otp = await generateUniqueOtp();
      user.otp = otp;
      user.otpExpires = Date.now() + 1000 * 60 * 60 * 24;
      await user.save();

      await sendEmail(
        ems,
        "Verify your Login for MockSurvey365",
        verifyLoginHtml({ firstName: user?.firstName, otp })
      );

      // log the activity
      auditLogger(
        "user login",
        `${user.phoneNumber} user login`,
        "UserActivity",
        user._id
      );

      return res.status(200).json({
        status: true,
        statusCode: 200,
        message:
          "User Login successfully. Kindly check your email for OTP to login",
        isMfaActive: false,
      });
    }
  } catch (error) {
    auditLogger(
      "user login Error",
      `user login in encounted an error: ${error.message}`,
      "UserActivity"
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during user login: ${error.message}`,
    });
  }
};

// resendOtp
const resendOtp = async (req, res) => {
  try {
    const { error } = resendOtpRequestValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }
    const { email } = req.body;
    const existingEmail = await User.findOne({ email });
    if (!existingEmail) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Email does not exit register.",
      });
    }

    const otp = await generateUniqueOtp();
    existingEmail.otp = otp;
    existingEmail.otpExpires = Date.now() + 1000 * 60 * 60 * 24;
    await existingEmail.save();

    const firstName = existingEmail.firstName;

    await sendEmail(
      email,
      "Verify your email",
      verifyEmailHtml({ firstName, otp })
    );

    // log the activity
    auditLogger(
      "user resend otp",
      `${existingEmail.email} user resend otp ..`,
      "LoginActivity",
      existingEmail._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message:
        "resend successful. Please your one time OTP has been sent to your email",
    });
  } catch (error) {
    auditLogger(
      "user resend otp Error",
      `user resend otp encounted an error: ${error.message}`,
      "UserActivity"
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during user resend otp: ${error.message}`,
    });
  }
};

// uploads
const uploads = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "File not provided or exceeds size limit 16 MB",
      });
    }

    const s3Client = new S3Client({
      region: CONSTANTS.AWS_REGION,
      credentials: {
        accessKeyId: CONSTANTS.AWS_ACCESS_KEY_ID,
        secretAccessKey: CONSTANTS.AWS_SECRET_KEY_ID,
      },
    });

    // Determine file extension based on file type
    let fileExtension = "";
    if (req.file.mimetype.startsWith("audio")) {
      fileExtension = `.${req.file.originalname.split(".").pop()}`;
    } else if (req.file.mimetype.startsWith("video")) {
      fileExtension = `.${req.file.originalname.split(".").pop()}`;
    } else {
      fileExtension = `.${req.file.originalname.split(".").pop()}`;
    }

    // Create a unique file key
    const originalName = req.file.originalname
      .split(".")[0] // Get filename without extension
      .replace(/\s+/g, "_")
      .toLowerCase(); // Replace spaces with underscores and convert to lowercase
    const timestamp = Date.now();
    const fileKey = `uploads/${originalName}_${timestamp}${fileExtension}`; // Added underscore before timestamp

    // Set up S3 upload parameters
    const params = {
      Bucket: CONSTANTS.AWS_BUCKET_NAME,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: "public-read",
    };

    
    // Upload the file to S3
    try {
      await s3Client.send(new PutObjectCommand(params));
      const bucket = CONSTANTS.AWS_BUCKET_NAME;
      const region = CONSTANTS.AWS_REGION;
      const location = `https://${bucket}.s3.${region}.amazonaws.com/${fileKey}`;

      auditLogger(
        " File uploaded successfully",
        "user file uploading",
        "UserActivity",
        req.user?._id
      );

      return res.status(200).send({
        status: true,
        statusCode: 200,
        message: "Upload successfully",
        data: location,
      });
    } catch (err) {
      return res.status(400).send({
        status: false,
        statusCode: 400,
        message: `Upload Failed: ${err.message}`,
      });
    }
  } catch (error) {
    auditLogger(
      "File upload Error",
      `File upload encounted an error: ${error.message}`,
      "UserActivity"
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during file upload: ${error.message}`,
    });
  }
};

// updateProfile
const updateProfile = async (req, res) => {
  try {
    // updateProfileRequestValidation

    const { error } = updateProfileRequestValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { firstName, lastName, phoneNumber, organization } = req.body;
    const userId = req.user?._id;

    await User.findByIdAndUpdate(
      userId,
      {
        firstName,
        lastName,
        phoneNumber,
        organization,
      },
      { new: true, runValidators: true }
    );

    auditLogger(
      "user profile update",
      "user profile updated successfully",
      "UserActivity",
      userId
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "User Profile Updated Successfully",
    });
  } catch (error) {
    auditLogger(
      "user update profile Error",
      `user update profile encounted an error: ${error.message}`,
      "UserActivity"
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during user update profile : ${error.message}`,
    });
  }
};

// change password
const changePassword = async (req, res) => {
  try {
    const { error } = changePasswordRequestValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user?._id;
    const user = await User.findById(userId);
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isValidPassword) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Invalid current password",
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "New password and confirm password do not match",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    auditLogger(
      "user change password",
      `${user.email} user change password`,
      "UserActivity",
      user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Password changed successfully",
    });
  } catch (error) {
    auditLogger(
      "user change password Error",
      `user change password encounted an error: ${error.message}`,
      "UserActivity"
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during user change password: ${error.message}`,
    });
  }
};

// fcmToken
const fcmToken = async (req, res) => {
  try {
    const { error } = fcmTokenValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { fcmtoken } = req.body;
    const userId = req.user?._id;
    const user = await User.findById(userId);

    // Update the user's fcmtoken
    user.fcmToken = fcmtoken;

    await user.save();

    auditLogger(
      "user FCM TOKEN update",
      `${user.email} user FCM TOKEN update`,
      "UserActivity",
      user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "FCM Token updated successfully.",
      data: fcmtoken,
    });
  } catch (error) {
    auditLogger(
      "user FCM TOKEN Error",
      `user FCM TOKEN encounted an error: ${error.message}`,
      "UserActivity"
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during user FCM TOKEN: ${error.message}`,
    });
  }
};

// deleteAccount
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found",
        data: {},
      });
    }

    // Check if user has any balance
    // if (user.wallet.availableBalance > 0) {
    //   return res.status(400).json({
    //     status: false,
    //     statusCode: 400,
    //     message: "Please withdraw all funds before deleting your account",
    //   });
    // }

    // Anonymize user data instead of complete deletion for audit purposes
    const anonymizedData = {
      isDeleted: true,
      deletedAt: new Date(),
    };

    // Update user with anonymized data
    await User.findByIdAndUpdate(userId, anonymizedData);

    // Log the account deletion
    auditLogger(
      "account deletion",
      `User account deleted successfully`,
      "UserActivity",
      userId
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Account deleted successfully",
    });
  } catch (error) {
    auditLogger(
      "account deletion error",
      `Error during account deletion: ${error.message}`,
      "UserActivity"
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during account deletion: ${error.message}`,
    });
  }
};

// preferences
const updatePreferences = async (req, res) => {
  try {
    // updateProfileRequestValidation

    const { error } = updatePreferencesRequestValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const {
      emailNotification,
      surveyResponsesNotification,
      weeklyReportNotification,
    } = req.body;
    const userId = req.user?._id;

    await User.findByIdAndUpdate(
      userId,
      {
        emailNotification,
        surveyResponsesNotification,
        weeklyReportNotification,
      },
      { new: true, runValidators: true }
    );

    auditLogger(
      "user preference update",
      "user preference updated successfully",
      "UserActivity",
      userId
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "User preference updated successfully",
    });
  } catch (error) {
    auditLogger(
      "user update preference Error",
      `user update preference encounted an error: ${error.message}`,
      "UserActivity"
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during user update preference : ${error.message}`,
    });
  }
};

// forget password
const forgetPassword = async (req, res) => {
  try {
    const { error } = forgetPasswordRequestValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { email } = req.body;
    const existingEmail = await User.findOne({ email });
    if (!existingEmail) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User with this email does not exist.",
      });
    }

    const otp = await generateUniqueOtp();
    existingEmail.otp = otp;
    existingEmail.otpExpires = Date.now() + 1000 * 60 * 60 * 24;
    await existingEmail.save();

    const firstName = existingEmail.firstName;

    await sendEmail(
      email,
      "Forgot Password",
      forgotPasswordHtml({ firstName, otp })
    );

    auditLogger(
      "user forget password",
      `${existingEmail.email} user forget password`,
      "UserActivity",
      existingEmail._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message:
        "Please reset your password using the new OTP sent to your email address.",
    });
  } catch (error) {
    auditLogger(
      "user forget password Error",
      `user forget password encounted an error: ${error.message}`,
      "UserActivity"
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during user forget password: ${error.message}`,
    });
  }
};

// reset password
const resetPassword = async (req, res) => {
  try {
    const { error } = resetPasswordRequestValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }
    const { otp, newPassword, confirmPassword } = req.body;

    const user = await User.findOne({ otp });

    // Check if OTP exists
    if (!user?.otp) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "No OTP found for this user.",
      });
    }

    // Check if OTP is expired
    if (Date.now() > user?.otpExpires) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "OTP has expired.",
      });
    }

    // Check if the OTP matches
    if (user?.otp !== otp) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Invalid OTP.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "New password and confirm password do not match",
      });
    }
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    // If OTP is correct and not expired, you can mark the phone number as verified, etc.
    user.otp = null; // Clear OTP after successful verification
    user.otpExpires = null; // Clear OTP expiration
    await user.save();

    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.roleId,
    };
    const token = jwt.sign(tokenPayload, CONSTANTS.JWT_SECRET, {
      expiresIn: "30d", // Token expires in 30 days
    });

    const refreshToken = jwt.sign(tokenPayload, CONSTANTS.JWT_SECRET, {
      expiresIn: "60d", // Refresh token expires in 60 days
    });

    user.lastSignIn = new Date();
    user.refreshToken = refreshToken;
    await user.save();

    const userInfo = await User.findOne({ _id: user?._id })
      .select(
        "_id firstName lastName email agreementConfirmation ipAddress continentCode continentName countryCode countryName stateProv city photo phoneNumber isSubscribed roleId organization lastSignIn isEmailVerified fcmToken permissions createdAt"
      )
      .populate({ path: "roleId", select: "_id name" });

    // log the activity
    auditLogger(
      "user reset password",
      `${user.email} user reset password`,
      "UserActivity",
      user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Password reset successfully.",
      data: userInfo,
      accessToken: token,
      refreshToken: refreshToken,
    });
  } catch (error) {
    auditLogger(
      "user reset password Error",
      `user reset password encounted an error: ${error.message}`,
      "UserActivity"
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during user reset password: ${error.message}`,
    });
  }
};

// invite user to join the organization
const inviteUserToJoinOrganization = async (req, res) => {
  try {
    const { error } = inviteUserToJoinOrganizationRequestValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }
    const { email, organizationId, roleId } = req.body;
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User with this email already exists.",
      });
    }
    const organization = await User.findOne({ uniqueCode: organizationId });
    if (!organization) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Organization not found.",
      });
    }
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Role not found.",
      });
    }
    const user = new User({
      email,
      uniqueCode: organizationId,
      roleId,
    });
    await user.save();

    // sendEmail(
    //   email,
    //   "MockSurvey365 Invite",
    //   appInviteHtml({
    //     name,
    //     email,
    //     company: user?.firstName + " " + user?.lastName,
    //   })
    // );
  } catch (error) {}
};

// all signed users
const signedUsers = async (req, res) => {
  try {
    const {
      email,
      firstName,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;
    const query = { invited: false };
    if (email) {
      query.email = email;
    }
    if (firstName) {
      query.firstName = { $regex: `^${firstName}`, $options: "i" };
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    const users = await User.find(query)
      .select(
        "_id firstName lastName email agreementConfirmation countryName city photo phoneNumber isSubscribed roleId organization lastSignIn isEmailVerified fcmToken permissions subscriptionId emailNotification surveyResponsesNotification weeklyReportNotification uniqueCode createdAt"
      )
      .populate({ path: "roleId", select: "_id name" })
      .populate({
        path: "subscriptionId",
        select: "_id plan pricingModel yearlyPrice",
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));
    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Signed users retrieved successfully.",
      data: {
        users,
        pagination: {
          total,
          totalPages,
          limit: parseInt(limit),
          currentPage: parseInt(page),
        },
      },
    });
  } catch (error) {
    auditLogger(
      "signed users Error",
      `signed users encounted an error: ${error.message}`,
      "UserActivity"
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during signed users: ${error.message}`,
    });
  }
};

// invited users under signed users
const invitedUsers = async (req, res) => {
  try {
    const invite = req.params.id;
    const user1 = await User.findById(invite);
    if (!user1) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found.",
      });
    }

    const users = await User.find({ uniqueCode: user1.uniqueCode })
      .select(
        "_id firstName lastName email invited agreementConfirmation countryName city photo phoneNumber roleId organization lastSignIn isEmailVerified fcmToken permissions emailNotification surveyResponsesNotification weeklyReportNotification uniqueCode createdAt"
      )
      .populate({ path: "roleId", select: "_id name" })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Signed invited users retrieved successfully.",
      data: users,
    });
  } catch (error) {
    auditLogger(
      "signed invited users Error",
      `signed users encounted an error: ${error.message}`,
      "UserActivity"
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during signed invited users: ${error.message}`,
    });
  }
};

// facilities under signed user
const facilitiesUnderUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user1 = await User.findById(userId);
    if (!user1) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found.",
      });
    }

    const fac = await Facility.find({ userId: user1._id })
      .select(
        "_id name type address size contact secondaryContactPhone notes tags status userId riskScore lastSurvey providerNumber"
      )
      .populate("type", "_id name")
      .populate("userId", "_id firstName lastName email organization")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Facilities under user retrieved successfully.",
      data: fac,
    });
  } catch (error) {
    auditLogger(
      "facilities under user Error",
      `facilities under user encounted an error: ${error.message}`,
      "UserActivity"
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during facilities under user: ${error.message}`,
    });
  }
};

// setup2FA
const setup2FA = async (req, res) => {
  try {
    const { error } = reset2FARequestValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }
    const { isMfaActive } = req.body;

    const userId = req.user?._id;
    const user = await User.findById(userId);
    let secret = speakeasy.generateSecret();
    user.twoFactorSecret = secret.base32;
    user.isMfaActive = isMfaActive;
    await user.save();

    const url = speakeasy.otpauthURL({
      secret: secret.base32,
      label: `${user?.email}`,
      issuer: "MockSurvey365™",
      encoding: "base32",
    });

    const qrImageUrl = await QRCode.toDataURL(url);

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "MFA setup successfully",
      secret: secret.base32,
      qrCode: qrImageUrl,
    });
  } catch (error) {
    auditLogger(
      "setup 2FA Error",
      `setup 2FA encounted an error: ${error.message}`,
      "UserActivity"
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during setup 2FA: ${error.message}`,
    });
  }
};
// verify2FA
const verify2FA = async (req, res) => {
  try {
    const { error } = codeRequestValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }
    const { code, email } = req.body;

    // const userId = req.user?._id;
    const user = await User.findOne({email});

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: code,
    });

    if (verified) {
      const tokenPayload = {
        id: user._id,
        email: user.email,
        role: user.roleId,
      };

      const token = jwt.sign(tokenPayload, CONSTANTS.JWT_SECRET, {
        expiresIn: "14d", // Token expires in 14 days
      });

      const refreshToken = jwt.sign(tokenPayload, CONSTANTS.JWT_SECRET, {
        expiresIn: "60d", // Refresh token expires in 60 days
      });

      user.lastSignIn = new Date();
      user.refreshToken = refreshToken;
      await user.save();

      const userInfo = await User.findOne({ _id: user?._id })
        .select(
          "_id firstName lastName  email agreementConfirmation ipAddress continentCode continentName countryCode countryName stateProv city photo phoneNumber roleId organization lastSignIn  isEmailVerified isLocked lockoutTime permissions isSubscribed fcmToken createdAt createdAt rememberMe isMfaActive"
        )
        .populate({ path: "roleId", select: "_id name" });

      // log the activity
      auditLogger(
        "user verify mfa",
        `${user.email} user verify mfa`,
        "UserActivity",
        user._id
      );

      return res.status(200).json({
        status: true,
        statusCode: 200,
        message: "MFA verified successfully.",
        data: userInfo,
        accessToken: token,
        refreshToken: refreshToken,
      });
    } else {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Invalid MFA Code.",
      });
    }
  } catch (error) {
    auditLogger(
      "verify 2FA Error",
      `verify 2FA encounted an error: ${error.message}`,
      "UserActivity"
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during verify 2FA: ${error.message}`,
    });
  }
};
// reset2FA
const reset2FA = async (req, res) => {
  try {
    const { error } = reset2FARequestValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }
    const { isMfaActive } = req.body;

    const userId = req.user?._id;
    const user = await User.findById(userId);
    user.twoFactorSecret = "";
    user.isMfaActive = isMfaActive;
    await user.save();

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "MFA reset successfully.",
    });
  } catch (error) {
    auditLogger(
      "reset 2FA Error",
      `reset 2FA encounted an error: ${error.message}`,
      "UserActivity"
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during reset 2FA: ${error.message}`,
    });
  }
};

module.exports = {
  customer_signup,
  verifyOtp,
  login,
  resendOtp,
  uploads,
  updateProfile,
  fcmToken,
  deleteAccount,
  changePassword,
  updatePreferences,
  forgetPassword,
  resetPassword,
  inviteUserToJoinOrganization,
  signedUsers,
  invitedUsers,
  facilitiesUnderUser,
  setup2FA,
  verify2FA,
  reset2FA,
};
