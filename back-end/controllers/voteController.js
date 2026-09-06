const Vote = require("../models/Vote");
const DebateSession = require("../models/DebateSession");
const { StatusCodes } = require("http-status-codes");
const crypto = require("crypto");

const getVoterId = (req) => {
  if (req.user?.userId) return req.user.userId;

  const token = req.headers["x-voter-token"];
  if (!token) return null;

  return crypto.createHash("sha256").update(token).digest("hex").slice(0, 24);
};

const submitVote = async (req, res, next) => {
  try {
    const session = await DebateSession.findById(req.params.id);

    if (!session) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Debate session not found",
      });
    }

    const phase =
      session.status === "pre-voting"
        ? "pre"
        : session.status === "post-voting"
          ? "post"
          : null;

    if (!phase) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Voting is not currently open",
      });
    }

    const { choice } = req.body;
    const voterId = getVoterId(req);

    if (!voterId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "A voter identity is required",
      });
    }

    if (!["teamOne", "teamTwo", "abstain"].includes(choice)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Choose Team One, Team Two, or Abstain",
      });
    }

    const vote = await Vote.create({
      session: session._id,
      voter: voterId,
      phase,
      choice,
    });

    res.status(StatusCodes.CREATED).json({
      message: "Your vote was recorded",
      vote: { phase: vote.phase, choice: vote.choice },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(StatusCodes.CONFLICT).json({
        message: "You have already voted in this phase",
      });
    }

    next(error);
  }
};

const getVoteResults = async (req, res, next) => {
  try {
    if (!require("mongoose").isValidObjectId(req.params.id)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Invalid debate session id",
      });
    }

    const results = await Vote.aggregate([
      { $match: { session: new (require("mongoose").Types.ObjectId)(req.params.id) } },
      {
        $group: {
          _id: { phase: "$phase", choice: "$choice" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.phase": 1, "_id.choice": 1 } },
    ]);

    res.status(StatusCodes.OK).json({ results });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitVote, getVoteResults };
