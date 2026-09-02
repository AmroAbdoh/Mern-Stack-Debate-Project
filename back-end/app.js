const express = require("express");
const authRoutes = require("./routes/authRoutes");
const debateSessionRoutes = require("./routes/debateSessionRoutes");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Debate Project",
  });
});

// Authentication
app.use("/api/auth", authRoutes);

// Debate Session
app.use("/api/sessions", debateSessionRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Server Error";

  res.status(statusCode).json({ message });
});

module.exports = app;
