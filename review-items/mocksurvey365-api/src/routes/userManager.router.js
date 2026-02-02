const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/check-auth");
const userManagementController = require("../controllers/UserManagement/usermanager.controller");


router.get("/users", checkAuth, userManagementController.users);
router.get("/users/:userId", checkAuth, userManagementController.getUserById);
router.get("/roles", checkAuth, userManagementController.roles);
router.put("/blockunblock", checkAuth, userManagementController.blockunblock);


module.exports = router;
