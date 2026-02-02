const mongoose = require("mongoose");
const RiskBasedSetupSchema = new mongoose.Schema(
  {
    surveyCreationDate: { type: Date },
    surveyMode: { type: String },
    surveyCategory: { type: String },
    facilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
    },
    facilityInfo: { type: mongoose.Schema.Types.Mixed, default: {} },
    teamMembers: { type: Array, default: [] },
    teamCoordinator: { type: String, default: "" },
    assignments: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, default: "" },
    riskBasedProcessSetup: { type: mongoose.Schema.Types.Mixed, default: {} },
    facilityInitiatedSurvey: {
      residents: {type: Array, default: []},
      clinicalAreaNotes: {type: Object, default: {}},
      surveyMode: {type: String, default: ""},
      admissions: { type: Object, default: {} },
      riskManagementProcess: {type: Object, default: {}},
      behaviors: { type: Object, default: {} },
      falls: { type: Object, default: {} },
      changeInCondition: { type: Object, default: {} },
      grievances: { type: Object, default: {} },
      hospitalReadmissions: { type: Object, default: {} },
      incidents: { type: Object, default: {} },
      infections: { type: Object, default: {} },
      pain: { type: Object, default: {} },
      pressureUlcers: { type: Object, default: {} },
      ivTherapy: { type: Object, default: {} },
      weightLoss: { type: Object, default: {} },
      psychotropicMedications: { type: Object, default: {} },
      activities: { type: Object, default: {} },
      staffEducation: { type: Object, default: {} },
      annualEducation: { type: Object, default: {} },
      submittedAt: { type: Date, default: null },
      completedAt: { type: Date, default: null },
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("RiskBasedSetup", RiskBasedSetupSchema);
