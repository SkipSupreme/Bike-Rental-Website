const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { requireAuth } = require('./auth');
const { v4: uuidv4 } = require('uuid');

// Get approved reviews (public)
router.get('/', (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT r.id, r.rating, r.comment, r.created_at, u.first_name
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.is_approved = 1
      ORDER BY r.created_at DESC
      LIMIT 20
    `).all();

    // Calculate average rating
    const stats = db.prepare(`
      SELECT AVG(rating) as average, COUNT(*) as count
      FROM reviews WHERE is_approved = 1
    `).get();

    res.json({
      reviews,
      stats: {
        averageRating: stats.average ? parseFloat(stats.average.toFixed(1)) : 0,
        totalReviews: stats.count
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Submit a review
router.post('/', requireAuth, (req, res) => {
  try {
    const { rating, comment, rentalId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if user has completed a rental
    const hasRental = db.prepare(`
      SELECT id FROM rentals WHERE user_id = ? AND status = 'completed'
    `).get(req.session.userId);

    if (!hasRental) {
      return res.status(400).json({ error: 'You must complete a rental before leaving a review' });
    }

    // Check if user already reviewed this rental
    if (rentalId) {
      const existingReview = db.prepare(`
        SELECT id FROM reviews WHERE user_id = ? AND rental_id = ?
      `).get(req.session.userId, rentalId);

      if (existingReview) {
        return res.status(400).json({ error: 'You have already reviewed this rental' });
      }
    }

    const reviewId = uuidv4();
    db.prepare(`
      INSERT INTO reviews (id, user_id, rental_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(reviewId, req.session.userId, rentalId || null, rating, comment);

    res.json({
      success: true,
      message: 'Thank you for your review! It will be visible after approval.'
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Check if user can leave a review
router.get('/can-review', requireAuth, (req, res) => {
  try {
    const completedRentals = db.prepare(`
      SELECT r.id, r.end_time, b.name as bike_name
      FROM rentals r
      JOIN bikes b ON r.bike_id = b.id
      LEFT JOIN reviews rv ON r.id = rv.rental_id
      WHERE r.user_id = ? AND r.status = 'completed' AND rv.id IS NULL
      ORDER BY r.end_time DESC
    `).all(req.session.userId);

    res.json({
      canReview: completedRentals.length > 0,
      unreviewedRentals: completedRentals
    });
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    res.status(500).json({ error: 'Failed to check eligibility' });
  }
});

module.exports = router;
