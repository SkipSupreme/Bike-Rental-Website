const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { requireAdmin } = require('./auth');

// Get dashboard stats
router.get('/dashboard', requireAdmin, (req, res) => {
  try {
    // Today's rentals
    const today = new Date().toISOString().split('T')[0];
    const todayRentals = db.prepare(`
      SELECT COUNT(*) as count FROM rentals
      WHERE DATE(start_time) = DATE(?) AND status != 'cancelled'
    `).get(today);

    // Active rentals right now
    const activeRentals = db.prepare(`
      SELECT COUNT(*) as count FROM rentals WHERE status = 'active'
    `).get();

    // This week's revenue
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekRevenue = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total FROM rentals
      WHERE payment_status = 'paid' AND created_at >= ?
    `).get(weekStart.toISOString());

    // Total customers
    const totalCustomers = db.prepare(`
      SELECT COUNT(*) as count FROM users WHERE is_admin = 0
    `).get();

    // Recent rentals
    const recentRentals = db.prepare(`
      SELECT r.*, b.name as bike_name, u.first_name, u.last_name
      FROM rentals r
      JOIN bikes b ON r.bike_id = b.id
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 10
    `).all();

    // Upcoming rentals (next 24 hours)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const upcomingRentals = db.prepare(`
      SELECT r.*, b.name as bike_name, u.first_name, u.last_name, u.phone
      FROM rentals r
      JOIN bikes b ON r.bike_id = b.id
      JOIN users u ON r.user_id = u.id
      WHERE r.status = 'confirmed' AND r.start_time BETWEEN ? AND ?
      ORDER BY r.start_time ASC
    `).all(new Date().toISOString(), tomorrow.toISOString());

    res.json({
      stats: {
        todayRentals: todayRentals.count,
        activeRentals: activeRentals.count,
        weekRevenue: weekRevenue.total,
        totalCustomers: totalCustomers.count
      },
      recentRentals,
      upcomingRentals
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get settings
router.get('/settings', requireAdmin, (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings').all();
    const settingsObj = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.json({ settings: settingsObj });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update settings
router.put('/settings', requireAdmin, (req, res) => {
  try {
    const { settings } = req.body;

    const updateSetting = db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);

    Object.entries(settings).forEach(([key, value]) => {
      updateSetting.run(key, String(value));
    });

    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get pending reviews
router.get('/reviews/pending', requireAdmin, (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT r.*, u.first_name, u.last_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.is_approved = 0
      ORDER BY r.created_at DESC
    `).all();
    res.json({ reviews });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Approve/reject review
router.put('/reviews/:id', requireAdmin, (req, res) => {
  try {
    const { approved } = req.body;

    if (approved) {
      db.prepare('UPDATE reviews SET is_approved = 1 WHERE id = ?').run(req.params.id);
    } else {
      db.prepare('DELETE FROM reviews WHERE id = ?').run(req.params.id);
    }

    res.json({ message: approved ? 'Review approved' : 'Review removed' });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

module.exports = router;
