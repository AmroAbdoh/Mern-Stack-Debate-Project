const DebateSession = require("../models/DebateSession");
const { StatusCodes } = require("http-status-codes");
const {
  getSession: findSessionById,
  checkSessionHost,
} = require("../utils/sessionUtils");

const getOrderedPhases = (session) =>
  [...session.phases].sort((first, second) => first.order - second.order);

const getPhaseDurationSeconds = (phase) =>
  phase.durationSeconds || phase.duration * 60;

const getPhaseEnd = (phase, startedAt) =>
  new Date(startedAt.getTime() + getPhaseDurationSeconds(phase) * 1000);

const startDebatePhase = (session, phaseIndex, startedAt) => {
  const phase = getOrderedPhases(session)[phaseIndex];

  if (!phase) return false;

  session.status = "live";
  session.currentPhase = "debate";
  session.currentPhaseIndex = phaseIndex;
  session.activeTeam = phase.timingMode === "shared" ? undefined : "teamOne";
  session.phaseStartedAt = startedAt;
  session.phaseEndsAt = getPhaseEnd(phase, startedAt);
  return true;
};

const finishDebate = (session, now) => {
  session.currentPhaseIndex = undefined;
  session.activeTeam = undefined;
  session.phaseStartedAt = now;
  session.phaseEndsAt = undefined;

  if (session.settings.postDebateVoting) {
    session.status = "post-voting";
    session.currentPhase = "post-voting";
  } else {
    session.status = "finished";
    session.currentPhase = undefined;
    session.endedAt = now;
  }
};

const advanceExpiredPhase = (session, now) => {
  if (session.status !== "live" || !session.phaseEndsAt || session.phaseEndsAt > now) {
    return false;
  }

  const phase = getOrderedPhases(session)[session.currentPhaseIndex];

  if (phase?.timingMode === "per-team" && session.activeTeam === "teamOne") {
    session.activeTeam = "teamTwo";
    session.phaseStartedAt = now;
    session.phaseEndsAt = getPhaseEnd(phase, now);
    return true;
  }

  if (!startDebatePhase(session, session.currentPhaseIndex + 1, now)) {
    finishDebate(session, now);
  }

  return true;
};

const activateScheduledSessions = async () => {
  const sessions = await DebateSession.find({
    status: "scheduled",
    startTime: { $lte: new Date() },
  });

  for (const session of sessions) {
    const now = new Date();
    const isPreVoting = session.settings.preDebateVoting;

    session.status = isPreVoting ? "pre-voting" : "live";
    session.currentPhase = isPreVoting ? "pre-voting" : "debate";
    session.startedAt = now;
    session.phaseStartedAt = now;
    session.phaseEndsAt = isPreVoting ? undefined : undefined;

    if (!isPreVoting && !startDebatePhase(session, 0, now)) {
      finishDebate(session, now);
    }

    await session.save();
  }
};

const advanceActiveSessions = async () => {
  const sessions = await DebateSession.find({
    status: "live",
    phaseEndsAt: { $lte: new Date() },
  });

  for (const session of sessions) {
    if (advanceExpiredPhase(session, new Date())) {
      await session.save();
    }
  }
};

const createSession = async (req, res) => {
  const session = await DebateSession.create({
    ...req.body,
    host: req.user.userId,
  });

  res.status(StatusCodes.CREATED).json({
    session,
  });
};

const getSessions = async (req, res) => {
  const sessions = await DebateSession.find({ host: req.user.userId })
    .sort({ startTime: 1 })
    .lean();

  res.status(StatusCodes.OK).json({ sessions });
};

const getSession = async (req, res) => {
  const { id } = req.params;

  const session = await DebateSession.findById(id);

  if (!session) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "Debate session not found",
    });
  }

  res.status(StatusCodes.OK).json({
    session,
  });
};

const getSessionByCode = async (req, res) => {
  const session = await DebateSession.findOne({
    code: req.params.code.toUpperCase(),
  });

  if (!session) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "Debate session not found",
    });
  }

  res.status(StatusCodes.OK).json({ session });
};

const updateSession = async (req, res) => {
  const { id } = req.params;

  const session = await DebateSession.findById(id);

  if (!session) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "Debate session not found",
    });
  }

  if (session.host.toString() !== req.user.userId) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: "You are not allowed to modify this session",
    });
  }

  const updatedSession = await DebateSession.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(StatusCodes.OK).json({
    session: updatedSession,
  });
};

