const express = require("express");
const router = express.Router();

const {
  createSession,
  getSessions,
  getSession,
  getSessionByCode,
  updateSession,
  deleteSession,
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
const optionalAuthentication = require("../middleware/optionalAuthentication");
const { submitVote, getVoteResults } = require("../controllers/voteController");

router.post("/", authenticateUser, createSession);
router.get("/", authenticateUser, getSessions);
router.get("/code/:code", optionalAuthentication, getSessionByCode);
router.get("/:id", authenticateUser, getSession);
router.patch("/:id", authenticateUser, updateSession);
router.delete("/:id", authenticateUser, deleteSession);
router.patch("/:id/start", authenticateUser, startSession);
router.patch("/:id/pause", authenticateUser, pauseSession);
router.patch("/:id/resume", authenticateUser, resumeSession);
router.patch("/:id/cancel", authenticateUser, cancelSession);
router.patch("/:id/begin-voting", authenticateUser, beginVoting);
router.patch("/:id/end-voting", authenticateUser, endVoting);
router.patch("/:id/end-debate", authenticateUser, endDebate);
router.patch("/:id/end-post-voting", authenticateUser, endPostVoting);
router.post("/:id/votes", optionalAuthentication, submitVote);
router.get("/:id/votes/results", optionalAuthentication, getVoteResults);

module.exports = router;
