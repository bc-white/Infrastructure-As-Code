const mongoose = require("mongoose");
const PlanOfCorrectionSchema = new mongoose.Schema(
  {
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
    },
    summary: { type: Object },
    plansOfCorrection: { type: Array },
    education: { type: Object },
    disclaimer: { type: String },
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

module.exports = mongoose.model("PlanOfCorrection", PlanOfCorrectionSchema);
