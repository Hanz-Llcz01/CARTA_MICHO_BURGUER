import fs from 'fs';
import zlib from 'zlib';

const CONFIG_ITEM_ID = '7de66ec4-f69b-4182-9c18-48e6ed4c2ecd';
const STORE_ID = '6ad54167-dd5c-482b-806c-0b917f8b4545';
const DEFAULT_FALLBACK_VARIANT_ID = '6d767227-33a4-4738-9bad-426be19362fe';

function loadLocalConfig() {
  try {
    const fileUrl = new URL('../data/config.json', import.meta.url);
    const raw = fs.readFileSync(fileUrl, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function saveLocalConfig(configObj) {
  try {
    const fileUrl = new URL('../data/config.json', import.meta.url);
    fs.writeFileSync(fileUrl, JSON.stringify(configObj, null, 2), 'utf8');
    return true;
  } catch (e) {
    // En Vercel Serverless el sistema de archivos es de solo lectura, se guarda en la nube (Loyverse)
    return false;
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

function encodeCloudConfig(configObj) {
  const jsonStr = JSON.stringify(configObj);
  const compressed = zlib.gzipSync(Buffer.from(jsonStr, 'utf8')).toString('base64');
  return `MICHO_CFG_GZ:${compressed}`;
}

async function fetchCloudState(token) {
  const localConfig = loadLocalConfig();
  try {
    const itemRes = await fetch(`https://api.loyverse.com/v1.0/items/${CONFIG_ITEM_ID}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (itemRes.ok) {
      const cfgItem = await itemRes.json();
      const cloudConfig = decodeCloudConfig(cfgItem.description);
      let activeConfig = cloudConfig || localConfig;
      if (cloudConfig && localConfig && localConfig.updatedAt && cloudConfig.updatedAt) {
        if (new Date(localConfig.updatedAt) > new Date(cloudConfig.updatedAt)) {
          activeConfig = localConfig;
        }
      }
      return { activeConfig, cfgItem };
    }
  } catch (e) {
    console.warn('No se pudo consultar config en Loyverse:', e.message);
  }
  return { activeConfig: localConfig, cfgItem: null };
}

async function saveCloudState(token, configObj, existingCfgItem) {
  // 1. Intentar guardar también en archivo local (para XAMPP)
  saveLocalConfig(configObj);

  // 2. Guardar en Loyverse Cloud (dentro del campo description del ítem de sistema)
  let baseItem = existingCfgItem;
  if (!baseItem) {
    const getRes = await fetch(`https://api.loyverse.com/v1.0/items/${CONFIG_ITEM_ID}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (getRes.ok) {
      baseItem = await getRes.json();
    }
  }

  if (!baseItem) {
    throw new Error('No se pudo obtener el contenedor de configuración en Loyverse.');
  }

  const encoded = encodeCloudConfig(configObj);
  const payload = {
    ...baseItem,
    description: encoded
  };

  const postRes = await fetch('https://api.loyverse.com/v1.0/items', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!postRes.ok) {
    const errData = await postRes.json().catch(() => ({}));
    throw new Error('Error guardando configuración en la nube: ' + JSON.stringify(errData));
  }

  return true;
}

const LOYVERSE_CATEGORY_MAP = {
  'hamburguesas': 'd7bbda2c-e51e-4587-97d2-18161341fc4d',
  'pollo_deshilachado': 'a2bdfa28-f86f-4eda-a292-a7574fe76f4c',
  'filetes': '71b46f1c-0ca2-4222-98dc-3de6256d4502',
  'crispy': '71b46f1c-0ca2-4222-98dc-3de6256d4502',
  'chorizos': '9adb1370-239e-4dec-8096-46a590a3d0f5',
  'salchipapa': '4c68ad36-f1b8-410a-9b12-98b485341c1b',
  'pollo_broaster': '4c68ad36-f1b8-410a-9b12-98b485341c1b',
  'promociones': '4c68ad36-f1b8-410a-9b12-98b485341c1b',
  'extras_porciones': null
};

function getNextAvailableSku(configObj) {
  let maxSku = 10055;
  for (const cat of (configObj.categories || [])) {
    for (const it of (cat.items || [])) {
      const s = parseInt(it.sku || 0, 10);
      if (s > maxSku) maxSku = s;
    }
  }
  for (const ex of (configObj.extras || [])) {
    const s = parseInt(ex.sku || 0, 10);
    if (s > maxSku) maxSku = s;
  }
  return String(maxSku + 1);
}

async function syncItemWithLoyverse(token, item, catId = null, fallbackSku = '') {
  const itemName = String(item.name || 'Producto').trim();
  const price = Number(item.price) || 0;
  const sku = String(item.sku || fallbackSku || '').trim();
  const isAvailable = (item.active !== false) && (item.manualOutOfStock !== true) && (item.available !== false);
  const existingItemId = String(item.item_id || '').trim();
  const existingVariantId = (item.variant_id && item.variant_id !== 'NEW_LOYVERSE_ITEM') ? String(item.variant_id).trim() : '';

  let payload = null;
  if (existingItemId) {
    try {
      const getRes = await fetch(`https://api.loyverse.com/v1.0/items/${existingItemId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (getRes.ok) {
        const current = await getRes.json();
        if (current && current.id) {
          current.item_name = itemName;
          if (catId && Object.prototype.hasOwnProperty.call(LOYVERSE_CATEGORY_MAP, catId)) {
            current.category_id = LOYVERSE_CATEGORY_MAP[catId];
          }
          if (Array.isArray(current.variants) && current.variants[0]) {
            current.variants[0].default_pricing_type = 'FIXED';
            current.variants[0].default_price = price;
            if (sku) current.variants[0].sku = sku;
            if (Array.isArray(current.variants[0].stores) && current.variants[0].stores[0]) {
              current.variants[0].stores[0].pricing_type = 'FIXED';
              current.variants[0].stores[0].price = price;
              current.variants[0].stores[0].available_for_sale = isAvailable;
            }
          }
          payload = current;
        }
      }
    } catch (e) {}
  }

  if (!payload) {
    const variantData = {
      default_pricing_type: 'FIXED',
      default_price: price,
      stores: [
        {
          store_id: STORE_ID,
          pricing_type: 'FIXED',
          price: price,
          available_for_sale: isAvailable
        }
      ]
    };
    if (sku) variantData.sku = sku;
    if (existingVariantId) variantData.variant_id = existingVariantId;

    payload = {
      item_name: itemName,
      category_id: (catId && Object.prototype.hasOwnProperty.call(LOYVERSE_CATEGORY_MAP, catId)) ? LOYVERSE_CATEGORY_MAP[catId] : null,
      track_stock: false,
      is_composite: false,
      use_production: false,
      primary_supplier_id: null,
      tax_ids: [],
      modifiers_ids: [],
      form: 'SQUARE',
      color: 'ORANGE',
      variants: [variantData]
    };
    if (existingItemId) payload.id = existingItemId;
  }

  try {
    const res = await fetch('https://api.loyverse.com/v1.0/items', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const saved = await res.json();
      if (saved && Array.isArray(saved.variants) && saved.variants[0]) {
        return {
          item_id: saved.id || existingItemId,
          variant_id: saved.variants[0].variant_id || existingVariantId || DEFAULT_FALLBACK_VARIANT_ID,
          sku: saved.variants[0].sku || sku
        };
      }
    }
  } catch (e) {
    console.warn('No se pudo sincronizar ítem en Loyverse:', e.message);
  }

  return {
    item_id: existingItemId,
    variant_id: existingVariantId || DEFAULT_FALLBACK_VARIANT_ID,
    sku
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const token = process.env.LOYVERSE_TOKEN || 'c26d1ad904604b0fba6b1b3d148b60ed';

  if (req.method === 'GET') {
    const { activeConfig } = await fetchCloudState(token);
    if (!activeConfig) {
      return res.status(404).json({ success: false, error: 'Configuración no encontrada.' });
    }
    const publicConfig = JSON.parse(JSON.stringify(activeConfig));
    delete publicConfig.adminAuth;
    return res.status(200).json({ success: true, config: publicConfig });
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const { action, username, password } = body;

    const { activeConfig, cfgItem } = await fetchCloudState(token);
    if (!activeConfig) {
      return res.status(500).json({ success: false, error: 'No se pudo cargar la configuración base.' });
    }

    const expectedUser = (activeConfig.adminAuth && activeConfig.adminAuth.username) || 'admin';
    const expectedPass = (activeConfig.adminAuth && activeConfig.adminAuth.passwordHash) || 'micho2026';

    const inputPass = String(password || '');
    const validPass = (inputPass === expectedPass) || (expectedPass === 'micho2026' && (inputPass === 'admin' || inputPass === '123456'));

    if (
      String(username || '').trim().toLowerCase() !== expectedUser.toLowerCase() ||
      !validPass
    ) {
      return res.status(401).json({
        success: false,
        error: 'Usuario o contraseña incorrectos.'
      });
    }

    // Acción 1: Iniciar sesión o Sincronizar con Loyverse POS
    if (action === 'login' || action === 'sync_loyverse') {
      let loyverseCatalog = [];
      let stockMap = {};
      try {
        const [itemsRes, invRes] = await Promise.all([
          fetch('https://api.loyverse.com/v1.0/items?limit=250', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`https://api.loyverse.com/v1.0/inventory?store_ids=${STORE_ID}&limit=250`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (invRes.ok) {
          const invData = await invRes.json();
          for (const lvl of (invData.inventory_levels || [])) {
            stockMap[lvl.variant_id] = Number(lvl.in_stock) || 0;
          }
        }

        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          loyverseCatalog = (itemsData.items || [])
            .filter(it => it.id !== CONFIG_ITEM_ID)
            .map(it => {
              const v = (it.variants && it.variants[0]) || {};
              const s = (v.stores && v.stores[0]) || {};
              const vid = v.variant_id || '';
              return {
                item_id: it.id,
                name: it.item_name,
                sku: v.sku || '',
                variant_id: vid,
                price: Number(s.price ?? v.default_price ?? 0),
                available_for_sale: s.available_for_sale !== false,
                track_stock: it.track_stock === true,
                in_stock: Object.prototype.hasOwnProperty.call(stockMap, vid) ? stockMap[vid] : null
              };
            });
        }
      } catch (e) {
        console.warn('Error cargando catálogo Loyverse:', e.message);
      }

      if (action === 'sync_loyverse' && loyverseCatalog.length > 0) {
        const byVar = {};
        const byItem = {};
        for (const c of loyverseCatalog) {
          if (c.variant_id) byVar[c.variant_id] = c;
          if (c.item_id) byItem[c.item_id] = c;
        }
        let changed = false;
        for (const cat of (activeConfig.categories || [])) {
          for (const it of (cat.items || [])) {
            const match = (it.item_id && byItem[it.item_id]) || (it.variant_id && byVar[it.variant_id]);
            if (match) {
              it.item_id = match.item_id;
              it.variant_id = match.variant_id;
              it.sku = match.sku;
              if (match.price > 0) it.price = match.price;
              changed = true;
            }
          }
        }
        for (const ex of (activeConfig.extras || [])) {
          const match = (ex.item_id && byItem[ex.item_id]) || (ex.variant_id && byVar[ex.variant_id]);
          if (match) {
            ex.item_id = match.item_id;
            ex.variant_id = match.variant_id;
            ex.sku = match.sku;
            if (match.price > 0) ex.price = match.price;
            changed = true;
          }
        }
        if (changed) {
          activeConfig.updatedAt = new Date().toISOString();
          await saveCloudState(token, activeConfig, cfgItem);
        }
      }

      const safeConfig = JSON.parse(JSON.stringify(activeConfig));
      safeConfig.adminUser = expectedUser;
      delete safeConfig.adminAuth;

      return res.status(200).json({
        success: true,
        config: safeConfig,
        loyverseCatalog,
        loyverseStockMap: stockMap
      });
    }

    // Acción 1b: Actualizar stock numérico directamente en Loyverse POS
    if (action === 'update_loyverse_stock') {
      const variantId = String(body.variant_id || '').trim();
      const newStock = Number(body.stock) || 0;
      if (!variantId) {
        return res.status(400).json({ success: false, error: 'Falta variant_id.' });
      }
      const invRes = await fetch('https://api.loyverse.com/v1.0/inventory', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inventory_levels: [
            {
              variant_id: variantId,
              store_id: STORE_ID,
              stock_after: newStock
            }
          ]
        })
      });
      if (invRes.ok) {
        return res.status(200).json({ success: true, variant_id: variantId, stock_after: newStock });
      }
      const errData = await invRes.json().catch(() => ({}));
      return res.status(400).json({ success: false, error: 'No se pudo actualizar el stock en Loyverse.', details: errData });
    }

    // Acción 2: Cambio rápido de estado de tienda / horario
    if (action === 'quick_schedule') {
      const updatedConfig = JSON.parse(JSON.stringify(activeConfig));
      updatedConfig.schedule = {
        ...updatedConfig.schedule,
        ...(body.schedule || {})
      };
      updatedConfig.updatedAt = new Date().toISOString();

      await saveCloudState(token, updatedConfig, cfgItem);

      const safeConfig = JSON.parse(JSON.stringify(updatedConfig));
      delete safeConfig.adminAuth;

      return res.status(200).json({
        success: true,
        message: 'Estado y horario actualizados correctamente.',
        config: safeConfig
      });
    }

    // Acción 3: Guardar toda la configuración y sincronizar cambios hacia Loyverse POS
    if (action === 'save') {
      const incoming = body.config || {};
      const updatedConfig = JSON.parse(JSON.stringify(activeConfig));

      const oldItemsById = {};
      for (const oldCat of (activeConfig.categories || [])) {
        for (const oldIt of (oldCat.items || [])) {
          if (oldIt.id) oldItemsById[oldIt.id] = oldIt;
        }
      }
      const oldExtrasById = {};
      for (const oldEx of (activeConfig.extras || [])) {
        if (oldEx.id) oldExtrasById[oldEx.id] = oldEx;
      }

      if (incoming.schedule) {
        updatedConfig.schedule = {
          ...updatedConfig.schedule,
          ...incoming.schedule
        };
      }
      if (Array.isArray(incoming.cremas)) {
        updatedConfig.cremas = incoming.cremas;
      }
      if (Array.isArray(incoming.extras)) {
        for (const ex of incoming.extras) {
          const oldEx = ex.id ? oldExtrasById[ex.id] : null;
          const isNew = !ex.variant_id || ex.variant_id === 'NEW_LOYVERSE_ITEM' || !ex.item_id;
          const hasChanged = !oldEx ||
            oldEx.name !== ex.name ||
            Math.abs(Number(oldEx.price || 0) - Number(ex.price || 0)) > 0.001 ||
            Boolean(oldEx.available ?? true) !== Boolean(ex.available ?? true) ||
            String(oldEx.sku || '') !== String(ex.sku || '');

          if (isNew || hasChanged) {
            const nextSku = ex.sku || getNextAvailableSku(incoming);
            const synced = await syncItemWithLoyverse(token, ex, null, nextSku);
            ex.item_id = synced.item_id;
            ex.variant_id = synced.variant_id;
            ex.sku = synced.sku;
          }
        }
        updatedConfig.extras = incoming.extras;
      }
      if (Array.isArray(incoming.masterStockGroups)) {
        updatedConfig.masterStockGroups = incoming.masterStockGroups;
      }
      if (Array.isArray(incoming.categories)) {
        const keptItemIds = {};
        for (const cat of incoming.categories) {
          if (!Array.isArray(cat.items)) continue;
          const catId = cat.id || null;
          for (const item of cat.items) {
            if (item.id) keptItemIds[item.id] = true;
            const oldIt = item.id ? oldItemsById[item.id] : null;
            const isNew = !item.variant_id || item.variant_id === 'NEW_LOYVERSE_ITEM' || !item.item_id;
            const hasChanged = !oldIt ||
              oldIt.name !== item.name ||
              Math.abs(Number(oldIt.price || 0) - Number(item.price || 0)) > 0.001 ||
              Boolean(oldIt.active ?? true) !== Boolean(item.active ?? true) ||
              Boolean(oldIt.manualOutOfStock ?? false) !== Boolean(item.manualOutOfStock ?? false) ||
              String(oldIt.sku || '') !== String(item.sku || '');

            if (isNew || hasChanged) {
              const nextSku = item.sku || getNextAvailableSku(incoming);
              const synced = await syncItemWithLoyverse(token, item, catId, nextSku);
              item.item_id = synced.item_id;
              item.variant_id = synced.variant_id;
              item.sku = synced.sku;
            }
          }
        }

        // Eliminar en Loyverse POS los ítems eliminados del panel
        for (const [oldId, oldIt] of Object.entries(oldItemsById)) {
          if (!keptItemIds[oldId] && oldIt.item_id && oldIt.item_id !== CONFIG_ITEM_ID) {
            try {
              await fetch(`https://api.loyverse.com/v1.0/items/${oldIt.item_id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
            } catch (e) {}
          }
        }

        updatedConfig.categories = incoming.categories;
      }

      // Cambio opcional de credenciales de administrador
      if (body.newPassword && String(body.newPassword).trim().length >= 4) {
        updatedConfig.adminAuth = {
          username: body.newUsername ? String(body.newUsername).trim() : expectedUser,
          passwordHash: String(body.newPassword).trim()
        };
      } else if (body.newUsername && String(body.newUsername).trim().length >= 3) {
        updatedConfig.adminAuth = {
          username: String(body.newUsername).trim(),
          passwordHash: expectedPass
        };
      }

      updatedConfig.updatedAt = new Date().toISOString();

      await saveCloudState(token, updatedConfig, cfgItem);

      const safeConfig = JSON.parse(JSON.stringify(updatedConfig));
      safeConfig.adminUser = updatedConfig.adminAuth.username;
      delete safeConfig.adminAuth;

      return res.status(200).json({
        success: true,
        message: 'Cambios guardados y sincronizados en tiempo real con la Carta y Loyverse POS.',
        config: safeConfig
      });
    }

    return res.status(400).json({ success: false, error: 'Acción no reconocida.' });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
