const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Shop = require('../models/Shop');

const router = express.Router();

// Shop Login
router.post('/login', [
  body('phone').trim().notEmpty().withMessage('Phone number required'),
  body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { phone, password } = req.body;
    const shop = await Shop.findOne({ phone });

    if (!shop) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!shop.active) {
      return res.status(401).json({ error: 'Account deactivated. Contact admin.' });
    }

    const isValid = await shop.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: shop._id, role: 'shop', phone: shop.phone },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      shop: {
        id: shop._id,
        shopName: shop.shopName,
        phone: shop.phone,
        gstNo: shop.gstNo,
        address: shop.address
      }
    });
  } catch (error) {
    console.error('Shop login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;