const mysql = require("mysql2/promise");

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "1234",
  database: "bitespeed",
};

const createConnection = async () => {
  return await mysql.createConnection(dbConfig);
};

const testConnection = async () => {
  try {
    const connection = await createConnection();
    console.log("Database connection successful!");
    await connection.end();
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
};

module.exports = { testConnection };
