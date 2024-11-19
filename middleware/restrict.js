const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

const restrict = async (req, res, next) => {
    const { authorization } = req.headers;
    let token;

    if (authorization && authorization.startsWith("Bearer ")) {
        token = authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.access_token) {
        token = req.cookies.access_token;
    }

    if (!token) {
        return res.status(401).json({ error: "You must be logged in to access this route" });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: "You are not authorized" });
        }
        req.user = decoded; 
        next();
    });
};

module.exports = restrict;