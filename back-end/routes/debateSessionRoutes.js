const express = require("express");
const router = express.Router();

const {
  createSession,
  getSessions,
  getSession,
  getSessionByCode,
  updateSession,
  startSession,
  pauseSession,
  resumeSession,
  cancelSession,
  beginVoting,
  endVoting,
  endDebate,
  endPostVoting,
} = require("../controllers/debateSessionController.js");

const authenticateUser = require("../middleware/authentication");
const { submitVote, getVoteResults } = require("../controllers/voteController");

router.post("/", authenticateUser, createSession);
router.get("/", authenticateUser, getSessions);
router.get("/code/:code", authenticateUser, getSessionByCode);
router.get("/:id", authenticateUser, getSession);
router.patch("/:id", authenticateUser, updateSession);
router.patch("/:id/start", authenticateUser, startSession);
router.patch("/:id/pause", authenticateUser, pauseSession);
router.patch("/:id/resume", authenticateUser, resumeSession);
router.patch("/:id/cancel", authenticateUser, cancelSession);
router.patch("/:id/begin-voting", authenticateUser, beginVoting);
router.patch("/:id/end-voting", authenticateUser, endVoting);
router.patch("/:id/end-debate", authenticateUser, endDebate);
router.patch("/:id/end-post-voting", authenticateUser, endPostVoting);
router.post("/:id/votes", authenticateUser, submitVote);
router.get("/:id/votes/results", authenticateUser, getVoteResults);

module.exports = router;
