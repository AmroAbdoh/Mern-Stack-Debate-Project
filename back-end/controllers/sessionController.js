const DebateSession = require("../models/DebateSession");
const Vote = require("../models/Vote");
const { StatusCodes } = require("http-status-codes");
const crypto = require("crypto");

const getParticipantId = (req) => {
  if (req.user?.userId) return req.user.userId;

  const token = req.headers["x-voter-token"];
  return token
    ? crypto.createHash("sha256").update(token).digest("hex").slice(0, 24)
    : null;
};

const ALLOWED_UPDATE_FIELDS = [
  "name",
  "statement",
  "format",
  "startTime",
  "teams",
  "settings",
  "phases",
];

const validateFormatRequirements = (format, teams) => {
  if (!teams || !["PF", "LD"].includes(format)) return null;

  const expectedMembers = format === "PF" ? 2 : 1;
  if (
    teams.length !== 2 ||
    teams.some((team) => team.members?.length !== expectedMembers)
  ) {
    return `${format} requires ${expectedMembers} member${expectedMembers === 1 ? "" : "s"} per team`;
  }

  return null;
};

const createSession = async (req, res) => {
  const formatError = validateFormatRequirements(
    req.body.format,
    req.body.teams,
  );
  if (formatError) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: formatError });
  }

  try {
    const session = await DebateSession.create({
      ...req.body,
      host: req.user.userId,
      settings: { ...req.body.settings, postDebateVoting: true },
    });

    res.status(StatusCodes.CREATED).json({ session });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(StatusCodes.CONFLICT).json({
        message: "You already have a session with this name",
      });
    }
    throw error;
  }
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

  res.status(StatusCodes.OK).json({
    session,
    participantCount: session.participants.length,
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

  const participantId = getParticipantId(req);
  if (participantId && session.host.toString() !== participantId) {
    const alreadyJoined = session.participants.some(
      (participant) => participant.toString() === participantId,
    );
    await DebateSession.updateOne(
      { _id: session._id },
      { $addToSet: { participants: participantId } },
    );
    if (!alreadyJoined) session.participants.push(req.user.userId);
  }

  res.status(StatusCodes.OK).json({
    session,
    participantCount: session.participants.length,
  });
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

  if (updates.settings) {
    updates.settings = { ...updates.settings, postDebateVoting: true };
  }

  const formatError = validateFormatRequirements(
    updates.format || session.format,
    updates.teams || session.teams,
  );
  if (formatError) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: formatError });
  }

  if (updates.name) {
    const duplicate = await DebateSession.findOne({
      _id: { $ne: session._id },
      host: req.user.userId,
      name: updates.name,
    }).collation({ locale: "en", strength: 2 });

    if (duplicate) {
      return res.status(StatusCodes.CONFLICT).json({
        message: "You already have a session with this name",
      });
    }
  }

  try {
    const updatedSession = await DebateSession.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true },
    );

    res.status(StatusCodes.OK).json({ session: updatedSession });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(StatusCodes.CONFLICT).json({
        message: "You already have a session with this name",
      });
    }
    throw error;
  }
};

const deleteSession = async (req, res) => {
  const session = await DebateSession.findById(req.params.id);

  if (!session) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "Debate session not found",
    });
  }

  if (session.host.toString() !== req.user.userId) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: "You are not allowed to delete this session",
    });
  }

  await Vote.deleteMany({ session: session._id });
  await session.deleteOne();

  res.status(StatusCodes.NO_CONTENT).send();
};

module.exports = {
  createSession,
  getSessions,
  getSession,
  getSessionByCode,
  updateSession,
  deleteSession,
};
