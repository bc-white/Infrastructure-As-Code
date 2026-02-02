const bcrypt = require("bcryptjs");
const User = require("../../models/user-model/user.model");
const Role = require("../../models/user-model/role.model");
const RiskBasedSetup = require("../../models/surveys/risk-based-setup-model");
const SurveyLog = require("../../models/surveyModels/surveyLogs.model");
const auditLogger = require("../../helpers/logger");
const CONSTANTS = require("../../constants/constants");
const Survey = require("../../models/surveyModels/survey.model");
const { sendEmail } = require("../../helpers/sendEmail");
const requestEmailHtml = require("../../utils/html/requestEmail");
const appInviteHtml = require("../../utils/html/appInvite");
const { generateUniquePassword } = require("../../helpers/generateOtpCode");
const {
  Types: { ObjectId },
} = require("mongoose");

const {
  requestEmailValidation,
  riskBasedSetupValidation,
  updateRiskBasedSetupValidation,
} = require("../../validators/survey-validators/survey-wizard.validators");

// Helper function to parse USA date format (MM/DD/YYYY) to Date object
const parseDate = (dateStr) => {
  if (!dateStr) return new Date();

  // Check if it's USA date format (MM/DD/YYYY)
  if (
    typeof dateStr === "string" &&
    /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)
  ) {
    const [month, day, year] = dateStr.split("/");
    return new Date(year, month - 1, day);
  }

  // Otherwise parse as ISO or other format
  return new Date(dateStr);
};

// survey categories
const surveyCategories = async (req, res) => {
  try {
    const surveyCategory = [
      { name: "Annual" },
      { name: "Revisit" },
      { name: "Complaint" },
      { name: "Life Safety Survey" },
      // { name: "Risk Based Survey" },
    ];

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Survey categories fetched successfully.",
      data: surveyCategory,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "all survey categories error",
      `Error during all survey categories: ${errorMsg}`,
      "AdminActivity",
      req.user._id,
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during all survey categories: ${errorMsg}`,
    });
  }
};

const specialTypes = async (req, res) => {
  try {
    const specialtypes = [
      { name: "Alzheimer's / Dementia" },
      { name: "Excessive Weight Loss" },
      { name: "Tube Feeding" },
      { name: "Dehydration" },
      { name: "Physical Restraints" },
      { name: "Indwelling Catheter" },
      { name: "Dialysis" },
      { name: "Hospice" },
      { name: "End of Life Care" },
      { name: "Tracheostomy" },
      { name: "Ventilator" },
      { name: "Transmission-Based Precautions" },
      { name: "IV Therapy'" },
      { name: "PTSD / Trauma" },
      { name: "Fall" },
      { name: "Fall with Injury" },
      { name: "Fall with Major Injury" },
      { name: "Pressure Ulcers" },
      { name: "Antipsych Med (L)" },
      { name: "Antipsych Med (S)" },
      { name: "UTI (L)" },
      { name: "Antipsychotic" },
      { name: "FLU" },
      { name: "FLU A" },
      { name: "Behav Sx affect Others (L)" },
      { name: "Incr ADL Help (L)" },
      { name: "Move Indep Worsens (L)" },
      { name: "Discharge Function Score" },
      { name: "Insulin" },
      { name: "Anticoagulant" },
      { name: "Antibiotic" },
      { name: "Diuretic" },
      { name: "Opioid" },
      { name: "Hypnotic" },
      { name: "Antianxiety" },
      { name: "Respiratory" },
      { name: "Antidepressant" },
      { name: "Depress Sx" },
      { name: "Cath Insert/Left Bladder" },
      { name: "New or Worsened B/B" },
      { name: "MRSA" },
      { name: "Wound Infection" },
      { name: "Pneumonia" },
      { name: "Tuberculosis" },
      { name: "Viral Hepatitis" },
      { name: "Clostridium Difficile" },
      { name: "Urinary Tract Infection" },
      { name: "Sepsis" },
      { name: "Scabies" },
      { name: "Gastrointestinal Infection" },
      { name: "COVID-19" },
      { name: "Offsite" },
      { name: "Abuse" },
      { name: "Elopement" },
    ];

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Survey diagnosis fetched successfully.",
      data: specialtypes,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "all survey categories error",
      `Error during all survey categories: ${errorMsg}`,
      "AdminActivity",
      req.user._id,
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during all survey categories: ${errorMsg}`,
    });
  }
};

