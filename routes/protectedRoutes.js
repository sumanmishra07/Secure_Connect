
const express = require("express");
const router = express.Router();

const {
  protect,
  authorizeRoles
} = require("../middleware/authMiddleware");

// Profile route - Any authenticated user
router.get("/profile", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Protected profile accessed successfully!",
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Admin-only route
router.get(
  "/admin",
  protect,
  authorizeRoles("admin"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome Admin!",
      admin: {
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  }
);

// User-only route
router.get(
  "/user",
  protect,
  authorizeRoles("user"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome User!",
      user: {
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  }
);

module.exports = router;
