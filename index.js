const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Proxy de Facu Activo 🚀'));

app.get('/catalog', async (req, res) => {
    try {
        const { category, subcategory, keyword, cursor, makeupType } = req.query;
        let url = `https://catalog.roblox.com/v1/search/items?limit=30&sortType=2`;

        if (category) url += `&category=${category}`;
        if (subcategory) url += `&subcategory=${subcategory}`;
        
        let finalKeyword = keyword || "";
        if (makeupType && makeupType !== "Todos") finalKeyword = `${makeupType} ${finalKeyword}`.trim();
        if (finalKeyword) url += `&keyword=${encodeURIComponent(finalKeyword)}`;
        if (cursor) url += `&cursor=${cursor}`;

        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const data = await response.json();

        if (!data.data) return res.json({ items: [], nextCursor: null });

        const items = data.data.map(item => ({
            AssetId: item.id,
            Name: item.name,
            Price: item.price || 0,
            Image: `rbxthumb://type=Asset&id=${item.id}&w=150&h=150`
        }));

        res.json({ items, nextCursor: data.nextPageCursor || null });
    } catch (err) {
        res.status(500).json({ items: [], nextCursor: null });
    }
});

app.listen(PORT, () => console.log(`Proxy corriendo en puerto ${PORT}`));
