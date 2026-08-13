const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'gausevasecretkey2026';

const protect = (req, res, next) => {
    let token;

    // Check header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } 
    // Check query param (for PDF viewing)
    else if (req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token is invalid or expired' });
    }
};

module.exports = { protect };
