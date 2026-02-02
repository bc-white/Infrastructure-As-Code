const mongoose = require("mongoose");
const InitialAssessmentEntranceSchema = new mongoose.Schema(
  {
    type: { type: String, default: ""},
    completed:{ type: Boolean, default: false },
    dateTime:{ type: String, default: ""},
    notes: { type: String, default: "" },
    additionalComments: { type: String, default: "" },
    probeList: {type: Object, default: {}},
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

module.exports = mongoose.model("initialAssessmentEntrance", InitialAssessmentEntranceSchema);
