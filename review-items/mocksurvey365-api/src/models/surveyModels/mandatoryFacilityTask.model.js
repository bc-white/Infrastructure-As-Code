const mongoose = require("mongoose");
const FacilityMandatoryTaskSchema = new mongoose.Schema(
  {
    mandatorytaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mandatorytasks",
    },
    mandatorytaskTitle: { type: String, default: "" },
    mandatorytaskDescription: { type: String, default: "" },
    status: { type: String, default: "" },
    probe: { type: String, default: "" },
    fTag: { type: String, default: "" },
    citation: { type: String, default: "" },
    compliant: { type: Boolean },
    explanation: { type: String, default: "" },
    citationNote: { type: String, default: "" },
    timestamp: { type: String, default: "" },
    aiAnalyzed: { type: Boolean, default: false },
    originalFTag: { type: String, default: "" },
    note: { type: String, default: "" },
    isCompleted: { type: Boolean, default: false },
    observation: { type: Array, default: [] },
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
    },
    teamMemberUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "FacilityMandatoryTask",
  FacilityMandatoryTaskSchema
);
