const jwt = require('jsonwebtoken');
require('dotenv').config();

const isAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const [type, token] = authHeader.split(' ');

  if (!token || type !== "Bearer") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Support both userId or id
    req.userId = payload.userId || payload.id;
    req.role = payload.role || "user";

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = isAuth;
