const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { requireAuth, requireAdmin } = require('./auth');
const { v4: uuidv4 } = require('uuid');

// Get user's rentals
router.get('/my-rentals', requireAuth, (req, res) => {
  try {
    const rentals = db.prepare(`
      SELECT r.*, b.name as bike_name, b.type as bike_type, b.image_url as bike_image
      FROM rentals r
      JOIN bikes b ON r.bike_id = b.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `).all(req.session.userId);

    res.json({ rentals });
  } catch (error) {
    console.error('Error fetching rentals:', error);
    res.status(500).json({ error: 'Failed to fetch rentals' });
  }
});

// Create new rental
router.post('/', requireAuth, (req, res) => {
  try {
    const { bikeId, startTime, endTime, rentalType } = req.body;
    const userId = req.session.userId;

    // Verify user has signed waiver
    const user = db.prepare('SELECT waiver_signed FROM users WHERE id = ?').get(userId);
    if (!user || user.waiver_signed !== 1) {
      return res.status(400).json({ error: 'Please sign the waiver before renting' });
    }

    // Get bike details
    const bike = db.prepare('SELECT * FROM bikes WHERE id = ?').get(bikeId);
    if (!bike) {
      return res.status(404).json({ error: 'Bike not found' });
    }

    // Check availability
    const bufferSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('buffer_minutes');
    const bufferMinutes = bufferSetting ? parseInt(bufferSetting.value) : 20;

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const bufferedEndTime = new Date(endDate.getTime() + bufferMinutes * 60000);

    const conflict = db.prepare(`
      SELECT id FROM rentals
      WHERE bike_id = ? AND status IN ('confirmed', 'active')
      AND (start_time < ? AND datetime(end_time, '+' || ? || ' minutes') > ?)
    `).get(bikeId, bufferedEndTime.toISOString(), bufferMinutes, startDate.toISOString());

    if (conflict) {
      return res.status(400).json({ error: 'This bike is not available for the selected time' });
    }

    // Calculate price based on rental type
    let baseAmount;
    switch (rentalType) {
      case 'hourly':
        const hours = Math.ceil((endDate - startDate) / (1000 * 60 * 60));
        baseAmount = hours * bike.hourly_rate;
        break;
      case 'half_day':
        baseAmount = bike.half_day_rate;
        break;
      case 'full_day':
        baseAmount = bike.full_day_rate;
        break;
      case 'all_day':
        // All day is full day rate + 20% premium
        baseAmount = Math.round(bike.full_day_rate * 1.2);
        break;
      default:
        return res.status(400).json({ error: 'Invalid rental type' });
    }

    const rentalId = uuidv4();

    db.prepare(`
      INSERT INTO rentals (id, user_id, bike_id, start_time, end_time, rental_type, base_amount, total_amount, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(rentalId, userId, bikeId, startTime, endTime, rentalType, baseAmount, baseAmount);

    const rental = db.prepare(`
      SELECT r.*, b.name as bike_name, b.type as bike_type
      FROM rentals r
      JOIN bikes b ON r.bike_id = b.id
      WHERE r.id = ?
    `).get(rentalId);

    res.json({ rental });
  } catch (error) {
    console.error('Error creating rental:', error);
    res.status(500).json({ error: 'Failed to create rental' });
  }
});

// Get rental by ID
router.get('/:id', requireAuth, (req, res) => {
  try {
    const rental = db.prepare(`
      SELECT r.*, b.name as bike_name, b.type as bike_type, b.image_url as bike_image,
             u.first_name, u.last_name, u.email, u.phone
      FROM rentals r
      JOIN bikes b ON r.bike_id = b.id
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `).get(req.params.id);

    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    // Check authorization (user owns rental or is admin)
    if (rental.user_id !== req.session.userId && !req.session.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get additional charges
    const charges = db.prepare('SELECT * FROM additional_charges WHERE rental_id = ?').all(req.params.id);

    res.json({ rental, charges });
  } catch (error) {
    console.error('Error fetching rental:', error);
    res.status(500).json({ error: 'Failed to fetch rental' });
  }
});

// Cancel rental
router.post('/:id/cancel', requireAuth, (req, res) => {
  try {
    const rental = db.prepare('SELECT * FROM rentals WHERE id = ?').get(req.params.id);

    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    if (rental.user_id !== req.session.userId && !req.session.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (rental.status === 'completed' || rental.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot cancel this rental' });
    }

    db.prepare(`UPDATE rentals SET status = 'cancelled' WHERE id = ?`).run(req.params.id);

    res.json({ message: 'Rental cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling rental:', error);
    res.status(500).json({ error: 'Failed to cancel rental' });
  }
});

// Admin: Get all rentals
router.get('/admin/all', requireAdmin, (req, res) => {
  try {
    const { status, date } = req.query;

    let query = `
      SELECT r.*, b.name as bike_name, b.type as bike_type,
             u.first_name, u.last_name, u.email, u.phone
      FROM rentals r
      JOIN bikes b ON r.bike_id = b.id
      JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ' AND r.status = ?';
      params.push(status);
    }

    if (date) {
      query += ' AND DATE(r.start_time) = DATE(?)';
      params.push(date);
    }

    query += ' ORDER BY r.start_time DESC';

    const rentals = db.prepare(query).all(...params);
    res.json({ rentals });
  } catch (error) {
    console.error('Error fetching rentals:', error);
    res.status(500).json({ error: 'Failed to fetch rentals' });
  }
});

