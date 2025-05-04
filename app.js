require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const { Webhook } = require('discord-webhook-node');
const apiMonitor = require('./apiMonitor');

const app = express();
const PORT = process.env.PORT || 3000;

const hook = new Webhook(process.env.DISCORD_WEBHOOK_URL);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    if (req.path.includes('.') ||
        req.path === '/' ||
        req.path.startsWith('/documentation') ||
        req.path.startsWith('/monitor') ||
        req.path.startsWith('/report')) {
        return next();
    }
    next();
});

app.use((req, res, next) => {
    if (req.path.startsWith('/documentation') ||
        req.path.startsWith('/monitor') ||
        req.path.startsWith('/report')) {
        return next();
    }

    const apiKey = req.query.apiKey || req.headers['x-api-key'];

    if (!apiKey) {
        req.apiKey = 'free';
        req.rateLimit = { limit: 100, windowMs: 3600000 };
        return next();
    }

    if (apiKey === process.env.ADMIN_API_KEY) {
        req.apiKey = 'admin';
        req.rateLimit = { limit: 10000, windowMs: 3600000 };
    } else if (apiKey.startsWith('premium_')) {
        req.apiKey = 'premium';
        req.rateLimit = { limit: 1000, windowMs: 3600000 };
    } else {
        return res.status(403).json({ error: 'Invalid API key' });
    }

    next();
});

app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        const { apiKey } = req;
        apiMonitor.trackRequest(req.path, apiKey);

        if (apiMonitor.isRateLimited(apiKey)) {
            return res.status(429).json({
                error: 'Too many requests',
                message: `Rate limit exceeded for ${apiKey} tier`
            });
        }
    }
    next();
});

const fs = require('fs');
const apiPath = path.join(__dirname, 'api');
fs.readdirSync(apiPath).forEach(category => {
    const categoryPath = path.join(apiPath, category);
    if (fs.statSync(categoryPath).isDirectory()) {
        fs.readdirSync(categoryPath).forEach(file => {
            const routePath = path.join(categoryPath, file);
            const route = require(routePath);
            app.use(`/api/${category}`, route);
        });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/documentation', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'documentation.html'));
});

app.get('/monitor', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'monitor.html'));
});

app.get('/api', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'api.json'))
})

app.get('/monitor/data', (req, res) => {
    try {
        const stats = apiMonitor.getStats();
        const filteredStats = {
            ...stats,
            topEndpoints: stats.topEndpoints.filter(e => e.path.startsWith('/api/')),
            recentActivity: stats.recentActivity.filter(e => e.path.startsWith('/api/'))
        };

        res.json(filteredStats);
    } catch (error) {
        console.error('Error generating monitor data:', error);
        res.status(500).json({ error: 'Failed to generate monitor data' });
    }
});

app.get('/report', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'report.html'));
});

app.post('/report', async (req, res) => {
    const { issue, description, contact } = req.body;

    try {
        await hook.send(`**New API Issue Reported**\n\n**Issue:** ${issue}\n**Description:** ${description}\n**Contact:** ${contact || 'Not provided'}`);
        res.json({ success: true, message: 'Report submitted successfully' });
    } catch (error) {
        console.error('Error sending report to Discord:', error);
        res.status(500).json({ success: false, message: 'Failed to submit report' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});