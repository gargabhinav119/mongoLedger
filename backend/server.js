require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Routes
const adminRoutes = require('./routes/admin.routes');
const shopRoutes = require('./routes/shop.routes');
const dataRoutes = require('./routes/data.routes');
const backupRoutes = require('./routes/backup.routes');

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Apply rate limiting to all routes
app.use('/api', limiter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Admin routes - ONLY LOCALHOST
app.use('/api/admin', (req, res, next) => {
  const origin = req.get('origin') || req.get('host') || '';
  const isLocalhost = origin.includes('localhost') || 
                     origin.includes('127.0.0.1') ||
                     origin.startsWith('http://localhost') ||
                     origin.startsWith('http://127.0.0.1');
  
  if (isLocalhost || process.env.NODE_ENV === 'development') {
    next();
  } else {
    res.status(403).json({ error: 'Admin access restricted to localhost only' });
  }
}, adminRoutes);

// Shop routes
app.use('/api/shop', shopRoutes);

// Data routes (protected by shop auth)
app.use('/api/data', dataRoutes);

// Backup routes (protected by shop auth)
app.use('/api/backup', backupRoutes);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║       बही खाता — Backend Server Ready        ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  👉 http://localhost:${PORT}                    ║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log('║  📦 MongoDB Connected                        ║');
  console.log('║  🔐 JWT Auth Enabled                         ║');
  console.log('║  🛡️ Admin: Localhost only                    ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
});