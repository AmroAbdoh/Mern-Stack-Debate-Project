const mongoose = require("mongoose");
const crypto = require("crypto");

const generateSessionCode = () =>
  crypto.randomBytes(4).toString("base64url").toUpperCase().slice(0, 6);

const DebateSessionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      uppercase: true,
      default: generateSessionCode,
      minlength: 6,
      maxlength: 6,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    statement: {
      type: String,
      required: true,
      trim: true,
    },

    format: {
      type: String,
      enum: ["PF", "LD"],
      required: true,
    },

    teams: {
      type: [
        {
          name: {
            type: String,
            required: true,
            trim: true,
          },

          members: [
            {
              name: {
                type: String,
                required: true,
                trim: true,
              },

              contactInfo: {
                type: String,
                trim: true,
              },
            },
          ],
        },
      ],

      validate: {
        validator: function (teams) {
          return teams.length === 2;
        },
        message: "A debate must have exactly 2 teams.",
      },

      required: true,
    },

    startTime: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "scheduled",
        "waiting",
        "pre-voting",
        "live",
        "paused",
        "post-voting",
        "finished",
        "cancelled",
      ],
      default: "scheduled",
    },

    startedAt: Date,
    endedAt: Date,
    phaseStartedAt: Date,
    phaseEndsAt: Date,
    pausedAt: Date,
    currentPhase: {
      type: String,
      enum: ["pre-voting", "debate", "post-voting"],
    },
    currentPhaseIndex: {
      type: Number,
      min: 0,
    },
    activeTeam: {
      type: String,
      enum: ["teamOne", "teamTwo"],
    },

    settings: {
      allowAbstain: {
        type: Boolean,
        default: false,
      },

      preDebateVoting: {
        type: Boolean,
        default: false,
      },

      postDebateVoting: {
        type: Boolean,
        default: true,
      },

      autoShowResults: {
        type: Boolean,
        default: true,
      },
    },

    phases: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },

        duration: {
          type: Number,
          required: true,
          min: 1,
        },

        durationSeconds: {
          type: Number,
          min: 1,
          default: function () {
            return this.duration ? this.duration * 60 : 180;
          },
        },

        timingMode: {
          type: String,
          enum: ["per-team", "shared"],
          default: "per-team",
        },

        order: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("DebateSession", DebateSessionSchema);
