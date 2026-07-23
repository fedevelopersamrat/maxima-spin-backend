require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createShopifyCoupon } = require('./shopify');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health Check Route
app.get('/', (req, res) => {
  res.send({ status: 'ok', message: 'Spin Wheel Backend API is running' });
});

// Main Coupon Endpoint
app.get('/api/coupon', async (req, res) => {
  try {
    const result = await createShopifyCoupon();
    return res.status(200).json(result);
  } catch (error) {
    console.error('API Error generating coupon:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create Shopify coupon'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});