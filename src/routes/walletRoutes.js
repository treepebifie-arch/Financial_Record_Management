const walletController = require('../controllers/walletController');
const express = require('express');
const walletRoute = express.Router();
const  validateData  = require('../middlewares/Zod/zodValidation');
const authValidation = require('../middlewares/Zod/validationSchema');
const isAuth = require('../middlewares/auth.js');


walletRoute.post("/create-wallet/:userId", walletController.createWallet,); 
walletRoute.post("/transfer-funds/:userId", validateData(authValidation.transferFundsSchema), walletController.transferFunds);
walletRoute.post("/make-deposit", isAuth, walletController.makeDeposit);





module.exports = walletRoute;