const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { requireAdmin } = require('./auth');

// Get all bikes (grouped by type for display)
router.get('/', (req, res) => {
  try {
    const bikes = db.prepare(`
      SELECT * FROM bikes WHERE is_available = 1 ORDER BY type, name
    `).all();

    // Group bikes by type
    const grouped = bikes.reduce((acc, bike) => {
      if (!acc[bike.type]) {
        acc[bike.type] = [];
      }
      acc[bike.type].push(bike);
      return acc;
    }, {});

    res.json({ bikes, grouped });
  } catch (error) {
    console.error('Error fetching bikes:', error);
    res.status(500).json({ error: 'Failed to fetch bikes' });
  }
});

// Get available bikes for a time range
router.get('/available', (req, res) => {
  try {
    const { start, end, type } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end times are required' });
    }

    // Get buffer minutes from settings
    const bufferSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('buffer_minutes');
    const bufferMinutes = bufferSetting ? parseInt(bufferSetting.value) : 20;

    // Adjust the query times to account for buffer
    const startTime = new Date(start);
    const endTime = new Date(end);

    // Add buffer to end time for checking conflicts
    const bufferedEndTime = new Date(endTime.getTime() + bufferMinutes * 60000);

    // Get bikes that are NOT rented during the requested time
    let query = `
      SELECT b.* FROM bikes b
      WHERE b.is_available = 1
      AND b.id NOT IN (
        SELECT r.bike_id FROM rentals r
        WHERE r.status IN ('confirmed', 'active')
        AND (
          (r.start_time < ? AND datetime(r.end_time, '+' || ? || ' minutes') > ?)
        )
      )
    `;

    const params = [bufferedEndTime.toISOString(), bufferMinutes, startTime.toISOString()];

    if (type && type !== 'all') {
      query += ' AND b.type = ?';
      params.push(type);
    }

    query += ' ORDER BY b.type, b.name';

    const availableBikes = db.prepare(query).all(...params);

    res.json({ bikes: availableBikes });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
});

// Get single bike
router.get('/:id', (req, res) => {
  try {
    const bike = db.prepare('SELECT * FROM bikes WHERE id = ?').get(req.params.id);
    if (!bike) {
      return res.status(404).json({ error: 'Bike not found' });
    }
    res.json({ bike });
  } catch (error) {
    console.error('Error fetching bike:', error);
    res.status(500).json({ error: 'Failed to fetch bike' });
  }
});

// Admin: Get all bikes including unavailable
router.get('/admin/all', requireAdmin, (req, res) => {
  try {
    const bikes = db.prepare('SELECT * FROM bikes ORDER BY type, name').all();
    res.json({ bikes });
  } catch (error) {
    console.error('Error fetching bikes:', error);
    res.status(500).json({ error: 'Failed to fetch bikes' });
  }
});

// Admin: Add new bike
router.post('/', requireAdmin, (req, res) => {
  try {
    const { name, type, description, hourlyRate, halfDayRate, fullDayRate, imageUrl } = req.body;
    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();

    db.prepare(`
      INSERT INTO bikes (id, name, type, description, hourly_rate, half_day_rate, full_day_rate, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, type, description, hourlyRate, halfDayRate, fullDayRate, imageUrl);

    const bike = db.prepare('SELECT * FROM bikes WHERE id = ?').get(id);
    res.json({ bike });
  } catch (error) {
    console.error('Error adding bike:', error);
    res.status(500).json({ error: 'Failed to add bike' });
  }
});

// Admin: Update bike
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const { name, type, description, hourlyRate, halfDayRate, fullDayRate, imageUrl, isAvailable } = req.body;

    db.prepare(`
      UPDATE bikes SET
        name = ?, type = ?, description = ?,
        hourly_rate = ?, half_day_rate = ?, full_day_rate = ?,
        image_url = ?, is_available = ?
      WHERE id = ?
    `).run(name, type, description, hourlyRate, halfDayRate, fullDayRate, imageUrl, isAvailable ? 1 : 0, req.params.id);

    const bike = db.prepare('SELECT * FROM bikes WHERE id = ?').get(req.params.id);
    res.json({ bike });
  } catch (error) {
    console.error('Error updating bike:', error);
    res.status(500).json({ error: 'Failed to update bike' });
  }
});

// Admin: Delete bike
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    // Check if bike has active rentals
    const activeRentals = db.prepare(`
      SELECT COUNT(*) as count FROM rentals
      WHERE bike_id = ? AND status IN ('confirmed', 'active')
    `).get(req.params.id);

    if (activeRentals.count > 0) {
      return res.status(400).json({ error: 'Cannot delete bike with active rentals' });
    }

    db.prepare('DELETE FROM bikes WHERE id = ?').run(req.params.id);
    res.json({ message: 'Bike deleted successfully' });
  } catch (error) {
    console.error('Error deleting bike:', error);
    res.status(500).json({ error: 'Failed to delete bike' });
  }
});

module.exports = router;
