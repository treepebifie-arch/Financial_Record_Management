const apiResponse = require('../middlewares/apiResponse');
const dashboardService = require('../services/dashboardService');

const dashboardServices = new dashboardService();

const getOverview = async (req, res, next) => {
  console.log("request received for dashboard overview");
    try {
        const { id } = req.user.id;
        const data = await dashboardServices.fetchStats(id);
        apiResponse(res, 200, data, "Dashboard overview fetched successfully");
    } catch (error) {
        next(error);
    }
    console.log("Dashboard overview accessed by user ID:", req.user.id);
};

const getOneTransaction = async (req, res, next) => {
    try {
        const { transactionId } = req.params;  
        const { id: userId, role } = req.user;
        console.log(`request recieved from ${role} with ID: ${userId} for transaction ID: ${transactionId}`);
        const transaction = await dashboardServices.getOneTransaction(userId, role, transactionId);
        apiResponse(res, 200, transaction, `Transaction fetched by ${role} successfully`);
    } catch (error) {
        next(error);
    }

};

const searchByFilters = async (req, res, next) => {
    try {
        const { id: userId, role } = req.user;
        const filters = req.query;
        const transactions = await dashboardServices.filterTransactions(filters, role, userId);
        apiResponse(res, 200, transactions, "Transactions filtered successfully");
    } catch (error) {
        next(error);
    }
};

const getAllTransactions = async (req, res, next) => {
    try {
        const transactions = await dashboardServices.fetchAllTransactions(req.query.page);
        apiResponse(res, 200, transactions, "Transactions fetched successfully");
    } catch (error) {
        next(error);
    }
};


const getRecentTransactions = async (req, res, next) => {
    try {
        const transactions = await dashboardServices.fetchRecentTransactions();
        apiResponse(res, 200, transactions, "Recent transactions fetched successfully");
    } catch (error) {
        next(error);
    }
};

const getUsers = async (req, res, next) => {
    try {
        const users = await dashboardServices.fetchAllUsers(req.query.page);
        apiResponse(res, 200, users, "Users fetched successfully");
    } catch (error) {
        next(error);
    }
};

const getWallets = async (req, res, next) => {
    try {
        const wallets = await dashboardServices.fetchAllWallets(req.query.page);
        apiResponse(res, 200, wallets, "Wallets fetched successfully");
    } catch (error) {
        next(error);
    }
}



const suspendUser   = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await dashboardServices.updateUserStatus(userId);
        apiResponse(res, 200, user, `${user.name} has been ${user.isSuspended ? 'suspended' : 'unsuspended'}`);
    } catch (error) {
        next(error);
    }
};


const changeUserRole = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await dashboardServices.changeUserRole(userId);
    apiResponse(res, 200, result, `${result.name} is now an ${result.role}`);
  } catch (error) {
    next(error);
  }
};

module.exports = {
    getOverview,
    getOneTransaction,
    searchByFilters,
    getAllTransactions,
    getRecentTransactions,
    getUsers,
    getWallets,
    suspendUser,
    changeUserRole
};