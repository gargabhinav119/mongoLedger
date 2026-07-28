const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Shop = require('../models/Shop');

const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ error: 'Admin not found' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

const verifyShop = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const shop = await Shop.findById(decoded.id);
    if (!shop) {
      return res.status(401).json({ error: 'Shop not found' });
    }
    if (!shop.active) {
      return res.status(401).json({ error: 'Shop account is deactivated' });
    }

    req.shop = shop;
    req.shopId = shop._id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { verifyAdmin, verifyShop };