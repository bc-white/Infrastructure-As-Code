const express = require("express");
const app = express();
const helmet = require("helmet");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const cors = require("cors");

const CONSTANTS = require("./src/constants/constants");
const swaggerDocs = require("./swaggerConfig");
const { connect_to_db } = require("./src/db/db");
const { errorHandler } = require("./src/routes/error.router");

// Add this line to serve files from the 'public' directory
app.use('/public', express.static('public'));
app.set('trust proxy', true);

// Middlewares
app.use(errorHandler);
app.use(morgan("dev"));
app.use(cors());
var urlencoded_body_parser = bodyParser.urlencoded({
  limit: "250mb",
  extended: true,
});
app.use(bodyParser.json({ limit: "250mb" }));
app.use(urlencoded_body_parser);
app.use(helmet());
app.use(
  helmet.hsts({
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  })
);

// allowed http methods
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method === "OPTIONS") {
      res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
      return res.status(200).json({});
    }
  
    next();
});




// Routes which should handle requests
const prefix = `/api/${CONSTANTS.VERSION}`;
app.use(`${prefix}/health`, require("./src/routes/health.router"));
app.use(`${prefix}/admin`,require("./src/routes/adminAuth.router"));
app.use(`${prefix}/user`,require("./src/routes/customerAuth.router"));
app.use(`${prefix}/usermanagement`,require("./src/routes/userManager.router"));
app.use(`${prefix}/subscription`,require("./src/routes/subscriptionAuth.router"));
app.use(`${prefix}/config`,require("./src/routes/config.router"));
app.use(`${prefix}/resident`,require("./src/routes/resident.router"));
app.use(`${prefix}/surveybuilder`,require("./src/routes/surveys.router"));
app.use(`${prefix}/health-assistant`, require("./src/routes/healthAssistant.router"));
app.use(`${prefix}/surveyMain`, require("./src/routes/surveyMain.router"));

connect_to_db();


// main route
app.get("/",(req,res)=>{
    res.send(`we are on mocksurvey365 api v1: we are live: ${new Date()}`)
})

// Initialize Swagger
swaggerDocs(app);

// not found response
app.use((req, res, next) => {
  const error = new Error("Endpoint Not found");
  error.status = 404;
  next(error);
});

// app error response
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});

module.exports = app;