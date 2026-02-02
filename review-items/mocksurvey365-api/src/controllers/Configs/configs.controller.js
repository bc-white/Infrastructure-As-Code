const axios = require("axios");
const User = require("../../models/user-model/user.model");
const Role = require("../../models/user-model/role.model");
const auditLogger = require("../../helpers/logger");
const CONSTANTS = require("../../constants/constants");
const LongTermRegulations = require("../../models/configs/long-term-regulations.model");
const Resources = require("../../models/configs/resources.model");
const FacilityTypes = require("../../models/configs/facility-types.model");
const Facility = require("../../models/configs/facility.model");
const Resident = require("../../models/configs/resident.model");
const CriticalElement = require("../../models/configs/critical_elements.model");
const Ftags = require("../../models/configs/ftags.model");
const MandatoryTasks = require("../../models/configs/mandatorytasks.model");
const NursingHomes = require("../../models/configs/nursing_homes.model");
const NursingHomeProviders = require("../../models/configs/nursing_home_providers.model");
const CriticalPathWayQuestion = require("../../models/surveyModels/criticalPathWayQuestion.model");
const Survey = require("../../models/surveyModels/survey.model");
const {
  addLongTermRegulationsValidation,
  updateLongTermRegulationsValidation,
  addFacilityTypesValidation,
  addFacilityValidation,
  updateFacilityValidation,
  addResourcesValidation,
  updateResourcesValidation,
  addCEValidation,
  updateCEValidation,
  addFtagSetupValidation,
  updateFtagSetupValidation,
  addMandatoryTaskValidation,
  updateMandatoryTaskValidation,
} = require("../../validators/config-validators/config.validators");

// critical elements questions
const addCritialQuestions = async (req, res) => {
  try {
     const { pathwayName, section, title, questionText, subQuestion } =
       req.body;

     let result = await CriticalPathWayQuestion.create({
       pathwayName,
       section,
       title,
       questionText,
       subQuestion,
     });

   

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Critical elements added successfully.",
      data: result,
    });
  } catch (error) {}
};

// critical questions
const critialQuestions = async (req, res) => {
  try {
    let result = await CriticalPathWayQuestion.find().sort({ createdAt: 1 });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Critical elements fetched successfully.",
      data: result,
    });
  } catch (error) {}
};

// critical elements
const addCriticalElement = async (req, res) => {
  try {
    const { error } = addCEValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { name, pdflink, type } = req.body;
    const criticalElementinfo = await CriticalElement.findOne({ name });
    if (criticalElementinfo) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Critical element data already exist",
      });
    }

    const criticalElement = await CriticalElement.create({
      userId: req.user._id,
      name,
      pdflink,
      type,
      status: true,
    });

    auditLogger(
      "critical elements",
      `critical elements added successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Critical elements added successfully.",
      data: criticalElement,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "critical elements error",
      `Error during critical elements: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during critical elements: ${errorMsg}`,
    });
  }
};

// update critical elements
const updateCriticalElments = async (req, res) => {
  try {
    const { error } = updateCEValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { id, name, pdflink, type } = req.body;
    const criticalElementinfo = await CriticalElement.findById(id);
    if (!criticalElementinfo) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Critical element data not found",
      });
    }

    const criticalElement = await CriticalElement.findByIdAndUpdate(id, {
      name,
      pdflink,
      type,
      status: true,
    });

    auditLogger(
      "critical elements",
      `critical elements updated successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Critical elements updated successfully.",
      data: criticalElement,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "critical elements error",
      `Error during critical elements: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during critical elements: ${errorMsg}`,
    });
  }
};

// view critical elements
const viewCriticalElement = async (req, res) => {
  try {
    const criticalElementId = req.params.id;
    if (!criticalElementId) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Critical element ID is required.",
      });
    }

    const ce = await CriticalElement.findById(criticalElementId)
      .select("_id name pdflink status createdAt")
      .sort({ createdAt: -1 });

    auditLogger(
      "view critical element",
      "critical element data view",
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Critical element data viewed successfully",
      data: ce,
    });
  } catch (error) {
    auditLogger(
      "view critical element Error",
      `view critical element encounted an error: ${error.message}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during view critical element: ${error.message}`,
    });
  }
};

// critical elements
const criticalElements = async (req, res) => {
  try {
    const { name, startDate, endDate, page = 1, limit = 35 } = req.query;
    const query = { status: true, type: "Resident CE Pathways" };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (name) {
      query.name = { $regex: `^${name}`, $options: "i" };
    }

    // Get total count efficiently
    const total = await CriticalElement.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    const criticalelements = await CriticalElement.find(query)
      .select("_id name type pdflink status createdAt")
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ createdAt: 1 });

    auditLogger(
      "critical elements",
      `critical elements fetched successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Critical elements fetched successfully.",
      data: {
        criticalelements,
        pagination: {
          total,
          totalPages,
          limit: parseInt(limit),
          currentPage: parseInt(page),
        },
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "critical elements error",
      `Error during critical elements: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during critical elements: ${errorMsg}`,
    });
  }
};

const facilityTaskCEPathways = async (req, res) => {
  try {
    const { name, startDate, endDate, page = 1, limit = 35 } = req.query;
    const query = { status: true, type: "Facility Task CE Pathways" };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (name) {
      query.name = { $regex: `^${name}`, $options: "i" };
    }

    // Get total count efficiently
    const total = await CriticalElement.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    const criticalelements = await CriticalElement.find(query)
      .select("_id name type pdflink status createdAt")
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ createdAt: 1 });

    auditLogger(
      "critical elements",
      `critical elements fetched successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Critical elements fetched successfully.",
      data: {
        criticalelements,
        pagination: {
          total,
          totalPages,
          limit: parseInt(limit),
          currentPage: parseInt(page),
        },
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "critical elements error",
      `Error during critical elements: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during critical elements: ${errorMsg}`,
    });
  }
};

// delete critical elments
const deleteCriticalElements = async (req, res) => {
  try {
    const id = req.params.id;
    const criticalElement = await CriticalElement.findByIdAndDelete(id);
    if (!criticalElement) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Critical element not found",
      });
    }

    auditLogger(
      "critical elements",
      `critical elements deleted successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Critical elements deleted successfully.",
      data: criticalElement,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "critical elements error",
      `Error during critical elements: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during critical elements: ${errorMsg}`,
    });
  }
};

const addLongTermRegulations = async (req, res) => {
  try {
    const { error } = addLongTermRegulationsValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { name, state, pdflink, date, description } = req.body;
    const longTermRegulationsinfo = await LongTermRegulations.findOne({
      name,
    });
    if (longTermRegulationsinfo) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Long term regulations data already exist",
      });
    }

    const longTermRegulations = await LongTermRegulations.create({
      userId: req.user._id,
      name,
      state,
      pdflink,
      date,
      description,
      status: true,
    });

    auditLogger(
      "longterm regulations",
      `longterm regulations added successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Long term regulations added successfully.",
      data: longTermRegulations,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "longterm regulations error",
      `Error during longterm regulations: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during longterm regulations: ${errorMsg}`,
    });
  }
};

const longTermRegulationas = async (req, res) => {
  try {
    const { name, state, startDate, endDate, page = 1, limit = 10 } = req.query;
    const query = { status: true };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (state) {
      query.state = { $regex: `^${state}`, $options: "i" };
    }

    if (name) {
      query.name = { $regex: `^${name}`, $options: "i" };
    }

    // Get total count efficiently
    const total = await LongTermRegulations.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    const longTermRegulations = await LongTermRegulations.find(query)
      .select("_id name state pdflink date description")
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ state: 1 });

    auditLogger(
      "longterm regulations",
      `longterm regulations fetched successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Long term regulations fetched successfully.",
      data: {
        longTermRegulations,
        pagination: {
          total,
          totalPages,
          limit: parseInt(limit),
          currentPage: parseInt(page),
        },
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "longterm regualtions error",
      `Error during longterm regualtions: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during longterm regualtions: ${errorMsg}`,
    });
  }
};

const deleteLongTermRegulations = async (req, res) => {
  try {
    const id = req.params.id;
    const longTermRegulations = await LongTermRegulations.findByIdAndDelete(id);
    if (!longTermRegulations) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Long term regulations not found",
      });
    }

    auditLogger(
      "longterm regulations",
      `longterm regulations deleted successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Long term regulations deleted successfully.",
      data: longTermRegulations,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "longterm regualtions error",
      `Error during longterm regualtions: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during longterm regualtions: ${errorMsg}`,
    });
  }
};

// resources
const addResources = async (req, res) => {
  try {
    const { error } = addResourcesValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { name, type, pdflink, date, description } = req.body;

    const resources = await Resources.create({
      userId: req.user._id,
      name,
      type,
      pdflink,
      date,
      description,
      status: true,
    });

    auditLogger(
      "resources",
      `resources added successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Resources added successfully.",
      data: resources,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "resources error",
      `Error during resources: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during longterm regulations: ${errorMsg}`,
    });
  }
};

const resources = async (req, res) => {
  try {
    const { name, type, startDate, endDate, page = 1, limit = 10 } = req.query;
    const query = { status: true };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (type) {
      query.type = { $regex: `^${type}`, $options: "i" };
    }

    if (name) {
      query.name = { $regex: `^${name}`, $options: "i" };
    }

    // Get total count efficiently
    const total = await Resources.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    const resources = await Resources.find(query)
      .select("_id name type pdflink date description")
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ type: 1 });

    auditLogger(
      "resources",
      `resources fetched successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Resources fetched successfully.",
      data: {
        resources,
        pagination: {
          total,
          totalPages,
          limit: parseInt(limit),
          currentPage: parseInt(page),
        },
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "resources error",
      `Error during resources: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during resources: ${errorMsg}`,
    });
  }
};

const viewResources = async (req, res) => {
  try {
    const resourcesId = req.params.id;
    if (!resourcesId) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Resources ID is required.",
      });
    }

    const resources = await Resources.findById(resourcesId).select(
      "_id name type pdflink date description status"
    );
    if (!resources) {
      return res.status(200).json({
        status: true,
        statusCode: 200,
        message: "Resources data not found",
        data: {},
      });
    }

    auditLogger("view resources", "resources data view", "AdminActivity", "");

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Resources data viewed successfully",
      data: resources,
    });
  } catch (error) {
    auditLogger(
      "view resources Error",
      `view resources encounted an error: ${error.message}`,
      "AdminActivity",
      ""
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during view resources: ${error.message}`,
    });
  }
};

// delete resources
const deleteResources = async (req, res) => {
  try {
    const resourcesId = req.params.id;
    if (!resourcesId) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Resources ID is required.",
      });
    }

    const resources = await Resources.findByIdAndDelete(resourcesId);
    if (!resources) {
      return res.status(200).json({
        status: true,
        statusCode: 200,
        message: "Resources data not found",
        data: {},
      });
    }

    auditLogger(
      "delete resources",
      "resources data deleted",
      "AdminActivity",
      ""
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Resources data deleted successfully",
      data: resources,
    });
  } catch (error) {
    auditLogger(
      "delete resources Error",
      `delete resources encounted an error: ${error.message}`,
      "AdminActivity",
      ""
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during delete resources: ${error.message}`,
    });
  }
};

