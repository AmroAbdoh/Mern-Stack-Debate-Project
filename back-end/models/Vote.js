const mongoose = require("mongoose");

const VoteSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DebateSession",
      required: true,
    },
    voter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    phase: {
      type: String,
      enum: ["pre", "post"],
      required: true,
    },
    choice: {
      type: String,
      enum: ["teamOne", "teamTwo", "abstain"],
      required: true,
    },
  },
  { timestamps: true },
);

VoteSchema.index({ session: 1, voter: 1, phase: 1 }, { unique: true });

module.exports = mongoose.model("Vote", VoteSchema);
