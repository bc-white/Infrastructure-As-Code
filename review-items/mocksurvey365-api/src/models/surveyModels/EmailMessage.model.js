const mongoose = require("mongoose");
const EmailMessageSchema = new mongoose.Schema(
  {
    to: { type: String, default: "" },
    subject: { type: String, default: "" },
    body: { type: String, default: "" },
    fileUrl: { type: String, default: "" },
    data: { type: Object, default: {} },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("EmailMessage", EmailMessageSchema);
