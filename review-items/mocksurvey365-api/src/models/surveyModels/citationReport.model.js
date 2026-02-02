const mongoose = require("mongoose");
const CitationReportSchema = new mongoose.Schema(
  {
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
    },
    totalFTags: { type: Number },
    totalFindings: { type: Number },
    surveyData: { type: Object },
    professionalFindings: { type: Array },
    citationReportGenerated: { type: Boolean, default: false },
    disclaimer: {type: String},
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

module.exports = mongoose.model("CitationReport", CitationReportSchema);
