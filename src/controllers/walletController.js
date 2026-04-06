const walletService = require('../services/walletService');
const ApiError = require('../middlewares/apiError');
const apiResponse = require('../middlewares/apiResponse');

const walletServices = new walletService(); 

const createWallet = async (req, res, next) => {
    try {

        const {userId} = req.params
        const walletDetails = await walletServices.createWallet(userId);
        apiResponse(res, 201, walletDetails, "Wallet created successfully");
    } catch (err) {
        next(err);
    }
};

const transferFunds = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const {accountNumber, amount} = req.body;
        const transferData = { accountNumber, amount };
        const result = await walletServices.transferFunds(userId, transferData)
        apiResponse(res, 200, result, `successfully transferred ${amount} to account ${accountNumber}`);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createWallet,
    transferFunds
};