const startSession = async (req, res) => {
  const session = await findSessionById(req.params.id);

  checkSessionHost(session, req.user.userId);

  if (session.status !== "scheduled") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Only scheduled sessions can be started",
    });
  }

  const now = new Date();
  session.status = session.settings.preDebateVoting ? "pre-voting" : "live";
  session.currentPhase = session.settings.preDebateVoting
    ? "pre-voting"
    : "debate";
  session.startedAt = now;
  session.phaseStartedAt = now;
  if (!session.settings.preDebateVoting && !startDebatePhase(session, 0, now)) {
    finishDebate(session, now);
  }

  await session.save();

  res.status(StatusCodes.OK).json({
    message: "Debate session started",
    session,
  });
};

const beginVoting = async (req, res) => {
  const session = await findSessionById(req.params.id);
  checkSessionHost(session, req.user.userId);

  if (session.status !== "waiting" && session.status !== "scheduled") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "This session is not ready for voting",
    });
  }

  const now = new Date();
  session.status = "pre-voting";
  session.currentPhase = "pre-voting";
  session.startedAt = session.startedAt || now;
  session.phaseStartedAt = now;
  await session.save();

  res
    .status(StatusCodes.OK)
    .json({ message: "Pre-debate voting started", session });
};

const endVoting = async (req, res) => {
  const session = await findSessionById(req.params.id);
  checkSessionHost(session, req.user.userId);

  if (session.status !== "pre-voting") {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Pre-debate voting is not active" });
  }

  if (!startDebatePhase(session, 0, new Date())) {
    finishDebate(session, new Date());
  }
  await session.save();

  res
    .status(StatusCodes.OK)
    .json({ message: "Pre-debate voting ended", session });
};

const endDebate = async (req, res) => {
  const session = await findSessionById(req.params.id);
  checkSessionHost(session, req.user.userId);

  if (session.status !== "live" && session.status !== "paused") {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "The debate is not active" });
  }

  session.status = session.settings.postDebateVoting
    ? "post-voting"
    : "finished";
  session.currentPhase = session.settings.postDebateVoting
    ? "post-voting"
    : undefined;
  session.phaseStartedAt = new Date();
  session.endedAt = session.settings.postDebateVoting ? undefined : new Date();
  await session.save();

  res.status(StatusCodes.OK).json({ message: "Debate ended", session });
};

const endPostVoting = async (req, res) => {
  const session = await findSessionById(req.params.id);
  checkSessionHost(session, req.user.userId);

  if (session.status !== "post-voting") {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Post-debate voting is not active" });
  }

  session.status = "finished";
  session.currentPhase = undefined;
  session.endedAt = new Date();
  await session.save();

  res.status(StatusCodes.OK).json({ message: "Session finished", session });
};

const pauseSession = async (req, res) => {
  const session = await findSessionById(req.params.id);

  checkSessionHost(session, req.user.userId);

  if (session.status !== "live") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Only live sessions can be paused",
    });
  }

  session.status = "paused";
  session.pausedAt = new Date();

  await session.save();

  res.status(StatusCodes.OK).json({
    message: "Debate session paused",
    session,
  });
};

// Resume debate
const resumeSession = async (req, res) => {
  const session = await findSessionById(req.params.id);

  checkSessionHost(session, req.user.userId);

  if (session.status !== "paused") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Only paused sessions can be resumed",
    });
  }

  session.status = "live";

  if (session.pausedAt && session.phaseEndsAt) {
    session.phaseEndsAt = new Date(
      session.phaseEndsAt.getTime() +
        (Date.now() - session.pausedAt.getTime()),
    );
  }

  session.pausedAt = undefined;

  await session.save();

  res.status(StatusCodes.OK).json({
    message: "Debate session resumed",
    session,
  });
};

// Cancel debate
const cancelSession = async (req, res) => {
  const session = await findSessionById(req.params.id);

  checkSessionHost(session, req.user.userId);

  if (["finished", "cancelled"].includes(session.status)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "This session cannot be cancelled",
    });
  }

  session.status = "cancelled";

  await session.save();

  res.status(StatusCodes.OK).json({
    message: "Debate session cancelled",
    session,
  });
};

module.exports = {
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
  activateScheduledSessions,
  advanceActiveSessions,
};
