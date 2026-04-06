const Wallet = require('../models/walletModel');
const Record = require('../models/recordModel');
const ApiError = require('../middlewares/apiError');
const crypto = require('crypto');


class walletService {
    // Generate a unique account number
        /**
     * Generates a 10-digit account number starting with a specific prefix
     * @param {string} prefix - e.g., '20' or '21'
     * @returns {string} - The full account number
     */
    async generateAccountNumber  (prefix = '20'|| '21') {
        // Generate a random 8-digit number
        // Min: 10,000,000 | Max: 99,999,999
        const randomPart = crypto.randomInt(10000000, 100000000);

        return `${prefix}${randomPart}`;
    };

    async createWallet(userId) {
        if (!userId) {
            throw new ApiError(400, "User ID is required to create a wallet");
        }
        // Generate account number
        const accountNumber = await this.generateAccountNumber();
        const newWallet = new Wallet({
            userId: userId,
            accountNumber: accountNumber,
            currency: 'NGN',
            balance: '0.00'.toString(),
        });
        await newWallet.save();

        const walletDetails = await Wallet.findOne({ userId }).populate('userId', 'name email');
        return walletDetails;

    }

    async transferFunds (userId, transferData) {
        const sender = await Wallet.findOne({ userId });
        if (!sender) {
            throw new ApiError(404, "Sender wallet not found");
        }
        const recipient = await Wallet.findOne({ accountNumber: transferData.accountNumber });
        if (!recipient) {
            throw new ApiError(404, "Recipient wallet not found");
        }
        // Prevent self-transfer
        if (sender.accountNumber === transferData.accountNumber) {
            throw new ApiError(400, "Cannot transfer to the same account");
        }
        // Check for sufficient funds
        if (sender.balance < transferData.amount) {
            throw new ApiError(400, "Insufficient funds");
        }
        // Perform the transfer atomically
        const debitSender = await Wallet.findOneAndUpdate(
            { userId,
            balance: { $gte: transferData.amount } },
            
            { $inc: { balance: -transferData.amount } },
            { new: true }
        );
        if (!debitSender) {
            throw new ApiError(400, "Failed to debit sender's wallet");
        }
        const creditRecipient = await Wallet.findOneAndUpdate(
            { accountNumber: transferData.accountNumber },
            { $inc: { balance: transferData.amount } },
            { new: true }
        );
        if (!creditRecipient) {
            // Rollback sender's debit if recipient credit fails
            await Wallet.findOneAndUpdate(
                { userId },
                { $inc: { balance: transferData.amount } } // Refund sender
            );
            throw new ApiError(400, "Failed to credit recipient's wallet");
        }
        // Generate transanction reference and Record the transaction history
        
        const txRf = `TRF-${crypto.randomBytes(5).toString('hex').toUpperCase()}`; 

        //  sender's transaction
        const senderRecord = new Record({
            userId: userId,
            walletId: sender._id,
            description: 'Fund transfer',
            amount: transferData.amount,
            currency: 'NGN',
            type: 'expense',
            category: 'transfer',
            balanceBefore: sender.balance,
            balanceAfter: debitSender.balance,
            status: 'successful',
            txRf: txRf        
        });
        await senderRecord.save();

        // recipient's transaction
        const recipientRecord = new Record({
            userId: creditRecipient.userId,
            walletId: creditRecipient._id,
            description: 'Incoming transfer',
            amount: transferData.amount,
            currency: 'NGN',
            type: 'income',
            category: 'transfer',
            balanceBefore: recipient.balance,
            balanceAfter: creditRecipient.balance,
            status: 'successful',
            txRf: txRf        
        });
        await recipientRecord.save();

        return Record.find(senderRecord._id).select('-userId -walletId -balanceBefore -balanceAfter')

    }


}

module.exports = walletService;