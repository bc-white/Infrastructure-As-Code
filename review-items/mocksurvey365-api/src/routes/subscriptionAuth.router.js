const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/check-auth");
const subscriptionController = require("../controllers/Subscription/subscription.controller");


router.post("/addSubscription", checkAuth, subscriptionController.addSubscription);
router.put("/updateSubscription", checkAuth, subscriptionController.updateSubscription);
router.get("/allSubscription", subscriptionController.subscription);
router.get("/viewSubscription/:id", subscriptionController.viewSubscription);



module.exports = router;
