require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const crypto = require('crypto');
const path = require('path');
const db = require('./database');
const authRoutes = require('./routes/auth');
const bikeRoutes = require('./routes/bikes');
const rentalRoutes = require('./routes/rentals');
const customerRoutes = require('./routes/customers');
const adminRoutes = require('./routes/admin');
const contentRoutes = require('./routes/content');
const paymentRoutes = require('./routes/payments');
const waiverRoutes = require('./routes/waiver');
const reviewRoutes = require('./routes/reviews');

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Validate required environment variables in production
if (isProduction) {
  if (!process.env.SESSION_SECRET) {
    console.error('FATAL: SESSION_SECRET environment variable is required in production');
    process.exit(1);
  }
  if (process.env.SESSION_SECRET.length < 32) {
    console.error('FATAL: SESSION_SECRET must be at least 32 characters');
    process.exit(1);
  }
}

// Security headers with helmet
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false, // Disable CSP in dev for hot reload
  crossOriginEmbedderPolicy: false // Allow embedding for payment forms
}));

// Rate limiting - general API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// CORS configuration - be specific about allowed origins
const allowedOrigins = isProduction
  ? (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc) in dev only
    if (!origin && !isProduction) {
      return callback(null, true);
    }
    if (!origin && isProduction) {
      return callback(null, true); // Allow server-to-server in production
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Apply general rate limiting
app.use('/api', generalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Session configuration with security best practices
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
app.use(session({
  secret: sessionSecret,
  name: 'jg_session', // Custom cookie name (don't reveal session framework)
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction, // HTTPS only in production
    httpOnly: true, // Prevent XSS access to cookie
    sameSite: 'lax', // CSRF protection
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    domain: isProduction ? process.env.COOKIE_DOMAIN : undefined
  }
}));

// Trust proxy in production (for secure cookies behind reverse proxy)
if (isProduction) {
  app.set('trust proxy', 1);
}

// Apply stricter rate limiting to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/waiver', waiverRoutes);
app.use('/api/reviews', reviewRoutes);

// Serve static files in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Error handler - don't leak stack traces in production
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: isProduction ? 'Internal server error' : err.message
  });
});

// Initialize database and start server
db.initialize().then(() => {
  app.listen(PORT, () => {
    console.log(`🚲 Joe's Garage server running on port ${PORT}`);
    if (!isProduction) {
      console.log('⚠️  Running in development mode');
    }
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
