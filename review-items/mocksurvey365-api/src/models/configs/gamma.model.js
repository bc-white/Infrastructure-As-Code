const mongoose = require("mongoose");

const gammaSchema = new mongoose.Schema(
  {
    inputText: { type: String},
    textMode: { type: String, default: "generate" },
    format: { type: String, default: "presentation" },
    themeName: { type: String, default: "Oasis" },
    numCards: { type: Number, default: 10 },
    cardSplit: { type: String, default: "auto" },
    additionalInstructions: { type: String, default: "" },
    exportAs: { type: String, default: "pptx" },
    textOptions: { type: Object, default: {} },
    imageOptions: { type: Object, default: {} },
    cardOptions: { type: Object, default: {} },
    sharingOptions: { type: Object, default: {} },
    generationId: { type: String, default: "" },
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

module.exports = mongoose.model("gamma", gammaSchema);