const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('Proxy de Facuu Activo - Sistema de Precios Fixeado 🚀'));

app.get('/catalog', async (req, res) => {
    try {
        const { cursor } = req.query;
        // Buscamos en categoría 0 (Todos) para traer de todo un poco
        let url = `https://catalog.roblox.com/v1/search/items?limit=30&sortType=2&category=0`;

        if (cursor) url += `&cursor=${cursor}`;

        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const data = await response.json();

        if (!data.data) return res.json({ items: [], nextCursor: null });

        const items = data.data.map(item => {
            // FIX DE PRECIOS: Roblox a veces manda 'price' y otras 'lowestPrice'
            let displayPrice = 0;
            if (item.price !== undefined && item.price !== null) {
                displayPrice = item.price;
            } else if (item.lowestPrice !== undefined && item.lowestPrice !== null) {
                displayPrice = item.lowestPrice;
            }

            return {
                AssetId: item.id,
                Name: item.name,
                Price: displayPrice,
                Image: `rbxthumb://type=Asset&id=${item.id}&w=150&h=150`
            };
        });

        res.json({ items, nextCursor: data.nextPageCursor || null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ items: [], nextCursor: null });
    }
});

app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
