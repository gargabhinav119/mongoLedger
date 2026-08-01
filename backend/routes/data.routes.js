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
// Incremental upsert: sirf changed/new customers write hote hain,
// aur sirf woh customers delete hote hain jo incoming payload me nahi hain.
// Poore collection ka delete+reinsert nahi hota (pehle yahi slow tha).
router.post('/', verifyShop, async (req, res) => {
  try {
    const incomingData = req.body;

    if (!incomingData.customers || !Array.isArray(incomingData.customers)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const incomingIds = incomingData.customers.map(c => c.id);

    // Sirf un customers ko delete karo jo ab incoming list me nahi hain
    // (user ne delete kiya ho frontend se)
    const deleteOp = Customer.deleteMany({
      shopId: req.shopId,
      id: { $nin: incomingIds }
    });

    // Baaki sab customers upsert (update if exists, insert if new)
    const bulkOps = incomingData.customers.map(c => ({
      updateOne: {
        filter: { shopId: req.shopId, id: c.id },
        update: {
          $set: {
            shopId: req.shopId,
            id: c.id,
            name: c.name,
            createdAt: c.createdAt || new Date().toISOString(),
            entries: c.entries || []
          }
        },
        upsert: true
      }
    }));

    const [deleteResult, bulkResult] = await Promise.all([
      deleteOp,
      bulkOps.length > 0
        ? Customer.bulkWrite(bulkOps, { ordered: false })
        : Promise.resolve(null)
    ]);

    res.json({
      success: true,
      count: incomingData.customers.length,
      deleted: deleteResult.deletedCount,
      upserted: bulkResult ? (bulkResult.upsertedCount + bulkResult.modifiedCount) : 0
    });
  } catch (error) {
    console.error('POST data error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;