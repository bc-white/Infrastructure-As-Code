const axios = require("axios");
const mongoose = require("mongoose");
const CONSTANTS = require("../../constants/constants");
const User = require("../../models/user-model/user.model");
const Survey = require("../../models/surveyModels/survey.model");
const TeamMember = require("../../models/surveyModels/teamMembers.model");
const SurveyLog = require("../../models/surveyModels/surveyLogs.model");
const FacilityEntrance = require("../../models/surveyModels/facilityEntrance.model");
const DocumentsToUpload = require("../../models/surveyModels/documentsToUpload.model");
const RequestEntranceItem = require("../../models/surveyModels/requestEntranceItems.model");
const ResidentEntrance = require("../../models/surveyModels/residentEntrance.model");
const InitialAssessmentEntrance = require("../../models/surveyModels/initialAssessmentEntrance.model");
const InitialPoolService = require("../../services/initialPool.service");
const FinalSample = require("../../models/surveyModels/finalSample.model");
const FinalSampleService = require("../../services/finalSample.service");
const InvestigationService = require("../../services/investigation.service");
const InitialPool = require("../../models/surveyModels/initialPool.model");
const CriticalElement = require("../../models/configs/critical_elements.model");
const CitationReport = require("../../models/surveyModels/citationReport.model");
const CriticalPathWayQuestion = require("../../models/surveyModels/criticalPathWayQuestion.model");
const CitationReportService = require("../../services/citationReport.service");
const PlanOfCorrectionService = require("../../services/planofCorrection.service");
const { sendEmail } = require("../../helpers/sendEmail");
const {
  addplanofCorrectionValidation,
} = require("../../validators/survey-validators/survey.validators");

// Generate Initial pool residents
const generatingInitialResident = async (req, res) => {
  try {
    const surveyId = req.params.id;

    if (!surveyId) {
      return res
        .status(400)
        .json({ success: false, message: "Survey ID is required" });
    }

    let survey = await Survey.findById(surveyId);
    const teamMember = await TeamMember.findOne({
      surveyId,
      teamMemberUserId: req.user._id,
    });

    const isCreator = survey.createdBy.toString() === req.user._id.toString();

    const isTeamCoordinator = teamMember && teamMember.teamCoordinator === true;

    if (!isCreator && !isTeamCoordinator) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only the survey creator or a team coordinator can do this.",
      });
    }

    // fetching needed data for generating initial pool resident
    let documentsToUpload = await DocumentsToUpload.find({
      surveyId: surveyId,
    });
    let residents = await ResidentEntrance.find({ surveyId: surveyId });
    let response = await InitialPoolService.generatingInitialResident(
      survey,
      documentsToUpload,
      residents
    );

    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Generating initial pool resident by ${users.firstName} ${users.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Initial pool resident generated successfully.",
      total: response.length,
      data: response,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Generating initial pool resident by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during from generating initial pool resident: ${errorMsg}`,
    });
  }
};

// Generate Final Sample residents
const generatingFinalSampleResident = async (req, res) => {
  try {
    const surveyId = req.params.id;

    if (!surveyId) {
      return res
        .status(400)
        .json({ success: false, message: "Survey ID is required" });
    }

    let survey = await Survey.findById(surveyId);
    const teamMember = await TeamMember.findOne({
      surveyId,
      teamMemberUserId: req.user._id,
    });

    const isCreator = survey.createdBy.toString() === req.user._id.toString();

    const isTeamCoordinator = teamMember && teamMember.teamCoordinator === true;

    if (!isCreator && !isTeamCoordinator) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only the survey creator or a team coordinator can do this.",
      });
    }

    let residents = await InitialPool.find({
      surveyId: surveyId,
      included: true,
    });
    let finalSample = await FinalSampleService.generatingfinalsampleResident(
      survey,
      residents
    );

    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Generating final sample resident by ${users.firstName} ${users.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Final sample resident generated successfully.",
      total: finalSample.length,
      data: finalSample,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Generating final sample resident by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during from generating final sample resident: ${errorMsg}`,
    });
  }
};

