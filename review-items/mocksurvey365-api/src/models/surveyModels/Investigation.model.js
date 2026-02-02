const mongoose = require("mongoose");
const InvestigationDataSchema = new mongoose.Schema(
  {
    generatedId: { type: String, default: "" },
    name: { type: String, default: "" },
    room: { type: String, default: "" },
    admissionDate: { type: String, default: "" },
    isNewAdmission: { type: Boolean, default: false },
    included: { type: Boolean, default: false },
    generalSurveyorNotes: { type: String, default: "" },
    risks: { type: Array, default: [] },
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
    },
    teamMemberUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    investigations: { type: Array, default: [] },
    bodyMapObservations: { type: Array, default: [] },
    weightCalculatorData: { type: Object, default: {} },
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

module.exports = mongoose.model("InvestigationData", InvestigationDataSchema);
