const swaggerJSDoc = require("swagger-jsdoc");

const PORT = process.env.PORT || 5000;

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Ecommerce Backend API",
      version: "1.0.0",
      description: "API documentation for the Node.js ecommerce backend",
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Local server",
      },
    ],
  },
  apis: ["./src/routes/*.js", "./src/controllers/*.js", "./src/modules/**/*.js"],
};

module.exports = swaggerJSDoc(options);
