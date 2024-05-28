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

const initializeDatabase = async () => {
  const connection = await createConnection();
  try {
    await connection.execute(`
        CREATE TABLE IF NOT EXISTS Contact (
          id INT AUTO_INCREMENT PRIMARY KEY,
          phoneNumber VARCHAR(20),
          email VARCHAR(100),
          linkedId INT DEFAULT NULL,
          linkPrecedence ENUM('primary', 'secondary') DEFAULT 'primary',
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deletedAt DATETIME DEFAULT NULL,
          FOREIGN KEY (linkedId) REFERENCES Contact(id)
        )
      `);
    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Failed to initialize database:", error.message);
  } finally {
    await connection.end();
  }
};

module.exports = { createConnection, testConnection, initializeDatabase };