// Generate Investigation
const generatingInvestigation = async (req, res) => {
  try {
    const surveyId = req.params.id;

    if (!surveyId) {
      return res
        .status(400)
        .json({ success: false, message: "Survey ID is required" });
    }

    let survey = await Survey.findById(surveyId);
    const teamMember = await TeamMember.findOne({
      surveyId,
      teamMemberUserId: req.user._id,
    });

    const isCreator = survey.createdBy.toString() === req.user._id.toString();

    const isTeamCoordinator = teamMember && teamMember.teamCoordinator === true;

    if (!isCreator && !isTeamCoordinator) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only the survey creator or a team coordinator can do this.",
      });
    }

    let finalsample = await FinalSample.find({ surveyId: surveyId });
    if (!finalsample) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "No final sample selection found. Please complete final sample selection first.",
      });
    }

    const criticalElementPathWaysQuestions =
      await CriticalPathWayQuestion.find();

    let investigate = await InvestigationService.generateInvestigationReport(
      finalsample,
      criticalElementPathWaysQuestions
    );

    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Generating Investigation report by ${users.firstName} ${users.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Investigation report generated successfully.",
      data: investigate,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Generating Investigation report by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during from generating investigation report: ${errorMsg}`,
    });
  }
};

// generate citation report
const generatingCitationReport = async (req, res) => {
  try {
    const surveyId = req.params.id;

    if (!surveyId) {
      return res
        .status(400)
        .json({ success: false, message: "Survey ID is required" });
    }

    let survey = await Survey.findById(surveyId);
    const teamMember = await TeamMember.findOne({
      surveyId,
      teamMemberUserId: req.user._id,
    });

    const isCreator = survey.createdBy.toString() === req.user._id.toString();

    const isTeamCoordinator = teamMember && teamMember.teamCoordinator === true;

    if (!isCreator && !isTeamCoordinator) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only the survey creator or a team coordinator can do this.",
      });
    }

    let report = await CitationReportService.generateCitationReport(surveyId);

    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Generating Citation report by ${users.firstName} ${users.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });
    let disclaimer =
      "The citation reports generated by MockSurvey365 are intended solely for demonstration, training, and educational purposes. MockSurvey365 is a simulated software environment that mimics the CMS survey process and is not affiliated with, endorsed by, or authorized by the Centers for Medicare and Medicaid Services or any federal or state regulatory agency. Reports may be generated using user-entered or resident-level information; however, all survey findings, citations, and outcomes are simulated and do not constitute official regulatory determinations. Reports are generated using intelligence and must be reviewed and validated by users for accuracy and completeness. This report contains resident information and facilities are solely responsible for safeguarding resident information and ensuring compliance with all applicable privacy and confidentiality requirements, including HIPAA. MockSurvey365 outputs may not be used in place of official CMS surveys, reports, or citations and must not be relied upon for regulatory decision making, accreditation, enforcement actions, or legal proceedings.";
    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Citation report generated successfully.",
      data: report,
      disclaimer,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Generating Citation report by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during from generating citation report: ${errorMsg}`,
    });
  }
};

// generate plan of correction
const generatingPlanOfCorrection = async (req, res) => {
  try {
    const { error } = addplanofCorrectionValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { pdfurl, surveyId } = req.body;
    let pdfurlfromsurvey;

    if (!pdfurl) {
      let pdf = await CitationReport.findOne({ surveyId: surveyId });
      pdfurlfromsurvey = pdf.citationUrl;
      if (!pdfurlfromsurvey) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          message: "generate citation report first",
        });
      }
    } else {
      pdfurlfromsurvey = pdfurl;
    }

       /* -------------------- 🔥 KEEP CONNECTION ALIVE 🔥 -------------------- */
    // res.setHeader("Content-Type", "application/json; charset=utf-8");
    // res.setHeader("Transfer-Encoding", "chunked");
    // res.setHeader("Cache-Control", "no-cache");
    // res.flushHeaders();

    // Heartbeat every 10s so Nginx never times out
    // const heartbeat = setInterval(() => {
    //   try {
    //     res.write(" \n");
    //   } catch {
    //     clearInterval(heartbeat);
    //   }
    // }, 10000);


    // Stop work if client disconnects
    // let clientDisconnected = false;
    // req.on("close", () => {
    //   clientDisconnected = true;
    //   clearInterval(heartbeat);
    //   console.warn("Client disconnected — job abandoned");
    // });

    /* -------------------- LONG RUNNING TASK -------------------- */
    const report = await PlanOfCorrectionService.generatePlanOfCorrection(
      surveyId,
      pdfurlfromsurvey
    );

    // if (clientDisconnected) return;

    // clearInterval(heartbeat);


    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Generating Plan of Correction by ${users.firstName} ${users.lastName}`,
      action: "Success",
      createdBy: req.user._id,
    });
    let disclaimer =
      "The plan of correction generated by MockSurvey365 are intended solely for demonstration, training, and educational purposes. MockSurvey365 is a simulated software environment that mimics the CMS survey process and is not affiliated with, endorsed by, or authorized by the Centers for Medicare and Medicaid Services or any federal or state regulatory agency. Reports may be generated using user-entered or resident-level information; however, all survey findings, citations, and outcomes are simulated and do not constitute official regulatory determinations. Plan of corrections are generated using intelligence and must be reviewed and validated by users for accuracy and completeness. This report contains resident information and facilities are solely responsible for safeguarding resident information and ensuring compliance with all applicable privacy and confidentiality requirements, including HIPAA. MockSurvey365 outputs may not be used in place of official CMS surveys, reports, or citations and must not be relied upon for regulatory decision making, accreditation, enforcement actions, or legal proceedings.";

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Plan of correction generated successfully.",
      data: report,
      disclaimer
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Generating Plan of Correction by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during from generating plan of correction: ${errorMsg}`,
    });
  }
};

module.exports = {
  generatingInitialResident,
  generatingFinalSampleResident,
  generatingInvestigation,
  generatingCitationReport,
  generatingPlanOfCorrection,
};