const addFacilityTypes = async (req, res) => {
  try {
    const { error } = addFacilityTypesValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { name } = req.body;
    const facilityTypesinfo = await FacilityTypes.findOne({
      name,
    });
    if (facilityTypesinfo) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Facility type already exist",
      });
    }

    const facilityTypes = await FacilityTypes.create({
      userId: req.user._id,
      name,
      status: true,
    });

    auditLogger(
      "facility types",
      `facility types added successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Facility type added successfully.",
      data: facilityTypes,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "facility types error",
      `Error during facility types: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during facility types: ${errorMsg}`,
    });
  }
};

const facilityTypes = async (req, res) => {
  try {
    const facilityTypes = await FacilityTypes.find({ status: true })
      .select("_id name")
      .sort({ name: 1 });

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Facility types fetched successfully.",
      data: facilityTypes,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "all facility types error",
      `Error during all facility types: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during all facility: ${errorMsg}`,
    });
  }
};

// delete facility types
const deleteFacilityTypes = async (req, res) => {
  try {
    const facilityTypesId = req.params.id;
    if (!facilityTypesId) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Facility types ID is required.",
      });
    }

    const facilityTypes = await FacilityTypes.findByIdAndDelete(
      facilityTypesId
    );
    if (!facilityTypes) {
      return res.status(200).json({
        status: true,
        statusCode: 200,
        message: "Facility types data not found",
        data: {},
      });
    }

    auditLogger(
      "delete facility types",
      "facility types data deleted",
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Facility types data deleted successfully",
      data: facilityTypes,
    });
  } catch (error) {
    auditLogger(
      "delete facility types Error",
      `delete facility types encounted an error: ${error.message}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during delete facility types: ${error.message}`,
    });
  }
};

// facility
const addFacility = async (req, res) => {
  try {
    const { error } = addFacilityValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const {
      name,
      address,
      size,
      contact,
      secondaryContactPhone,
      notes,
      lastSurvey,
      providerNumber,
      CMS_Certification_Number_CCN,
      Provider_Name,
      Provider_Address,
      City_Town,
      State,
      ZIP_Code,
      Telephone_Number,
      Provider_SSA_County_Code,
      County_Parish,
      Ownership_Type,
      Number_of_Certified_Beds,
      Average_Number_of_Residents_per_Day,
      Average_Number_of_Residents_per_Day_Footnote,
      Provider_Type,
      Provider_Resides_in_Hospital,
      Legal_Business_Name,
      Date_First_Approved_to_Provide_Medicare_and_Medicaid_Services,
      Chain_Name,
      Chain_ID,
      Number_of_Facilities_in_Chain,
      Chain_Average_Overall_5_star_Rating,
      Chain_Average_Health_Inspection_Rating,
      Chain_Average_Staffing_Rating,
      Chain_Average_QM_Rating,
      Continuing_Care_Retirement_Community,
      Special_Focus_Status,
      Abuse_Icon,
      Most_Recent_Health_Inspection_More_Than_2_Years_Ago,
      Provider_Changed_Ownership_in_Last_12_Months,
      With_a_Resident_and_Family_Council,
      Automatic_Sprinkler_Systems_in_All_Required_Areas,
      Overall_Rating,
      Overall_Rating_Footnote,
      Health_Inspection_Rating,
      Health_Inspection_Rating_Footnote,
      QM_Rating,
      QM_Rating_Footnote,
      Long_Stay_QM_Rating,
      Long_Stay_QM_Rating_Footnote,
      Short_Stay_QM_Rating,
      Short_Stay_QM_Rating_Footnote,
      Staffing_Rating,
      Staffing_Rating_Footnote,
      Reported_Staffing_Footnote,
      Physical_Therapist_Staffing_Footnote,
      Reported_Nurse_Aide_Staffing_Hours_per_Resident_per_Day,
      Reported_LPN_Staffing_Hours_per_Resident_per_Day,
      Reported_RN_Staffing_Hours_per_Resident_per_Day,
      Reported_Licensed_Staffing_Hours_per_Resident_per_Day,
      Reported_Total_Nurse_Staffing_Hours_per_Resident_per_Day,
      Total_number_of_nurse_staff_hours_per_resident_per_day_on_the_weekend,
      Registered_Nurse_hours_per_resident_per_day_on_the_weekend,
      Reported_Physical_Therapist_Staffing_Hours_per_Resident_Per_Day,
      Total_nursing_staff_turnover,
      Total_nursing_staff_turnover_footnote,
      Registered_Nurse_turnover,
      Registered_Nurse_turnover_footnote,
      Number_of_administrators_who_have_left_the_nursing_home,
      Administrator_turnover_footnote,
      Nursing_Case_Mix_Index,
      Nursing_Case_Mix_Index_Ratio,
      Case_Mix_Nurse_Aide_Staffing_Hours_per_Resident_per_Day,
      Case_Mix_LPN_Staffing_Hours_per_Resident_per_Day,
      Case_Mix_RN_Staffing_Hours_per_Resident_per_Day,
      Case_Mix_Total_Nurse_Staffing_Hours_per_Resident_per_Day,
      Case_Mix_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day,
      Adjusted_Nurse_Aide_Staffing_Hours_per_Resident_per_Day,
      Adjusted_LPN_Staffing_Hours_per_Resident_per_Day,
      Adjusted_RN_Staffing_Hours_per_Resident_per_Day,
      Adjusted_Total_Nurse_Staffing_Hours_per_Resident_per_Day,
      Adjusted_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day,
      Rating_Cycle_1_Standard_Survey_Health_Date,
      Rating_Cycle_1_Total_Number_of_Health_Deficiencies,
      Rating_Cycle_1_Number_of_Standard_Health_Deficiencies,
      Rating_Cycle_1_Number_of_Complaint_Health_Deficiencies,
      Rating_Cycle_1_Health_Deficiency_Score,
      Rating_Cycle_1_Number_of_Health_Revisits,
      Rating_Cycle_1_Health_Revisit_Score,
      Rating_Cycle_1_Total_Health_Score,
      Rating_Cycle_2_Standard_Health_Survey_Date,
      Rating_Cycle_2_3_Total_Number_of_Health_Deficiencies,
      Rating_Cycle_2_Number_of_Standard_Health_Deficiencies,
      Rating_Cycle_2_3_Number_of_Complaint_Health_Deficiencies,
      Rating_Cycle_2_3_Health_Deficiency_Score,
      Rating_Cycle_2_Number_of_Health_Revisits,
      Rating_Cycle_2_3_Number_of_Health_Revisits,
      Rating_Cycle_2_3_Health_Revisit_Score,
      Rating_Cycle_2_3_Total_Health_Score,
      Total_Weighted_Health_Survey_Score,
      Number_of_Facility_Reported_Incidents,
      Number_of_Substantiated_Complaints,
      Number_of_Citations_from_Infection_Control_Inspections,
      Number_of_Fines,
      Total_Amount_of_Fines_in_Dollars,
      Number_of_Payment_Denials,
      Total_Number_of_Penalties,
      Location,
      Latitude,
      Longitude,
      Geocoding_Footnote,
      Processing_Date,
    } = req.body;
    if (Provider_Name) {
      const facilityinfo = await Facility.findOne({
        Provider_Name,
        userId: req.user._id,
      });
      if (facilityinfo) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          message: "Facility already exist",
        });
      }
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found",
      });
    }
    const facility = await Facility.create({
      userId: req.user._id,
      name,
      address,
      size,
      contact,
      secondaryContactPhone,
      notes,
      uniqueOrgCode: user?.uniqueCode,
      lastSurvey,
      providerNumber,
      CMS_Certification_Number_CCN,
      Provider_Name,
      Provider_Address,
      City_Town,
      State,
      ZIP_Code,
      Telephone_Number,
      Provider_SSA_County_Code,
      County_Parish,
      Ownership_Type,
      Number_of_Certified_Beds,
      Average_Number_of_Residents_per_Day,
      Average_Number_of_Residents_per_Day_Footnote,
      Provider_Type,
      Provider_Resides_in_Hospital,
      Legal_Business_Name,
      Date_First_Approved_to_Provide_Medicare_and_Medicaid_Services,
      Chain_Name,
      Chain_ID,
      Number_of_Facilities_in_Chain,
      Chain_Average_Overall_5_star_Rating,
      Chain_Average_Health_Inspection_Rating,
      Chain_Average_Staffing_Rating,
      Chain_Average_QM_Rating,
      Continuing_Care_Retirement_Community,
      Special_Focus_Status,
      Abuse_Icon,
      Most_Recent_Health_Inspection_More_Than_2_Years_Ago,
      Provider_Changed_Ownership_in_Last_12_Months,
      With_a_Resident_and_Family_Council,
      Automatic_Sprinkler_Systems_in_All_Required_Areas,
      Overall_Rating,
      Overall_Rating_Footnote,
      Health_Inspection_Rating,
      Health_Inspection_Rating_Footnote,
      QM_Rating,
      QM_Rating_Footnote,
      Long_Stay_QM_Rating,
      Long_Stay_QM_Rating_Footnote,
      Short_Stay_QM_Rating,
      Short_Stay_QM_Rating_Footnote,
      Staffing_Rating,
      Staffing_Rating_Footnote,
      Reported_Staffing_Footnote,
      Physical_Therapist_Staffing_Footnote,
      Reported_Nurse_Aide_Staffing_Hours_per_Resident_per_Day,
      Reported_LPN_Staffing_Hours_per_Resident_per_Day,
      Reported_RN_Staffing_Hours_per_Resident_per_Day,
      Reported_Licensed_Staffing_Hours_per_Resident_per_Day,
      Reported_Total_Nurse_Staffing_Hours_per_Resident_per_Day,
      Total_number_of_nurse_staff_hours_per_resident_per_day_on_the_weekend,
      Registered_Nurse_hours_per_resident_per_day_on_the_weekend,
      Reported_Physical_Therapist_Staffing_Hours_per_Resident_Per_Day,
      Total_nursing_staff_turnover,
      Total_nursing_staff_turnover_footnote,
      Registered_Nurse_turnover,
      Registered_Nurse_turnover_footnote,
      Number_of_administrators_who_have_left_the_nursing_home,
      Administrator_turnover_footnote,
      Nursing_Case_Mix_Index,
      Nursing_Case_Mix_Index_Ratio,
      Case_Mix_Nurse_Aide_Staffing_Hours_per_Resident_per_Day,
      Case_Mix_LPN_Staffing_Hours_per_Resident_per_Day,
      Case_Mix_RN_Staffing_Hours_per_Resident_per_Day,
      Case_Mix_Total_Nurse_Staffing_Hours_per_Resident_per_Day,
      Case_Mix_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day,
      Adjusted_Nurse_Aide_Staffing_Hours_per_Resident_per_Day,
      Adjusted_LPN_Staffing_Hours_per_Resident_per_Day,
      Adjusted_RN_Staffing_Hours_per_Resident_per_Day,
      Adjusted_Total_Nurse_Staffing_Hours_per_Resident_per_Day,
      Adjusted_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day,
      Rating_Cycle_1_Standard_Survey_Health_Date,
      Rating_Cycle_1_Total_Number_of_Health_Deficiencies,
      Rating_Cycle_1_Number_of_Standard_Health_Deficiencies,
      Rating_Cycle_1_Number_of_Complaint_Health_Deficiencies,
      Rating_Cycle_1_Health_Deficiency_Score,
      Rating_Cycle_1_Number_of_Health_Revisits,
      Rating_Cycle_1_Health_Revisit_Score,
      Rating_Cycle_1_Total_Health_Score,
      Rating_Cycle_2_Standard_Health_Survey_Date,
      Rating_Cycle_2_3_Total_Number_of_Health_Deficiencies,
      Rating_Cycle_2_Number_of_Standard_Health_Deficiencies,
      Rating_Cycle_2_3_Number_of_Complaint_Health_Deficiencies,
      Rating_Cycle_2_3_Health_Deficiency_Score,
      Rating_Cycle_2_Number_of_Health_Revisits,
      Rating_Cycle_2_3_Number_of_Health_Revisits,
      Rating_Cycle_2_3_Health_Revisit_Score,
      Rating_Cycle_2_3_Total_Health_Score,
      Total_Weighted_Health_Survey_Score,
      Number_of_Facility_Reported_Incidents,
      Number_of_Substantiated_Complaints,
      Number_of_Citations_from_Infection_Control_Inspections,
      Number_of_Fines,
      Total_Amount_of_Fines_in_Dollars,
      Number_of_Payment_Denials,
      Total_Number_of_Penalties,
      Location,
      Latitude,
      Longitude,
      Geocoding_Footnote,
      Processing_Date,
    });

    auditLogger(
      "facility",
      `facility added successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Facility added successfully.",
      data: facility,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "facility error",
      `Error during facility: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during facility: ${errorMsg}`,
    });
  }
};

