const express = require('express');
const router = express.Router();
const checkAuth = require("../middlewares/check-auth");
const healthAssistantController = require('../controllers/HealthAssistant/healthAssistant.controller');


router.post('/ftag', checkAuth, healthAssistantController.getFtagFromQuestion);
router.post('/gamma',checkAuth, healthAssistantController.gamma);
router.get('/getGamma/:id',checkAuth, healthAssistantController.getGamma);
router.get('/getGammaParameters',checkAuth, healthAssistantController.gammaData);
router.post('/askMocky365', checkAuth, healthAssistantController.askMocky365);

module.exports = router;
