const dotenv = require("dotenv");

dotenv.config();

const app = require("./app");
const connectDatabase = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDatabase();

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
  });
};

startServer().catch((error) => {
  console.error("Unable to start server:", error.message);
  process.exit(1);
});
