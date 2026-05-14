const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Proxy activo 🚀'));

app.get('/ping', (req, res) => res.json({ status: 'ok' }));

app.get('/catalog', async (req, res) => {
    try {
        const { category, subcategory, keyword, cursor } = req.query;

        let url = `https://catalog.roblox.com/v1/search/items?limit=30&sortType=2`;
        if (category) url += `&category=${category}`;
        if (subcategory) url += `&subcategory=${subcategory}`;
        if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
        if (cursor) url += `&cursor=${cursor}`;

        const searchRes = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
        });
        const searchData = await searchRes.json();

        if (!searchData.data || searchData.data.length === 0) {
            return res.json({ items: [], nextPageCursor: null });
        }

        // Segunda llamada para obtener nombre y precio
        const detailsRes = await fetch('https://catalog.roblox.com/v1/catalog/items/details', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            body: JSON.stringify({
                items: searchData.data.map(i => ({ itemType: i.itemType, id: i.id }))
            })
        });
        const detailsData = await detailsRes.json();

        const items = (detailsData.data || []).map(item => ({
            AssetId: item.id,
            Name: item.name || 'Item',
            Price: item.price || item.lowestPrice || 0,
            Image: `rbxthumb://type=Asset&id=${item.id}&w=150&h=150`
        }));

        res.json({
            items: items,
            nextPageCursor: searchData.nextPageCursor || null
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ items: [], nextPageCursor: null });
    }
});

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
