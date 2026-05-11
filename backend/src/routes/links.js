import express from 'express';
import pool from '../db.js';
import { verifyToken } from '../auth.js';
const router = express.Router();

// Get all links for a user
router.get('/user/:userId', verifyToken, async (req, res) => {
    const { userId } = req.params;
    if (req.user.id != userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    try {
        const [rows] = await pool.query(
            'SELECT * FROM links WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create new link
router.post('/', verifyToken, async (req, res) => {
    const { userId, slug, url } = req.body;
    if (req.user.id != userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    if (!slug || slug.length < 2) return res.status(400).json({ error: 'Slug must be at least 2 characters' });
    if (!url) return res.status(400).json({ error: 'URL required' });
    try {
        // Check slug uniqueness
        const [existing] = await pool.query('SELECT id FROM links WHERE slug = ?', [slug]);
        if (existing.length > 0) return res.status(409).json({ error: 'Slug already taken' });
        const [result] = await pool.query(
            'INSERT INTO links (user_id, slug, url) VALUES (?, ?, ?)',
            [userId, slug, url]
        );
        const [newLink] = await pool.query('SELECT * FROM links WHERE id = ?', [result.insertId]);
        res.status(201).json(newLink[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Track click (for redirect endpoint)
router.post('/:slug/click', async (req, res) => {
    const { slug } = req.params;
    try {
        const [result] = await pool.query(
            'UPDATE links SET clicks = clicks + 1 WHERE slug = ?',
            [slug]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Slug not found' });
        const [rows] = await pool.query('SELECT clicks FROM links WHERE slug = ?', [slug]);
        res.json({ clicks: rows[0].clicks });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get redirect URL (also increments clicks atomically)
router.get('/redirect/:slug', async (req, res) => {
    const { slug } = req.params;
    try {
        const [rows] = await pool.query('SELECT url, clicks FROM links WHERE slug = ?', [slug]);
        if (rows.length === 0) return res.status(404).json({ error: 'Slug not found' });
        await pool.query('UPDATE links SET clicks = clicks + 1 WHERE slug = ?', [slug]);
        res.json({ url: rows[0].url, clicks: rows[0].clicks + 1 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete link
router.delete('/:slug', verifyToken, async (req, res) => {
    const { slug } = req.params;
    const { userId } = req.body;
    if (req.user.id != userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied' });
    }
    try {
        const [result] = await pool.query('DELETE FROM links WHERE slug = ? AND user_id = ?', [slug, userId]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Link not found or not owned' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Check slug availability (public)
router.get('/check-slug/:slug', async (req, res) => {
    const { slug } = req.params;
    try {
        const [rows] = await pool.query('SELECT id FROM links WHERE slug = ?', [slug]);
        res.json({ available: rows.length === 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
