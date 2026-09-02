const express = require("express");
const router = express.Router();

const {
  createSession,
  getSession,
  updateSession,
  startSession,
  pauseSession,
  resumeSession,
  cancelSession,
} = require("../controllers/debateSessionController.js");

const authenticateUser = require("../middleware/authentication");

router.post("/", authenticateUser, createSession);
router.get("/:id", getSession);
router.patch("/:id", authenticateUser, updateSession);
router.patch("/:id/start", authenticateUser, startSession);
router.patch("/:id/pause", authenticateUser, pauseSession);
router.patch("/:id/resume", authenticateUser, resumeSession);
router.patch("/:id/cancel", authenticateUser, cancelSession);

module.exports = router;
