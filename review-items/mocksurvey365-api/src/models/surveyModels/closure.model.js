const mongoose = require("mongoose");
const ClosureSchema = new mongoose.Schema(
  {
    surveyClosed: { type: Boolean, default: false },
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
    },
    closureNotes: { type: String, default: "" },
    closureSignature: { type: Object },
    surveyCompleted: { type: Boolean, default: false },
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

module.exports = mongoose.model("Closure", ClosureSchema);
