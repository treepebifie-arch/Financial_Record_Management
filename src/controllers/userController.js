const ApiError = require("../middlewares/apiError");
const apiResponse = require("../middlewares/apiResponse");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const userServiceActivities = require("../services/userService");
const cloudinary = require("../config/cloudinary");


const userService = new userServiceActivities();

const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const user = await userService.createUser({
      name,
      email,
      password,
    });

    apiResponse(res, 201, user, "user registered successfully");
  } catch (err) {
    next(err);
  }
};


const loginuser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await userService.login(email, password);

    apiResponse(res, 200, user, "Login successful");
  } catch (error) {
    next(error);
  }
};

const verifyAccount = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    await userService.verifyAccount(email, otp);

    apiResponse(res, 200, null, "Account verified successfully");
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await userService.resendOtp(email);
    apiResponse(res, 200, result, "A new OTP has been sent to your email");
  } catch (error) {
    next(error);
  }
};


const profilePictureUpload = async (req, res, next) => {
  console.log("File:", req.file);
  try {
    const userId = req.user.id;
    const file = req.file;

    const user = await userService.uploadProfilePicture(userId, file);

    apiResponse(res, 200, user, "Profile picture uploaded successfully");
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email }  = req.body;
    const result = await userService.forgotPassword(email);
    apiResponse(res, 200, result, "Reset OTP sent to email");
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    await userService.resetPassword(email, otp, newPassword);
    apiResponse(res, 200, null, "Password changed successfully");
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateUserDetails(
      req.user.id,
      req.body,
    );
    apiResponse(res, 200, user, "Profile updated successfully");
  } catch (error) {
    next(error);
  }
};

const deleteProfile = async (req, res, next) => {
  try {
    const result = await userService.softDeleteUser(req.user.id);
    apiResponse(res, 200, null, result.message);
  } catch (error) {
next(error);
  }
};

const logoutuser = async (req, res, next) => {
  try {
    await userService.logout(req.user.id);
    apiResponse(res, 200, null, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};


module.exports = {
  signup,
  loginuser,
  verifyAccount,
  resendOtp,
  profilePictureUpload,
  forgotPassword,
  resetPassword,
  updateProfile,
  deleteProfile,
  logoutuser,

};
