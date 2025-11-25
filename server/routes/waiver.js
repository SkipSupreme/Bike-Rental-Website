const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { requireAuth, requireAdmin } = require('./auth');

// Get waiver content
router.get('/', (req, res) => {
  try {
    const waiver = db.prepare('SELECT * FROM content WHERE section = ?').get('waiver');
    res.json({
      waiver: waiver ? {
        title: waiver.title,
        body: waiver.body
      } : null
    });
  } catch (error) {
    console.error('Error fetching waiver:', error);
    res.status(500).json({ error: 'Failed to fetch waiver' });
  }
});

// Check if user has signed waiver
router.get('/status', requireAuth, (req, res) => {
  try {
    const user = db.prepare('SELECT waiver_signed, waiver_signed_at FROM users WHERE id = ?')
      .get(req.session.userId);

    res.json({
      signed: user.waiver_signed === 1,
      signedAt: user.waiver_signed_at
    });
  } catch (error) {
    console.error('Error checking waiver status:', error);
    res.status(500).json({ error: 'Failed to check waiver status' });
  }
});

// Sign waiver
router.post('/sign', requireAuth, (req, res) => {
  try {
    const { signature, agreedToTerms } = req.body;

    if (!signature || !agreedToTerms) {
      return res.status(400).json({ error: 'Signature and agreement required' });
    }

    // Validate signature is a data URL (base64 image from canvas)
    if (!signature.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid signature format' });
    }

    const signedAt = new Date().toISOString();

    db.prepare(`
      UPDATE users SET
        waiver_signed = 1,
        waiver_signature = ?,
        waiver_signed_at = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(signature, signedAt, req.session.userId);

    res.json({
      success: true,
      message: 'Waiver signed successfully',
      signedAt
    });
  } catch (error) {
    console.error('Error signing waiver:', error);
    res.status(500).json({ error: 'Failed to sign waiver' });
  }
});

// Admin: Get customer's waiver signature
router.get('/signature/:userId', requireAdmin, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT waiver_signature, waiver_signed_at, first_name, last_name, email
      FROM users WHERE id = ?
    `).get(req.params.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      signature: user.waiver_signature,
      signedAt: user.waiver_signed_at,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email
    });
  } catch (error) {
    console.error('Error fetching signature:', error);
    res.status(500).json({ error: 'Failed to fetch signature' });
  }
});

module.exports = router;
