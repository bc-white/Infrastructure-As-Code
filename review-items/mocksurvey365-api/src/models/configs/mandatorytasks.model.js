const mongoose = require("mongoose");

const mandatorytasksSchema = new mongoose.Schema(
  {
    title: { type: String },
    version_date: { type: Date },
    source_citation: { type: String },
    desc: { type: String },
    categories: { type: Array, default: [] },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("mandatorytasks", mandatorytasksSchema);
