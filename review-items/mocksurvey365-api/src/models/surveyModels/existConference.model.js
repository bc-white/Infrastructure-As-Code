const mongoose = require("mongoose");
const ExistConferenceSchema = new mongoose.Schema(
  {
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
    },
    exitDate: { type: String},
    exitTime: { type: String },
    exitConference: { type: Object, default: {} },
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

module.exports = mongoose.model("ExistConference", ExistConferenceSchema);
