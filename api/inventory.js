export default async function handler(req, res) {
  // Configuración de CORS y caché Edge de Vercel (20 segundos)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=40');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = process.env.LOYVERSE_TOKEN || 'c26d1ad904604b0fba6b1b3d148b60ed';
  const storeId = "6ad54167-dd5c-482b-806c-0b917f8b4545";

  try {
    // 1. Obtener lista de artículos con disponibilidad ("available_for_sale")
    const itemsRes = await fetch('https://api.loyverse.com/v1.0/items?limit=250', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const itemsData = await itemsRes.json();

    // 2. Obtener niveles de inventario de la tienda
    const invRes = await fetch(`https://api.loyverse.com/v1.0/inventory?store_ids=${storeId}&limit=250`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const invData = await invRes.json();

    const invMap = {};
    if (invData && Array.isArray(invData.inventory_levels)) {
      invData.inventory_levels.forEach(lvl => {
        invMap[lvl.variant_id] = lvl.in_stock;
      });
    }

    const stockStatus = {};

    if (itemsData && Array.isArray(itemsData.items)) {
      itemsData.items.forEach(item => {
        const trackStock = item.track_stock === true;
        (item.variants || []).forEach(v => {
          const storeInfo = (v.stores || []).find(s => s.store_id === storeId) || (v.stores || [])[0];
          const availableForSale = storeInfo ? storeInfo.available_for_sale !== false : true;
          const inStock = invMap[v.variant_id] !== undefined ? invMap[v.variant_id] : null;

          // Criterios de Agotado en Loyverse:
          // 1. Si "Disponible para la venta" fue desactivado en Loyverse (available_for_sale === false)
          // 2. Si el producto tiene seguimiento de stock y su cantidad llegó a 0 (o menor si fue ajustado recientemente)
          let isOutOfStock = false;
          if (!availableForSale) {
            isOutOfStock = true;
          } else if (trackStock && inStock !== null && inStock <= 0) {
            isOutOfStock = true;
          }

          stockStatus[v.variant_id] = {
            inStock: inStock,
            trackStock: trackStock,
            availableForSale: availableForSale,
            isOutOfStock: isOutOfStock
          };
        });
      });
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stock: stockStatus
    });
  } catch (error) {
    console.error('Error al sincronizar inventario de Loyverse:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
