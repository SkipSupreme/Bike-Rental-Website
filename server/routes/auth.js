const express = require('express');
const router = express.Router();
const argon2 = require('argon2');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../database');

// Argon2id configuration (OWASP recommended)
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536,  // 64 MB
  timeCost: 3,        // 3 iterations
  parallelism: 4      // 4 threads
};

// Password requirements
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

function validatePassword(password) {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }
  if (!PASSWORD_REGEX.test(password)) {
    return { valid: false, error: 'Password must contain uppercase, lowercase, and a number' };
  }
  return { valid: true };
}

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate password strength
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.error });
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const hashedPassword = await argon2.hash(password, ARGON2_OPTIONS);
    const userId = uuidv4();

    db.prepare(`
      INSERT INTO users (id, email, password, first_name, last_name, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, email.toLowerCase(), hashedPassword, firstName, lastName, phone);

    const user = db.prepare('SELECT id, email, first_name, last_name, phone, is_admin, waiver_signed FROM users WHERE id = ?').get(userId);

    // Regenerate session to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
      }
      req.session.userId = user.id;
      req.session.isAdmin = user.is_admin === 1;

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          isAdmin: user.is_admin === 1,
          waiverSigned: user.waiver_signed === 1
        }
      });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());

    // Use constant-time comparison via argon2.verify
    let passwordValid = false;
    if (user) {
      try {
        passwordValid = await argon2.verify(user.password, password);
      } catch {
        // Hash format error (e.g., old bcrypt hash) - deny login
        passwordValid = false;
      }
    }

    if (!user || !passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Regenerate session to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.status(500).json({ error: 'Login failed' });
      }

      req.session.userId = user.id;
      req.session.isAdmin = user.is_admin === 1;

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          isAdmin: user.is_admin === 1,
          waiverSigned: user.waiver_signed === 1
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user
router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.json({ user: null });
  }

  const user = db.prepare('SELECT id, email, first_name, last_name, phone, is_admin, waiver_signed, stripe_customer_id FROM users WHERE id = ?').get(req.session.userId);

  if (!user) {
    return res.json({ user: null });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      isAdmin: user.is_admin === 1,
      waiverSigned: user.waiver_signed === 1,
      hasPaymentMethod: !!user.stripe_customer_id
    }
  });
});

// Update user profile
router.put('/profile', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { firstName, lastName, phone } = req.body;

  db.prepare(`
    UPDATE users SET first_name = ?, last_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(firstName, lastName, phone, req.session.userId);

  res.json({ message: 'Profile updated successfully' });
});

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
  if (!req.session.userId || !req.session.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = router;
module.exports.requireAuth = requireAuth;
module.exports.requireAdmin = requireAdmin;
