const User = require("../../models/user-model/user.model");
const Role = require("../../models/user-model/role.model");
const auditLogger = require("../../helpers/logger");
const CONSTANTS = require("../../constants/constants");

const {
  blockUnblockRequestValidation,
} = require("../../validators/auth-validators/admin_auth.validator");

const users = async (req, res) => {
  try {
    let userId = req.user._id;

    console.log(userId,'userId');

    const { name, startDate, endDate, userId: filterUserId, page = 1, limit = 10 } = req.query;
    const query = { roleId: { $ne: "673ab825a73a1aeac68da871" } };
    
    // Filter by specific userId if provided
    if (filterUserId) {
      query._id = filterUserId;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (name) {
      query.fullName = { $regex: `^${name}`, $options: "i" };
    }

    // Get total count efficiently
    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    const user = await User.find(query)
      .select("_id fullName email roleId isDeleted isLocked createdAt invited")
      .populate({
        path: "roleId",
        select: "_id name",
      })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    auditLogger(
      "user management",
      `fetching all users .`,
      "AdminActivity",
      userId
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Users fetched successfully.",
      data: {
        user,
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
      "users management error",
      `Error during users management: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during users management: ${errorMsg}`,
    });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.user._id;

    // console.log(userId, 'userId to fetch');
    // console.log(requestingUserId, 'requestingUserId');

    // Find the specific user
    const user = await User.findOne({ 
      _id: userId,
      roleId: { $ne: "673ab825a73a1aeac68da871" } // Exclude admin users
    })
      .select("_id fullName email roleId isDeleted isLocked createdAt updatedAt invited")
      .populate({
        path: "roleId",
        select: "_id name",
      });

    if (!user) {
      return res.status(404).json({
        status: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    auditLogger(
      "user management",
      `fetching user by ID: ${userId}`,
      "AdminActivity",
      requestingUserId
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "User fetched successfully.",
      data: {
        user,
      },
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "users management error",
      `Error during user fetch by ID: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during user fetch: ${errorMsg}`,
    });
  }
};


// roles
const roles = async (req, res) => {
  try {
    let userId = req.user._id;
    const { name, startDate, endDate, page = 1, limit = 10 } = req.query;
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (name) {
      query.name = { $regex: `^${name}`, $options: "i" };
    }

    // Get total count efficiently
    const total = await Role.countDocuments(query);
    const totalPages = Math.ceil(total / parseInt(limit));

    const rolesList = await Role.find(query)
      .select("_id name access status createdAt")
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // For each role, count the number of users with that role
    const rolesWithUserCount = await Promise.all(
      rolesList.map(async (role) => {
        const userCount = await User.countDocuments({ roleId: role._id });
        return {
          ...role.toObject(),
          userCount,
        };
      })
    );

    auditLogger(
      "user management",
      `fetching all roles .`,
      "AdminActivity",
      userId
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Roles fetched successfully.",
      data: {
        role: rolesWithUserCount,
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
      "users management error",
      `Error during users management: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during users management: ${errorMsg}`,
    });
  }
};



// block and unblock player
const blockunblock = async (req, res) => {
  try {
    const { error } = blockUnblockRequestValidation(req.body);

    if (error) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: error.details[0].message,
      });
    }

    const { userId, isLocked } = req.body;

    // Update new user info
    const updatedBy = req.user.fullName;
    const lockoutTime = new Date();

    // First verify user data exists
    const userUpdate = await User.findOne({
      _id: userId,
    });

    if (!userUpdate) {
      return res.status(200).json({
        status: true,
        statusCode: 200,
        message: "User data not found",
      });
    }

    // Update User Information
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        isLocked,
        isLockedBy: updatedBy,
        lockoutTime: lockoutTime,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    auditLogger(
      "block and unblock UPDATE",
      `block and unblock UPDATE by ${updatedBy}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "user data updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "users management error",
      `Error during users management: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred during users management: ${errorMsg}`,
    });
  }
};



// Update user role
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;
    const updatedBy = req.user.fullName;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    // Verify role exists
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({
        status: false,
        statusCode: 404,
        message: "Role not found",
      });
    }

    // Update user role
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { roleId },
      { new: true, runValidators: true }
    ).populate('roleId', 'name');

    auditLogger(
      "user role update",
      `User role updated to ${role.name} by ${updatedBy}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "User role updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "user role update error",
      `Error updating user role: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred updating user role: ${errorMsg}`,
    });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const deletedBy = req.user.fullName;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    // Soft delete by setting isDeleted to true
    const deletedUser = await User.findByIdAndUpdate(
      userId,
      { isDeleted: true },
      { new: true }
    );

    auditLogger(
      "user deletion",
      `User ${user.fullName} deleted by ${deletedBy}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "User deleted successfully",
      data: deletedUser,
    });
  } catch (error) {
    const errorMsg = error.response?.data || error.message;

    auditLogger(
      "user deletion error",
      `Error deleting user: ${errorMsg}`,
      "AdminActivity",
      req.user._id
    );

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: `An error occurred deleting user: ${errorMsg}`,
    });
  }
};

module.exports = {
  users,
  getUserById,
  roles,
  blockunblock,
  updateUserRole,
  deleteUser,
};
