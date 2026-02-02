const User = require("../../models/user-model/user.model");
const Role = require("../../models/user-model/role.model");
const auditLogger = require("../../helpers/logger");
const CONSTANTS = require("../../constants/constants");
const Subscription = require("../../models/subscription/subscription.model");
const {
  addSubscriptionRequestValidation,
  updateSubscriptionRequestValidation
} = require("../../validators/subscription-validators/subscription.validator");

const addSubscription = async (req, res) => {
  try {
    const { error } = addSubscriptionRequestValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const {
      plan,
      pricingModel,
      yearlyPrice,
      usageLimit,
      additionalSurvey,
      included,
      restrictions,
    } = req.body;

    const subscription = await Subscription.create({
      plan,
      pricingModel,
      yearlyPrice,
      usageLimit,
      additionalSurvey,
      included,
      restrictions,
      status: true,
      userId: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Subscription added successfully.",
      data: subscription,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "subscription error",
      `Error during subscription: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during subscription: ${errorMsg}`,
    });
  }
};

const updateSubscription = async (req, res) => {
  try {
    const { error } = updateSubscriptionRequestValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }
    const { id } = req.body;
    const subscription = await Subscription.findById(id);
    if (!subscription) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Subscription not found.",
      });
    }
    const {
      plan,
      pricingModel,
      yearlyPrice,
      usageLimit,
      additionalSurvey,
      included,
      restrictions,
    } = req.body;
    subscription.plan = plan;
    subscription.pricingModel = pricingModel;
    subscription.yearlyPrice = yearlyPrice;
    subscription.usageLimit = usageLimit;
    subscription.additionalSurvey = additionalSurvey;
    subscription.included = included;
    subscription.restrictions = restrictions;
    await subscription.save();
    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Subscription updated successfully.",
      data: subscription,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "update subscription error",
      `Error during update subscription: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during update subscription: ${errorMsg}`,
    });
  }
};  

const subscription = async (req, res) => {
  try {
    const subscription = await Subscription.find({ status: true });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Subscription fetched successfully.",
      data: subscription,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "all subscription error",
      `Error during all subscription: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during all subscription: ${errorMsg}`,
    });
  }
};

// view subscription
const viewSubscription = async (req, res) => {
  try {
    const subId = req.params.id;
    if (!subId) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Subscription ID is required.",
      });
    }

    const subscription = await Subscription.findById(subId).select(
      "_id plan pricingModel yearlyPrice included restrictions usageLimit additionalSurvey status"
    );
    if (!subscription) {
      return res.status(200).json({
        status: true,
        statusCode: 200,
        message: "Subscription data not found",
        data: {},
      });
    }

    auditLogger(
      "view subscription",
      "subscription data view",
      "AdminActivity",
      ""
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Subscription data viewed successfully",
      data: subscription,
    });
  } catch (error) {
    auditLogger(
      "view subscription Error",
      `view subscription encounted an error: ${error.message}`,
      "AdminActivity",
      ""
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during view subscription: ${error.message}`,
    });
  }
};

module.exports = {
  addSubscription,
  updateSubscription,
  subscription,
  viewSubscription,
};
