const mongoose = require ("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
        type: String,
        required: true, 
    },
    profilePicture: {
        type: String,
    },
    otp: {
        type: String,
    },
    otpExpiry: {
        type: Date,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isloggedIn: {
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        enum: ['user', 'auditor', 'admin' ],
        default: 'user',
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    },
    lastLogin: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: false
    },
    isSuspended: {
        type: Boolean,
        default: false
    }
    

}, { timestamps: true,
    versionKey: false,
 }
);


const User = mongoose.model('User', userSchema);

module.exports = User;
