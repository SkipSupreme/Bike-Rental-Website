const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { requireAdmin } = require('./auth');

// Admin: Get all customers
router.get('/', requireAdmin, (req, res) => {
  try {
    const { search } = req.query;

    let query = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.phone,
             u.waiver_signed, u.waiver_signed_at, u.created_at,
             COUNT(r.id) as rental_count,
             SUM(CASE WHEN r.status = 'completed' THEN r.total_amount ELSE 0 END) as total_spent
      FROM users u
      LEFT JOIN rentals r ON u.id = r.user_id
      WHERE u.is_admin = 0
    `;
    const params = [];

    if (search) {
      query += ` AND (u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.phone LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' GROUP BY u.id ORDER BY u.created_at DESC';

    const customers = db.prepare(query).all(...params);
    res.json({ customers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Admin: Get single customer with details
router.get('/:id', requireAdmin, (req, res) => {
  try {
    const customer = db.prepare(`
      SELECT id, email, first_name, last_name, phone,
             waiver_signed, waiver_signature, waiver_signed_at, created_at
      FROM users WHERE id = ? AND is_admin = 0
    `).get(req.params.id);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get customer's rentals
    const rentals = db.prepare(`
      SELECT r.*, b.name as bike_name, b.type as bike_type
      FROM rentals r
      JOIN bikes b ON r.bike_id = b.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.id);

    // Get additional charges
    const charges = db.prepare(`
      SELECT ac.*, r.start_time as rental_start
      FROM additional_charges ac
      JOIN rentals r ON ac.rental_id = r.id
      WHERE ac.user_id = ?
      ORDER BY ac.created_at DESC
    `).all(req.params.id);

    // Calculate totals
    const totalSpent = rentals
      .filter(r => r.payment_status === 'paid')
      .reduce((sum, r) => sum + r.total_amount, 0);

    const outstandingBalance = rentals
      .filter(r => r.payment_status === 'pending' && r.status !== 'cancelled')
      .reduce((sum, r) => sum + r.total_amount, 0);

    res.json({
      customer,
      rentals,
      charges,
      stats: {
        totalRentals: rentals.length,
        totalSpent,
        outstandingBalance
      }
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Admin: Add charge to customer (not tied to specific rental)
router.post('/:id/charge', requireAdmin, (req, res) => {
  try {
    const { chargeType, amount, description } = req.body;
    const customerId = req.params.id;

    // Get customer's most recent rental to attach charge to
    const lastRental = db.prepare(`
      SELECT id FROM rentals WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(customerId);

    if (!lastRental) {
      return res.status(400).json({ error: 'Customer has no rentals to attach charge to' });
    }

    const { v4: uuidv4 } = require('uuid');
    const chargeId = uuidv4();

    db.prepare(`
      INSERT INTO additional_charges (id, rental_id, user_id, charge_type, amount, description, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(chargeId, lastRental.id, customerId, chargeType, amount, description, req.session.userId);

    // Update rental total
    const rental = db.prepare('SELECT * FROM rentals WHERE id = ?').get(lastRental.id);
    const newTotal = rental.base_amount + rental.additional_charges + amount - rental.discount_amount;
    db.prepare(`
      UPDATE rentals SET additional_charges = additional_charges + ?, total_amount = ?
      WHERE id = ?
    `).run(amount, newTotal, lastRental.id);

    res.json({ message: 'Charge added successfully' });
  } catch (error) {
    console.error('Error adding charge:', error);
    res.status(500).json({ error: 'Failed to add charge' });
  }
});

module.exports = router;
