require("dotenv").config();

const auth = (req, res, next) => {
  const jwt = require("jsonwebtoken");
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).send({
      success: false,
      message: "No authorization header",
    });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({
        success: false,
        message: "Invalid token",
      });
    }

    // req.auth = decoded;
    req.user = decoded.username;
    req.role = decoded.role;
    next();
  });
};

module.exports = auth;
