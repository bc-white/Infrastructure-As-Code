const mongoose = require("mongoose");
const DocumentsToUploadSchema = new mongoose.Schema(
  {
    type: { type: String, default: "", enum: ["form802", "casperQmIqies"] },
    docUrl: { type: String, default: "" },
    uploaded: { type: Boolean, default: false },
    uploadTimestamp: { type: String, default: "" },
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

module.exports = mongoose.model("DocumentsToUpload", DocumentsToUploadSchema);
