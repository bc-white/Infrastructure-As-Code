const mongoose = require("mongoose");
const TeamMeetingSchema = new mongoose.Schema(
  {
    dailyMeetingAgenda: { type: Object },
    teamDeterminations: { type: Array },
    openingStatements: { type: Object },
    investigations: { type: Array },
    ethicsComplianceConcerns: { type: Boolean },
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

module.exports = mongoose.model("TeamMeeting", TeamMeetingSchema);
