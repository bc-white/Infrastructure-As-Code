const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/check-auth");
const surveyWizardController = require("../controllers/surveys/surveyWizard.controller");

// survey wizard first page
router.get(
  "/surveyCategories",
  checkAuth,
  surveyWizardController.surveyCategories
);

router.get("/specialtypes",checkAuth, surveyWizardController.specialTypes);

// request email
router.post("/requestEmail", surveyWizardController.requestEmail);
// view surveys under a facility
router.get(
  "/viewSurveysUnderFacility/:id",
  checkAuth,
  surveyWizardController.viewSurveysUnderFacility
);

// risk based setup
router.post(
  "/riskBasedSetup",
  checkAuth,
  surveyWizardController.addRiskBasedSetup
);

router.put(
  "/riskBasedSetup",
  checkAuth,
  surveyWizardController.updateRiskBasedSetup
);

router.get(
  "/riskBasedSetup/:id",
  checkAuth,
  surveyWizardController.viewRiskBasedSetup
);

// facility risk based setup
router.get(
  "/facilityRiskBasedSetup/:id",
  checkAuth,
  surveyWizardController.facilityRiskBasedSetup
);

// user risk based setup
router.get(
  "/userRiskBasedSetup",
  checkAuth,
  surveyWizardController.userRiskBasedSetup
);

// invited users survey risk based list
router.get(
  "/invitedUsersSurveyRiskBasedList",
  checkAuth,
  surveyWizardController.invitedUsersSurveyRiskBasedList
);


router.delete("/removeRiskBasedSurvey/:id", checkAuth, surveyWizardController.removeRiskBased);

module.exports = router;
