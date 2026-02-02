const express = require("express");
const router = express.Router();
const multer = require("multer");
const checkAuth = require("../middlewares/check-auth");
const customerController = require("../controllers/Auth/customerAuth.controller");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "audio/",
      "video/",
      "image/",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];
    if (allowedMimeTypes.some((type) => file.mimetype.startsWith(type))) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB limit
});

router.post("/signup", customerController.customer_signup);
router.post("/verifyOtp", customerController.verifyOtp);
router.post("/login", customerController.login);
router.post("/resendOtp", customerController.resendOtp);
router.post(
  "/upload",
  upload.single("file"),
  checkAuth,
  customerController.uploads
);
router.put("/updateProfile", checkAuth, customerController.updateProfile);
router.post("/fcmtoken", checkAuth, customerController.fcmToken);
router.post("/deleteAccount", checkAuth, customerController.deleteAccount);
router.post("/changePassword", checkAuth, customerController.changePassword);
router.post(
  "/updatePreferences",
  checkAuth,
  customerController.updatePreferences
);
router.post("/forgetPassword", customerController.forgetPassword);
router.post("/resetPassword", customerController.resetPassword);
router.get("/signedUsers", checkAuth, customerController.signedUsers);
router.get("/invitedUsers/:id", checkAuth, customerController.invitedUsers);
router.get("/facilitiesUnderUser/:id", checkAuth, customerController.facilitiesUnderUser);
router.post("/2faSetup", checkAuth, customerController.setup2FA);
router.post("/verify2fa", customerController.verify2FA);
router.post("/reset2fa", checkAuth, customerController.reset2FA);

module.exports = router;
