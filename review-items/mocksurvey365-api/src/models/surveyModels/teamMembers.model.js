const mongoose = require("mongoose");
const TeamMemberSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    specialization: { type: String, default: "" },
    teamCoordinator: { type: Boolean, default: false },
    invited: { type: Boolean, default: false },
    teamMemberUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Roles",
    },
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("TeamMember", TeamMemberSchema);
