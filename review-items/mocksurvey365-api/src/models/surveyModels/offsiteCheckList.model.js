const mongoose = require("mongoose");
const OffsiteCheckListSchema = new mongoose.Schema(
  {
    taskName: { type: String, default: "" },
    taskIndex: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    timestamp: { type: Date, default: "" },
    description: { type: String, default: "" },
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
    },
    files: { type: Array, default: [] },
    notes: {type: String, default: ""},
    otherItem: { type: String, default: "" },
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

module.exports = mongoose.model("OffsiteCheckList", OffsiteCheckListSchema);
