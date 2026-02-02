const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const CONSTANTS = require("./src/constants/constants");


const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Mocksurvey365 api",
      version: "1.0.0",
      description: "API documentation for Mocksurvey365 application",
    },
    servers: [
      {
        url: CONSTANTS.API_BASE_URL, // Change this to your API base URL
      },
    ],
  },
  apis: ["./src/routes/*.js"], // Path to API routes
};

const swaggerSpec = swaggerJSDoc(options);

const swaggerDocs = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(`Swagger Docs available at ${CONSTANTS.API_BASE_URL}/api-docs`);
};

module.exports = swaggerDocs;