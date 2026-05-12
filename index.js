const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/catalog', async (req, res) => {
    try {
        const { category, subcategory, keyword, cursor, limit } = req.query;

        // 1. Construir URL de búsqueda
        let url = `https://catalog.roblox.com/v1/search/items?limit=${limit || 30}&sortType=2`;
        if (category) url += `&category=${category}`;
        if (subcategory) url += `&subcategory=${subcategory}`;
        if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`;
        if (cursor) url += `&cursor=${cursor}`;

        const searchRes = await fetch(url, {
            headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
        });
        const searchData = await searchRes.json();

        // Error handling si la API de Roblox falla
        if (!searchData.data || searchData.data.length === 0) {
            return res.json({ items: [], nextPageCursor: null });
        }

        // 2. Obtener detalles de los items encontrados
        const detailsRes = await fetch(`https://catalog.roblox.com/v1/catalog/items/details`, {
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

        // 3. Formatear para que Roblox lo lea fácil
        const items = (detailsData.data || []).map(item => ({
            AssetId: item.id,
            Name: item.name,
            Price: item.price || 0,
            // Agregamos el thumbnail directo para que el LocalScript no trabaje de más
            Image: `rbxthumb://type=Asset&id=${item.id}&w=150&h=150`
        }));

        res.json({
            items: items,
            nextPageCursor: searchData.nextPageCursor || null
        });

    } catch (err) {
        console.error("Error en el proxy:", err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Proxy corriendo en http://localhost:${PORT}`);
});
