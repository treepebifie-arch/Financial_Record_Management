const Wallet = require('../models/walletModel');
const Record = require('../models/recordModel');
const ApiError = require('../middlewares/apiError');
const crypto = require('crypto');
const axios = require('axios');
const User = require('../models/userModel');
const flw = require('flutterwave-node-v3');


class walletService {
    // Generate a unique account number
    /**
 * Generates a 10-digit account number starting with a specific prefix
 * @param {string} prefix - e.g., '20' or '21'
 * @returns {string} - The full account number
 */
    async generateAccountNumber(prefix = '20' || '21') {
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

    async transferFunds(userId, transferData) {
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
            {
                userId,
                balance: { $gte: transferData.amount }
            },

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

    async makeDeposit(userId, depositData) {

        const wallet = await Wallet.findOne({ userId }).populate('userId', 'name email');
        if (!wallet) {
            throw new ApiError(404, "Wallet not found");
        }
        const txRf = `TRF-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

        // Initialize Flutterwave client
        const flutterwave = new flw(
            process.env.FLW_PUBLIC_KEY,
            process.env.FLW_SECRET_KEY
        );
        try {
            const response = await axios.post(
                'https://api.flutterwave.com/v3/payments',
                {
                    tx_ref: txRf,
                    amount: depositData.amount,
                    currency: 'NGN',
                    redirect_url: 'https://api-zorvyn-fintech.onrender.com',
                    customer: {
                        email: wallet.userId.email,
                        name: wallet.userId.name,
                    },
                    customizations: {
                        title: 'Make a Deposit',
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
                        'Content-Type': 'application/json',
                    },
                }
            );
            return response.data.data.link
        } catch (err) {
            console.error(err.code);
            console.error(err.response.data);
        }
    }


    async flutterWebHook(payload) {
        const session = await mongoose.startSession();

        try {
           

            // Check if the transaction was successful
            const response = await flw.Transaction.verify({ id: payload.id });
            if (
                response.data.status === "successful"
                && response.data.amount === expectedAmount
                && response.data.currency === expectedCurrency
                && response.data.tx_ref === expectedReference) {
                // Success! Confirm the customer's payment, extract details, and start transaction
                session.startTransaction();
                // Automatically lock the record and update status to processing to prevent duplicate processing
                const record = await Record.findOneAndUpdate({
                    txRf: payload.tx_ref,
                    status: 'pending'
                },
                {
                    $set: { 
                        status: 'processing',
                        lockedAt: new Date()
                    },
                }, 
                { new: true, session }
                );
                console.log("Record locked for processing:", record);
                if (!record) {
                    await session.abortTransaction();
                
                    // check if the transaction has already been processed
                    const existingRecord = await Record.findOne({ txRf: payload.tx_ref });
                    if (existingRecord && existingRecord.status !== 'pending') {
                        console.log("Transaction already processed:", existingRecord.status);
                        return {
                            message: "Transaction already processed",
                            status: existingRecord.status
                        }
                    }
                    throw new ApiError(404, "Record does not exist or is not pending for processing");
                    
                }
                // Proceed with updating the wallet balance and record status
                const wallet = await Wallet.findOneAndUpdate({_id: record.walletId}, 
                    { 
                        $inc: { balance: amount }, 
                        $set: { updatedAt: new Date() }    
                    }, 
                    { new: true, session });
                
                if (wallet) {
                    // find the user associated with the wallet
                    const user = await User.findById(record.userId).session(session);
                    console.log ('user found', user)

                    if (user) {
                        console.log(`wallet balance updated for user ${user.name}, amount: ${wallet.balance} ${wallet.currency}`);
                    }
                    // Update the record status to successful
                    record.status = 'successful',
                    record.completedAt = new Date();
                    record.lockedAt = null; // Unlock the record

                    await record.save({ session });

                    // Commit the transaction
                    await session.commitTransaction();
                    console.log("Transaction committed successfully");

                    return {
                        message: "Transaction processed successfully",
                        status: record.status,
                        walletBalance: wallet.balance,
                    }
                } else {
                    await session.abortTransaction();
                    console.error("Wallet not found for the record:", record.walletId);
                    throw new ApiError(404, "Wallet not found for the record");
                }
            } else {
                console.error("Payment verification failed:", response.data);
                throw new ApiError(400, "Payment verification failed");
            }

        } catch (err) {
            // abort the transaction and log the error
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            console.error("Error occurred while processing webhook:", err);
            throw err; // Pass the error to the next middleware for handling
        } finally {
            session.endSession();
        }
    }
}

module.exports = walletService;