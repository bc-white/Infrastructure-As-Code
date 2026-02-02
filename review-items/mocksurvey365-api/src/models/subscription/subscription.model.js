const mongoose = require("mongoose");
const SubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    plan: { type: String },
    pricingModel: { type: String },
    yearlyPrice: { type: Number },
    included: { type: Array, default: [] },
    restrictions: { type: Array, default: [] },
    usageLimit: { type: String },
    additionalSurvey: { type: String },
    status: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Subscription", SubscriptionSchema);
