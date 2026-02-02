const mongoose = require("mongoose");
const ResidentEntranceSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    room: { type: String, default: "" },
    admissionDate: { type: String, default: "" },
    diagnosis: { type: String, default: "" },
    specialTypes: { type: Array, default: [] },
    specialTypesOthers: { type: Array, default: [] },
    included: { type: Boolean, default: false },
    isNewAdmission: { type: Boolean, default: false },
    fiFlagged: { type: Boolean, default: false },
    ijHarm: { type: Boolean, default: false },
    surveyorNotes: { type: String, default: "" },
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

module.exports = mongoose.model("ResidentEntrance", ResidentEntranceSchema);
