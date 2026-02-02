const mongoose = require("mongoose");
const FacilityEntranceSchema = new mongoose.Schema(
  {
    entranceTime: { type: String, default: "" },
    entranceDate: {type: Date, default: ""},
    entranceAttendees: { type: Object, default: {} },
    entranceAgenda: { type: Array, default: [] },
    entranceNotes: { type: String, default: "" },
    bindingArbitration: { type: Object, default: {} },
    isEditing: { type: Boolean, default: false },
    isGenerated: { type: Boolean, default: false },
    customItems: { type: Array, default: [] },
    facilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
    },
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

module.exports = mongoose.model("FacilityEntrance", FacilityEntranceSchema);
