const mongoose = require("mongoose");
const AuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    ipAddress: { type: String },
    continentCode: { type: String },
    continentName: { type: String },
    countryCode: { type: String },
    countryName: { type: String },
    stateProv: { type: String },
    city: { type: String },
    auditType: {
      type: String,
      enum: ["LoginActivity", "UserActivity", "AdminActivity"],
      default: "Active",
    },
    activity: { type: String },
    action: { type: String },
    dateTime: { type: Date },
  
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AuditLog", AuditLogSchema);

