const DebateSession = require("../models/DebateSession");

const getSession = async (id) => {
  const session = await DebateSession.findById(id);

  if (!session) {
    const error = new Error("Debate session not found");
    error.statusCode = 404;
    throw error;
  }

  return session;
};

const checkSessionHost = (session, userId) => {
  if (session.host.toString() !== userId) {
    const error = new Error("You are not allowed to modify this session");
    error.statusCode = 403;
    throw error;
  }
};

module.exports = {
  getSession,
  checkSessionHost,
};