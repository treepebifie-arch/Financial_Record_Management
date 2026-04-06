const jwt = require('jsonwebtoken');
const User = require('../models/userModel');



const  limitAccess = async (req, res, next) => {
    try {
                
        if (!req.user) {
            console.error('User not found for ID:', decoded.id);
            return res.status(404).json({ message: "User not found" });
        }

        // Role Authorization Logic
        const allowedRoles = ['admin', 'auditor'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied: User is not authorized" });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

// Middleware for Write-Access (Actions)

const restrictToAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            success: false, 
            message: "Permission denied: only Admins can perform this action" 
        });
    }
    next();
};

module.exports = { limitAccess, restrictToAdmin };