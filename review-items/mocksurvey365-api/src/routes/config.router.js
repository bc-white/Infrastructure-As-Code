const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/check-auth");
const configController = require("../controllers/Configs/configs.controller");

router.post(
  "/addLongTermRegulations",
  checkAuth,
  configController.addLongTermRegulations
);
router.get("/allLongTermRegulations",checkAuth, configController.longTermRegulationas);
router.delete("/deleteLongTermRegulations/:id", checkAuth, configController.deleteLongTermRegulations);
router.post("/addFacilityTypes", checkAuth, configController.addFacilityTypes);
router.get("/allFacilityTypes",checkAuth, configController.facilityTypes);
router.delete("/deleteFacilityTypes/:id", checkAuth, configController.deleteFacilityTypes);
router.post("/addFacility", checkAuth, configController.addFacility);
router.put("/updateFacility", checkAuth, configController.updateFacility);
router.get("/viewFacility/:id", checkAuth, configController.viewFacility);
router.get("/facility", checkAuth, configController.facility);
router.delete("/deleteFacility/:id", checkAuth, configController.deleteFacility);

router.post("/addResources", checkAuth, configController.addResources);
router.get("/allResources", checkAuth, configController.resources);
router.get("/viewResources/:id", configController.viewResources);
router.delete("/deleteResources/:id", checkAuth, configController.deleteResources);

router.get("/criticalElements", checkAuth, configController.criticalElements);
router.get("/facilityTaskCEPathways", checkAuth, configController.facilityTaskCEPathways);
router.get("/viewCriticalElement/:id", checkAuth, configController.viewCriticalElement);
router.post("/addCriticalElement", checkAuth, configController.addCriticalElement);
router.put("/updateCriticalElement", checkAuth, configController.updateCriticalElments);
router.delete("/deleteCriticalElement/:id", checkAuth, configController.deleteCriticalElements);

router.post("/addFtagSetup", checkAuth, configController.addFtagSetup);
router.get("/allFtagSetup", checkAuth, configController.ftagSetup);
router.get("/viewFtagSetup/:id", checkAuth, configController.viewFtagsSetup);
router.put("/updateFtagSetup", checkAuth, configController.updateFtagsSetup);

router.delete("/deleteFtagSetup/:id", checkAuth, configController.deleteFtag);

// mandatory tasks
router.post("/addMandatoryTask", checkAuth, configController.addMandatoryTask);
router.get("/allMandatoryTask", checkAuth, configController.mandatoryTasks);
router.get("/viewMandatoryTask/:id", checkAuth, configController.viewMandatoryTask);
router.put("/updateMandatoryTask", checkAuth, configController.updateMandatoryTask);
router.delete("/deleteMandatoryTask/:id", checkAuth, configController.deleteMandatoryTask);

// nursing homes
router.get("/fetchNursingHomes", checkAuth, configController.fetchNursingHomes);
router.get("/allNursingHomes", checkAuth, configController.allnursinghomes);

router.put("/updateAllFtagsSetup", checkAuth, configController.updateAllFtagsSetup);

// Multi-facility metrics
router.get("/multiFacilityMetric", checkAuth, configController.multiFacilityMetric);



router.post("/addNursingHomesProviders", checkAuth, configController.addNursingHomesProviders);
router.get("/allNursingHomesProviders", checkAuth, configController.allnursinghomesproviders);

router.post("/criticalquestions", configController.addCritialQuestions);
router.get("/criticalquestion", configController.critialQuestions);
module.exports = router;