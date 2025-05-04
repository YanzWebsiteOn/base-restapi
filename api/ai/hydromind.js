const express = require('express');
const router = express.Router();
const axios = require('axios');
const FormData = require('form-data');
const apiMonitor = require('../../apiMonitor');

router.get('/hydromind', async (req, res) => {
    const { text, model } = req.query;

    if (!text || !model) {
        return res.status(400).json({ error: 'text and Model parameter is required. See the list of supported AI models here: https://mind.hydrooo.web.id' });
    }

    try {
        const response = await hydromind(text, model);

        apiMonitor.recordSuccess('/api/ai/hydromind');
        res.json(response);
    } catch (error) {
        apiMonitor.recordFailure('/api/ai/hydromind');
        console.error('Error fetching hydromind response:', error.message);

        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat memproses permintaan ke hydromind AI.';

        res.status(statusCode).json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

async function hydromind(content, model) {
    const form = new FormData();
    form.append('content', content);
    form.append('model', model);
    const { data } = await axios.post('https://mind.hydrooo.web.id/v1/chat/', form, {
        headers: {
            ...form.getHeaders(),
        }
    })
    return data;
}

module.exports = router;