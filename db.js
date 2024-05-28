const { Pool } = require("pg");

const connectionString = 'postgres://user:VaagOhy2M1wF7OXKisjewVT4uDVi0o0m@dpg-cpamkt7109ks73aqkp9g-a/flux_kart';

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS Contact (
        id SERIAL PRIMARY KEY,
        phoneNumber VARCHAR(20),
        email VARCHAR(100),
        linkedId INT DEFAULT NULL,
        linkPrecedence VARCHAR(20) DEFAULT 'primary',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deletedAt TIMESTAMP DEFAULT NULL,
        FOREIGN KEY (linkedId) REFERENCES Contact(id)
      )
    `);
    console.log("Database initialized successfully!");
    client.release();
  } catch (error) {
    console.error("Failed to initialize database:", error.message);
  }
};

module.exports = { pool, initializeDatabase };
