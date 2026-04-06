const User = require("../models/userModel");
const ApiError = require("../middlewares/apiError");
const TokenService = require("../utils/tokens");
const AuthHash = require("../utils/hash");
// const { sendOTPEmail } = require("../email/emailService");
const cloudinary = require("../config/cloudinary");
const walletService = require("./walletService");
const Wallet = require("../models/walletModel");


const newToken = TokenService;
const hash = AuthHash;
const walletServices = new walletService();

class userServiceActivities {
    async generateOtp() {
        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
        return otp;
    }

    async generateOtpExpiry() {
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
        return expiry;
    }

    async createUser(userData) {
        const { email, password, name } = userData;

        // check for existing User
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            throw new ApiError(409, "Identity conflict: Email already taken");
        }

        // Hash password
        const hashedPassword = await hash.hashPassword(password);

        // Generate otp, otp expiry 
        const otp = await this.generateOtp();
        const otpExpiry = await this.generateOtpExpiry();
    
        // Create User
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            otp,
            otpExpiry,
        });

        // Create wallet for the new user
        const userWallet = await walletServices.createWallet(newUser._id);

        // sendOTPEmail(email, name, "VERIFICATION", otp);

        // Return User without sensitive fields
        return User.findById(newUser._id).select("-password -otpExpiry") && userWallet;   
    }

    async login(email, password) {
        const user = await User.findOne({ email });
        if (!user) {
            throw new ApiError(404, "User does not exist");
        }
        const isPasswordValid = await hash.comparePassword(
            password,
            user.password,
        );
        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid User credentials");
        }
        if (!user.isVerified) {
            throw new ApiError(
                403,
                "Account not verified. Please verify your account to log in.",
            );
        }
        // Generate token
        const payload = { id: user._id, role: user.role };
        const token = newToken.generateAccessToken(payload);
        console.log(payload);

        user.isloggedIn = true;
        user.isActive = true;
        user.lastLogin = new Date();
        await user.save();

        // Remove sensitive data before returning
        const loggedInUser = await User.findById(user._id).select(
            "-password -otp -otpExpiry",
        );
        return { User: loggedInUser, token };
    }


    async verifyAccount(email, otp) {
        const user = await User.findOne({ email });

        if (!user) throw new ApiError(404, "User not found");
        if (user.isVerified) throw new ApiError(400, "Account already verified");

        // Check if OTP matches and hasn't expired
        if (user.otp !== otp) throw new ApiError(400, "Invalid OTP");
        if (new Date() > user.otpExpiry)
            throw new ApiError(400, "OTP has expired");

        user.isVerified = true;
        user.otp = null; // Clear OTP once used
        user.otpExpiry = null;
        await user.save();

        return user;
    }

    async resendOtp(email) {
        const user = await User.findOne({ email });
        if (!user) throw new ApiError(404, "User not found");

        // Generate otp, otp expiry
        const newOtp = await this.generateOtp();
        const newOtpExpiry = await this.generateOtpExpiry();

        // Update User with new OTP and expiry
        user.otp = newOtp;
        user.otpExpiry = newOtpExpiry;
        await user.save();

        // sendOTPEmail(email, User.name, "RESEND_OTP", newOtp);

        return user.otp;
    }


    //upload Profile Picture
    async uploadProfilePicture(UserId, file) {
        if (!file) {
            throw new ApiError(400, "No file uploaded");
        }
        const user = await User.findById(UserId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        if (!user.isloggedIn) {
            throw new ApiError(400, "Please log in first");
        }
        if (user.isDeleted) {
            throw new ApiError(400, "Cannot upload picture for a deleted account");
        }
        const uploadResult = await cloudinary.uploader.upload(file.path, {
            folder: "profilePicture",
            public_id: `user_${userId}_profile`,
        });
        user.profilePicture = uploadResult.secure_url;
        await user.save();
        return user;
    }

    async forgotPassword(email) {
        const user = await User.findOne({ email });
        if (!user) throw new ApiError(404, "User not found");

        // Generate otp, otp expiry
        const otp = await this.generateOtp();
        const otpExpiry = await this.generateOtpExpiry();

        // Update User with new OTP and expiry
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // sendOTPEmail(email, user.name, "PASSWORD_RESET", otp);

        return otp;
    }

    async resetPassword(email, otp, password) {
        const user = await User.findOne({ email });
        if (!user) throw new ApiError(404, "User not found");

        // check if OTP matches and hasn't expired
        if (user.otp !== otp) throw new ApiError(400, "Invalid OTP");
        if (new Date() > user.otpExpiry)
            throw new ApiError(400, "OTP has expired");

        // Hash new password and update User
        const hashNewPassword = await hash.hashPassword(password);

        user.password = hashNewPassword;
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        return { message: "Password reset successful" };
    }

    async updateUserDetails(userId, updateData) {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, "User not found");
        if (!user.isloggedIn) throw new ApiError(400, "Please log in first");
        if (user.isDeleted)
            throw new ApiError(400, "Cannot update a deleted account");

        const updates = {}; // will update only provided fields
        if (updateData.name) updates.name = updateData.name;
        if (updateData.email) {
            const existing = await User.findOne({
                email: updateData.email,
                _id: { $ne: userId },
            });
            if (existing)
                throw new ApiError(400, "Email already in use by another account");
            updates.email = updateData.email;
        }
        if (updateData.password) {
            updates.password = await hash.hashPassword(updateData.password);
        }
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updates }, // $set ensures only these fields are touched
            { new: true, runValidators: true },
        ).select("-password -otp -otpExpiry");

        return updatedUser;
    }

    async softDeleteUser(userId) {
        //  mark the User as deleted and set a timestamp
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, "User not found");
        const deletedUser = await User.findByIdAndUpdate(
            userId,
            {
                isDeleted: true,
                deletedAt: new Date(),
                status: "inactive", // Optional: update status for easier filtering
            },
            { new: true },
        );
        return { message: "Account deactivated successfully" };
    }

    async logout(userId) {
    
        const user = await User.findById(userId);
        if (!user) throw new ApiError(404, "User not found");
        if (!user.isloggedIn)
            throw new ApiError(400, "User is already logged out");
        user.isloggedIn = false;
        user.isActive = false;
        await user.save();
        return { message: "Logged out successfully" };
    }

    

}

module.exports = userServiceActivities;
