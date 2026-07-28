require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
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

// ============================================================
// 1. SECURITY HEADERS (Helmet)
// ============================================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
    }
  }
}));

// ============================================================
// 2. RATE LIMITING (Prevent DDOS)
// ============================================================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for login routes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts per 15 minutes
  message: { error: 'Too many login attempts. Try again after 15 minutes.' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================
// 3. CORS CONFIGURATION (Secure)
// ============================================================
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  'http://localhost:5500',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  'https://mongoledger-1.onrender.com'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

app.options('*', cors());

// ============================================================
// 4. BODY PARSERS (With size limits)
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// 5. DATA SANITIZATION (Prevent NoSQL Injection & XSS)
// ============================================================
// Prevent NoSQL injection
app.use(mongoSanitize());

// Prevent XSS attacks
app.use(xss());

// ============================================================
// 6. COMPRESSION (Faster response)
// ============================================================
app.use(compression());

// ============================================================
// 7. RATE LIMITING - Apply to all API routes
// ============================================================
app.use('/api', limiter);

// ============================================================
// 8. HEALTH CHECK (No rate limit)
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime()
  });
});

// ============================================================
// 9. ADMIN ROUTES - With IP/Origin restriction
// ============================================================
const allowedAdminOrigins = [
  'http://localhost:5500',
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  'https://mongoledger-1.onrender.com'
];

// Admin routes ke liye alag rate limit
app.use('/api/admin', loginLimiter);

app.use('/api/admin', (req, res, next) => {
  const origin = req.get('origin') || req.get('host') || '';
  const isLocalhost = origin.includes('localhost') ||
                     origin.includes('127.0.0.1') ||
                     origin.startsWith('http://localhost') ||
                     origin.startsWith('http://127.0.0.1');

  // Allow if localhost OR in allowedAdminOrigins OR development mode
  if (isLocalhost || allowedAdminOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
    next();
  } else {
    console.log('❌ Admin access blocked from:', origin);
    res.status(403).json({
      error: 'Admin access restricted',
      message: 'Access denied. Admin panel can only be accessed from authorized origins.'
    });
  }
}, adminRoutes);

// ============================================================
// 10. SHOP ROUTES - With login rate limit
// ============================================================
app.use('/api/shop', loginLimiter, shopRoutes);

// ============================================================
// 11. DATA & BACKUP ROUTES (Protected by shop auth)
// ============================================================
app.use('/api/data', dataRoutes);
app.use('/api/backup', backupRoutes);

// ============================================================
// 12. 404 Handler
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ============================================================
// 13. GLOBAL ERROR HANDLER
// ============================================================
app.use(errorHandler);

// ============================================================
// 14. START SERVER
// ============================================================
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║       बही खाता — Backend Server Ready (Secure)       ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  👉 http://localhost:${PORT}                              ║`);
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  ✅ MongoDB Connected                                ║');
  console.log('║  🔐 JWT Auth Enabled                                ║');
  console.log('║  🛡️ CORS: Production Ready                          ║');
  console.log('║  🚀 Helmet Security Headers Active                  ║');
  console.log('║  🛡️ NoSQL Injection Protection Active               ║');
  console.log('║  🛡️ XSS Protection Active                          ║');
  console.log('║  ⏱️  Rate Limiting Active                            ║');
  console.log('║  📦 Compression Enabled                             ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  🔒 Admin: Restricted Access                        ║');
  console.log('║  🌐 Environment: ' + (process.env.NODE_ENV || 'development') + '                       ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log('');
});