const jwt = require("jsonwebtoken");

// Auth middleware for the cloud backend.
//
// The frontend logs in against RegistrationBack, which signs a JWT as
// jwt.sign({ _id }, SECRET_KEY). That same token is sent here in the
// Authorization header. We verify it with the SAME SECRET_KEY (set both
// backends' SECRET_KEY to the same value in .env) and expose the user id
// as req.userId so every cloud operation is scoped to the signed-in user.
//
// This replaces the old cross-directory require into RegistrationBack, which
// pulled in that app's mongoose connection/model and did not work from here.
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
