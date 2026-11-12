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

    // 4. Propagación de stock por Grupo Maestro (Insumo Principal + Bloqueo Manual Admin)
    const masterGroups = Array.isArray(activeConfig.masterStockGroups) ? activeConfig.masterStockGroups : [];
    masterGroups.forEach(group => {
      const masterInfo = stockStatus[group.masterVariantId];
      const groupDepleted = (masterInfo && masterInfo.isOutOfStock) || group.manualOutOfStock === true;
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
