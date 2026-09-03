require("dotenv").config({ path: __dirname + "/.env" });

const app = require("./app");
const connectDB = require("./config/db");
const {
  activateScheduledSessions,
  advanceActiveSessions,
} = require("./controllers/debateSessionController.js");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  setInterval(() => {
    activateScheduledSessions().catch((error) => {
      console.error("Scheduled session activation failed:", error.message);
    });

    advanceActiveSessions().catch((error) => {
      console.error("Active phase advancement failed:", error.message);
    });
  }, 10000);
};

startServer();
