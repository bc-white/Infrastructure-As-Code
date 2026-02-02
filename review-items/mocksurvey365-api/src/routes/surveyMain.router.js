const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/check-auth");
const surveyController = require("../controllers/surveys/survey.controller");
const AgentController = require("../controllers/surveys/agent.controller");

router.post(
  "/surveyFirstPage",
  checkAuth,
  surveyController.addSurveyFirstPageMain
);

router.post(
  "/removeTeamMemberFromSurvey",
  checkAuth,
  surveyController.removeTeamMember
);

router.post(
  "/removeAssignedFacilityToTeamMember",
  checkAuth,
  surveyController.removeAssignedFacilityToTeamMember
);

router.get("/mySurvey", checkAuth, surveyController.mySurveys);

router.get(
  "/viewSurveyFirstPage/:id",
  checkAuth,
  surveyController.viewSurveyFirstPage
);

router.put(
  "/updateSurveyFirstPage",
  checkAuth,
  surveyController.updateSurveyFirstPageMain
);

router.post(
  "/offsitePreSurvey",
  checkAuth,
  surveyController.addSurveySecondPageMainOffSite
);

router.get(
  "/viewOffsitePreSurvey/:id",
  checkAuth,
  surveyController.viewOffsitePresurvey
);

router.post(
  "/facilityEntrance",
  checkAuth,
  surveyController.addSurveyThirdPageMainFacilityEntrance
);

router.get(
  "/viewFacilityEntrance/:id",
  checkAuth,
  surveyController.viewFacilityEntrance
);
router.post(
  "/removeResidentFacilityEntrance",
  checkAuth,
  surveyController.removeFacilityEntranceResident
);

router.get(
  "/generateInitialPool/:id",
  checkAuth,
  AgentController.generatingInitialResident
);

router.post("/initialPool", checkAuth, surveyController.saveInitialResidents);

router.get("/viewInitialPool/:id", checkAuth, surveyController.viewInitialPool);

router.post(
  "/removeTeamMemberInitialPool",
  checkAuth,
  surveyController.removeTeamMemberInitialPoolResident
);

router.post(
  "/getTeamMemberResidents",
  checkAuth,
  surveyController.viewTeamMemberResidents
);

router.post(
  "/addInitialPoolTeamMember",
  checkAuth,
  surveyController.saveInitialPoolTeamMemberResidents
);

router.post(
  "/teamMemberInitialPoolResidents",
  checkAuth,
  surveyController.checkTeamMemberAssignedResident
);

router.get(
  "/generateFinalSample/:id",
  checkAuth,
  AgentController.generatingFinalSampleResident
);
router.post(
  "/finalSample",
  checkAuth,
  surveyController.saveFinalSampleResidents
);

router.get("/viewFinalSample/:id", checkAuth, surveyController.viewfinalSample);

router.get(
  "/generateInvestigation/:id",
  checkAuth,
  AgentController.generatingInvestigation
);

router.post(
  "/InvestigationResidents",
  checkAuth,
  surveyController.saveInvestigationResidents
);

router.get(
  "/viewInvestigations/:id",
  checkAuth,
  surveyController.viewInvestigations
);

router.post(
  "/addInvestigationTeamMember",
  checkAuth,
  surveyController.saveTeamMemberInvestigations
);
router.get(
  "/viewTeamMemberMandatoryFaciltyTask/:id",
  checkAuth,
  surveyController.viewTeamMemberAssignedMandatoryTask
);

router.post(
  "/saveMandatoryAndUpdate",
  checkAuth,
  surveyController.saveMandatoryAndUpdate
);

router.get(
  "/viewFacilityMandatoryTask/:id",
  checkAuth,
  surveyController.viewMandatoryFacilityTask
);

router.post(
  "/saveTeamMemberMandatoryTask",
  checkAuth,
  surveyController.saveTeamMemberMandatoryFacilityTask
);

router.post("/teamMeeting", checkAuth, surveyController.saveUpdateTeamMeeting);

router.post(
  "/teamMemberMeeting",
  checkAuth,
  surveyController.saveUpdateTeamMemberTeamMeeting
);

router.get("/viewTeamMeeting/:id", checkAuth, surveyController.viewTeamMeeting);

router.post("/closure", checkAuth, surveyController.saveUpdateClosure);

router.get("/viewClosure/:id", checkAuth, surveyController.viewClosure);

router.post(
  "/existConference",
  checkAuth,
  surveyController.saveUpdateExistConference
);

router.get(
  "/viewExistConference/:id",
  checkAuth,
  surveyController.viewExistConference
);

router.get(
  "/generateCitationReport/:id",
  checkAuth,
  AgentController.generatingCitationReport
);

router.post(
  "/citationReport",
  checkAuth,
  surveyController.saveUpdateCitationReport
);

router.get(
  "/viewCitationReport/:id",
  checkAuth,
  surveyController.viewCitationReport
);

router.post(
  "/generatePlanOfCorrection",
  checkAuth,
  AgentController.generatingPlanOfCorrection
);

router.post(
  "/planOfCorrection",
  checkAuth,
  surveyController.saveUpdatePlanOfCorrections
);

router.get(
  "/viewPlanOfCorrections/:id",
  checkAuth,
  surveyController.viewPlanOfCorrections
);

router.get(
  "/myPlanOfCorrections",
  checkAuth,
  surveyController.myPlanOfCorrections
);

router.get(
  "/viewmyplanofcorrections/:id",
  checkAuth,
  surveyController.viewMYPlanOfCorrections
);

router.get(
  "/viewTeamMembersInSurvey/:id",
  checkAuth,
  surveyController.viewTeamMemberInSurvey
);

router.post(
  "/teamMemberSurveyAccess",
  checkAuth,
  surveyController.viewTeamMemberSurveyAccess
);

router.delete("/removeSurvey/:id", checkAuth, surveyController.removeSurvey);

router.get("/surveyNotes/:id", checkAuth, surveyController.surveyNotes);

router.get("/reports", checkAuth, surveyController.reports);

router.get("/dashboardMatrix", checkAuth, surveyController.dashboardMatrix);
router.get("/surveyCheck/:id", checkAuth, surveyController.checkSurvey);
router.delete("/removePlanOfCorrections/:id", checkAuth, surveyController.removePlanOfCorrections);

module.exports = router;
