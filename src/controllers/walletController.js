const walletService = require('../services/walletService');
const ApiError = require('../middlewares/apiError');
const apiResponse = require('../middlewares/apiResponse');

const walletServices = new walletService();

const createWallet = async (req, res, next) => {
    try {

        const { userId } = req.params
        const walletDetails = await walletServices.createWallet(userId);
        apiResponse(res, 201, "Wallet created successfully", walletDetails);
    } catch (err) {
        next(err);
    }
};

const transferFunds = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { accountNumber, amount } = req.body;
        const transferData = { accountNumber, amount };
        const result = await walletServices.transferFunds(userId, transferData)
        apiResponse(res, 200, `successfully transferred ${amount} to account ${accountNumber}`, result);
    } catch (err) {
        next(err);
    }
}

const makeDeposit = async (req, res, next) => {
    try {
        const userId = req.user.id;
        console.log("User ID from token:", userId,);
        const { amount } = req.body;
        const result = await walletServices.makeDeposit(userId, req.body);
        apiResponse(res, 200, `Deposit of ${amount} initiated successfully`, result);
    } catch (err) {
        next(err);
    }
};

const verifyPayment = async (req, res, next) => {
    try {
        // verify the webhook signature
        const secretHash = process.env.FLW_SECRET_HASH;
        const signature = req.headers["verif-hash"];
        if (!signature || (signature !== secretHash)) {
            // This request isn't from Flutterwave; discard
                throw new ApiError(401, "Unauthorized")
        }
        const payload = req.body;
        const { result, message } = await walletServices.flutterWebHook(req.body);
        apiResponse(res, 200, message, result);
    } catch (err) {
        next(err);
    }

}

module.exports = {
    createWallet,
    transferFunds,
    makeDeposit,
    verifyPayment
};