const express = require("express");
const userRoute = express.Router();
const userController = require("../controllers/userController");
const validateData = require("../middlewares/Zod/zodValidation");
const authValidation = require("../middlewares/Zod/validationSchema");
const upload = require("../config/multer");
const isAuth = require("../middlewares/auth");
const {userStatusCheck} = require("../middlewares/userStatus");


userRoute.post(
  "/signup", validateData(authValidation.signupSchema), userController.signup,);
userRoute.post(  "/login",  validateData(authValidation.loginSchema),   userController.loginuser,);
userRoute.post( "/verify-account", validateData(authValidation.verifyAccountSchema), userController.verifyAccount,);
userRoute.post("/resend-otp", validateData(authValidation.resendOtpSchema), userController.resendOtp,);
userRoute.post("/upload-profile-picture", isAuth, userStatusCheck, upload.single("profilePicture"),userController.profilePictureUpload,);
userRoute.post("/forgot-password", validateData(authValidation.forgotPasswordSchema), userController.forgotPassword);
userRoute.post("/reset-password", validateData(authValidation.resetPasswordSchema), userController.resetPassword, 
);
userRoute.patch("/update-profile", isAuth, userStatusCheck, validateData(authValidation.updateProfileSchema), userController.updateProfile);
userRoute.delete( "/delete-profile", isAuth, userStatusCheck, userController.deleteProfile, );
userRoute.post("/logout", isAuth, userStatusCheck, userController.logoutuser);

module.exports = userRoute;
