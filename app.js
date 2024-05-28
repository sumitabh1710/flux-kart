const express = require('express');
const { testConnection } = require('./db');
const contactRoutes = require('./routes');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, async() => {
  console.log(`Server is running on port ${PORT}`);
  await testConnection();
});
