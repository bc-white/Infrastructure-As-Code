const mongoose = require("mongoose");
const SurveySchema = new mongoose.Schema(
  {
    surveyCreationDate: { type: Date },
    surveyCategory: { type: String, default: "" },
    census: { type: Number, required: true },
    initialPool: { type: String, default: "" },
    finalSample: { type: String, default: "" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    facilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
    },
    status: { type: String, default: "setup" },
    uniqueOrgCode: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Survey", SurveySchema);
