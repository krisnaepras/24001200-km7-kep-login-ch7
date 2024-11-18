const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

const restrict = async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res
            .status(401)
            .json({ error: "You must be logged in to access this route" });
    }
    const token = authorization.split(" ")[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: "You are not authoried" });
        }
        req.user = decoded;
        next();
    });
};

module.exports = restrict;