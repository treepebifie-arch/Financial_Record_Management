
const express = require ('express');
const router = express.Router()
const userRoute = require ('./userRoutes');
const walletRoute = require('./walletRoutes');
const dashboardRoute = require('./dashboardRoutes');



const defaultRoutes = [
  {
    path: "/auth/user",
    route: userRoute,
  },
  {
    path: "/wallet",
    route: walletRoute,
  },
  {
    path: "/dashboard",
    route: dashboardRoute,
  }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;


