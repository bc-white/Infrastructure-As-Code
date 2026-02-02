const mongoose = require("mongoose");
const FinalSampleSchema = new mongoose.Schema(
  {
    generatedId: { type: String, default: "" },
    name: { type: String, default: "" },
    room: { type: String, default: "" },
    admissionDate: { type: String, default: "" },
    isNewAdmission: { type: Boolean, default: false },
    included: { type: Boolean, default: false },
    pressureUlcers: { type: String, default: "" },
    risks: { type: Array, default: [] },
    interviews: { type: Array, default: [] },
    observations: { type: Array, default: [] },
    notes: { type: String, default: "" },
    scheduleInterviewType: { type: String, default: "" },
    scheduleInterviewEmail: { type: String, default: "" },
    scheduleInterviewDateTime: { type: String, default: "" },
    scheduleInterviewNotes: { type: String, default: "" },
    scheduleObservationArea: { type: String, default: "" },
    scheduleObservationDescription: { type: String, default: "" },
    scheduleObservationDateTime: { type: String, default: "" },
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
    },
    qualityMeasureCount: { type: Number, default: 0 },
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

module.exports = mongoose.model("FinalSample", FinalSampleSchema);