const updateFacility = async (req, res) => {
  try {
    const { error } = updateFacilityValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }
    const {
      id,
      name,
      address,
      size,
      contact,
      secondaryContactPhone,
      notes,
      lastSurvey,
      providerNumber,
      CMS_Certification_Number_CCN,
      Provider_Name,
      Provider_Address,
      City_Town,
      State,
      ZIP_Code,
      Telephone_Number,
      Provider_SSA_County_Code,
      County_Parish,
      Ownership_Type,
      Number_of_Certified_Beds,
      Average_Number_of_Residents_per_Day,
      Average_Number_of_Residents_per_Day_Footnote,
      Provider_Type,
      Provider_Resides_in_Hospital,
      Legal_Business_Name,
      Date_First_Approved_to_Provide_Medicare_and_Medicaid_Services,
      Chain_Name,
      Chain_ID,
      Number_of_Facilities_in_Chain,
      Chain_Average_Overall_5_star_Rating,
      Chain_Average_Health_Inspection_Rating,
      Chain_Average_Staffing_Rating,
      Chain_Average_QM_Rating,
      Continuing_Care_Retirement_Community,
      Special_Focus_Status,
      Abuse_Icon,
      Most_Recent_Health_Inspection_More_Than_2_Years_Ago,
      Provider_Changed_Ownership_in_Last_12_Months,
      With_a_Resident_and_Family_Council,
      Automatic_Sprinkler_Systems_in_All_Required_Areas,
      Overall_Rating,
      Overall_Rating_Footnote,
      Health_Inspection_Rating,
      Health_Inspection_Rating_Footnote,
      QM_Rating,
      QM_Rating_Footnote,
      Long_Stay_QM_Rating,
      Long_Stay_QM_Rating_Footnote,
      Short_Stay_QM_Rating,
      Short_Stay_QM_Rating_Footnote,
      Staffing_Rating,
      Staffing_Rating_Footnote,
      Reported_Staffing_Footnote,
      Physical_Therapist_Staffing_Footnote,
      Reported_Nurse_Aide_Staffing_Hours_per_Resident_per_Day,
      Reported_LPN_Staffing_Hours_per_Resident_per_Day,
      Reported_RN_Staffing_Hours_per_Resident_per_Day,
      Reported_Licensed_Staffing_Hours_per_Resident_per_Day,
      Reported_Total_Nurse_Staffing_Hours_per_Resident_per_Day,
      Total_number_of_nurse_staff_hours_per_resident_per_day_on_the_weekend,
      Registered_Nurse_hours_per_resident_per_day_on_the_weekend,
      Reported_Physical_Therapist_Staffing_Hours_per_Resident_Per_Day,
      Total_nursing_staff_turnover,
      Total_nursing_staff_turnover_footnote,
      Registered_Nurse_turnover,
      Registered_Nurse_turnover_footnote,
      Number_of_administrators_who_have_left_the_nursing_home,
      Administrator_turnover_footnote,
      Nursing_Case_Mix_Index,
      Nursing_Case_Mix_Index_Ratio,
      Case_Mix_Nurse_Aide_Staffing_Hours_per_Resident_per_Day,
      Case_Mix_LPN_Staffing_Hours_per_Resident_per_Day,
      Case_Mix_RN_Staffing_Hours_per_Resident_per_Day,
      Case_Mix_Total_Nurse_Staffing_Hours_per_Resident_per_Day,
      Case_Mix_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day,
      Adjusted_Nurse_Aide_Staffing_Hours_per_Resident_per_Day,
      Adjusted_LPN_Staffing_Hours_per_Resident_per_Day,
      Adjusted_RN_Staffing_Hours_per_Resident_per_Day,
      Adjusted_Total_Nurse_Staffing_Hours_per_Resident_per_Day,
      Adjusted_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day,
      Rating_Cycle_1_Standard_Survey_Health_Date,
      Rating_Cycle_1_Total_Number_of_Health_Deficiencies,
      Rating_Cycle_1_Number_of_Standard_Health_Deficiencies,
      Rating_Cycle_1_Number_of_Complaint_Health_Deficiencies,
      Rating_Cycle_1_Health_Deficiency_Score,
      Rating_Cycle_1_Number_of_Health_Revisits,
      Rating_Cycle_1_Health_Revisit_Score,
      Rating_Cycle_1_Total_Health_Score,
      Rating_Cycle_2_Standard_Health_Survey_Date,
      Rating_Cycle_2_3_Total_Number_of_Health_Deficiencies,
      Rating_Cycle_2_Number_of_Standard_Health_Deficiencies,
      Rating_Cycle_2_3_Number_of_Complaint_Health_Deficiencies,
      Rating_Cycle_2_3_Health_Deficiency_Score,
      Rating_Cycle_2_Number_of_Health_Revisits,
      Rating_Cycle_2_3_Number_of_Health_Revisits,
      Rating_Cycle_2_3_Health_Revisit_Score,
      Rating_Cycle_2_3_Total_Health_Score,
      Total_Weighted_Health_Survey_Score,
      Number_of_Facility_Reported_Incidents,
      Number_of_Substantiated_Complaints,
      Number_of_Citations_from_Infection_Control_Inspections,
      Number_of_Fines,
      Total_Amount_of_Fines_in_Dollars,
      Number_of_Payment_Denials,
      Total_Number_of_Penalties,
      Location,
      Latitude,
      Longitude,
      Geocoding_Footnote,
      Processing_Date,
    } = req.body;
    const facility = await Facility.findById(id);
    if (!facility) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Facility not found.",
      });
    }
    facility.name = name;
    facility.address = address;
    facility.size = size;
    facility.contact = contact;
    facility.secondaryContactPhone = secondaryContactPhone;
    facility.notes = notes;
    facility.lastSurvey = lastSurvey;
    facility.providerNumber = providerNumber;

    facility.CMS_Certification_Number_CCN = CMS_Certification_Number_CCN;
    facility.Provider_Name = Provider_Name;
    facility.Provider_Address = Provider_Address;
    facility.City_Town = City_Town;
    facility.State = State;
    facility.ZIP_Code = ZIP_Code;
    facility.Telephone_Number = Telephone_Number;
    facility.Provider_SSA_County_Code = Provider_SSA_County_Code;
    facility.County_Parish = County_Parish;
    facility.Ownership_Type = Ownership_Type;
    facility.Number_of_Certified_Beds = Number_of_Certified_Beds;
    facility.Average_Number_of_Residents_per_Day =
      Average_Number_of_Residents_per_Day;
    facility.Average_Number_of_Residents_per_Day_Footnote =
      Average_Number_of_Residents_per_Day_Footnote;
    facility.Provider_Type = Provider_Type;
    facility.Provider_Resides_in_Hospital = Provider_Resides_in_Hospital;
    facility.Legal_Business_Name = Legal_Business_Name;
    facility.Date_First_Approved_to_Provide_Medicare_and_Medicaid_Services =
      Date_First_Approved_to_Provide_Medicare_and_Medicaid_Services;
    facility.Chain_Name = Chain_Name;
    facility.Chain_ID = Chain_ID;
    facility.Number_of_Facilities_in_Chain = Number_of_Facilities_in_Chain;
    facility.Chain_Average_Overall_5_star_Rating =
      Chain_Average_Overall_5_star_Rating;
    facility.Chain_Average_Health_Inspection_Rating =
      Chain_Average_Health_Inspection_Rating;
    facility.Chain_Average_Staffing_Rating = Chain_Average_Staffing_Rating;
    facility.Chain_Average_QM_Rating = Chain_Average_QM_Rating;
    facility.Continuing_Care_Retirement_Community =
      Continuing_Care_Retirement_Community;
    facility.Special_Focus_Status = Special_Focus_Status;
    facility.Abuse_Icon = Abuse_Icon;
    facility.Most_Recent_Health_Inspection_More_Than_2_Years_Ago =
      Most_Recent_Health_Inspection_More_Than_2_Years_Ago;
    facility.Provider_Changed_Ownership_in_Last_12_Months =
      Provider_Changed_Ownership_in_Last_12_Months;
    facility.With_a_Resident_and_Family_Council =
      With_a_Resident_and_Family_Council;
    facility.Automatic_Sprinkler_Systems_in_All_Required_Areas =
      Automatic_Sprinkler_Systems_in_All_Required_Areas;
    facility.Overall_Rating = Overall_Rating;
    facility.Overall_Rating_Footnote = Overall_Rating_Footnote;
    facility.Health_Inspection_Rating = Health_Inspection_Rating;
    facility.Health_Inspection_Rating_Footnote =
      Health_Inspection_Rating_Footnote;
    facility.QM_Rating = QM_Rating;
    facility.QM_Rating_Footnote = QM_Rating_Footnote;
    facility.Long_Stay_QM_Rating = Long_Stay_QM_Rating;
    facility.Long_Stay_QM_Rating_Footnote = Long_Stay_QM_Rating_Footnote;
    facility.Short_Stay_QM_Rating = Short_Stay_QM_Rating;
    facility.Short_Stay_QM_Rating_Footnote = Short_Stay_QM_Rating_Footnote;
    facility.Staffing_Rating = Staffing_Rating;
    facility.Staffing_Rating_Footnote = Staffing_Rating_Footnote;
    facility.Reported_Staffing_Footnote = Reported_Staffing_Footnote;
    facility.Physical_Therapist_Staffing_Footnote =
      Physical_Therapist_Staffing_Footnote;
    facility.Reported_Nurse_Aide_Staffing_Hours_per_Resident_per_Day =
      Reported_Nurse_Aide_Staffing_Hours_per_Resident_per_Day;
    facility.Reported_LPN_Staffing_Hours_per_Resident_per_Day =
      Reported_LPN_Staffing_Hours_per_Resident_per_Day;
    facility.Reported_RN_Staffing_Hours_per_Resident_per_Day =
      Reported_RN_Staffing_Hours_per_Resident_per_Day;
    facility.Reported_Licensed_Staffing_Hours_per_Resident_per_Day =
      Reported_Licensed_Staffing_Hours_per_Resident_per_Day;
    facility.Reported_Total_Nurse_Staffing_Hours_per_Resident_per_Day =
      Reported_Total_Nurse_Staffing_Hours_per_Resident_per_Day;
    facility.Total_number_of_nurse_staff_hours_per_resident_per_day_on_the_weekend =
      Total_number_of_nurse_staff_hours_per_resident_per_day_on_the_weekend;
    facility.Registered_Nurse_hours_per_resident_per_day_on_the_weekend =
      Registered_Nurse_hours_per_resident_per_day_on_the_weekend;
    facility.Reported_Physical_Therapist_Staffing_Hours_per_Resident_Per_Day =
      Reported_Physical_Therapist_Staffing_Hours_per_Resident_Per_Day;
    facility.Total_nursing_staff_turnover = Total_nursing_staff_turnover;
    facility.Total_nursing_staff_turnover_footnote =
      Total_nursing_staff_turnover_footnote;
    facility.Registered_Nurse_turnover = Registered_Nurse_turnover;
    facility.Registered_Nurse_turnover_footnote =
      Registered_Nurse_turnover_footnote;
    facility.Number_of_administrators_who_have_left_the_nursing_home =
      Number_of_administrators_who_have_left_the_nursing_home;
    facility.Administrator_turnover_footnote = Administrator_turnover_footnote;
    facility.Nursing_Case_Mix_Index = Nursing_Case_Mix_Index;
    facility.Nursing_Case_Mix_Index_Ratio = Nursing_Case_Mix_Index_Ratio;
    facility.Case_Mix_Nurse_Aide_Staffing_Hours_per_Resident_per_Day =
      Case_Mix_Nurse_Aide_Staffing_Hours_per_Resident_per_Day;
    (facility.Case_Mix_LPN_Staffing_Hours_per_Resident_per_Day =
      Case_Mix_LPN_Staffing_Hours_per_Resident_per_Day),
      (facility.Case_Mix_RN_Staffing_Hours_per_Resident_per_Day =
        Case_Mix_RN_Staffing_Hours_per_Resident_per_Day),
      (facility.Case_Mix_Total_Nurse_Staffing_Hours_per_Resident_per_Day =
        Case_Mix_Total_Nurse_Staffing_Hours_per_Resident_per_Day),
      (facility.Case_Mix_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day =
        Case_Mix_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day),
      (facility.Adjusted_Nurse_Aide_Staffing_Hours_per_Resident_per_Day =
        Adjusted_Nurse_Aide_Staffing_Hours_per_Resident_per_Day),
      (facility.Adjusted_LPN_Staffing_Hours_per_Resident_per_Day =
        Adjusted_LPN_Staffing_Hours_per_Resident_per_Day),
      (facility.Adjusted_RN_Staffing_Hours_per_Resident_per_Day =
        Adjusted_RN_Staffing_Hours_per_Resident_per_Day),
      (facility.Adjusted_Total_Nurse_Staffing_Hours_per_Resident_per_Day =
        Adjusted_Total_Nurse_Staffing_Hours_per_Resident_per_Day),
      (facility.Adjusted_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day =
        Adjusted_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day),
      (facility.Rating_Cycle_1_Standard_Survey_Health_Date =
        Rating_Cycle_1_Standard_Survey_Health_Date),
      (facility.Rating_Cycle_1_Total_Number_of_Health_Deficiencies =
        Rating_Cycle_1_Total_Number_of_Health_Deficiencies),
      (facility.Rating_Cycle_1_Number_of_Standard_Health_Deficiencies =
        Rating_Cycle_1_Number_of_Standard_Health_Deficiencies),
      (facility.Rating_Cycle_1_Number_of_Complaint_Health_Deficiencies =
        Rating_Cycle_1_Number_of_Complaint_Health_Deficiencies),
      (facility.Rating_Cycle_1_Health_Deficiency_Score =
        Rating_Cycle_1_Health_Deficiency_Score),
      (facility.Rating_Cycle_1_Number_of_Health_Revisits =
        Rating_Cycle_1_Number_of_Health_Revisits),
      (facility.Rating_Cycle_1_Health_Revisit_Score =
        Rating_Cycle_1_Health_Revisit_Score),
      (facility.Rating_Cycle_1_Total_Health_Score =
        Rating_Cycle_1_Total_Health_Score),
      (facility.Rating_Cycle_2_Standard_Health_Survey_Date =
        Rating_Cycle_2_Standard_Health_Survey_Date),
      (facility.Rating_Cycle_2_3_Total_Number_of_Health_Deficiencies =
        Rating_Cycle_2_3_Total_Number_of_Health_Deficiencies),
      (facility.Rating_Cycle_2_Number_of_Standard_Health_Deficiencies =
        Rating_Cycle_2_Number_of_Standard_Health_Deficiencies),
      (facility.Rating_Cycle_2_3_Number_of_Complaint_Health_Deficiencies =
        Rating_Cycle_2_3_Number_of_Complaint_Health_Deficiencies),
      (facility.Rating_Cycle_2_3_Health_Deficiency_Score =
        Rating_Cycle_2_3_Health_Deficiency_Score),
      (facility.Rating_Cycle_2_Number_of_Health_Revisits =
        Rating_Cycle_2_Number_of_Health_Revisits),
      (facility.Rating_Cycle_2_3_Number_of_Health_Revisits =
        Rating_Cycle_2_3_Number_of_Health_Revisits),
      (facility.Rating_Cycle_2_3_Health_Revisit_Score =
        Rating_Cycle_2_3_Health_Revisit_Score),
      (facility.Rating_Cycle_2_3_Total_Health_Score =
        Rating_Cycle_2_3_Total_Health_Score);
    facility.Total_Weighted_Health_Survey_Score =
      Total_Weighted_Health_Survey_Score;
    facility.Number_of_Facility_Reported_Incidents =
      Number_of_Facility_Reported_Incidents;
    facility.Number_of_Substantiated_Complaints =
      Number_of_Substantiated_Complaints;
    facility.Number_of_Citations_from_Infection_Control_Inspections =
      Number_of_Citations_from_Infection_Control_Inspections;
    facility.Number_of_Fines = Number_of_Fines;
    facility.Total_Amount_of_Fines_in_Dollars =
      Total_Amount_of_Fines_in_Dollars;
    facility.Number_of_Payment_Denials = Number_of_Payment_Denials;
    facility.Total_Number_of_Penalties = Total_Number_of_Penalties;
    facility.Location = Location;
    facility.Latitude = Latitude;
    facility.Longitude = Longitude;
    facility.Geocoding_Footnote = Geocoding_Footnote;
    facility.Processing_Date = Processing_Date;

    await facility.save();
    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Facility updated successfully.",
      data: facility,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "update facility error",
      `Error during update facility: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during update facility: ${errorMsg}`,
    });
  }
};

