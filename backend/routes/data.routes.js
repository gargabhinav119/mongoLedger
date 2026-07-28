const express = require('express');
const { verifyShop } = require('../middleware/auth');
const Customer = require('../models/Customer');

const router = express.Router();

// GET data for logged-in shop
router.get('/', verifyShop, async (req, res) => {
  try {
    const customers = await Customer.find({ shopId: req.shopId });
    
    // Format response to match v1 structure
    const data = {
      customers: customers.map(c => ({
        id: c.id,
        name: c.name,
        createdAt: c.createdAt,
        entries: c.entries || []
      }))
    };

    res.json(data);
  } catch (error) {
    console.error('GET data error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST data for logged-in shop
router.post('/', verifyShop, async (req, res) => {
  try {
    const incomingData = req.body;
    
    if (!incomingData.customers || !Array.isArray(incomingData.customers)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    // Delete all existing customers for this shop
    await Customer.deleteMany({ shopId: req.shopId });

    // Insert new customers
    const customersToInsert = incomingData.customers.map(c => ({
      shopId: req.shopId,
      id: c.id,
      name: c.name,
      createdAt: c.createdAt || new Date().toISOString(),
      entries: c.entries || []
    }));

    if (customersToInsert.length > 0) {
      await Customer.insertMany(customersToInsert);
    }

    res.json({ success: true, count: customersToInsert.length });
  } catch (error) {
    console.error('POST data error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;