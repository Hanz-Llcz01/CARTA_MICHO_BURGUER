import fs from 'fs';
import zlib from 'zlib';

const CONFIG_ITEM_ID = '7de66ec4-f69b-4182-9c18-48e6ed4c2ecd';
const STORE_ID = '6ad54167-dd5c-482b-806c-0b917f8b4545';

function loadLocalConfig() {
  try {
    const fileUrl = new URL('../data/config.json', import.meta.url);
    const raw = fs.readFileSync(fileUrl, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn('No se pudo leer data/config.json local:', e.message);
    return null;
  }
}

function decodeCloudConfig(desc) {
  if (!desc || typeof desc !== 'string') return null;
  const trimmed = desc.trim();
  if (!trimmed) return null;
  try {
    if (trimmed.startsWith('MICHO_CFG_GZ:')) {
      const b64 = trimmed.slice('MICHO_CFG_GZ:'.length);
      const buf = Buffer.from(b64, 'base64');
      const jsonStr = zlib.gunzipSync(buf).toString('utf8');
      return JSON.parse(jsonStr);
    }
    if (trimmed.startsWith('{')) {
      return JSON.parse(trimmed);
    }
  } catch (e) {
    console.warn('Error decodificando config en Loyverse:', e.message);
  }
  return null;
}

export default async function handler(req, res) {
  // Configuración de CORS y caché corta para reflejar cambios del Admin al instante
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = process.env.LOYVERSE_TOKEN || 'c26d1ad904604b0fba6b1b3d148b60ed';
  const localConfig = loadLocalConfig();

  try {
    // 1. Obtener lista de artículos con disponibilidad ("available_for_sale") y config en nube
    const [itemsRes, invRes] = await Promise.all([
      fetch('https://api.loyverse.com/v1.0/items?limit=250', {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`https://api.loyverse.com/v1.0/inventory?store_ids=${STORE_ID}&limit=250`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    const itemsData = await itemsRes.json();
    const invData = await invRes.json();

    // 2. Extraer configuración guardada en la nube (dentro del ítem de sistema en Loyverse)
    let cloudConfig = null;
    if (itemsData && Array.isArray(itemsData.items)) {
      const cfgItem = itemsData.items.find(it => it.id === CONFIG_ITEM_ID);
      if (cfgItem && cfgItem.description) {
        cloudConfig = decodeCloudConfig(cfgItem.description);
      }
    }

    // Elegir la configuración más reciente entre nube y local
    let activeConfig = cloudConfig || localConfig || {};
    if (cloudConfig && localConfig && localConfig.updatedAt && cloudConfig.updatedAt) {
      if (new Date(localConfig.updatedAt) > new Date(cloudConfig.updatedAt)) {
        activeConfig = localConfig;
      }
    }

    // 3. Mapear niveles de inventario de la tienda
    const invMap = {};
    if (invData && Array.isArray(invData.inventory_levels)) {
      invData.inventory_levels.forEach(lvl => {
        invMap[lvl.variant_id] = lvl.in_stock;
      });
    }

    const stockStatus = {};
    const loyverseByVariant = {};
    const loyverseByItem = {};

    if (itemsData && Array.isArray(itemsData.items)) {
      itemsData.items.forEach(item => {
        if (item.id === CONFIG_ITEM_ID) return;
        const trackStock = item.track_stock === true;
        (item.variants || []).forEach(v => {
          const storeInfo = (v.stores || []).find(s => s.store_id === STORE_ID) || (v.stores || [])[0];
          const availableForSale = storeInfo ? storeInfo.available_for_sale !== false : true;
          const storePrice = Number(storeInfo?.price ?? v.default_price ?? 0);
          const inStock = invMap[v.variant_id] !== undefined ? invMap[v.variant_id] : null;

          let isOutOfStock = false;
          if (!availableForSale) {
            isOutOfStock = true;
          } else if (trackStock && inStock !== null && inStock <= 0) {
            isOutOfStock = true;
          }

          const entryData = {
            itemId: item.id,
            itemName: item.item_name,
            sku: v.sku ? String(v.sku) : '',
            price: storePrice,
            inStock: inStock,
            trackStock: trackStock,
            availableForSale: availableForSale,
            isOutOfStock: isOutOfStock
          };
          stockStatus[v.variant_id] = entryData;
          loyverseByVariant[v.variant_id] = entryData;
          loyverseByItem[item.id] = entryData;
        });
      });
    }

    // Sincronizar automáticamente precios y códigos SKU modificados en Loyverse POS hacia la Carta Digital
    if (Array.isArray(activeConfig.categories)) {
      activeConfig.categories.forEach(cat => {
        (cat.items || []).forEach(it => {
          const loyMatch = (it.variant_id && loyverseByVariant[it.variant_id]) ||
                           (it.item_id && loyverseByItem[it.item_id]);
          if (loyMatch) {
            if (loyMatch.price > 0 && Math.abs(Number(it.price || 0) - loyMatch.price) > 0.001) {
              it.price = loyMatch.price;
            }
            if (loyMatch.sku && String(it.sku || '') !== loyMatch.sku) {
              it.sku = loyMatch.sku;
            }
          }
        });
      });
    }
    if (Array.isArray(activeConfig.extras)) {
      activeConfig.extras.forEach(ex => {
        const loyMatch = (ex.variant_id && loyverseByVariant[ex.variant_id]) ||
                         (ex.item_id && loyverseByItem[ex.item_id]);
        if (loyMatch) {
          if (loyMatch.price > 0 && Math.abs(Number(ex.price || 0) - loyMatch.price) > 0.001) {
            ex.price = loyMatch.price;
          }
          if (loyMatch.sku && String(ex.sku || '') !== loyMatch.sku) {
            ex.sku = loyMatch.sku;
          }
        }
      });
    }

    // 4. Propagación bidireccional de stock por Grupo Maestro (Platos <-> Porciones/Adicionales)
    const CANONICAL_GROUP_VARIANTS = {
      grp_hamburguesas: ['6d767227-33a4-4738-9bad-426be19362fe', '8bf81c7e-7d00-48d3-b9e9-cda9f9d72c39', '6443424f-c859-44b2-81df-14b2259a1f5e', '4e4fef97-e474-4399-bd9c-a3018cc5f08e', 'ea59f87e-7011-4a3e-a7a9-44382e4a0e4c', 'b34af2ce-02d8-426a-ab23-44a9c4b1f845'],
      grp_pollo: ['c577b91a-a10f-4e1e-9911-a1f73b9f6c97', 'e4d1fbbf-1503-4317-94cb-acc75b1c913a', '060095b1-6642-4cb1-ae5a-2d2cd7c96334', '6906ccd6-cc74-4042-8601-e646c1129131', 'f1f36672-bc7c-41de-9961-ddd068380e4d', '9f238682-be0f-4853-91be-2824471e0ab0', '1dcb00a3-0b10-4384-9c2a-df9ab86cbca1', '2ce4b601-7b87-4eb3-9a66-5a6ebeb33f33', 'c526cfb0-c85d-466a-aa62-8b9ee2629d69'],
      grp_filetes: ['08d0e755-36f3-4253-b262-56430ea37cad', '8e2a954c-1719-4be3-99b2-f220b80f40a8', '2bfa628d-bdfb-468b-aafa-ac351846b7de', 'f9fad568-98bf-4dd9-a57d-b5d3f5f86ed4', '0e2ef7ed-82a0-43ad-a8d7-4e0d99ee9eea'],
      grp_crispy: ['5262de55-d870-46c2-aad9-25a7a096d8a0', '57bf1904-69f2-427a-8731-afe078274a6d', 'd94b34ba-f604-44b9-b76c-08286adaff5e', '54ca71a0-bb6d-44de-b3a3-af21b46924c3', '60bc53aa-36cd-4650-9707-c082244fbf7c'],
      grp_chorizos: ['8fdde459-5909-49a4-a2c9-eacbec3efa18', '9be1375d-d1ca-4ada-ab6d-55218b8a792d', '93e6270e-8acc-49f9-8c0f-3fee2faa4c70', 'c084ac1e-f45b-4c6d-8173-1527d39ca3f5', '6059ac60-e268-4809-9060-4253c62c24db', 'bc323c7e-358a-4853-855b-9e2f2beb1618'],
      grp_pecho_broaster: ['ef9fc0a8-c3e4-4b0f-8ad3-d15d14a5b526', '47fd3400-d49d-49fa-9f9b-b749a89414bd'],
      grp_encuentro_broaster: ['7433770a-524e-46b1-b07d-1c6f4c2a7eb1', '8d4008bc-a051-420f-bf69-d46e33878809'],
      grp_ala_broaster: ['8056dee7-40f6-4e43-bce8-a3344060997c', '2177ce33-0135-45b7-9a43-60167b803e1f', 'df1e6c91-9f19-4dbd-a065-b4b021fc4843'],
      grp_muzlo_broaster: ['7ff8ac6a-2ae7-4989-8a6e-5e535ca1fcb8', '139e2101-3055-4fb7-9413-b33432f8e55f']
    };

    const masterGroups = Array.isArray(activeConfig.masterStockGroups) ? activeConfig.masterStockGroups : [];
    masterGroups.forEach(group => {
      if (group.id && CANONICAL_GROUP_VARIANTS[group.id]) {
        const mergedSet = new Set([...(group.variants || []), ...CANONICAL_GROUP_VARIANTS[group.id]]);
        group.variants = Array.from(mergedSet);
      }
      const masterInfo = stockStatus[group.masterVariantId];
      const anyLinkedOut = (group.variants || []).some(vid => {
        if (vid === 'df1e6c91-9f19-4dbd-a065-b4b021fc4843' && group.id === 'grp_ala_broaster') return false;
        return stockStatus[vid] && stockStatus[vid].isOutOfStock === true;
      });
      const groupDepleted = (masterInfo && masterInfo.isOutOfStock) || anyLinkedOut || group.manualOutOfStock === true;
      if (groupDepleted) {
        (group.variants || []).forEach(variantId => {
          if (!stockStatus[variantId]) {
            stockStatus[variantId] = { isOutOfStock: true };
          } else {
            stockStatus[variantId].isOutOfStock = true;
          }
          stockStatus[variantId].reason = group.manualOutOfStock
            ? `Grupo agotado manualmente (${group.name})`
            : `Agotado insumo maestro (${group.name})`;
        });
      }
    });

    const alaInfo = stockStatus['8056dee7-40f6-4e43-bce8-a3344060997c'];
    if (alaInfo && alaInfo.trackStock && alaInfo.inStock !== null && Number(alaInfo.inStock) < 2) {
      if (stockStatus['df1e6c91-9f19-4dbd-a065-b4b021fc4843']) {
        stockStatus['df1e6c91-9f19-4dbd-a065-b4b021fc4843'].isOutOfStock = true;
      }
    }

    // 5. Preparar configuración pública (sin exponer credenciales de administrador)
    const publicConfig = JSON.parse(JSON.stringify(activeConfig));
    delete publicConfig.adminAuth;

    // Sincronizar disponibilidad de adicionales (Queso, Jamón, Huevo, Tocino) con Loyverse si están agotados allá
    if (Array.isArray(publicConfig.extras)) {
      publicConfig.extras = publicConfig.extras.map(ex => {
        const loyverseOut = ex.variant_id && stockStatus[ex.variant_id] && stockStatus[ex.variant_id].isOutOfStock === true;
        return {
          ...ex,
          available: ex.available !== false && !loyverseOut
        };
      });
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stock: stockStatus,
      config: publicConfig
    });
  } catch (error) {
    console.error('Error al sincronizar inventario y configuración:', error);
    const fallbackPublic = localConfig ? JSON.parse(JSON.stringify(localConfig)) : null;
    if (fallbackPublic) delete fallbackPublic.adminAuth;

    return res.status(200).json({
      success: true,
      offlineFallback: true,
      timestamp: new Date().toISOString(),
      stock: {},
      config: fallbackPublic
    });
  }
}