// view facility
const viewFacility = async (req, res) => {
  try {
    const facilityId = req.params.id;
    if (!facilityId) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Facility ID is required.",
      });
    }

    const facility = await Facility.findById(facilityId)
      .select(
        "_id name address size contact secondaryContactPhone notes status userId riskScore lastSurvey providerNumber CMS_Certification_Number_CCN Provider_Name Provider_Address City_Town State ZIP_Code Telephone_Number Provider_SSA_County_Code County_Parish Ownership_Type Number_of_Certified_Beds Average_Number_of_Residents_per_Day Average_Number_of_Residents_per_Day_Footnote Provider_Type Provider_Resides_in_Hospital Legal_Business_Name Date_First_Approved_to_Provide_Medicare_and_Medicaid_Services Chain_Name Chain_ID Number_of_Facilities_in_Chain Chain_Average_Overall_5_star_Rating Chain_Average_Health_Inspection_Rating Chain_Average_Staffing_Rating Chain_Average_QM_Rating Continuing_Care_Retirement_Community Special_Focus_Status Abuse_Icon Most_Recent_Health_Inspection_More_Than_2_Years_Ago Provider_Changed_Ownership_in_Last_12_Months With_a_Resident_and_Family_Council Automatic_Sprinkler_Systems_in_All_Required_Areas Overall_Rating Overall_Rating_Footnote Health_Inspection_Rating Health_Inspection_Rating_Footnote QM_Rating QM_Rating_Footnote Long_Stay_QM_Rating Long_Stay_QM_Rating_Footnote Short_Stay_QM_Rating Short_Stay_QM_Rating_Footnote Staffing_Rating Staffing_Rating_Footnote Reported_Staffing_Footnote Physical_Therapist_Staffing_Footnote Reported_Nurse_Aide_Staffing_Hours_per_Resident_per_Day Reported_LPN_Staffing_Hours_per_Resident_per_Day Reported_RN_Staffing_Hours_per_Resident_per_Day Reported_Licensed_Staffing_Hours_per_Resident_per_Day Reported_Total_Nurse_Staffing_Hours_per_Resident_per_Day Total_number_of_nurse_staff_hours_per_resident_per_day_on_the_weekend Registered_Nurse_hours_per_resident_per_day_on_the_weekend Reported_Physical_Therapist_Staffing_Hours_per_Resident_Per_Day Total_nursing_staff_turnover Total_nursing_staff_turnover_footnote Registered_Nurse_turnover Registered_Nurse_turnover_footnote Number_of_administrators_who_have_left_the_nursing_home Administrator_turnover_footnote Nursing_Case_Mix_Index Nursing_Case_Mix_Index_Ratio Case_Mix_Nurse_Aide_Staffing_Hours_per_Resident_per_Day Case_Mix_LPN_Staffing_Hours_per_Resident_per_Day Case_Mix_RN_Staffing_Hours_per_Resident_per_Day Case_Mix_Total_Nurse_Staffing_Hours_per_Resident_per_Day Case_Mix_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day Adjusted_Nurse_Aide_Staffing_Hours_per_Resident_per_Day Adjusted_LPN_Staffing_Hours_per_Resident_per_Day Adjusted_RN_Staffing_Hours_per_Resident_per_Day Adjusted_Total_Nurse_Staffing_Hours_per_Resident_per_Day Adjusted_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day Rating_Cycle_1_Standard_Survey_Health_Date Rating_Cycle_1_Total_Number_of_Health_Deficiencies Rating_Cycle_1_Number_of_Standard_Health_Deficiencies Rating_Cycle_1_Number_of_Complaint_Health_Deficiencies Rating_Cycle_1_Health_Deficiency_Score Rating_Cycle_1_Number_of_Health_Revisits Rating_Cycle_1_Health_Revisit_Score Rating_Cycle_1_Total_Health_Score Rating_Cycle_2_Standard_Health_Survey_Date Rating_Cycle_2_3_Total_Number_of_Health_Deficiencies Rating_Cycle_2_Number_of_Standard_Health_Deficiencies Rating_Cycle_2_3_Number_of_Complaint_Health_Deficiencies Rating_Cycle_2_3_Health_Deficiency_Score Rating_Cycle_2_Number_of_Health_Revisits Rating_Cycle_2_3_Number_of_Health_Revisits Rating_Cycle_2_3_Health_Revisit_Score Rating_Cycle_2_3_Total_Health_Score Total_Weighted_Health_Survey_Score Number_of_Facility_Reported_Incidents Number_of_Substantiated_Complaints Number_of_Citations_from_Infection_Control_Inspections Number_of_Fines Total_Amount_of_Fines_in_Dollars Number_of_Payment_Denials Total_Number_of_Penalties Location Latitude Longitude Geocoding_Footnote Processing_Date"
      )
      .populate("type", "_id name")
      .populate("userId", "_id firstName lastName email organization");
    if (!facility) {
      return res.status(200).json({
        status: true,
        statusCode: 200,
        message: "Facility data not found",
        data: {},
      });
    }

    auditLogger(
      "view facility",
      "facility data view",
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Facility data viewed successfully",
      data: facility,
    });
  } catch (error) {
    auditLogger(
      "view facility Error",
      `view facility encounted an error: ${error.message}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during view facility: ${error.message}`,
    });
  }
};

// delete facility
const deleteFacility = async (req, res) => {
  try {
    const facilityId = req.params.id;
    if (!facilityId) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Facility ID is required.",
      });
    }

    // First, find the facility to check ownership
    const facility = await Facility.findById(facilityId);
    if (!facility) {
      return res.status(404).json({
        status: false,
        statusCode: 404,
        message: "Facility data not found",
        data: {},
      });
    }

    // Check if the user is the creator of the facility
    if (facility.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        status: false,
        statusCode: 403,
        message:
          "You are not authorized to delete this facility. Only the facility creator can delete it.",
        data: {},
      });
    }

    // Delete the facility
    await Facility.findByIdAndDelete(facilityId);

    auditLogger(
      "delete facility",
      "facility data deleted",
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Facility data deleted successfully",
      data: facility,
    });
  } catch (error) {
    auditLogger(
      "delete facility Error",
      `delete facility encounted an error: ${error.message}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during delete facility: ${error.message}`,
    });
  }
};

