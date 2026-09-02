const DebateSession = require("../models/DebateSession");
const { StatusCodes } = require("http-status-codes");
const {
  getSession: findSessionById,
  checkSessionHost,
} = require("../utils/sessionUtils");

const createSession = async (req, res) => {
  const session = await DebateSession.create({
    ...req.body,
    host: req.user.userId,
  });

  res.status(StatusCodes.CREATED).json({
    session,
  });
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

  session.status = "live";

  await session.save();

  res.status(StatusCodes.OK).json({
    message: "Debate session started",
    session,
  });
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
  getSession,
  updateSession,
  startSession,
  pauseSession,
  resumeSession,
  cancelSession,
};
