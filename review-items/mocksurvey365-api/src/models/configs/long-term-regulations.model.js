const mongoose = require("mongoose");
const LongTermRegulationsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: { type: String },
    state: { type: String },
    pdflink: { type: String },
    date: { type: Date },
    description: {type: String},
    status: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("LongTermRegulations", LongTermRegulationsSchema);
