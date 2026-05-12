const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/catalog', async (req, res) => {
    try {
        const { category, keyword, cursor, limit } = req.query;
        
        let url = `https://catalog.roblox.com/v1/search/items?limit=${limit || 30}&sortType=2`;
        
        if (category) url += `&category=${category}`;
        if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
        if (cursor) url += `&cursor=${cursor}`;

        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            }
        });

        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy corriendo en puerto ${PORT}`);
});