// facility
const facility = async (req, res) => {
  try {
    const {
      name,
      status,
      city,
      state,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;
    const query = { userId: req.user._id };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (status) {
      query.status = { $regex: `^${status}`, $options: "i" };
    }

    if (name) {
      query.Chain = { $regex: `^${name}`, $options: "i" };
    }

    // Use dot notation for nested fields in MongoDB
    if (city) {
      query["address.city"] = { $regex: `^${city}`, $options: "i" };
    }
    if (state) {
      query["address.state"] = { $regex: `^${state}`, $options: "i" };
    }

    // Get total count efficiently
    const total = await Facility.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    const facilities = await Facility.find(query)
      .select(
        "_id name address size contact secondaryContactPhone notes status userId riskScore lastSurvey providerNumber CMS_Certification_Number_CCN Provider_Name Provider_Address City_Town State ZIP_Code Telephone_Number Provider_SSA_County_Code County_Parish Ownership_Type Number_of_Certified_Beds Average_Number_of_Residents_per_Day Average_Number_of_Residents_per_Day_Footnote Provider_Type Provider_Resides_in_Hospital Legal_Business_Name Date_First_Approved_to_Provide_Medicare_and_Medicaid_Services Chain_Name Chain_ID Number_of_Facilities_in_Chain Chain_Average_Overall_5_star_Rating Chain_Average_Health_Inspection_Rating Chain_Average_Staffing_Rating Chain_Average_QM_Rating Continuing_Care_Retirement_Community Special_Focus_Status Abuse_Icon Most_Recent_Health_Inspection_More_Than_2_Years_Ago Provider_Changed_Ownership_in_Last_12_Months With_a_Resident_and_Family_Council Automatic_Sprinkler_Systems_in_All_Required_Areas Overall_Rating Overall_Rating_Footnote Health_Inspection_Rating Health_Inspection_Rating_Footnote QM_Rating QM_Rating_Footnote Long_Stay_QM_Rating Long_Stay_QM_Rating_Footnote Short_Stay_QM_Rating Short_Stay_QM_Rating_Footnote Staffing_Rating Staffing_Rating_Footnote Reported_Staffing_Footnote Physical_Therapist_Staffing_Footnote Reported_Nurse_Aide_Staffing_Hours_per_Resident_per_Day Reported_LPN_Staffing_Hours_per_Resident_per_Day Reported_RN_Staffing_Hours_per_Resident_per_Day Reported_Licensed_Staffing_Hours_per_Resident_per_Day Reported_Total_Nurse_Staffing_Hours_per_Resident_per_Day Total_number_of_nurse_staff_hours_per_resident_per_day_on_the_weekend Registered_Nurse_hours_per_resident_per_day_on_the_weekend Reported_Physical_Therapist_Staffing_Hours_per_Resident_Per_Day Total_nursing_staff_turnover Total_nursing_staff_turnover_footnote Registered_Nurse_turnover Registered_Nurse_turnover_footnote Number_of_administrators_who_have_left_the_nursing_home Administrator_turnover_footnote Nursing_Case_Mix_Index Nursing_Case_Mix_Index_Ratio Case_Mix_Nurse_Aide_Staffing_Hours_per_Resident_per_Day Case_Mix_LPN_Staffing_Hours_per_Resident_per_Day Case_Mix_RN_Staffing_Hours_per_Resident_per_Day Case_Mix_Total_Nurse_Staffing_Hours_per_Resident_per_Day Case_Mix_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day Adjusted_Nurse_Aide_Staffing_Hours_per_Resident_per_Day Adjusted_LPN_Staffing_Hours_per_Resident_per_Day Adjusted_RN_Staffing_Hours_per_Resident_per_Day Adjusted_Total_Nurse_Staffing_Hours_per_Resident_per_Day Adjusted_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day Rating_Cycle_1_Standard_Survey_Health_Date Rating_Cycle_1_Total_Number_of_Health_Deficiencies Rating_Cycle_1_Number_of_Standard_Health_Deficiencies Rating_Cycle_1_Number_of_Complaint_Health_Deficiencies Rating_Cycle_1_Health_Deficiency_Score Rating_Cycle_1_Number_of_Health_Revisits Rating_Cycle_1_Health_Revisit_Score Rating_Cycle_1_Total_Health_Score Rating_Cycle_2_Standard_Health_Survey_Date Rating_Cycle_2_3_Total_Number_of_Health_Deficiencies Rating_Cycle_2_Number_of_Standard_Health_Deficiencies Rating_Cycle_2_3_Number_of_Complaint_Health_Deficiencies Rating_Cycle_2_3_Health_Deficiency_Score Rating_Cycle_2_Number_of_Health_Revisits Rating_Cycle_2_3_Number_of_Health_Revisits Rating_Cycle_2_3_Health_Revisit_Score Rating_Cycle_2_3_Total_Health_Score Total_Weighted_Health_Survey_Score Number_of_Facility_Reported_Incidents Number_of_Substantiated_Complaints Number_of_Citations_from_Infection_Control_Inspections Number_of_Fines Total_Amount_of_Fines_in_Dollars Number_of_Payment_Denials Total_Number_of_Penalties Location Latitude Longitude Geocoding_Footnote Processing_Date"
      )
      .populate("type", "_id name")
      .populate("userId", "_id firstName lastName email organization")
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    auditLogger(
      "facilities",
      `facilities fetched successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Facilities fetched successfully.",
      data: {
        facilities,
        pagination: {
          total,
          totalPages,
          limit: parseInt(limit),
          currentPage: parseInt(page),
        },
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "facilities error",
      `Error during facilities: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during facilities: ${errorMsg}`,
    });
  }
};

// ftag setup
const addFtagSetup = async (req, res) => {
  try {
    const { error } = addFtagSetupValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { tags } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "User not found",
      });
    }

    // Use Promise.all to properly handle async operations
    const createdFtags = await Promise.all(
      tags.map(async (arr) => {
        return await Ftags.create({
          userId: req.user._id,
          ftag: arr?.ftag,
          category: arr?.category,
          definitions: arr?.definitions,
          rev_and_date: arr?.rev_and_date,
          description: arr?.description,
          intent: arr?.intent,
          guidance: arr?.guidance,
          procedure: arr?.procedure,
        });
      })
    );

    auditLogger(
      "ftag",
      `ftag added successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: `${createdFtags.length} F-Tags added successfully.`,
      data: {
        count: createdFtags.length,
        ftags: createdFtags,
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "ftag error",
      `Error during ftag: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during ftag: ${errorMsg}`,
    });
  }
};

const updateFtagsSetup = async (req, res) => {
  try {
    const { error } = updateFtagSetupValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }
    const {
      id,
      ftag,
      category,
      definitions,
      rev_and_date,
      description,
      intent,
      guidance,
      procedure,
    } = req.body;
    const ftags = await Ftags.findById(id);
    if (!ftags) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "FTag not found.",
      });
    }

    ftags.ftag = ftag;
    ftags.category = category;
    ftags.definitions = definitions;
    ftags.rev_and_date = rev_and_date;
    ftags.description = description;
    ftags.intent = intent;
    ftags.guidance = guidance;
    ftags.procedure = procedure;
    await ftags.save();
    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "FTag updated successfully.",
      data: ftags,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "update ftag error",
      `Error during update ftag: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during update ftag: ${errorMsg}`,
    });
  }
};

// view ftag
const viewFtagsSetup = async (req, res) => {
  try {
    const ftagsId = req.params.id;
    if (!ftagsId) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "FTag ID is required.",
      });
    }

    const ftags = await Ftags.findById(ftagsId)
      .select(
        "_id ftag category definitions rev_and_date description intent guidance procedure userId"
      )
      .populate("userId", "_id firstName lastName email organization");
    if (!ftags) {
      return res.status(200).json({
        status: true,
        statusCode: 200,
        message: "FTag data not found",
        data: {},
      });
    }

    auditLogger(
      "view facility",
      "facility data view",
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "FTag data viewed successfully",
      data: ftags,
    });
  } catch (error) {
    auditLogger(
      "view ftag Error",
      `view ftag encounted an error: ${error.message}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during view ftag: ${error.message}`,
    });
  }
};

// delete ftag
const deleteFtag = async (req, res) => {
  try {
    const ftagsId = req.params.id;
    if (!ftagsId) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "FTag ID is required.",
      });
    }

    const ftags = await Ftags.findByIdAndDelete(ftagsId);
    if (!ftags) {
      return res.status(200).json({
        status: true,
        statusCode: 200,
        message: "FTag data not found",
        data: {},
      });
    }

    auditLogger(
      "delete ftag",
      "ftag data deleted",
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "FTag data deleted successfully",
      data: ftags,
    });
  } catch (error) {
    auditLogger(
      "delete ftag Error",
      `delete ftag encounted an error: ${error.message}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during delete ftag: ${error.message}`,
    });
  }
};

// ftag
const ftagSetup = async (req, res) => {
  try {
    const {
      ftag,
      category,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (ftag) {
      query.ftag = { $regex: `^${ftag}`, $options: "i" };
    }

    if (category) {
      query.category = { $regex: `^${category}`, $options: "i" };
    }

    // Get total count efficiently
    const total = await Ftags.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    const ftags = await Ftags.find(query)
      .select(
        "_id ftag category definitions rev_and_date description intent guidance procedure userId"
      )
      .populate("userId", "_id firstName lastName email organization")
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ createdAt: 1 });

    auditLogger(
      "ftags",
      `ftags fetched successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "FTags fetched successfully.",
      data: {
        ftags,
        pagination: {
          total,
          totalPages,
          limit: parseInt(limit),
          currentPage: parseInt(page),
        },
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "ftags error",
      `Error during ftags: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during ftags: ${errorMsg}`,
    });
  }
};

// add mand
const addMandatoryTask = async (req, res) => {
  try {
    const { error } = addMandatoryTaskValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { title, version_date, source_citation, desc, categories } = req.body;
    const mandatoryTaskinfo = await MandatoryTasks.findOne({ title });
    if (mandatoryTaskinfo) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Mandatory task data already exist",
      });
    }

    const mandatoryTask = await MandatoryTasks.create({
      userId: req.user._id,
      title,
      version_date,
      source_citation,
      desc,
      categories,
    });

    auditLogger(
      "mandatory task",
      `mandatory task added successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Mandatory task added successfully.",
      data: mandatoryTask,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "mandatory task error",
      `Error during mandatory task: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during mandatory task: ${errorMsg}`,
    });
  }
};

// update mandatory task
const updateMandatoryTask = async (req, res) => {
  try {
    const { error } = updateMandatoryTaskValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { id, title, version_date, source_citation, desc, categories } =
      req.body;
    const mandatoryTaskinfo = await MandatoryTasks.findById(id);
    if (!mandatoryTaskinfo) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Mandatory task data not found",
      });
    }

    const mandatoryTask = await MandatoryTasks.findByIdAndUpdate(id, {
      title,
      version_date,
      source_citation,
      desc,
      categories,
    });

    auditLogger(
      "mandatory task",
      `mandatory task updated successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Mandatory task updated successfully.",
      data: mandatoryTask,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "mandatory task error",
      `Error during mandatory task: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during mandatory task: ${errorMsg}`,
    });
  }
};

// view mandatory task
const viewMandatoryTask = async (req, res) => {
  try {
    const mandatoryTaskId = req.params.id;
    if (!mandatoryTaskId) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Mandatory task ID is required.",
      });
    }

    const mt = await MandatoryTasks.findById(mandatoryTaskId)
      .select(
        "_id title version_date source_citation desc categories createdAt"
      )
      .sort({ createdAt: -1 });

    auditLogger(
      "view mandatory task",
      "mandatory task data view",
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Mandatory task data viewed successfully",
      data: mt,
    });
  } catch (error) {
    auditLogger(
      "view mandatory task Error",
      `view mandatory task encounted an error: ${error.message}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during view mandatory task: ${error.message}`,
    });
  }
};

// mandatory tasks
const mandatoryTasks = async (req, res) => {
  try {
    const { title, startDate, endDate, page = 1, limit = 35 } = req.query;
    const query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (title) {
      query.title = { $regex: `^${title}`, $options: "i" };
    }

    // Get total count efficiently
    const total = await MandatoryTasks.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    const mt = await MandatoryTasks.find(query)
      .select(
        "_id title version_date source_citation desc categories createdAt"
      )
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ createdAt: 1 });

    auditLogger(
      "mandatory tasks",
      `mandatory tasks fetched successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Mandatory tasks fetched successfully.",
      data: {
        mt,
        pagination: {
          total,
          totalPages,
          limit: parseInt(limit),
          currentPage: parseInt(page),
        },
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "mandatory tasks error",
      `Error during mandatory tasks: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during mandatory tasks: ${errorMsg}`,
    });
  }
};