// request email
const requestEmail = async (req, res) => {
  try {
    const { error, value } = requestEmailValidation(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { to, subject, message, fileUrl } = req.body;
    await sendEmail(
      to,
      subject,
      requestEmailHtml({ subject, message, fileUrl }),
      fileUrl,
    );

    auditLogger(
      "request email",
      `request email sent successfully`,
      "AdminActivity",
      "",
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Email sent successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "request email error",
      `Error during request email: ${errorMsg}`,
      "AdminActivity",
      "",
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during request email: ${errorMsg}`,
    });
  }
};

// view surveys under a facility
const viewSurveysUnderFacility = async (req, res) => {
  try {
    // facility id
    const id = req.params.id;
    const surveys = await Survey.find({ facilityId: id })
      .select("_id surveyCreationDate surveyCategory status userId")
      .populate("userId", "_id firstName lastName email organization")
      .sort({ createdAt: -1 });

    // Add basic metrics to each survey
    const surveysWithMetrics = surveys.map((survey) => ({
      ...survey.toObject(),
      metrics: {
        surveyScore: 0,
        totalFindings: 0,
        criticalIssues: 0,
      },
    }));

    auditLogger(
      "view surveys under facility",
      `Surveys under facility retrieved successfully`,
      "AdminActivity",
      req.user._id,
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Surveys under facility retrieved successfully",
      data: surveysWithMetrics,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    auditLogger(
      "view surveys under facility error",
      `Error retrieving surveys under facility: ${errorMsg}`,
      "AdminActivity",
      req.user._id,
    );
    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred retrieving surveys under facility: ${errorMsg}`,
    });
  }
};

// add risk based setup
const addRiskBasedSetup = async (req, res) => {
  try {
    const { error, value } = riskBasedSetupValidation(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const {
      surveyCreationDate,
      surveyMode,
      surveyCategory,
      facilityId,
      facilityInfo,
      teamMembers,
      teamCoordinator,
      assignments,
      status,
      riskBasedProcessSetup,
    } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found",
      });
    }

    const riskbased = await RiskBasedSetup.create({
      surveyCreationDate,
      surveyCategory,
      facilityId,
      facilityInfo,
      teamMembers,
      teamCoordinator,
      assignments,
      status,
      riskBasedProcessSetup,
      surveyMode,
      userId: req.user._id,
    });

    auditLogger(
      "risk based setup",
      `risk based setup added successfully`,
      "AdminActivity",
      req.user._id,
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Risk based setup added successfully.",
      data: riskbased,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "risk based setup error",
      `Error during add risk based setup: ${errorMsg}`,
      "AdminActivity",
      req.user._id,
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during add risk based setup: ${errorMsg}`,
    });
  }
};

// update risk based setup
const updateRiskBasedSetup = async (req, res) => {
  try {
    const { error, value } = updateRiskBasedSetupValidation(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const {
      id,
      surveyMode,
      surveyCreationDate,
      surveyCategory,
      facilityId,
      facilityInfo,
      teamMembers,
      teamCoordinator,
      assignments,
      status,
      riskBasedProcessSetup,
    } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found",
      });
    }

    const riskbased = await RiskBasedSetup.findByIdAndUpdate(id, {
      surveyCreationDate,
      surveyCategory,
      facilityId,
      facilityInfo,
      teamMembers,
      teamCoordinator,
      assignments,
      status,
      riskBasedProcessSetup,
      surveyMode,
    });

    auditLogger(
      "risk based setup",
      `risk based setup updated successfully`,
      "AdminActivity",
      req.user._id,
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Risk based setup updated successfully.",
      data: riskbased,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "risk based setup error",
      `Error during update risk based setup: ${errorMsg}`,
      "AdminActivity",
      req.user._id,
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during update risk based setup: ${errorMsg}`,
    });
  }
};

