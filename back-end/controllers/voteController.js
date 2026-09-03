const Vote = require("../models/Vote");
const DebateSession = require("../models/DebateSession");
const { StatusCodes } = require("http-status-codes");

const submitVote = async (req, res, next) => {
  try {
    const session = await DebateSession.findById(req.params.id);

    if (!session) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Debate session not found",
      });
    }

    const phase = session.status === "pre-voting"
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

    if (!['teamOne', 'teamTwo', 'abstain'].includes(choice)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Choose Team One, Team Two, or Abstain",
      });
    }

    const vote = await Vote.create({
      session: session._id,
      voter: req.user.userId,
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
    const results = await Vote.aggregate([
      { $match: { session: req.params.id } },
      { $group: { _id: { phase: "$phase", choice: "$choice" }, count: { $sum: 1 } } },
      { $sort: { "_id.phase": 1, "_id.choice": 1 } },
    ]);

    res.status(StatusCodes.OK).json({ results });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitVote, getVoteResults };