const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../database');
const { requireAdmin } = require('./auth');
const { v4: uuidv4 } = require('uuid');

// Configure multer for image uploads
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Get all content (public)
router.get('/', (req, res) => {
  try {
    const content = db.prepare('SELECT * FROM content').all();
    const contentObj = content.reduce((acc, c) => {
      acc[c.section] = {
        id: c.id,
        title: c.title,
        body: c.body,
        imageUrl: c.image_url,
        updatedAt: c.updated_at
      };
      return acc;
    }, {});
    res.json({ content: contentObj });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Get single section
router.get('/:section', (req, res) => {
  try {
    const content = db.prepare('SELECT * FROM content WHERE section = ?').get(req.params.section);
    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }
    res.json({
      content: {
        id: content.id,
        section: content.section,
        title: content.title,
        body: content.body,
        imageUrl: content.image_url,
        updatedAt: content.updated_at
      }
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

// Admin: Update content
router.put('/:section', requireAdmin, (req, res) => {
  try {
    const { title, body, imageUrl } = req.body;
    const section = req.params.section;

    // Check if content exists
    const existing = db.prepare('SELECT id FROM content WHERE section = ?').get(section);

    if (existing) {
      db.prepare(`
        UPDATE content SET title = ?, body = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
        WHERE section = ?
      `).run(title, body, imageUrl, req.session.userId, section);
    } else {
      db.prepare(`
        INSERT INTO content (id, section, title, body, image_url, updated_by)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), section, title, body, imageUrl, req.session.userId);
    }

    const content = db.prepare('SELECT * FROM content WHERE section = ?').get(section);
    res.json({
      content: {
        id: content.id,
        section: content.section,
        title: content.title,
        body: content.body,
        imageUrl: content.image_url,
        updatedAt: content.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

// Admin: Upload image
router.post('/upload', requireAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Admin: Delete image
router.delete('/upload/:filename', requireAdmin, (req, res) => {
  try {
    const filePath = path.join(uploadsDir, req.params.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ message: 'Image deleted' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

module.exports = router;
