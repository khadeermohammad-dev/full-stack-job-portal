const express = require("express");
const {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/reset-password", resetPassword);
router.get("/me", protect, getMe);
router.post("/profile", protect, updateProfile);

module.exports = router;
