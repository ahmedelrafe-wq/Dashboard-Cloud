const jwt = require("jsonwebtoken");


module.exports = function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) {
      return res.status(401).json({ error: "Please log in first." });
    }
    const payload = jwt.verify(token, process.env.SECRET_KEY);
    if (!payload || !payload._id) {
      return res.status(401).json({ error: "Invalid token." });
    }
    req.userId = payload._id; // string form of the user's Mongo _id
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};
