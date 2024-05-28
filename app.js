const express = require("express");
const { initializeDatabase } = require("./db");
const { pool } = require("./db");
const contactRoutes = require("./routes");

const app = express();
app.use(express.json());

app.use("/identify", contactRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    await pool.connect();
    console.log("Database connection successful!");
    await initializeDatabase();
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
});
