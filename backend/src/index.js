import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import linkRoutes from './routes/links.js';
import adminRoutes from './routes/admin.js';
import pool from './db.js';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files (after building)
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/admin', adminRoutes);

// Redirect handler for short slugs (must be after API routes)
app.get('/:slug', async (req, res) => {
    const { slug } = req.params;
    // Skip reserved paths
    const reserved = ['api', 'login', 'dashboard', 'admin', 'signup'];
    if (reserved.includes(slug)) return next();
    try {
        const [rows] = await pool.query('SELECT url FROM links WHERE slug = ?', [slug]);
        if (rows.length === 0) {
            return res.status(404).send(`
                <html><body style="background:#0a0e27;color:white;text-align:center;padding:2rem;">
                <h1>🔗 Link not found</h1>
                <p>The short link <strong>/${slug}</strong> does not exist.</p>
                <a href="/" style="color:#8a2be2;">Go to 7starwins Shortly</a>
                </body></html>
            `);
        }
        // Increment click count
        await pool.query('UPDATE links SET clicks = clicks + 1 WHERE slug = ?', [slug]);
        res.redirect(rows[0].url);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Catch-all: serve React index.html for client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
