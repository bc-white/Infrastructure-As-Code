const mongoose = require("mongoose");

const ResidentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    room: { type: String, required: true },
    age: { type: Number, default: null },
    admissionDate: { type: Date, required: true },
    primaryDiagnosis: { type: String, default: "" },
    careLevel: { type: String, default: "" },
    status: { type: String, default: "active", enum: ["active", "discharged", "transferred"] },
    familyContact: { type: String, default: "" },
    familyPhone: { type: String, default: "" },
    specialNeeds: { type: Array, default: [] },
    notes: { type: String, default: "" },
    interviewable: { type: Boolean, default: true },
    facilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
      required: true
    },
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

module.exports = mongoose.model("Resident", ResidentSchema);