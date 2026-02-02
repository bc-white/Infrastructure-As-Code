const mongoose = require("mongoose");
const RiskFinalSampleSummaryCountSchema = new mongoose.Schema(
  {
    riskName: { type: String, default: "" },
    residentCount: { type: Number, default: 0 },
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
module.exports = mongoose.model("RiskFinalSampleSummaryCount", RiskFinalSampleSummaryCountSchema);
