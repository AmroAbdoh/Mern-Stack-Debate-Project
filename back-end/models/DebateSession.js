
const mongoose = require("mongoose");

const DebateSessionSchema = new mongoose.Schema(
  {
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
      enum: ["scheduled", "live", "paused", "finished", "cancelled"],
      default: "scheduled",
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

        order: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DebateSession", DebateSessionSchema);