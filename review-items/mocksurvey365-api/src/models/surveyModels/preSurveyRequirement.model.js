const mongoose = require("mongoose");
const PreSurveyRequirementSchema = new mongoose.Schema(
  {
    type: { type: String, default: "", enum: ["ehr_access", "cms_2567", "self_reports", "casper_report", "quality_measures", "risk_indicators", "specialist_focus","671_forms"] },
    requested: { type: Boolean, default: false },
    received: { type: Boolean, default: false },
    notReceived: { type: Boolean, default: false },
    requestTimestamp: { type: Date, default: "" },
    receivedTimestamp: { type: Date, default: "" },
    notes: {type: String, default: ""},
    notReceivedTimestamp: { type: Date, default: "" },
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
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

module.exports = mongoose.model("PreSurveyRequirement", PreSurveyRequirementSchema);
