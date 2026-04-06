const User = require('../models/userModel');

    
    const userStatusCheck = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (user.isSuspended) {
            return res.status(403).json({ 
                message: "Your account has been suspended. Please contact support." 
            });
        }
        if (!user.isloggedIn) {
            return res.status(403).json({ 
                message: "Please log in to access this resource." 
            });
        }
        if (user.isDeleted) {
            return res.status(403).json({ 
                message: "This account has been deleted." 
            });
        }

        next(); // User is active, proceed to the controller
    } catch (error) {
        next(error);
    }
};

module.exports = { userStatusCheck };