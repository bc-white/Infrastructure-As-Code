const express = require("express");
const router = express.Router();
const healthController = require("../controllers/health.controller");
router.get('/ping', healthController.ping);
router.get('/status', healthController.health);
router.get('/address', healthController.userAddress);

module.exports = router;