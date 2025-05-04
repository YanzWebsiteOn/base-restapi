const express = require('express');
const router = express.Router();
const axios = require('axios');
const apiMonitor = require('../../apiMonitor');

router.get('/brat', async (req, res) => {
    const { text } = req.query;

    if (!text) {
        return res.status(400).json({ error: 'Text parameter is required' });
    }

    try {
        const imageData = await getBratImage(text);

        apiMonitor.recordSuccess('/api/maker/brat');
        res.set('Content-Type', 'image/png');
        res.send(imageData);
    } catch (error) {
        apiMonitor.recordFailure('/api/maker/brat');
        console.error('Error fetching Brat image:', error.message);
        res.status(500).json({ error: 'Terjadi kesalahan saat memproses permintaan gambar Brat.' });
    }
});

async function getBratImage(text) {
    try {
        const url = `https://brat.caliphdev.com/api/brat?text=${encodeURIComponent(text)}`;
        const response = await axios.get(url, {
            responseType: 'arraybuffer'
        });

        return response.data;
    } catch (error) {
        console.error('Error:', error.message);
        throw new Error('Terjadi kesalahan saat memproses permintaan.');
    }
}

module.exports = router;