const mongoose = require("mongoose");

const ftagSchema = new mongoose.Schema(
  {
    ftag: { type: String},
    category: { type: String, default: "" },
    definitions: { type: String, default: "" },
    rev_and_date: { type: String, default: "" },
    description: { type: String, default: "" },
    intent: { type: String, default: "" },
    guidance: { type: String, default: "" },
    procedure: { type: String, default: "" },
    potential_tags: { type: String, default: "" },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ftags", ftagSchema);