// view risk based
const viewRiskBasedSetup = async (req, res) => {
  try {
    const riskbased = await RiskBasedSetup.findById(req.params.id);
    if (!riskbased) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Risk based setup not found",
      });
    }

    auditLogger(
      "risk based setup",
      `risk based setup retrieved successfully`,
      "AdminActivity",
      req.user._id,
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Risk based setup retrieved successfully.",
      data: riskbased,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "risk based setup error",
      `Error during get risk based setup: ${errorMsg}`,
      "AdminActivity",
      req.user._id,
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during get risk based setup: ${errorMsg}`,
    });
  }
};

// facility risk based
const facilityRiskBasedSetup = async (req, res) => {
  try {
    const riskbased = await RiskBasedSetup.find({ facilityId: req.params.id });
    if (!riskbased) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Risk based setup not found",
      });
    }

    auditLogger(
      "risk based setup",
      `risk based setup retrieved successfully`,
      "AdminActivity",
      req.user._id,
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Risk based setup retrieved successfully.",
      data: riskbased,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "risk based setup error",
      `Error during get risk based setup: ${errorMsg}`,
      "AdminActivity",
      req.user._id,
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during get risk based setup: ${errorMsg}`,
    });
  }
};

// user risk based
const userRiskBasedSetup = async (req, res) => {
  try {
    // const {
    //   facility,
    //   startDate,
    //   endDate,
    //   category,
    //   status,
    //   page = 1,
    //   limit = 10,
    // } = req.query;
    // const query = { userId: req.user._id };

    // // Filter by specific userId if provided
    // if (facility) {
    //   query.facilityId = facility;
    // }

    // if (startDate || endDate) {
    //   query.createdAt = {};
    //   if (startDate) query.createdAt.$gte = new Date(startDate);
    //   if (endDate) query.createdAt.$lte = new Date(endDate);
    // }

    // if (category) {
    //   query.surveyCategory = category;
    // }

    // if (status) {
    //   query.status = status;
    // }

    // // Get total count efficiently
    // const total = await RiskBasedSetup.countDocuments(query);
    // const totalPages = Math.ceil(total / parseInt(limit));

    // const userSurveyList = await RiskBasedSetup.find(query)
    //   .select(
    //     "_id surveyCreationDate surveyCategory facilityId teamMembers teamCoordinator status createdAt updatedAt"
    //   )
    //   .populate("userId", "firstName lastName")
    //   .populate("facilityId", "name")
    //   .limit(parseInt(limit))
    //   .skip((page - 1) * limit)
    //   .sort({ createdAt: -1 });

    // auditLogger(
    //   "user risk based setup list",
    //   "user risk based setup list fetched successfully",
    //   "AdminActivity",
    //   req.user._id
    // );

    // return res.status(200).json({
    //   status: true,
    //   statusCode: 200,
    //   message: "User risk based setup list fetched successfully.",
    //   data: {
    //     userSurveyList,
    //     pagination: {
    //       total,
    //       totalPages,
    //       limit: parseInt(limit),
    //       currentPage: parseInt(page),
    //     },
    //   },
    // });

    const {
      facility,
      startDate,
      endDate,
      category,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    const userId = req.user._id;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Helper function to build date filter
    const buildDateFilter = () => {
      if (!startDate && !endDate) return {};
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      return { createdAt: dateFilter };
    };

    // Helper function to format survey data consistently
    const formatSurveyData = (surveys, source = "direct") => {
      return surveys.map((survey) => ({
        _id: survey._id,
        surveyCreationDate: survey.surveyCreationDate,
        surveyCategory: survey.surveyCategory,
        facilityId: survey.facilityId,
        teamMembers: survey.teamMembers,
        teamCoordinator: survey.teamCoordinator,
        status: survey.status,
        createdAt: survey.createdAt,
        updatedAt: survey.updatedAt,
        userId: survey.userId,
        source, // Track data source for debugging
      }));
    };

    // Approach 1: Get surveys where user is the owner (direct SurveyWizard query)
    const getOwnedSurveys = async () => {
      const query = { userId };

      // Apply filters
      if (facility) query.facilityId = facility;
      if (category) query.surveyCategory = category;
      if (status) query.status = status;

      const dateFilter = buildDateFilter();
      if (Object.keys(dateFilter).length > 0) {
        Object.assign(query, dateFilter);
      }

      const [total, surveys] = await Promise.all([
        RiskBasedSetup.countDocuments(query),
        RiskBasedSetup.find(query)
          .select(
            "_id surveyCreationDate surveyCategory facilityId teamMembers teamCoordinator status createdAt updatedAt",
          )
          .populate("userId", "firstName lastName")
          .populate("facilityId", "name")
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
      ]);

      return {
        surveys: formatSurveyData(surveys, "owned"),
        total,
        totalPages: Math.ceil(total / limitNum),
      };
    };

    // Approach 2: Get surveys where user is invited (User.surveys array)
    const getInvitedSurveys = async () => {
      // Build survey match criteria for aggregation
      const surveyMatchCriteria = {};
      if (facility)
        surveyMatchCriteria["surveys.facilityId"] = new ObjectId(facility);
      if (category) surveyMatchCriteria["surveys.surveyCategory"] = category;
      if (status) surveyMatchCriteria["surveys.status"] = status;
      if (startDate || endDate) {
        surveyMatchCriteria["surveys.createdAt"] = {};
        if (startDate)
          surveyMatchCriteria["surveys.createdAt"].$gte = new Date(startDate);
        if (endDate)
          surveyMatchCriteria["surveys.createdAt"].$lte = new Date(endDate);
      }

      const basePipeline = [
        {
          $match: {
            _id: new ObjectId(userId),
            surveys: { $exists: true, $ne: [] },
          },
        },
        { $unwind: "$surveys" },
        {
          $addFields: {
            "surveys.surveyId": { $toObjectId: "$surveys.surveyId" },
          },
        },
        {
          $lookup: {
            from: "riskbasedsetups",
            let: { surveyId: "$surveys.surveyId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$surveyId"] } } },
              {
                $lookup: {
                  from: "users",
                  localField: "userId",
                  foreignField: "_id",
                  as: "user",
                },
              },
              { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
              {
                $lookup: {
                  from: "facilities",
                  localField: "facilityId",
                  foreignField: "_id",
                  as: "facility",
                },
              },
              {
                $unwind: {
                  path: "$facility",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $project: {
                  _id: 1,
                  surveyCreationDate: 1,
                  surveyCategory: 1,
                  facilityId: { $ifNull: ["$facility", null] },
                  teamMembers: 1,
                  teamCoordinator: 1,
                  status: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  userId: {
                    $cond: {
                      if: { $ifNull: ["$user", false] },
                      then: {
                        _id: "$user._id",
                        firstName: "$user.firstName",
                        lastName: "$user.lastName",
                      },
                      else: null,
                    },
                  },
                },
              },
            ],
            as: "surveyDetails",
          },
        },
        { $unwind: "$surveyDetails" },
      ];

      // Add survey-specific filters if any
      if (Object.keys(surveyMatchCriteria).length > 0) {
        basePipeline.push({ $match: surveyMatchCriteria });
      }

      // Get total count
      const countPipeline = [...basePipeline, { $count: "total" }];
      const countResult = await User.aggregate(countPipeline);
      const total = countResult.length > 0 ? countResult[0].total : 0;

      // Get paginated results
      const dataPipeline = [
        ...basePipeline,
        { $sort: { "surveyDetails.createdAt": -1 } },
        { $skip: (pageNum - 1) * limitNum },
        { $limit: limitNum },
        {
          $project: {
            _id: 0,
            survey: "$surveys",
            surveyDetails: "$surveyDetails",
          },
        },
      ];

      const surveys = await User.aggregate(dataPipeline);
      const formattedSurveys = surveys.map((item) => ({
        ...item.surveyDetails,
        source: "invited",
      }));

      return {
        surveys: formattedSurveys,
        total,
        totalPages: Math.ceil(total / limitNum),
      };
    };

    // Execute both approaches in parallel
    const [ownedResult, invitedResult] = await Promise.all([
      getOwnedSurveys(),
      getInvitedSurveys(),
    ]);

    // Merge and deduplicate results
    const allSurveys = [...ownedResult.surveys, ...invitedResult.surveys];
    const uniqueSurveys = allSurveys.reduce((acc, survey) => {
      const existingIndex = acc.findIndex(
        (s) => s._id.toString() === survey._id.toString(),
      );
      if (existingIndex === -1) {
        acc.push(survey);
      } else {
        // Prefer owned surveys over invited ones
        if (survey.source === "owned") {
          acc[existingIndex] = survey;
        }
      }
      return acc;
    }, []);

    // Sort merged results by creation date
    uniqueSurveys.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination to merged results
    const totalMerged = uniqueSurveys.length;
    const totalPagesMerged = Math.ceil(totalMerged / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedSurveys = uniqueSurveys.slice(startIndex, endIndex);

    // Clean up source field for response
    const cleanedSurveys = paginatedSurveys.map(
      ({ source, ...survey }) => survey,
    );

    auditLogger(
      "user survey list",
      `Fetched ${cleanedSurveys.length} surveys (${ownedResult.total} owned, ${invitedResult.total} invited) for user ${userId}`,
      "AdminActivity",
      req.user._id,
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "User survey list fetched successfully.",
      data: {
        userSurveyList: cleanedSurveys,
        pagination: {
          total: totalMerged,
          totalPages: totalPagesMerged,
          limit: limitNum,
          currentPage: pageNum,
        },
        // summary: {
        //   ownedSurveys: ownedResult.total,
        //   invitedSurveys: invitedResult.total,
        //   totalUnique: totalMerged
        // }
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "user survey list error",
      `Error during user survey list: ${errorMsg}`,
      "AdminActivity",
      req.user._id,
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during user survey list: ${errorMsg}`,
    });
  }
};

const invitedUsersSurveyRiskBasedList = async (req, res) => {
  try {
    // const userId = req.user._id;
    // const {
    //   facility,
    //   startDate,
    //   endDate,
    //   category,
    //   status,
    //   page = 1,
    //   limit = 10,
    // } = req.query;

    // // Build the base query
    // const matchStage = {
    //   _id: new ObjectId(userId),
    //   surveys: { $exists: true, $ne: [] }, // Check if surveys array exists and is not empty
    // };

    // // Add filters to matchStage
    // const surveyMatch = {};
    // if (facility) {
    //   surveyMatch["facilityId"] = new ObjectId(facility);
    // }
    // if (category) {
    //   surveyMatch["surveyCategory"] = category;
    // }
    // if (status) {
    //   surveyMatch["status"] = status;
    // }
    // if (startDate || endDate) {
    //   surveyMatch["createdAt"] = {};
    //   if (startDate) surveyMatch["createdAt"].$gte = new Date(startDate);
    //   if (endDate) surveyMatch["createdAt"].$lte = new Date(endDate);
    // }

    // // Get user with paginated surveys
    // const pipeline = [
    //   { $match: matchStage },
    //   { $unwind: "$surveys" },
    //   // Convert surveyId to ObjectId for proper matching
    //   {
    //     $addFields: {
    //       "surveys.surveyId": { $toObjectId: "$surveys.surveyId" },
    //     },
    //   },
    //   {
    //     $match: {
    //       ...(Object.keys(surveyMatch).length > 0
    //         ? { surveys: { $elemMatch: surveyMatch } }
    //         : {}),
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "riskbasedsetups",
    //       let: { surveyId: "$surveys.surveyId" },
    //       pipeline: [
    //         { $match: { $expr: { $eq: ["$_id", "$$surveyId"] } } },
    //         {
    //           $lookup: {
    //             from: "users",
    //             localField: "userId",
    //             foreignField: "_id",
    //             as: "user",
    //           },
    //         },
    //         { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
    //         {
    //           $lookup: {
    //             from: "facilities",
    //             localField: "facilityId",
    //             foreignField: "_id",
    //             as: "facility",
    //           },
    //         },
    //         {
    //           $unwind: { path: "$facility", preserveNullAndEmptyArrays: true },
    //         },
    //         {
    //           $project: {
    //             _id: 1,
    //             surveyCreationDate: 1,
    //             surveyCategory: 1,
    //             facilityId: { $ifNull: ["$facility", null] },
    //             teamMembers: 1,
    //             teamCoordinator: 1,
    //             status: 1,
    //             createdAt: 1,
    //             updatedAt: 1,
    //             userId: {
    //               $cond: {
    //                 if: { $ifNull: ["$user", false] },
    //                 then: {
    //                   _id: "$user._id",
    //                   firstName: "$user.firstName",
    //                   lastName: "$user.lastName",
    //                 },
    //                 else: null,
    //               },
    //             },
    //           },
    //         },
    //       ],
    //       as: "surveyDetails",
    //     },
    //   },
    //   { $unwind: "$surveyDetails" },
    //   // Count total matching surveys
    //   {
    //     $count: "total",
    //   },
    // ];

    // // First, get the total count
    // const countResult = await User.aggregate(pipeline);
    // const total = countResult.length > 0 ? countResult[0].total : 0;
    // const totalPages = Math.ceil(total / parseInt(limit));

    // // Then get the paginated results
    // const paginationPipeline = [
    //   ...pipeline.slice(0, -1), // Remove the $count stage
    //   { $sort: { "surveyDetails.createdAt": -1 } },
    //   { $skip: (page - 1) * parseInt(limit) },
    //   { $limit: parseInt(limit) },
    //   {
    //     $project: {
    //       _id: 0,
    //       survey: "$surveys",
    //       surveyDetails: 1,
    //     },
    //   },
    // ];

    // const surveys = await User.aggregate(paginationPipeline);

    // // Format the response
    // const formattedSurveys = surveys.map((item) => ({
    //   ...item.survey,
    //   surveyDetails: item.surveyDetails,
    // }));

    // auditLogger(
    //   "invited users survey list",
    //   `Fetched survey list for user ${userId} successfully`,
    //   "AdminActivity",
    //   req.user._id
    // );

    // return res.status(200).json({
    //   status: true,
    //   statusCode: 200,
    //   message: "User's survey list fetched successfully",
    //   data: {
    //     total,
    //     totalPages,
    //     page: parseInt(page),
    //     limit: parseInt(limit),
    //     surveys: formattedSurveys,
    //   },
    // });

    const {
      facility,
      startDate,
      endDate,
      category,
      status,
      page = 1,
      limit = 10,
    } = req.query;

    const userId = req.user._id;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Helper function to build date filter
    const buildDateFilter = () => {
      if (!startDate && !endDate) return {};
      const dateFilter = {};
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
      return { createdAt: dateFilter };
    };

    // Helper function to format survey data consistently
    const formatSurveyData = (surveys, source = "direct") => {
      return surveys.map((survey) => ({
        _id: survey._id,
        surveyCreationDate: survey.surveyCreationDate,
        surveyCategory: survey.surveyCategory,
        facilityId: survey.facilityId,
        teamMembers: survey.teamMembers,
        teamCoordinator: survey.teamCoordinator,
        status: survey.status,
        createdAt: survey.createdAt,
        updatedAt: survey.updatedAt,
        userId: survey.userId,
        source, // Track data source for debugging
      }));
    };

    // Approach 1: Get surveys where user is the owner (direct SurveyWizard query)
    const getOwnedSurveys = async () => {
      const query = { userId };

      // Apply filters
      if (facility) query.facilityId = facility;
      if (category) query.surveyCategory = category;
      if (status) query.status = status;

      const dateFilter = buildDateFilter();
      if (Object.keys(dateFilter).length > 0) {
        Object.assign(query, dateFilter);
      }

      const [total, surveys] = await Promise.all([
        RiskBasedSetup.countDocuments(query),
        RiskBasedSetup.find(query)
          .select(
            "_id surveyCreationDate surveyCategory facilityId teamMembers teamCoordinator status createdAt updatedAt",
          )
          .populate("userId", "firstName lastName")
          .populate("facilityId", "name")
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum),
      ]);

      return {
        surveys: formatSurveyData(surveys, "owned"),
        total,
        totalPages: Math.ceil(total / limitNum),
      };
    };

    // Approach 2: Get surveys where user is invited (User.surveys array)
    const getInvitedSurveys = async () => {
      // Build survey match criteria for aggregation
      const surveyMatchCriteria = {};
      if (facility)
        surveyMatchCriteria["surveys.facilityId"] = new ObjectId(facility);
      if (category) surveyMatchCriteria["surveys.surveyCategory"] = category;
      if (status) surveyMatchCriteria["surveys.status"] = status;
      if (startDate || endDate) {
        surveyMatchCriteria["surveys.createdAt"] = {};
        if (startDate)
          surveyMatchCriteria["surveys.createdAt"].$gte = new Date(startDate);
        if (endDate)
          surveyMatchCriteria["surveys.createdAt"].$lte = new Date(endDate);
      }

      const basePipeline = [
        {
          $match: {
            _id: new ObjectId(userId),
            surveys: { $exists: true, $ne: [] },
          },
        },
        { $unwind: "$surveys" },
        {
          $addFields: {
            "surveys.surveyId": { $toObjectId: "$surveys.surveyId" },
          },
        },
        {
          $lookup: {
            from: "riskbasedsetups",
            let: { surveyId: "$surveys.surveyId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$surveyId"] } } },
              {
                $lookup: {
                  from: "users",
                  localField: "userId",
                  foreignField: "_id",
                  as: "user",
                },
              },
              { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
              {
                $lookup: {
                  from: "facilities",
                  localField: "facilityId",
                  foreignField: "_id",
                  as: "facility",
                },
              },
              {
                $unwind: {
                  path: "$facility",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $project: {
                  _id: 1,
                  surveyCreationDate: 1,
                  surveyCategory: 1,
                  facilityId: { $ifNull: ["$facility", null] },
                  teamMembers: 1,
                  teamCoordinator: 1,
                  status: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  userId: {
                    $cond: {
                      if: { $ifNull: ["$user", false] },
                      then: {
                        _id: "$user._id",
                        firstName: "$user.firstName",
                        lastName: "$user.lastName",
                      },
                      else: null,
                    },
                  },
                },
              },
            ],
            as: "surveyDetails",
          },
        },
        { $unwind: "$surveyDetails" },
      ];

      // Add survey-specific filters if any
      if (Object.keys(surveyMatchCriteria).length > 0) {
        basePipeline.push({ $match: surveyMatchCriteria });
      }

      // Get total count
      const countPipeline = [...basePipeline, { $count: "total" }];
      const countResult = await User.aggregate(countPipeline);
      const total = countResult.length > 0 ? countResult[0].total : 0;

      // Get paginated results
      const dataPipeline = [
        ...basePipeline,
        { $sort: { "surveyDetails.createdAt": -1 } },
        { $skip: (pageNum - 1) * limitNum },
        { $limit: limitNum },
        {
          $project: {
            _id: 0,
            survey: "$surveys",
            surveyDetails: "$surveyDetails",
          },
        },
      ];

      const surveys = await User.aggregate(dataPipeline);
      const formattedSurveys = surveys.map((item) => ({
        ...item.surveyDetails,
        source: "invited",
      }));

      return {
        surveys: formattedSurveys,
        total,
        totalPages: Math.ceil(total / limitNum),
      };
    };

    // Execute both approaches in parallel
    const [ownedResult, invitedResult] = await Promise.all([
      getOwnedSurveys(),
      getInvitedSurveys(),
    ]);

    // Merge and deduplicate results
    const allSurveys = [...ownedResult.surveys, ...invitedResult.surveys];
    const uniqueSurveys = allSurveys.reduce((acc, survey) => {
      const existingIndex = acc.findIndex(
        (s) => s._id.toString() === survey._id.toString(),
      );
      if (existingIndex === -1) {
        acc.push(survey);
      } else {
        // Prefer owned surveys over invited ones
        if (survey.source === "owned") {
          acc[existingIndex] = survey;
        }
      }
      return acc;
    }, []);

    // Sort merged results by creation date
    uniqueSurveys.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination to merged results
    const totalMerged = uniqueSurveys.length;
    const totalPagesMerged = Math.ceil(totalMerged / limitNum);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedSurveys = uniqueSurveys.slice(startIndex, endIndex);

    // Clean up source field for response
    const cleanedSurveys = paginatedSurveys.map(
      ({ source, ...survey }) => survey,
    );

    auditLogger(
      "user survey list",
      `Fetched ${cleanedSurveys.length} surveys (${ownedResult.total} owned, ${invitedResult.total} invited) for user ${userId}`,
      "AdminActivity",
      req.user._id,
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "User survey list fetched successfully.",
      data: {
        surveys: cleanedSurveys,
        pagination: {
          total: totalMerged,
          totalPages: totalPagesMerged,
          limit: limitNum,
          currentPage: pageNum,
        },
        // summary: {
        //   ownedSurveys: ownedResult.total,
        //   invitedSurveys: invitedResult.total,
        //   totalUnique: totalMerged
        // }
      },
    });
  } catch (error) {
    console.error("Error in invitedUsersSurveyList:", error);
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "invited users survey list error",
      `Error during invited users survey list: ${errorMsg}`,
      "AdminActivity",
      req.user._id,
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred while fetching user's survey list: ${errorMsg}`,
    });
  }
};

