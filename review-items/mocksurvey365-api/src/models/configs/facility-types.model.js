const mongoose = require("mongoose");
const FacilityTypesSchema = new mongoose.Schema(
  {
    name: { type: String },
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

module.exports = mongoose.model("FacilityTypes", FacilityTypesSchema);