// Admin: Update rental status
router.put('/:id/status', requireAdmin, (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updates = { status };
    if (status === 'completed') {
      updates.actual_return_time = new Date().toISOString();
    }

    db.prepare(`
      UPDATE rentals SET status = ?, actual_return_time = ?
      WHERE id = ?
    `).run(status, updates.actual_return_time || null, req.params.id);

    res.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Admin: Add charge to rental
router.post('/:id/charge', requireAdmin, (req, res) => {
  try {
    const { chargeType, amount, description } = req.body;
    const rentalId = req.params.id;

    const rental = db.prepare('SELECT * FROM rentals WHERE id = ?').get(rentalId);
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    const chargeId = uuidv4();
    db.prepare(`
      INSERT INTO additional_charges (id, rental_id, user_id, charge_type, amount, description, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(chargeId, rentalId, rental.user_id, chargeType, amount, description, req.session.userId);

    // Update rental total
    const newTotal = rental.base_amount + rental.additional_charges + amount - rental.discount_amount;
    db.prepare(`
      UPDATE rentals SET additional_charges = additional_charges + ?, total_amount = ?
      WHERE id = ?
    `).run(amount, newTotal, rentalId);

    res.json({ message: 'Charge added successfully' });
  } catch (error) {
    console.error('Error adding charge:', error);
    res.status(500).json({ error: 'Failed to add charge' });
  }
});

// Admin: Add discount to rental
router.post('/:id/discount', requireAdmin, (req, res) => {
  try {
    const { amount, description } = req.body;
    const rentalId = req.params.id;

    const rental = db.prepare('SELECT * FROM rentals WHERE id = ?').get(rentalId);
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    // Update rental with discount
    const newTotal = Math.max(0, rental.base_amount + rental.additional_charges - (rental.discount_amount + amount));
    const chargeNotes = rental.charge_notes
      ? `${rental.charge_notes}\nDiscount: -$${amount} - ${description}`
      : `Discount: -$${amount} - ${description}`;

    db.prepare(`
      UPDATE rentals SET discount_amount = discount_amount + ?, total_amount = ?, charge_notes = ?
      WHERE id = ?
    `).run(amount, newTotal, chargeNotes, rentalId);

    res.json({ message: 'Discount applied successfully' });
  } catch (error) {
    console.error('Error applying discount:', error);
    res.status(500).json({ error: 'Failed to apply discount' });
  }
});

module.exports = router;