// delete mandatory task
const deleteMandatoryTask = async (req, res) => {
  try {
    const id = req.params.id;
    const mt = await MandatoryTasks.findByIdAndDelete(id);
    if (!mt) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Mandatory task not found",
      });
    }

    auditLogger(
      "mandatory tasks",
      `mandatory tasks deleted successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Mandatory task deleted successfully.",
      data: mt,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "mandatory tasks error",
      `Error during mandatory tasks: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during mandatory tasks: ${errorMsg}`,
    });
  }
};

// nursing homes from the api
const fetchNursingHomes = async (req, res) => {
  try {
    const response = await axios.get(
      "https://data.cms.gov/data-api/v1/dataset/97ecfad1-d3f1-4d42-b774-d74661d830bc/data",
      {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;
    const nursingHomes = data.map(async (item) => {
      await NursingHomes.create({
        Chain: item.Chain || "",
        Chain_ID: item["Chain ID"] || "",
        Number_of_facilities: item["Number of facilities"] || "",
        Number_of_states_and_territories_with_operations:
          item["Number of states and territories with operations"] || "",
        Number_of_Special_Focus_Facilities_SFF:
          item["Number of Special Focus Facilities (SFF)"] || "",
        Number_of_SFF_candidates: item["Number of SFF candidates"] || "",
        Number_of_facilities_with_an_abuse_icon:
          item["Number of facilities with an abuse icon"] || "",
        Percentage_of_facilities_with_an_abuse_icon:
          item["Percentage of facilities with an abuse icon"] || "",
        Percent_of_facilities_classified_as_for_profit:
          item["Percent of facilities classified as for-profit"] || "",
        Percent_of_facilities_classified_as_non_profit:
          item["Percent of facilities classified as non-profit"] || "",
        Percent_of_facilities_classified_as_government_owned:
          item["Percent of facilities classified as government-owned"] || "",
        Average_overall_5_star_rating:
          item["Average overall 5-star rating"] || "",
        Average_health_inspection_rating:
          item["Average health inspection rating"] || "",
        Average_staffing_rating: item["Average staffing rating"] || "",
        Average_quality_rating: item["Average quality rating"] || "",
        Average_total_nurse_hours_per_resident_day:
          item["Average total nurse hours per resident day"] || "",
        Average_total_weekend_nurse_hours_per_resident_day:
          item["Average total weekend nurse hours per resident day"] || "",
        Average_total_registered_nurse_hours_per_resident_day:
          item["Average total Registered Nurse hours per resident day"] || "",
        Average_total_Registered_Nurse_hours_per_resident_day:
          item["Average total Registered Nurse hours per resident day"] || "",
        Average_total_nursing_staff_turnover_percentage:
          item["Average total nursing staff turnover percentage"] || "",
        Average_registered_nurse_turnover_percentage:
          item["Average Registered Nurse turnover percentage"] || "",
        Average_number_of_administrators_who_have_left_the_nursing_home:
          item[
            "Average number of administrators who have left the nursing home"
          ] || "",
        Total_number_of_fines: item["Total number of fines"] || "",
        Average_number_of_fines: item["Average number of fines"] || "",
        Total_amount_of_fines_in_dollars:
          item["Total amount of fines in dollars"] || "",
        Average_amount_of_fines_in_dollars:
          item["Average amount of fines in dollars"] || "",
        Total_number_of_payment_denials:
          item["Total number of payment denials"] || "",
        Average_number_of_payment_denials:
          item["Average number of payment denials"] || "",
        Average_percentage_of_short_stay_residents_who_were_re_hospitalized_after_a_nursing_home_admission:
          item[
            "Average percentage of short-stay residents who were re-hospitalized after a nursing home admission"
          ] || "",
        Average_percentage_of_short_stay_residents_who_have_had_an_outpatient_emergency_department_visit:
          item[
            "Average percentage of short-stay residents who have had an outpatient emergency department visit"
          ] || "",
        Average_percentage_of_short_stay_residents_who_newly_received_an_antipsychotic_medication:
          item[
            "Average percentage of short-stay residents who newly received an antipsychotic medication"
          ] || "",
        Average_percentage_of_short_stay_residents_with_pressure_ulcers_or_pressure_injuries_that_are_new_or_worsened:
          item[
            "Average percentage of short-stay residents with pressure ulcers or pressure injuries that are new or worsened"
          ] || "",
        Average_percentage_of_short_stay_residents_who_are_at_or_above_an_expected_ability_to_care_for_themselves_and_move_around_at_discharge:
          item[
            "Average percentage of short-stay residents who are at or above an expected ability to care for themselves and move around at discharge"
          ] || "",
        Average_percentage_of_short_stay_residents_who_were_assessed_and_appropriately_given_the_seasonal_influenza_vaccine:
          item[
            "Average percentage of short-stay residents who were assessed and appropriately given the seasonal influenza vaccine"
          ] || "",
        Average_percentage_of_short_stay_residents_who_were_assessed_and_appropriately_given_the_pneumococcal_vaccine:
          item[
            "Average percentage of short-stay residents who were assessed and appropriately given the  pneumococcal vaccine"
          ] || "",
        Average_number_of_hospitalizations_per_1000_long_stay_resident_days:
          item[
            "Average number of hospitalizations per 1,000 long-stay resident days"
          ] || "",
        Average_number_of_outpatient_emergency_department_visits_per_1000_long_stay_resident_days:
          item[
            "Average number of outpatient emergency department visits per 1,000 long-stay resident days"
          ] || "",
        Average_percentage_of_long_stay_residents_who_received_an_antipsychotic_medication:
          item[
            "Average percentage of long-stay residents who received an antipsychotic medication"
          ] || "",
        Average_percentage_of_long_stay_residents_experiencing_one_or_more_falls_with_major_injury:
          item[
            "Average percentage of long-stay residents experiencing one or more falls with major injury"
          ] || "",
        Average_percentage_of_long_stay_residents_with_pressure_ulcers:
          item[
            "Average percentage of long-stay residents with pressure ulcers"
          ] || "",
        Average_percentage_of_long_stay_residents_with_a_urinary_tract_infection:
          item[
            "Average percentage of long-stay residents with a urinary tract infection"
          ] || "",
        Average_percentage_of_long_stay_residents_who_have_or_had_a_catheter_inserted_and_left_in_their_bladder:
          item[
            "Average percentage of long-stay residents who have or had a catheter inserted and left in their bladder"
          ] || "",
        Average_percentage_of_long_stay_residents_whose_ability_to_move_independently_worsened:
          item[
            "Average percentage of long-stay residents whose ability to move independently worsened"
          ] || "",
        Average_percentage_of_long_stay_residents_whose_need_for_help_with_activities_of_daily_living_has_increased:
          item[
            "Average percentage of long-stay residents whose need for help with activities of daily living has increased"
          ] || "",
        Average_percentage_of_long_stay_residents_who_were_assessed_and_appropriately_given_the_seasonal_influenza_vaccine:
          item[
            "Average percentage of long-stay residents who were assessed and appropriately given the seasonal influenza vaccine"
          ] || "",
        Average_percentage_of_long_stay_residents_who_were_assessed_and_appropriately_given_the_pneumococcal_vaccine:
          item[
            "Average percentage of long-stay residents who were assessed and appropriately given the  pneumococcal vaccine"
          ] || "",
        Average_percentage_of_long_stay_residents_who_were_physically_restrained:
          item[
            "Average percentage of long-stay residents who were physically restrained"
          ] || "",
        Average_percentage_of_long_stay_residents_with_new_or_worsened_bowel_or_bladder_incontinence:
          item[
            "Average percentage of long-stay residents with new or worsened bowel or bladder incontinence"
          ] || "",
        Average_percentage_of_long_stay_residents_who_lose_too_much_weight:
          item[
            "Average percentage of long-stay residents who lose too much weight"
          ] || "",
        Average_percentage_of_long_stay_residents_who_have_symptoms_of_depression:
          item[
            "Average percentage of long-stay residents who have symptoms of depression"
          ] || "",
        Average_percentage_of_long_stay_residents_who_used_antianxiety_or_hypnotic_medication:
          item[
            "Average percentage of long-stay residents who used antianxiety or hypnotic medication"
          ] || "",
        Average_rate_of_potentially_preventable_hospital_readmissions_30_days_after_discharge_from_a_snf:
          item[
            "Average rate of potentially preventable hospital readmissions 30 days after discharge from a SNF"
          ] || "",
        userId: req.user._id,
      });
    });

    auditLogger(
      "nursing homes",
      `nursing homes`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "nursing homes fetched successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "nursing homes error",
      `Error during nursing homes: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during nursing homes: ${errorMsg}`,
    });
  }
};

// all nursing homes
const allnursinghomes = async (req, res) => {
  try {
    const { name, page = 1, limit = 30 } = req.query;
    const query = {};
    if (name) {
      query.Chain = { $regex: `^${name}`, $options: "i" };
    }

    // Get total count efficiently
    const total = await NursingHomes.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    const nursinghomes = await NursingHomes.find(query)
      .select(
        "_id Chain Chain_ID Number_of_facilities Number_of_states_and_territories_with_operations Number_of_Special_Focus_Facilities_SFF Number_of_SFF_candidates Number_of_facilities_with_an_abuse_icon Percentage_of_facilities_with_an_abuse_icon Percent_of_facilities_classified_as_for_profit Percent_of_facilities_classified_as_non_profit Percent_of_facilities_classified_as_government_owned Average_overall_5_star_rating Average_health_inspection_rating Average_staffing_rating Average_quality_rating Average_total_nurse_hours_per_resident_day Average_total_weekend_nurse_hours_per_resident_day Average_total_registered_nurse_hours_per_resident_day Average_total_Registered_Nurse_hours_per_resident_day Average_total_nursing_staff_turnover_percentage Average_registered_nurse_turnover_percentage Average_number_of_administrators_who_have_left_the_nursing_home Total_number_of_fines Average_number_of_fines Total_amount_of_fines_in_dollars Average_amount_of_fines_in_dollars Total_number_of_payment_denials Average_number_of_payment_denials Average_percentage_of_short_stay_residents_who_were_re_hospitalized_after_a_nursing_home_admission Average_percentage_of_short_stay_residents_who_have_had_an_outpatient_emergency_department_visit Average_percentage_of_short_stay_residents_who_newly_received_an_antipsychotic_medication Average_percentage_of_short_stay_residents_with_pressure_ulcers_or_pressure_injuries_that_are_new_or_worsened Average_percentage_of_short_stay_residents_who_are_at_or_above_an_expected_ability_to_care_for_themselves_and_move_around_at_discharge Average_percentage_of_short_stay_residents_who_were_assessed_and_appropriately_given_the_seasonal_influenza_vaccine Average_percentage_of_short_stay_residents_who_were_assessed_and_appropriately_given_the_pneumococcal_vaccine Average_number_of_hospitalizations_per_1000_long_stay_resident_days Average_number_of_outpatient_emergency_department_visits_per_1000_long_stay_resident_days Average_percentage_of_long_stay_residents_who_received_an_antipsychotic_medication Average_percentage_of_long_stay_residents_experiencing_one_or_more_falls_with_major_injury Average_percentage_of_long_stay_residents_with_pressure_ulcers Average_percentage_of_long_stay_residents_with_a_urinary_tract_infection Average_percentage_of_long_stay_residents_who_have_or_had_a_catheter_inserted_and_left_in_their_bladder Average_percentage_of_long_stay_residents_whose_ability_to_move_independently_worsened Average_percentage_of_long_stay_residents_whose_need_for_help_with_activities_of_daily_living_has_increased Average_percentage_of_long_stay_residents_who_were_assessed_and_appropriately_given_the_seasonal_influenza_vaccine Average_percentage_of_long_stay_residents_who_were_assessed_and_appropriately_given_the_pneumococcal_vaccine Average_percentage_of_long_stay_residents_who_were_physically_restrained Average_percentage_of_long_stay_residents_with_new_or_worsened_bowel_or_bladder_incontinence Average_percentage_of_long_stay_residents_who_lose_too_much_weight Average_percentage_of_long_stay_residents_who_have_symptoms_of_depression Average_percentage_of_long_stay_residents_who_used_antianxiety_or_hypnotic_medication Average_rate_of_potentially_preventable_hospital_readmissions_30_days_after_discharge_from_a_snf"
      )
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ createdAt: 1 });

    auditLogger(
      "nursinghomes",
      `nursinghomes fetched successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Nursing homes fetched successfully.",
      data: {
        nursinghomes,
        pagination: {
          total,
          totalPages,
          limit: parseInt(limit),
          currentPage: parseInt(page),
        },
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "nursinghomes error",
      `Error during nursinghomes: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during nursinghomes: ${errorMsg}`,
    });
  }
};

// update all ftags
const updateAllFtagsSetup = async (req, res) => {
  try {
    const nursingHomes = req.body.map(async (item) => {
      // console.log(item['revision_date'])
      //  console.log(item['tag_number'])

      let ftags = await Ftags.findOne({ ftag: item["tag_number"] });
      if (ftags && ftags?.rev_and_date == "") {
        ftags.rev_and_date = item["revision_date"];
        ftags.description = item["definitions"];
        ftags.intent = item["intent"];
        ftags.guidance = item["guidance"];
        ftags.procedure = item["procedures"];
        ftags.potential_tags = item["potential_tags"];
        await ftags.save();
      }
    });

    // const {
    //   tag_number,
    //   revision_date,
    //   title,
    //   intent,
    //   guidance,
    //   definitions,
    //   procedures,
    //   potential_tags
    // } = req.body;
    // const ftags = await Ftags.findById({ftag: tag_number});
    // if (ftags && ftags?.rev_and_date != "") {
    //  ftags.rev_and_date = revision_date;
    //  ftags.description = definitions;
    //  ftags.intent = intent;
    //  ftags.guidance = guidance;
    //  ftags.procedure = procedures;
    //  ftags.potential_tags = potential_tags;
    //  await ftags.save();
    // }

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "FTag updated successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "update ftag error",
      `Error during update ftag: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during update ftag: ${errorMsg}`,
    });
  }
};

