const mongoose = require("mongoose");
const RequestEntranceItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      default: "",
      enum: [
        "conferenceWorksheet",
        "policies",
        "matrix",
        "smokersList",
        "bindingArbitration",
        "qapiPlan",
        "casperQmIqies",
        "other",
        "671Forms"
      ],
    },
    requested: { type: Boolean, default: false },
    received: { type: Boolean, default: false },
    receivedTimestamp: { type: String, default: "" },
    requestedTimestamp:{ type: String, default: "" },
    fullName: { type: String, default: "" },
    shortName: { type: String, default: "" },
    notes: { type: String, default: "" },
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

module.exports = mongoose.model(
  "RequestEntranceItem",
  RequestEntranceItemSchema
);
