const jwt = require("jsonwebtoken");

const optionalAuthentication = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  try {
    req.user = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
  } catch {
    // Public participation routes can continue without a valid login token.
  }

  next();
};

module.exports = optionalAuthentication;