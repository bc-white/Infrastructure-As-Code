const mongoose = require("mongoose");

// ****** users schema ******* //

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    password: { type: String },
    agreementConfirmation: { type: Boolean, default: true },
    organization: { type: String },
    ipAddress: { type: String, default: "" },
    continentCode: { type: String, default: "" },
    continentName: { type: String, default: "" },
    countryCode: { type: String, default: "" },
    countryName: { type: String, default: "" },
    stateProv: { type: String, default: "" },
    city: { type: String, default: "" },
    photo: { type: String, default: "" },
    phoneNumber: {
      type: String,
      default: "",
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Roles",
    },
    lastSignIn: { type: Date },
    otp: { type: String },
    otpExpires: { type: Date },
    failedAttempts: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    lockoutTime: { type: Date },
    refreshToken: { type: String, default: "" },
    fcmToken: { type: String, default: "" },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
    permissions: { type: Object, default: {} },
    deletedAt: { type: Date },
    isLockedBy: { type: String, default: "" },
    isEmailVerified: { type: Boolean, default: false },
    isSubscribed: { type: Boolean, default: false },
    emailNotification: { type: Boolean, default: false },
    surveyResponsesNotification: { type: Boolean, default: false },
    weeklyReportNotification: { type: Boolean, default: false },
    uniqueCode: { type: String, default: "" },
    rememberMe: {type: Boolean, default: false },
    isMfaActive: {type: Boolean, default: false },
    twoFactorSecret: {type: String, default: ""},
    src: {
      type: String,
      enum: ["mobile", "web", "cpanel"],
      default: "web",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
