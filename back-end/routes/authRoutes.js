const express = require("express");
const router = express.Router();

const {
  login,
  register,
  forgetPassword,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.patch("/forgetPassword", forgetPassword);

module.exports = router;
