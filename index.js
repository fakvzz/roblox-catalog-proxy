const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Ruta de salud para evitar que Render se duerma
app.get('/', (req, res) => {
    res.send('Proxy de Catálogo Activo 🚀 - Funcionando 24/7');
});

// 2. Endpoint principal del Catálogo
app.get('/catalog', async (req, res) => {
    try {
        const { category, subcategory, keyword, cursor, limit, makeupType } = req.query;

        // Construcción de la URL base de Roblox
        // Usamos sortType 2 (Más favoritos) por defecto para que se vea bien
        let url = `https://catalog.roblox.com/v1/search/items?limit=${limit || 30}&sortType=2`;

        // Aplicamos categorías y subcategorías reales
        if (category) url += `&category=${category}`;
        if (subcategory) url += `&subcategory=${subcategory}`;
        
        // Manejo de búsqueda por palabra clave
        let finalKeyword = keyword || "";
        
        // Lógica especial para Maquillaje (image_8211b3.png)
        // Si el usuario elige una subcategoría de maquillaje, le inyectamos el filtro
        if (makeupType && makeupType !== "Todos") {
            finalKeyword = `${makeupType} ${finalKeyword}`.trim();
        }
        
        if (finalKeyword) {
            url += `&keyword=${encodeURIComponent(finalKeyword)}`;
        }

        if (cursor) {
            url += `&cursor=${cursor}`;
        }

        // Petición a la API de Roblox
        const response = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const data = await response.json();

        // Si hay error en la API de Roblox
        if (!data.data) {
            return res.json({ items: [], nextCursor: null, error: "No se encontraron resultados" });
        }

        // Limpieza y mapeo de datos para que Roblox los lea fácil
        const items = data.data.map(item => ({
            AssetId: item.id,
            Name: item.name,
            Price: item.price || 0,
            // Enviamos el thumbnail ya pre-armado
            Image: `rbxthumb://type=Asset&id=${item.id}&w=150&h=150`
        }));

        // Respuesta final al Script de Servidor en Roblox
        res.json({
            items: items,
            nextCursor: data.nextPageCursor || null
        });

    } catch (err) {
        console.error("Error en Proxy:", err);
        res.status(500).json({ error: "Error interno del servidor proxy" });
    }
});

// 3. Sistema Auto-Ping (Para que no se duerma la instancia gratis de Render)
// Se hace un ping a sí mismo cada 10 minutos
setInterval(() => {
    fetch(`http://localhost:${PORT}/`)
        .then(() => console.log("Auto-ping exitoso para mantener despierto el proxy."))
        .catch(err => console.log("Error en auto-ping:", err.message));
}, 600000); 

app.listen(PORT, () => {
    console.log(`Proxy corriendo en puerto ${PORT}`);
});
