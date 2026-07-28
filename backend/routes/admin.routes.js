const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const Shop = require('../models/Shop');
const { verifyAdmin } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production-123456789";

// ─── ADMIN LOGIN ──────────────────────────────────────
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username required'),
  body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await admin.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      admin: { id: admin._id, username: admin.username }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── CREATE SHOP ──────────────────────────────────────
router.post('/shops', verifyAdmin, [
  body('shopName').trim().notEmpty().withMessage('Shop name required'),
  body('phone').trim().notEmpty().withMessage('Phone number required'),
  body('password').isLength({ min: 4 }).withMessage('Password must be at least 4 characters'),
  body('gstNo').optional().trim(),
  body('address').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { shopName, phone, password, gstNo, address } = req.body;

    const existing = await Shop.findOne({ phone });
    if (existing) {
      return res.status(400).json({ error: 'Shop with this phone already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const shop = new Shop({
      shopName,
      phone,
      passwordHash,
      gstNo: gstNo || '',
      address: address || '',
      createdBy: req.admin._id
    });

    await shop.save();

    res.status(201).json({
      success: true,
      shop: {
        id: shop._id,
        shopName: shop.shopName,
        phone: shop.phone,
        gstNo: shop.gstNo,
        address: shop.address,
        active: shop.active,
        createdAt: shop.createdAt
      }
    });
  } catch (error) {
    console.error('Create shop error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET ALL SHOPS ────────────────────────────────────
router.get('/shops', verifyAdmin, async (req, res) => {
  try {
    const shops = await Shop.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    res.json({ shops });
  } catch (error) {
    console.error('Get shops error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── DEACTIVATE SHOP ──────────────────────────────────
// ✅ YAHI HAI DEACTIVATE API
router.delete('/shops/:id', verifyAdmin, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Soft delete - sirf active false karo
    shop.active = false;
    await shop.save();

    res.json({
      success: true,
      message: 'Shop deactivated successfully'
    });
  } catch (error) {
    console.error('Deactivate shop error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── REACTIVATE SHOP ──────────────────────────────────
// ✅ YEH BHI ADD KARO (Reactivate ke liye)
router.put('/shops/:id/reactivate', verifyAdmin, async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    shop.active = true;
    await shop.save();

    res.json({
      success: true,
      message: 'Shop reactivated successfully'
    });
  } catch (error) {
    console.error('Reactivate shop error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;