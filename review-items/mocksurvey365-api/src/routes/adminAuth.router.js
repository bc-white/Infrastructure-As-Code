const express = require("express");
const router = express.Router();
const checkAuth = require("../middlewares/check-auth");
const adminController =require('../controllers/Auth/adminAuth.controller');


router.post('/signup',checkAuth, adminController.admin_signup);
router.get('/roles',checkAuth, adminController.roles_all);
router.get('/me', checkAuth, adminController.me);


module.exports = router