// adding nursing home providers
const addNursingHomesProviders = async (req, res) => {
  try {
    const data = req.body;
    const nursingHomes = data.map(async (item) => {
      await NursingHomeProviders.create({
        CMS_Certification_Number_CCN:
          item["CMS Certification Number (CCN)"] || "",
        Provider_Name: item["Provider Name"] || "",
        Provider_Address: item["Provider Address"] || "",
        City_Town: item["City/Town"] || "",
        State: item["State"] || "",
        ZIP_Code: item["ZIP Code"] || "",
        Telephone_Number: item["Telephone Number"] || "",
        Provider_SSA_County_Code: item["Provider SSA County Code"] || "",
        County_Parish: item["County/Parish"] || "",
        Ownership_Type: item["Ownership Type"] || "",
        Number_of_Certified_Beds: item["Number of Certified Beds"] || "",
        Average_Number_of_Residents_per_Day:
          item["Average Number of Residents per Day"] || "",
        Average_Number_of_Residents_per_Day_Footnote:
          item["Average Number of Residents per Day Footnote"] || "",
        Provider_Type: item["Provider Type"] || "",
        Provider_Resides_in_Hospital:
          item["Provider Resides in Hospital"] || "",
        Legal_Business_Name: item["Legal Business Name"] || "",
        Date_First_Approved_to_Provide_Medicare_and_Medicaid_Services:
          item[
            "Date First Approved to Provide Medicare and Medicaid Services"
          ] || "",
        Chain_Name: item["Chain Name"] || "",
        Chain_ID: item["Chain ID"] || "",
        Number_of_Facilities_in_Chain:
          item["Number of Facilities in Chain"] || "",
        Chain_Average_Overall_5_star_Rating:
          item["Chain Average Overall 5-star Rating"] || "",
        Chain_Average_Health_Inspection_Rating:
          item["Chain Average Health Inspection Rating"] || "",
        Chain_Average_Staffing_Rating:
          item["Chain Average Staffing Rating"] || "",
        Chain_Average_QM_Rating: item["Chain Average QM Rating"] || "",
        Continuing_Care_Retirement_Community:
          item["Continuing Care Retirement Community"] || "",
        Special_Focus_Status: item["Special Focus Status"] || "",
        Abuse_Icon: item["Abuse Icon"] || "",
        Most_Recent_Health_Inspection_More_Than_2_Years_Ago:
          item["Most Recent Health Inspection More Than 2 Years Ago"] || "",
        Provider_Changed_Ownership_in_Last_12_Months:
          item["Provider Changed Ownership in Last 12 Months"] || "",
        With_a_Resident_and_Family_Council:
          item["With a Resident and Family Council"] || "",
        Automatic_Sprinkler_Systems_in_All_Required_Areas:
          item["Automatic Sprinkler Systems in All Required Areas"] || "",
        Overall_Rating: item["Overall Rating"] || "",
        Overall_Rating_Footnote: item["Overall Rating Footnote"] || "",
        Health_Inspection_Rating: item["Health Inspection Rating"] || "",
        Health_Inspection_Rating_Footnote:
          item["Health Inspection Rating Footnote"] || "",
        QM_Rating: item["QM Rating"] || "",
        QM_Rating_Footnote: item["QM Rating Footnote"] || "",
        Long_Stay_QM_Rating: item["Long-Stay QM Rating"] || "",
        Long_Stay_QM_Rating_Footnote:
          item["Long-Stay QM Rating Footnote"] || "",
        Short_Stay_QM_Rating: item["Short-Stay QM Rating"] || "",
        Short_Stay_QM_Rating_Footnote:
          item["Short-Stay QM Rating Footnote"] || "",
        Staffing_Rating: item["Staffing Rating"] || "",
        Staffing_Rating_Footnote: item["Staffing Rating Footnote"] || "",
        Reported_Staffing_Footnote: item["Reported Staffing Footnote"] || "",
        Physical_Therapist_Staffing_Footnote:
          item["Physical Therapist Staffing Footnote"] || "",
        Reported_Nurse_Aide_Staffing_Hours_per_Resident_per_Day:
          item["Reported Nurse Aide Staffing Hours per Resident per Day"] || "",
        Reported_LPN_Staffing_Hours_per_Resident_per_Day:
          item["Reported LPN Staffing Hours per Resident per Day"] || "",
        Reported_RN_Staffing_Hours_per_Resident_per_Day:
          item["Reported RN Staffing Hours per Resident per Day"] || "",
        Reported_Licensed_Staffing_Hours_per_Resident_per_Day:
          item["Reported Licensed Staffing Hours per Resident per Day"] || "",
        Reported_Total_Nurse_Staffing_Hours_per_Resident_per_Day:
          item["Reported Total Nurse Staffing Hours per Resident per Day"] ||
          "",
        Total_number_of_nurse_staff_hours_per_resident_per_day_on_the_weekend:
          item[
            "Total number of nurse staff hours per resident per day on the weekend"
          ] || "",
        Registered_Nurse_hours_per_resident_per_day_on_the_weekend:
          item["Registered Nurse hours per resident per day on the weekend"] ||
          "",
        Reported_Physical_Therapist_Staffing_Hours_per_Resident_Per_Day:
          item[
            "Reported Physical Therapist Staffing Hours per Resident Per Day"
          ] || "",
        Total_nursing_staff_turnover:
          item["Total nursing staff turnover"] || "",
        Total_nursing_staff_turnover_footnote:
          item["Total nursing staff turnover footnote"] || "",
        Registered_Nurse_turnover: item["Registered Nurse turnover"] || "",
        Registered_Nurse_turnover_footnote:
          item["Registered Nurse turnover footnote"] || "",
        Number_of_administrators_who_have_left_the_nursing_home:
          item["Number of administrators who have left the nursing home"] || "",
        Administrator_turnover_footnote:
          item["Administrator turnover footnote"] || "",
        Nursing_Case_Mix_Index: item["Nursing Case-Mix Index"] || "",
        Nursing_Case_Mix_Index_Ratio:
          item["Nursing Case-Mix Index Ratio"] || "",
        Case_Mix_Nurse_Aide_Staffing_Hours_per_Resident_per_Day:
          item["Case-Mix Nurse Aide Staffing Hours per Resident per Day"] || "",

        Case_Mix_LPN_Staffing_Hours_per_Resident_per_Day:
          item["Case-Mix LPN Staffing Hours per Resident per Day"] || "",

        Case_Mix_RN_Staffing_Hours_per_Resident_per_Day:
          item["Case-Mix RN Staffing Hours per Resident per Day"] || "",

        Case_Mix_Total_Nurse_Staffing_Hours_per_Resident_per_Day:
          item["Case-Mix Total Nurse Staffing Hours per Resident per Day"] ||
          "",

        Case_Mix_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day:
          item[
            "Case-Mix Weekend Total Nurse Staffing Hours per Resident per Day"
          ] || "",

        Adjusted_Nurse_Aide_Staffing_Hours_per_Resident_per_Day:
          item["Adjusted Nurse Aide Staffing Hours per Resident per Day"] || "",

        Adjusted_LPN_Staffing_Hours_per_Resident_per_Day:
          item["Adjusted LPN Staffing Hours per Resident per Day"] || "",

        Adjusted_RN_Staffing_Hours_per_Resident_per_Day:
          item["Adjusted RN Staffing Hours per Resident per Day"] || "",
        Adjusted_Total_Nurse_Staffing_Hours_per_Resident_per_Day:
          item["Adjusted Total Nurse Staffing Hours per Resident per Day"] ||
          "",
        Adjusted_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day:
          item[
            "Adjusted Weekend Total Nurse Staffing Hours per Resident per Day"
          ] || "",

        Rating_Cycle_1_Standard_Survey_Health_Date:
          item["Rating Cycle 1 Standard Survey Health Date"] || "",
        Rating_Cycle_1_Total_Number_of_Health_Deficiencies:
          item["Rating Cycle 1 Total Number of Health Deficiencies"] || "",
        Rating_Cycle_1_Number_of_Standard_Health_Deficiencies:
          item["Rating Cycle 1 Number of Standard Health Deficiencies"] || "",

        Rating_Cycle_1_Number_of_Complaint_Health_Deficiencies:
          item["Rating Cycle 1 Number of Complaint Health Deficiencies"] || "",
        Rating_Cycle_1_Health_Deficiency_Score:
          item["Rating Cycle 1 Health Deficiency Score"] || "",
        Rating_Cycle_1_Number_of_Health_Revisits:
          item["Rating Cycle 1 Number of Health Revisits"] || "",

        Rating_Cycle_1_Health_Revisit_Score:
          item["Rating Cycle 1 Health Revisit Score"] || "",
        Rating_Cycle_1_Total_Health_Score:
          item["Rating Cycle 1 Total Health Score"] || "",

        Rating_Cycle_2_Standard_Health_Survey_Date:
          item["Rating Cycle 2 Standard Health Survey Date"] || "",
        Rating_Cycle_2_3_Total_Number_of_Health_Deficiencies:
          item["Rating Cycle 2/3 Total Number of Health Deficiencies"] || "",

        Rating_Cycle_2_Number_of_Standard_Health_Deficiencies:
          item["Rating Cycle 2 Number of Standard Health Deficiencies"] || "",

        Rating_Cycle_2_3_Number_of_Complaint_Health_Deficiencies:
          item["Rating Cycle 2/3 Number of Complaint Health Deficiencies"] ||
          "",

        Rating_Cycle_2_3_Health_Deficiency_Score:
          item["Rating Cycle 2/3 Health Deficiency Score"] || "",

        Rating_Cycle_2_Number_of_Health_Revisits:
          item["Rating Cycle 2 Number of Health Revisits"] || "",

        Rating_Cycle_2_3_Number_of_Health_Revisits:
          item["Rating Cycle 2/3 Number of Health Revisits"] || "",

        Rating_Cycle_2_3_Health_Revisit_Score:
          item["Rating Cycle 2/3 Health Revisit Score"] || "",

        Rating_Cycle_2_3_Total_Health_Score:
          item["Rating Cycle 2/3 Total Health Score"] || "",

        Total_Weighted_Health_Survey_Score:
          item["Total Weighted Health Survey Score"] || "",

        Number_of_Facility_Reported_Incidents:
          item["Number of Facility Reported Incidents"] || "",

        Number_of_Substantiated_Complaints:
          item["Number of Substantiated Complaints"] || "",

        Number_of_Citations_from_Infection_Control_Inspections:
          item["Number of Citations from Infection Control Inspections"] || "",

        Number_of_Fines: item["Number of Fines"] || "",

        Total_Amount_of_Fines_in_Dollars:
          item["Total Amount of Fines in Dollars"] || "",

        Number_of_Payment_Denials: item["Number of Payment Denials"] || "",

        Total_Number_of_Penalties: item["Total Number of Penalties"] || "",

        Location: item["Location"] || "",

        Latitude: item["Latitude"] || "",

        Longitude: item["Longitude"] || "",

        Geocoding_Footnote: item["Geocoding Footnote"] || "",

        Processing_Date: item["Processing Date"] || "",

        userId: req.user._id,
      });
    });

    auditLogger(
      "nursing homes",
      `nursing homes`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "nursin successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "nursing homes error",
      `Error during nursing homes: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during nursing homes: ${errorMsg}`,
    });
  }
};

