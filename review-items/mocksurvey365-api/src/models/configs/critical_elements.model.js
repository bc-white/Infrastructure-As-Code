const mongoose = require("mongoose");
const CriticalElementSchema = new mongoose.Schema(
  {
    name: { type: String },
    pdflink: { type: String },
    type: { type: String },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CriticalElement", CriticalElementSchema);
