const User = require('../models/userModel');
const Wallet = require('../models/walletModel');
const Record = require('../models/recordModel');
const ApiError = require('../middlewares/apiError');


class dashboardService {

    async fetchStats() {
        // Run aggregation to get totals in one DB call
        const stats = await Record.aggregate([
            {
                // Only include successful transactions in totals
                $match: { status: 'successful' }
            },
            {
                // Group everything to calculate totals
                $group: {
                    _id: null,
                    totalIncome: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "income"] }, { $toDouble: "$amount" }, 0]
                        }
                    },
                    totalExpense: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "expense"] }, { $toDouble: "$amount" }, 0]
                        }
                    },
                    totalTransactions: { $sum: 1 }
                }
            },
            {
                // Clean up the output
                $project: {
                    _id: 0,
                    totalFailedTransactions: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "failed"] }, 1, 0]
                        }
                    },
                    totalFlaggedTransactions: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "flagged"] }, 1, 0]
                        }
                    },
                    totalPendingTransactions: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "pending"] }, 1, 0]
                        }
                    },
                    totalSuccessfulTransactions: {
                        $sum: {
                            $cond: [{ $eq: ["$status", 'successful'] }, 1, 0]
                        }
                    },
                    totalIncome: { $round: ["$totalIncome", 2] },
                    totalExpense: { $round: ["$totalExpense", 2] },
                    netFlow: { $subtract: ["$totalIncome", "$totalExpense"] },
                    totalTransactions: 1
                }
            }
        ]);


        const userCount = await User.countDocuments();

        const walletCount = await Wallet.countDocuments();

        return {
            financials: stats[0] || {
                totalFailedTransactions: 0,
                totalFlaggedTransactions: 0,
                totalPendingTransactions: 0,
                totalSuccessfulTransactions: 0,
                totalIncome: 0,
                totalExpense: 0,
                netFlow: 0,
                totalTransactions: 0
            },
            totalUsers: userCount,
            totalWallets: walletCount

        };
    }

    async getOneTransaction(userId, role, transactionId) {

        const transaction = await Record.findById(transactionId)
            .select('-balanceBefore -balanceAfter') // Exclude sensitive fields
            .populate('userId', 'name email');
        if (!transaction) { throw new ApiError(404, "Transaction not found") };


        if (role === 'user') {

            if (transaction.userId?._id?.toString() !== userId?.toString()) {
                console.log(`Transaction user id ${transaction.userId?._id} accessed by user ID: ${userId}`);
                throw new ApiError(403, "Access denied: You can only view your own transactions");
            }
        }
        return transaction;

    }

    async filterTransactions(filters, role, userId) {
        const query = {};

        // Filter by Category
        if (filters.category) {
            query.category = filters.category;
        }

        // Filter by Status 
        if (filters.status) {
            query.status = filters.status;
        }

        // Filter by Date
        if (filters.createdAt) {
            query.createdAt = filters.createdAt;
        }

        // Filter by User
        if (filters.userId) {
            query.userId = filters.userId;
        }

        // Filter by type (income/expense)
        if (filters.type) {
            query.type = filters.type;
        }

        const result = await Record.find(query)
            .sort({ createdAt: -1 })
            .select('-balanceBefore -balanceAfter') // Exclude sensitive fields
            .populate('userId', 'name email');

        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        if (role === 'user') {

            const userRecords = result.filter(record =>
                record.userId?._id?.toString() === userId?.toString()
            );


            if (userRecords.length === 0) {
                throw new ApiError(404, "No record found for the user with the given filters");
            }

            return userRecords;
        }

        return result;

    }

    async fetchAllTransactions(userId, role, page, pageSize) {

        const totalCount = await Record.countDocuments({});

        const records = await Record.find({})
            .sort({ createdAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .populate('userId', 'name email')
            .select('-balanceBefore -balanceAfter');
            const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        if (role === 'user') {

            const userRecords = records.filter(record =>
                record.userId?._id?.toString() === userId?.toString()
            );

            if (userRecords.length === 0) {
                throw new ApiError(404, "No record found for the user with the given filters");
            }

            return {
                userRecords,
                
            };
        }


        return {
            records,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            currentPage: page
        };
    }

    async fetchRecentTransactions(userId, role) {

        const totalCount = await Record.countDocuments({});

        const records = await Record.find({})
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('userId', 'name email')
            .select('-balanceBefore -balanceAfter');

        const user = await User.findById(userId)
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        if (role === 'user') {

            const userRecords = records.filter(record =>
                record.userId?._id?.toString() === userId?.toString()
            );

            if (userRecords.length === 0) {
                throw new ApiError(404, "No record found for the user with the given filters");
            }

            return {
                userRecords,
                
            };
        }

        return {
            records,
            totalCount
        };

    }

    async fetchAllUsers(page = 1) {
        const limit = 10;
        const skip = (page - 1) * limit;
        return await User.find()
            .select('-password -otp -otpExpiry') // Exclude sensitive field
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
    }

    async fetchAllWallets(page = 1) {
        const limit = 10;
        const skip = (page - 1) * limit;
        return await Wallet.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
    }

    async updateUserStatus(userId) {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        // Simple toggle logic
        user.isSuspended = !user.isSuspended;
        return await user.save();
    }

    async changeUserRole(userId) {
        const user = await User.findByIdAndUpdate(userId).select("-password -otp -otpExpiry");
        if (!user) {
            throw new ApiError(404, "User not found");
        };
        if (user.role === 'user') {
            user.role = 'auditor';
        } else if (user.role === 'auditor') {
            user.role = 'admin';
        }

        await user.save();
        return user;



    }
}

module.exports = dashboardService;