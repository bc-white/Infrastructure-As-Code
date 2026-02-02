const mongoose = require("mongoose");
const AssignedFacilitySchema = new mongoose.Schema(
  {
    mandatorytaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "mandatorytasks",
    },
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Survey",
    },
    teamMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TeamMember",
    },
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AssignedFacility", AssignedFacilitySchema);
