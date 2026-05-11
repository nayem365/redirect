import express from 'express';
import pool from '../db.js';
import { hashPassword, comparePassword, generateToken } from '../auth.js';
const router = express.Router();

router.post('/register', async (req, res) => {
    const { email, password, role = 'user' } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    try {
        const hashed = await hashPassword(password);
        await pool.query('INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)', [email, hashed, role]);
        const [rows] = await pool.query('SELECT id, email, role FROM users WHERE email = ?', [email]);
        const token = generateToken(rows[0]);
        res.json({ token, user: rows[0] });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already exists' });
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
        const user = rows[0];
        const valid = await comparePassword(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
        const token = generateToken({ id: user.id, email: user.email, role: user.role });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
