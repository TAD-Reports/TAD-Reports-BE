const auth = (req, res, next) => {
  const jwt = require("jsonwebtoken");
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(401).send({
      success: false,
      message: "No authorization header",
    });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err || !decoded) {
      return res.status(401).send({
        success: false,
        message: "Invalid token",
      });
    }

    // req.auth = decoded;
    req.user = { id: decoded.id };
    next();
  });
};

module.exports = auth;
