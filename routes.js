const express = require("express");
const { pool } = require("./db");
const { consolidateContact } = require("./contactService");

const router = express.Router();

router.post("/", async (req, res) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res
      .status(400)
      .send({ error: "Either email or phoneNumber must be provided" });
  }

  try {
    const client = await pool.connect();
    const contact = await consolidateContact(email, phoneNumber);
    client.release();
    res.status(200).send({ contact });
  } catch (error) {
    console.error("Failed to consolidate contact:", error.message);
    res.status(500).send({ error: "Failed to consolidate contact" });
  }
});

module.exports = router;
