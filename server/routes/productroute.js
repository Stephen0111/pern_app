// server/routes/productRoute.js
const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/products", async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    const response = await axios.get(
      `https://dummyjson.com/products?limit=${limit}&skip=${skip}`
    );

    res.json(response.data);
  } catch (err) {
    console.error("❌ Error fetching products:", err.message);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

module.exports = router;