// remove risk based survey
const removeRiskBased = async (req, res) => {
  try {
    let riskId = req.params.id;
    let userId = req.user._id;
    let risk = await RiskBasedSetup.findById(riskId);

    const isCreator = risk.userId.toString() === userId.toString();

    if (!isCreator) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message:
          "You are not authorized to perform this action. Only the creator can do this.",
      });
    }

    await RiskBasedSetup.findByIdAndDelete(riskId);
   
    const users = await User.findById(req.user._id);
      await SurveyLog.create({
        activity: `Remove RiskBasedSurvey by ${users.firstName} ${users.lastName}`,
        action: "Success",
        createdBy: req.user._id,
      });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "RiskBasedSurvey removed successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    const users = await User.findById(req.user._id);
    await SurveyLog.create({
      activity: `Remove RiskBasedSurvey by ${users.firstName} ${users.lastName}`,
      action: "Failed",
      createdBy: req.user._id,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during from removing RiskBasedSurvey: ${errorMsg}`,
    });
  }
};

module.exports = {
  surveyCategories,
  requestEmail,
  viewSurveysUnderFacility,
  addRiskBasedSetup,
  updateRiskBasedSetup,
  viewRiskBasedSetup,
  facilityRiskBasedSetup,
  userRiskBasedSetup,
  invitedUsersSurveyRiskBasedList,
  specialTypes,
  removeRiskBased
};
