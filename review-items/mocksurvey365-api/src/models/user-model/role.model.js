const mongoose = require("mongoose");
const RoleSchema = new mongoose.Schema(
  {
    name: { type: String },
    status: { type: Boolean, default: true },
    access: { type: Array, default: [] },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Roles", RoleSchema);
