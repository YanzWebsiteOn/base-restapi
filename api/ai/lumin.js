const express = require('express');
const router = express.Router();
const axios = require('axios');
const apiMonitor = require('../../apiMonitor');

router.get('/lumin', async (req, res) => {
    const { content } = req.query;

    if (!content) {
        return res.status(400).json({ error: 'Content parameter is required ' });
    }

    try {
        const luminResponse = await fetchContent(content);

        apiMonitor.recordSuccess('/api/ai/lumin');
        res.json({
            status: true,
            luminResponse
        });
    } catch (error) {
        apiMonitor.recordFailure('/api/ai/lumin');
        console.error('Error fetching LuminAI response:', error.message);

        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat memproses permintaan ke LuminAI.';

        res.status(statusCode).json({
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

async function fetchContent(content) {
    try {
        const response = await axios.post('https://luminai.my.id/', { content });
        return response.data;
    } catch (error) {
        console.error("Error fetching content from LuminAI:", error);
        throw error;
    }
}

module.exports = router;