import express from 'express';
import pool from '../db.js';
import { verifyToken, requireAdmin } from '../auth.js';
const router = express.Router();

router.get('/stats', verifyToken, requireAdmin, async (req, res) => {
    try {
        const [totalUsers] = await pool.query('SELECT COUNT(*) as count FROM users');
        const [totalLinks] = await pool.query('SELECT COUNT(*) as count FROM links');
        const [totalClicks] = await pool.query('SELECT SUM(clicks) as total FROM links');
        res.json({
            totalUsers: totalUsers[0].count,
            totalLinks: totalLinks[0].count,
            totalClicks: totalClicks[0].total || 0
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/users', verifyToken, requireAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT u.id, u.email, u.role, u.created_at,
                   COUNT(l.id) as links_count,
                   COALESCE(SUM(l.clicks), 0) as total_clicks
            FROM users u
            LEFT JOIN links l ON u.id = l.user_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
