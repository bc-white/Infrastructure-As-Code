const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/check-auth");
const {
  addResident,
  getFacilityResidents,
  getResident,
  updateResident,
  deleteResident
} = require("../controllers/Configs/resident.controller");

// All routes require authentication
router.use(checkAuth);

// Add new resident
router.post("/add", addResident);

// Get all residents for a specific facility
router.get("/facility/:facilityId", getFacilityResidents);

// Get specific resident by ID
router.get("/:residentId", getResident);

// Update resident
router.put("/update", updateResident);

// Delete resident
router.delete("/:residentId", deleteResident);




module.exports = router;