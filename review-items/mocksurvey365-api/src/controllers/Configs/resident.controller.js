const Resident = require("../../models/configs/resident.model");
const Facility = require("../../models/configs/facility.model");
const Survey = require("../../models/surveyModels/survey.model");
const auditLogger = require("../../helpers/logger");
const {
  addResidentValidation,
  updateResidentValidation,
} = require("../../validators/config-validators/resident.validators");





// Add new resident
const addResident = async (req, res) => {
  try {
    const { error } = addResidentValidation(req.body);
    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const {
      name,
      room,
      age,
      admissionDate,
      primaryDiagnosis,
      careLevel,
      familyContact,
      familyPhone,
      specialNeeds,
      notes,
      interviewable,
      facilityId,
    } = req.body;

    // Check if facility exists and belongs to user
    const facility = await Facility.findOne({
      _id: facilityId,
      userId: req.user._id,
    });

    if (!facility) {
      return res.status(404).json({
        status: false,
        statusCode: 404,
        message: "Facility not found or access denied",
      });
    }

    // Check if room is already occupied by an active resident
    const existingResident = await Resident.findOne({
      facilityId: facilityId,
      room: room,
      status: "active",
    });

    if (existingResident) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "Room is already occupied by an active resident",
      });
    }

    const resident = await Resident.create({
      userId: req.user._id,
      facilityId: facilityId,
      name,
      room,
      age,
      admissionDate,
      primaryDiagnosis,
      careLevel,
      familyContact,
      familyPhone,
      specialNeeds: specialNeeds || [],
      notes,
      interviewable: interviewable !== undefined ? interviewable : true,
    });

    auditLogger(
      "resident",
      `Resident ${name} added successfully to facility ${facility.name}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Resident added successfully.",
      data: resident,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "resident error",
      `Error during resident creation: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during resident creation: ${errorMsg}`,
    });
  }
};

// Get all residents for a facility
const getFacilityResidents = async (req, res) => {
  try {
    const { facilityId } = req.params;
    const { page = 1, limit = 10, status, search } = req.query;

    // Check if facility exists and belongs to user
    const facility = await Facility.findOne({
      _id: facilityId,
      userId: req.user._id,
    });

    if (!facility) {
      return res.status(404).json({
        status: false,
        statusCode: 404,
        message: "Facility not found or access denied",
      });
    }

    const query = { facilityId: facilityId };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { room: { $regex: search, $options: "i" } },
        { primaryDiagnosis: { $regex: search, $options: "i" } },
      ];
    }

    // Get total count
    const total = await Resident.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    const residents = await Resident.find(query)
      .select(
        "_id name room age admissionDate primaryDiagnosis careLevel status familyContact familyPhone specialNeeds notes interviewable createdAt"
      )
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    auditLogger(
      "residents",
      `Residents fetched successfully for facility ${facility.name}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Residents fetched successfully.",
      data: {
        residents,
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
      "residents error",
      `Error during residents fetch: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during residents fetch: ${errorMsg}`,
    });
  }
};

// Get specific resident by ID
const getResident = async (req, res) => {
  try {
    const { residentId } = req.params;

    const resident = await Resident.findOne({
      _id: residentId,
      userId: req.user._id,
    })
      .populate("facilityId", "name address")
      .select(
        "_id name room age admissionDate primaryDiagnosis careLevel status familyContact familyPhone specialNeeds notes interviewable facilityId createdAt"
      );

    if (!resident) {
      return res.status(404).json({
        status: false,
        statusCode: 404,
        message: "Resident not found or access denied",
      });
    }

    auditLogger(
      "view resident",
      "Resident data viewed",
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Resident data viewed successfully",
      data: resident,
    });
  } catch (error) {
    auditLogger(
      "view resident Error",
      `View resident encountered an error: ${error.message}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during view resident: ${error.message}`,
    });
  }
};

// Update resident
const updateResident = async (req, res) => {
  try {
    const { error } = updateResidentValidation(req.body);
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
      room,
      age,
      admissionDate,
      primaryDiagnosis,
      careLevel,
      status,
      familyContact,
      familyPhone,
      specialNeeds,
      notes,
      interviewable,
    } = req.body;

    const resident = await Resident.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!resident) {
      return res.status(404).json({
        status: false,
        statusCode: 404,
        message: "Resident not found or access denied",
      });
    }

    // Check if room is already occupied by another active resident
    if (room !== resident.room && status === "active") {
      const existingResident = await Resident.findOne({
        facilityId: resident.facilityId,
        room: room,
        status: "active",
        _id: { $ne: id },
      });

      if (existingResident) {
        return res.status(400).json({
          status: false,
          statusCode: 400,
          message: "Room is already occupied by another active resident",
        });
      }
    }

    // Update resident fields
    resident.name = name;
    resident.room = room;
    resident.age = age;
    resident.admissionDate = admissionDate;
    resident.primaryDiagnosis = primaryDiagnosis;
    resident.careLevel = careLevel;
    resident.status = status;
    resident.familyContact = familyContact;
    resident.familyPhone = familyPhone;
    resident.specialNeeds = specialNeeds || [];
    resident.notes = notes;
    resident.interviewable = interviewable !== undefined ? interviewable : true;

    await resident.save();

    auditLogger(
      "update resident",
      `Resident ${name} updated successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Resident updated successfully.",
      data: resident,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "update resident error",
      `Error during resident update: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during resident update: ${errorMsg}`,
    });
  }
};

// Delete resident
const deleteResident = async (req, res) => {
  try {
    const { residentId } = req.params;

    const resident = await Resident.findOne({
      _id: residentId,
      userId: req.user._id,
    });

    if (!resident) {
      return res.status(404).json({
        status: false,
        statusCode: 404,
        message: "Resident not found or access denied",
      });
    }

    await Resident.findByIdAndDelete(residentId);

    auditLogger(
      "delete resident",
      `Resident ${resident.name} deleted successfully`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Resident deleted successfully.",
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "delete resident error",
      `Error during resident deletion: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during resident deletion: ${errorMsg}`,
    });
  }
};

module.exports = {
  addResident,
  getFacilityResidents,
  getResident,
  updateResident,
  deleteResident
};
