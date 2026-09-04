const DebateSession = require("../models/DebateSession");
const { StatusCodes } = require("http-status-codes");

const ALLOWED_UPDATE_FIELDS = [
  "name",
  "statement",
  "format",
  "startTime",
  "teams",
  "settings",
  "phases",
];

const createSession = async (req, res) => {
  const session = await DebateSession.create({
    ...req.body,
    host: req.user.userId,
  });

  res.status(StatusCodes.CREATED).json({ session });
};

const getSessions = async (req, res) => {
  const sessions = await DebateSession.find({ host: req.user.userId })
    .sort({ startTime: 1 })
    .lean();

  res.status(StatusCodes.OK).json({ sessions });
};

const getSession = async (req, res) => {
  const session = await DebateSession.findById(req.params.id);

  if (!session) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "Debate session not found",
    });
  }

  res.status(StatusCodes.OK).json({ session });
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
  const session = await DebateSession.findById(req.params.id);

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

  if (session.status !== "scheduled") {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Only scheduled sessions can be edited",
    });
  }

  const updates = ALLOWED_UPDATE_FIELDS.reduce((allowed, field) => {
    if (req.body[field] !== undefined) allowed[field] = req.body[field];
    return allowed;
  }, {});

  const updatedSession = await DebateSession.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true },
  );

  res.status(StatusCodes.OK).json({ session: updatedSession });
};

module.exports = {
  createSession,
  getSessions,
  getSession,
  getSessionByCode,
  updateSession,
};