const allnursinghomesproviders = async (req, res) => {
  try {
    const { name, address, city, state, page = 1, limit = 30 } = req.query;
    const query = {};
    if (name) {
      query.Provider_Name = { $regex: `^${name}`, $options: "i" };
    }
    if (address) {
      query.Provider_Address = { $regex: `^${address}`, $options: "i" };
    }
    if (city) {
      query.City_Town = { $regex: `^${city}`, $options: "i" };
    }

    if (state) {
      query.State = { $regex: `^${state}`, $options: "i" };
    }

    // Get total count efficiently
    const total = await NursingHomeProviders.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    const nursinghomes = await NursingHomeProviders.find(query)
      .select(
        "_id CMS_Certification_Number_CCN Provider_Name Provider_Address City_Town State ZIP_Code Telephone_Number Provider_SSA_County_Code County_Parish Ownership_Type Number_of_Certified_Beds Average_Number_of_Residents_per_Day Average_Number_of_Residents_per_Day_Footnote Provider_Type Provider_Resides_in_Hospital Legal_Business_Name Date_First_Approved_to_Provide_Medicare_and_Medicaid_Services Chain_Name Chain_ID Number_of_Facilities_in_Chain Chain_Average_Overall_5_star_Rating Chain_Average_Health_Inspection_Rating Chain_Average_Staffing_Rating Chain_Average_QM_Rating Continuing_Care_Retirement_Community Special_Focus_Status Abuse_Icon Most_Recent_Health_Inspection_More_Than_2_Years_Ago Provider_Changed_Ownership_in_Last_12_Months With_a_Resident_and_Family_Council Automatic_Sprinkler_Systems_in_All_Required_Areas Overall_Rating Overall_Rating_Footnote Health_Inspection_Rating Health_Inspection_Rating_Footnote QM_Rating QM_Rating_Footnote Long_Stay_QM_Rating Long_Stay_QM_Rating_Footnote Short_Stay_QM_Rating Short_Stay_QM_Rating_Footnote Staffing_Rating Staffing_Rating_Footnote Reported_Staffing_Footnote Reported_Nurse_Aide_Staffing_Hours_per_Resident_per_Day Reported_LPN_Staffing_Hours_per_Resident_per_Day Reported_RN_Staffing_Hours_per_Resident_per_Day Reported_Licensed_Staffing_Hours_per_Resident_per_Day Reported_Total_Nurse_Staffing_Hours_per_Resident_per_Day Total_number_of_nurse_staff_hours_per_resident_per_day_on_the_weekend Registered_Nurse_hours_per_resident_per_day_on_the_weekend Reported_Physical_Therapist_Staffing_Hours_per_Resident_Per_Day Total_nursing_staff_turnover Total_nursing_staff_turnover_footnote Registered_Nurse_turnover Registered_Nurse_turnover_footnote Number_of_administrators_who_have_left_the_nursing_home Administrator_turnover_footnote Nursing_Case_Mix_Index Nursing_Case_Mix_Index_Ratio Case_Mix_Nurse_Aide_Staffing_Hours_per_Resident_per_Day Case_Mix_LPN_Staffing_Hours_per_Resident_per_Day Case_Mix_RN_Staffing_Hours_per_Resident_per_Day Case_Mix_Total_Nurse_Staffing_Hours_per_Resident_per_Day Case_Mix_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day Adjusted_Nurse_Aide_Staffing_Hours_per_Resident_per_Day Adjusted_LPN_Staffing_Hours_per_Resident_per_Day Adjusted_RN_Staffing_Hours_per_Resident_per_Day Adjusted_Total_Nurse_Staffing_Hours_per_Resident_per_Day Adjusted_Weekend_Total_Nurse_Staffing_Hours_per_Resident_per_Day Rating_Cycle_1_Standard_Survey_Health_Date Rating_Cycle_1_Total_Number_of_Health_Deficiencies Rating_Cycle_1_Number_of_Standard_Health_Deficiencies Rating_Cycle_1_Number_of_Complaint_Health_Deficiencies Rating_Cycle_1_Health_Deficiency_Score Rating_Cycle_1_Number_of_Health_Revisits Rating_Cycle_1_Health_Revisit_Score Rating_Cycle_1_Total_Health_Score Rating_Cycle_2_Standard_Health_Survey_Date Rating_Cycle_2_3_Total_Number_of_Health_Deficiencies Rating_Cycle_2_Number_of_Standard_Health_Deficiencies Rating_Cycle_2_3_Number_of_Complaint_Health_Deficiencies Rating_Cycle_2_3_Health_Deficiency_Score Rating_Cycle_2_3_Number_of_Health_Revisits Rating_Cycle_2_3_Health_Revisit_Score Rating_Cycle_2_3_Total_Health_Score Total_Weighted_Health_Survey_Score Number_of_Facility_Reported_Incidents Number_of_Substantiated_Complaints Number_of_Citations_from_Infection_Control_Inspections Number_of_Fines Total_Amount_of_Fines_in_Dollars Number_of_Payment_Denials Total_Number_of_Penalties Location Latitude Longitude Geocoding_Footnote Processing_Date"
      )
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ createdAt: 1 });

    auditLogger(
      "nursinghomes",
      `nursinghomes fetched successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Nursing homes fetched successfully.",
      data: {
        nursinghomes,
        pagination: {
          total,
          totalPages,
          limit: parseInt(limit),
          currentPage: parseInt(page),
        },
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "nursinghomes error",
      `Error during nursinghomes: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during nursinghomes: ${errorMsg}`,
    });
  }
};

// metrics
const multiFacilityMetric = async (req, res) => {
  try {
    const { facilityName } = req.query;
    const userId = req.user._id;

    // Build query filter
    let facilityQuery = { userId };

    // Optional facility filter
    if (facilityName && facilityName.trim() !== "") {
      facilityQuery.Provider_Name = {
        $regex: facilityName.trim(),
        $options: "i",
      };
    }

    const facilities = await Facility.find(facilityQuery).lean();

    if (!facilities || facilities.length === 0) {
      return res.status(200).json({
        status: true,
        statusCode: 200,
        message: facilityName
          ? `No facilities found matching "${facilityName}"`
          : "No facilities found for this user",
        data: {},
      });
    }

    const facilityIds = facilities.map((f) => f._id);
    const surveys = await Survey.find({
      facilityId: { $in: facilityIds },
      userId,
    }).lean();

    // ===== Metrics Calculation =====
    const totalFacilities = facilities.length;

    // ===== Helpers =====
    const numericAverage = (key) => {
      const values = facilities.map((f) => Number(f[key]) || 0);
      return values.reduce((a, b) => a + b, 0) / totalFacilities;
    };

    const maxFacility = (key) =>
      facilities.reduce((prev, curr) =>
        Number(curr[key]) > Number(prev[key]) ? curr : prev
      );

    const minFacility = (key) =>
      facilities.reduce((prev, curr) =>
        Number(curr[key]) < Number(prev[key]) ? curr : prev
      );

    // ===== Base Averages =====
    const avgOverallRating = numericAverage("Overall_Rating");
    const avgStaffingHours = numericAverage(
      "Reported_Total_Nurse_Staffing_Hours_per_Resident_per_Day"
    );
    const avgQMRating = numericAverage("QM_Rating");
    const avgTurnover = numericAverage("Total_nursing_staff_turnover");
    // const avgInspectionScore = numericAverage(
    //   "Total_Weighted_Health_Survey_Score"
    // );
    const totalFinesInDollars = facilities
      .map((arr) => Number(arr.Total_Amount_of_Fines_in_Dollars) || 0)
      .reduce((sum, val) => sum + val, 0);

    const totalCertifiedBeds = facilities.reduce(
      (sum, f) => sum + (Number(f.Number_of_Certified_Beds) || 0),
      0
    );

    const totalDeficiencies = facilities
      .map(
        (arr) =>
          Number(arr.Rating_Cycle_1_Number_of_Standard_Health_Deficiencies) || 0
      )
      .reduce((sum, val) => sum + val, 0);

    const topFacility = maxFacility("Overall_Rating");
    const lowFacility = minFacility("Overall_Rating");

    // ===== Comparisons =====
    const ratingGap =
      Number(topFacility.Overall_Rating) - Number(lowFacility.Overall_Rating);
    const staffingGap =
      Number(
        topFacility.Reported_Total_Nurse_Staffing_Hours_per_Resident_per_Day ||
          0
      ) -
      Number(
        lowFacility.Reported_Total_Nurse_Staffing_Hours_per_Resident_per_Day ||
          0
      );

    const performanceGroups = {
      topPerformers: facilities.filter((f) => f.Overall_Rating >= 4),
      averagePerformers: facilities.filter(
        (f) => f.Overall_Rating >= 3 && f.Overall_Rating < 4
      ),
      lowPerformers: facilities.filter((f) => f.Overall_Rating < 3),
    };

    // ===== Trend Insight =====
    const trendInsight = `
      ${topFacility.Provider_Name} leads with an Overall Rating of ${
      topFacility.Overall_Rating
    }.
      ${lowFacility.Provider_Name} has the lowest Overall Rating (${
      lowFacility.Overall_Rating
    }).
      The rating gap between best and lowest facility is ${ratingGap.toFixed(
        2
      )} points.
      Average staffing hours across all facilities is ${avgStaffingHours.toFixed(
        2
      )} per resident/day.
      Staffing difference between best and lowest is ${staffingGap.toFixed(
        2
      )} hours.
    `;

    // ===== Facility Comparison Block =====
    const facilityComparison = facilities.map((f) => ({
      name: f.Provider_Name,
      overallRating: f.Overall_Rating,
      qmRating: f.QM_Rating,
      staffingHours:
        f.Reported_Total_Nurse_Staffing_Hours_per_Resident_per_Day || 0,
      turnover: f.Total_nursing_staff_turnover || 0,
      inspectionScore: f.Total_Weighted_Health_Survey_Score || 0,
      certifiedBeds: f.Number_of_Certified_Beds || 0,
      city: f.City_Town,
      Number_of_Fines: f.Number_of_Fines || 0,
      Total_Amount_of_Fines_in_Dollars: f.Total_Amount_of_Fines_in_Dollars || 0,
      Rating_Cycle_1_Standard_Survey_Health_Date:
        f.Rating_Cycle_1_Standard_Survey_Health_Date,
      Rating_Cycle_1_Total_Number_of_Health_Deficiencies:
        f.Rating_Cycle_1_Total_Number_of_Health_Deficiencies,
      Rating_Cycle_1_Number_of_Standard_Health_Deficiencies:
        f.Rating_Cycle_1_Number_of_Standard_Health_Deficiencies,
      Rating_Cycle_1_Number_of_Complaint_Health_Deficiencies:
        f.Rating_Cycle_1_Number_of_Complaint_Health_Deficiencies,
      Rating_Cycle_1_Health_Deficiency_Score:
        f.Rating_Cycle_1_Health_Deficiency_Score,
      Rating_Cycle_1_Health_Revisit_Score:
        f.Rating_Cycle_1_Health_Revisit_Score,
      Rating_Cycle_1_Total_Health_Score: f.Rating_Cycle_1_Total_Health_Score,
      Total_Weighted_Health_Survey_Score: f.Total_Weighted_Health_Survey_Score,
      Number_of_Facility_Reported_Incidents:
        f.Number_of_Facility_Reported_Incidents,
      Number_of_Substantiated_Complaints: f.Number_of_Substantiated_Complaints,
      Number_of_Citations_from_Infection_Control_Inspections:
        f.Number_of_Citations_from_Infection_Control_Inspections,
    }));

    // ===== Response Data =====
    const metricsData = {
      totalFacilities,
      avgOverallRating,
      avgStaffingHours,
      avgQMRating,
      avgTurnover,
      totalFinesInDollars,
      totalCertifiedBeds,
      totalDeficiencies,
      ratingGap,
      staffingGap,
      highestRatedFacility: {
        name: topFacility.Provider_Name,
        rating: topFacility.Overall_Rating,
        city: topFacility.City_Town,
      },
      lowestRatedFacility: {
        name: lowFacility.Provider_Name,
        rating: lowFacility.Overall_Rating,
        city: lowFacility.City_Town,
      },
      performanceGroups: {
        topPerformers: performanceGroups.topPerformers.map(
          (f) => f.Provider_Name
        ),
        averagePerformers: performanceGroups.averagePerformers.map(
          (f) => f.Provider_Name
        ),
        lowPerformers: performanceGroups.lowPerformers.map(
          (f) => f.Provider_Name
        ),
      },
      facilityComparison,
      trendInsight: trendInsight.trim(),
    };

    auditLogger(
      "multi facility metric success",
      `Retrieved metrics for ${totalFacilities} facilities`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: `Successfully retrieved metrics for ${totalFacilities} facility(ies)`,
      data: metricsData,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    auditLogger(
      "multi facility metric error",
      `Error during multi facility metric: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during multi facility metric: ${errorMsg}`,
    });
  }
};

module.exports = {
  addLongTermRegulations,
  longTermRegulationas,
  addFacilityTypes,
  facilityTypes,
  addFacility,
  updateFacility,
  viewFacility,
  facility,
  addResources,
  resources,
  viewResources,
  addCriticalElement,
  updateCriticalElments,
  viewCriticalElement,
  criticalElements,
  addFtagSetup,
  updateFtagsSetup,
  viewFtagsSetup,
  ftagSetup,
  deleteCriticalElements,
  deleteFacility,
  deleteFtag,
  deleteResources,
  deleteFacilityTypes,
  deleteLongTermRegulations,
  addMandatoryTask,
  updateMandatoryTask,
  viewMandatoryTask,
  mandatoryTasks,
  deleteMandatoryTask,
  facilityTaskCEPathways,
  fetchNursingHomes,
  allnursinghomes,
  updateAllFtagsSetup,
  multiFacilityMetric,
  addNursingHomesProviders,
  allnursinghomesproviders,
  addCritialQuestions,
  critialQuestions,
};
