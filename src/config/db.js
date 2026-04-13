const mysql = require("mysql2/promise");

let pool;

const createPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "tech_ecommerce_db",
      port: Number(process.env.DB_PORT) || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  return pool;
};


const connectDatabase = async () => {
  if (process.env.DB_ENABLED !== "true") {
    console.log("Database connection skipped. Set DB_ENABLED=true to enable MySQL.");
    return;
  }

  try {
    const databasePool = createPool();
    const connection = await databasePool.getConnection();

    console.log(
      `Connected to MySQL database "${process.env.DB_NAME || "tech_ecommerce_db"}" on port ${process.env.DB_PORT || 3306}`
    );

    connection.release();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  }
};

const getPool = () => createPool();

module.exports = connectDatabase;
module.exports.getPool = getPool;
