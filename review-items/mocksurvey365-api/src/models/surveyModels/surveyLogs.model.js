const mongoose = require("mongoose");
const SurveyLogSchema = new mongoose.Schema(
  {
    activity: { type: String, default: "" },
    action: { type: String, default: "" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SurveyLog", SurveyLogSchema);
