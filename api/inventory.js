// Mapeo de grupos maestros de stock
// Si el artículo maestro de un grupo se agota en Loyverse (stock <= 0 o available_for_sale === false),
// automáticamente todos los platos asociados a ese insumo se marcan como AGOTADOS.
const MASTER_STOCK_GROUPS = [
  {
    name: 'Hamburguesas',
    masterVariantId: '6d767227-33a4-4738-9bad-426be19362fe', // Hamburguesa clásica (carne)
    variants: [
      '6d767227-33a4-4738-9bad-426be19362fe', // Clásica
      '8bf81c7e-7d00-48d3-b9e9-cda9f9d72c39', // Especial
      '6443424f-c859-44b2-81df-14b2259a1f5e', // Royal
      '4e4fef97-e474-4399-bd9c-a3018cc5f08e', // Super
      'ea59f87e-7011-4a3e-a7a9-44382e4a0e4c', // Club Royal
      'b34af2ce-02d8-426a-ab23-44a9c4b1f845'  // Adicional hamburguesa
    ]
  },
  {
    name: 'Pollo Deshilachado',
    masterVariantId: 'c577b91a-a10f-4e1e-9911-a1f73b9f6c97', // Pollo clásico
    variants: [
      'c577b91a-a10f-4e1e-9911-a1f73b9f6c97', // Clásico
      'e4d1fbbf-1503-4317-94cb-acc75b1c913a', // Especial
      '060095b1-6642-4cb1-ae5a-2d2cd7c96334', // Royal
      '6906ccd6-cc74-4042-8601-e646c1129131', // Super
      'f1f36672-bc7c-41de-9961-ddd068380e4d'  // Club Royal
    ]
  },
  {
    name: 'Filetes',
    masterVariantId: '08d0e755-36f3-4253-b262-56430ea37cad', // Filete clásico
    variants: [
      '08d0e755-36f3-4253-b262-56430ea37cad', // Clásico
      '8e2a954c-1719-4be3-99b2-f220b80f40a8', // Especial
      '2bfa628d-bdfb-468b-aafa-ac351846b7de', // Royal
      'f9fad568-98bf-4dd9-a57d-b5d3f5f86ed4', // Super
      '0e2ef7ed-82a0-43ad-a8d7-4e0d99ee9eea'  // Club Royal
    ]
  },
  {
    name: 'Chorizos',
    masterVariantId: '8fdde459-5909-49a4-a2c9-eacbec3efa18', // CHORIZO CLASICO
    variants: [
      '8fdde459-5909-49a4-a2c9-eacbec3efa18', // Clásico
      '9be1375d-d1ca-4ada-ab6d-55218b8a792d', // Especial
      '93e6270e-8acc-49f9-8c0f-3fee2faa4c70', // Royal
      'c084ac1e-f45b-4c6d-8173-1527d39ca3f5', // Super
      '6059ac60-e268-4809-9060-4253c62c24db', // Club Royal
      '8fdde459-5909-49a4-a2c9-eacbec3efa18'  // Adicional chorizo
    ]
  },
  {
    name: 'Pecho Broaster',
    masterVariantId: 'ef9fc0a8-c3e4-4b0f-8ad3-d15d14a5b526', // Pecho broaster
    variants: [
      'ef9fc0a8-c3e4-4b0f-8ad3-d15d14a5b526',
      '47fd3400-d49d-49fa-9f9b-b749a89414bd'  // Broaster adicional
    ]
  },
  {
    name: 'Encuentro Broaster',
    masterVariantId: '7433770a-524e-46b1-b07d-1c6f4c2a7eb1',
    variants: [
      '7433770a-524e-46b1-b07d-1c6f4c2a7eb1'
    ]
  },
  {
    name: 'Ala Broaster',
    masterVariantId: '8056dee7-40f6-4e43-bce8-a3344060997c', // Ala broaster
    variants: [
      '8056dee7-40f6-4e43-bce8-a3344060997c',
      '2177ce33-0135-45b7-9a43-60167b803e1f'  // Ala adicional
    ]
  },
  {
    name: 'Pierna / Muzlo Broaster',
    masterVariantId: '7ff8ac6a-2ae7-4989-8a6e-5e535ca1fcb8',
    variants: [
      '7ff8ac6a-2ae7-4989-8a6e-5e535ca1fcb8'
    ]
  }
];

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

    // 3. Propagación de stock por Grupo Maestro (Insumo Principal)
    MASTER_STOCK_GROUPS.forEach(group => {
      const masterInfo = stockStatus[group.masterVariantId];
      if (masterInfo && masterInfo.isOutOfStock) {
        group.variants.forEach(variantId => {
          if (stockStatus[variantId]) {
            stockStatus[variantId].isOutOfStock = true;
            stockStatus[variantId].reason = `Agotado insumo maestro (${group.name})`;
          }
        });
      }
    });

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
