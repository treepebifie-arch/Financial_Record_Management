
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const compression =require("compression")
const connectDB = require("./src/config/db");
const apiRouter = require("./src/routes");
const routeNotFound = require("./src/middlewares/routeNotFound");
const errorHandler = require("./src/middlewares/errorHandler");

const app = express();

// Connect to Database
connectDB ();


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

app.get("/", (req, res) => {
  res.send("Welcome!")
});


// Security and Performance Enhancements
app.use(helmet());
app.use(compression());



// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests, slow down!" },
});
app.use(limiter);



//Routes
app.use("/api/v1", apiRouter);

app.use(routeNotFound)


// Error Handling
app.use(errorHandler);



// export
module.exports = app;