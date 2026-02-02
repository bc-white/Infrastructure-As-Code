const mongoose = require("mongoose");
const CriticalPathWayQuestionSchema = new mongoose.Schema(
  {
    pathwayName: {
      type: String,
    },
    section: {
      type: String,
      enum: ["ReviewInAdvance", "Observations", "Interviews", "RecordReview"],
    },
    title: { type: String },
    questionText: {
      type: String,
    },
    subQuestion: { type: Array },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "CriticalPathWayQuestion",
  CriticalPathWayQuestionSchema
);
