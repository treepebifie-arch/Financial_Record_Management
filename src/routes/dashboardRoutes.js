const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const isAuth = require('../middlewares/auth');
const {userStatusCheck} = require('../middlewares/userStatus');
const accessCheck = require('../middlewares/admin');
const dashboardRoute = express.Router();

dashboardRoute.get('/dashboard-overview', isAuth, accessCheck.limitAccess, dashboardController.getOverview);
dashboardRoute.get('/transactions/:transactionId', isAuth, userStatusCheck, dashboardController.getOneTransaction);
dashboardRoute.get('/search-transactions', isAuth, dashboardController.searchByFilters);
dashboardRoute.get('/all-transactions', isAuth, dashboardController.getAllTransactions);
dashboardRoute.get('/recent-transactions', isAuth, dashboardController.getRecentTransactions);
dashboardRoute.get('/users', isAuth, accessCheck.limitAccess, dashboardController.getUsers);
dashboardRoute.get('/wallets', isAuth, accessCheck.limitAccess, dashboardController.getWallets);
dashboardRoute.post('/suspend-user/:userId', isAuth, accessCheck.restrictToAdmin, dashboardController.suspendUser);
dashboardRoute.patch("/change-role/:userId", isAuth, userStatusCheck, dashboardController.changeUserRole);
    

module.exports = dashboardRoute;