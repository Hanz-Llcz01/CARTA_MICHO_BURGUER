import fs from 'fs';
import zlib from 'zlib';

const CONFIG_ITEM_ID = '7de66ec4-f69b-4182-9c18-48e6ed4c2ecd';

function parseTimeToMinutes(timeStr, fallbackMinutes) {
  if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return fallbackMinutes;
  const [h, m] = timeStr.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return fallbackMinutes;
  return h * 60 + m;
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
    return null;
  }
  return null;
}

async function getActiveSchedule(token) {
  let localSchedule = null;
  try {
    const fileUrl = new URL('../data/config.json', import.meta.url);
    const raw = fs.readFileSync(fileUrl, 'utf8');
    const parsed = JSON.parse(raw);
    localSchedule = parsed.schedule || null;
  } catch (e) {
    // Ignorar fallo de lectura local
  }

  try {
    const itemRes = await fetch(`https://api.loyverse.com/v1.0/items/${CONFIG_ITEM_ID}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (itemRes.ok) {
      const cfgItem = await itemRes.json();
      const cloudCfg = decodeCloudConfig(cfgItem.description);
      if (cloudCfg && cloudCfg.schedule) {
        return cloudCfg.schedule;
      }
    }
  } catch (e) {
    // Fallback a configuración local
  }

  return localSchedule || {
    mode: 'auto',
    openTime: '18:30',
    closeTime: '22:30',
    openDays: [1, 2, 3, 4, 5, 6],
    customClosedMessage: ''
  };
}

function evaluateStoreOpen(bypass, scheduleCfg) {
  if (bypass) return { isOpen: true };

  const cfg = scheduleCfg || {};
  const mode = cfg.mode || 'auto';

  if (mode === 'open') {
    return { isOpen: true };
  }

  if (mode === 'closed') {
    return {
      isOpen: false,
      message: cfg.customClosedMessage || 'En este momento nuestra cocina se encuentra cerrada temporalmente.'
    };
  }

  try {
    const now = new Date();
    const limaString = now.toLocaleString('en-US', { timeZone: 'America/Lima' });
    const limaDate = new Date(limaString);
    const day = limaDate.getDay(); // 0 = Domingo
    const minutes = limaDate.getHours() * 60 + limaDate.getMinutes();

    const openDays = Array.isArray(cfg.openDays) ? cfg.openDays : [1, 2, 3, 4, 5, 6];
    if (!openDays.includes(day)) {
      return {
        isOpen: false,
        message: cfg.customClosedMessage || 'Hoy nuestra cocina se encuentra de descanso. ¡Te esperamos en nuestro próximo día de atención!'
      };
    }

    const openMins = parseTimeToMinutes(cfg.openTime, 1110); // 18:30
    const closeMins = parseTimeToMinutes(cfg.closeTime, 1350); // 22:30

    const isWithinHours = openMins <= closeMins
      ? (minutes >= openMins && minutes <= closeMins)
      : (minutes >= openMins || minutes <= closeMins);

    if (!isWithinHours) {
      return {
        isOpen: false,
        message: cfg.customClosedMessage || `En este momento nuestra cocina se encuentra cerrada. Nuestro horario es: ${cfg.hoursLabel || 'Lun - Sáb de 6:30 PM a 10:30 PM'}.`
      };
    }

    return { isOpen: true };
  } catch (e) {
    return { isOpen: true }; // En caso de fallo de timezone, no bloquear
  }
}

function isSandwichItem(id) {
  if (!id) return false;
  const baseId = String(id).split('_')[0];
  return baseId.startsWith('h') || baseId.startsWith('pd') || baseId.startsWith('f') || baseId.startsWith('cr') || baseId.startsWith('c');
}

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { items, customer } = req.body || {};

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'El carrito no contiene productos.' });
  }

  // Token de Loyverse
  const token = process.env.LOYVERSE_TOKEN || 'c26d1ad904604b0fba6b1b3d148b60ed';
  const storeId = '6ad54167-dd5c-482b-806c-0b917f8b4545';

  // Verificación dinámica de horario laboral y modo manual (Abierto / Cerrado / Automático)
  const isTestOrder = customer?.isTestOrder === true;
  const scheduleCfg = await getActiveSchedule(token);
  const storeCheck = evaluateStoreOpen(isTestOrder, scheduleCfg);
  if (!storeCheck.isOpen) {
    return res.status(400).json({
      success: false,
      error: storeCheck.message
    });
  }

  // Mapeo de métodos de pago configurados en Loyverse
  const paymentTypeMap = {
    'efectivo': '31f10bd0-9fec-43c4-85c9-d610e12e3f6c',
    'yape': '598c4e51-5709-4f55-bcf7-52122d6ab53e',
    'plin': '1d359e17-40b3-4cbc-901c-e8fe40b8b9b8',
    'tarjeta': '3639a195-afc7-43ce-920e-9daf1c58eb61'
  };

  const paymentKey = (customer?.paymentMethod || 'efectivo').toLowerCase();
  const paymentTypeId = paymentTypeMap[paymentKey] || paymentTypeMap['efectivo'];

  const CANONICAL_CREMAS = ['MAYONESA', 'KETCHUT', 'MOSTAZA', 'GOLF', 'TÁRTARA', 'TARTARA', 'AJÍ', 'AJI', 'ACEITUNA'];
  const sortCremasList = (list) => {
    if (!Array.isArray(list) || list.length <= 1) return Array.isArray(list) ? [...list] : [];
    const getRank = (name) => {
      const up = String(name || '').toUpperCase().trim().replace(/\s+X\d+$/i, '').trim();
      if (up === 'MAYONESA') return 1;
      if (up === 'ACEITUNA') return 9999;
      const idx = CANONICAL_CREMAS.indexOf(up);
      return idx !== -1 ? 10 + idx : 500;
    };
    return [...list].sort((a, b) => getRank(a) - getRank(b));
  };

  items.forEach(it => {
    if (Array.isArray(it.cremasEnPedido)) {
      it.cremasEnPedido = sortCremasList(it.cremasEnPedido);
    }
    if (Array.isArray(it.cremasAparte)) {
      it.cremasAparte = sortCremasList(it.cremasAparte);
    }
  });

  let totalMoney = 0;
  const lineItems = [];
  items.forEach(item => {
    const qty = Number(item.qty) || 1;
    const unitPriceWithExtras = Number(item.price) || 0;
    const extrasList = (!item.isBeverage && Array.isArray(item.extras)) ? item.extras : [];

    let extrasUnitSum = 0;
    const validExtraLines = [];
    extrasList.forEach(ex => {
      if (ex && ex.variant_id) {
        const exPrice = Number(ex.price) || 0;
        extrasUnitSum += exPrice;
        validExtraLines.push({
          variant_id: ex.variant_id,
          name: ex.name || 'Adicional',
          price: exPrice
        });
      }
    });

    const baseUnitPrice = Math.max(0, unitPriceWithExtras - extrasUnitSum);
    const baseLineTotal = baseUnitPrice * qty;
    totalMoney += baseLineTotal;

    let lineNote = '';
    if (!item.isBeverage) {
      const parts = [];
      parts.push(`Ens: ${item.ensalada === 'no' ? 'NO' : 'SÍ'}`);
      if (item.allowsPotatoChoice || isSandwichItem(item.id)) {
        const papaLabel = item.tipoPapa === 'hilo' ? 'Hilo' : (item.tipoPapa === 'mixta' ? 'Mixta' : 'Fritas');
        parts.push(`Papa: ${papaLabel}`);
      }
      if (item.cremasEnPedido && item.cremasEnPedido.length > 0) {
        parts.push(`Cremas: ${item.cremasEnPedido.join(',')}`);
      }
      if (item.cremasAparte && item.cremasAparte.length > 0) {
        parts.push(`Aparte: ${item.cremasAparte.join(',')}`);
      }
      const pedCnt = Array.isArray(item.cremasEnPedido) ? item.cremasEnPedido.length : 0;
      const apCnt = Array.isArray(item.cremasAparte) ? item.cremasAparte.length : 0;
      const exCrCount = item.cremasExtraCount !== undefined ? Number(item.cremasExtraCount) : Math.max(0, (pedCnt + apCnt) - 9);
      const exCrCost = item.cremasExtraCost !== undefined ? Number(item.cremasExtraCost) : (exCrCount * 0.50);
      if (exCrCount > 0) {
        parts.push(`Cremas adic(${exCrCount}): +S/${exCrCost.toFixed(2)}`);
      }
      if (item.extras && item.extras.length > 0) {
        parts.push(`+${item.extras.map(e => e.name).join(',')}`);
      }
      if (item.instrucciones && item.instrucciones.trim()) {
        parts.push(`Nota: ${item.instrucciones.trim()}`);
      }
      lineNote = parts.join(' | ').slice(0, 240);
    }

    const itemObj = {
      variant_id: item.variant_id || '6d767227-33a4-4738-9bad-426be19362fe',
      quantity: qty,
      price: baseUnitPrice,
      total_money: baseLineTotal
    };
    if (lineNote) {
      itemObj.line_note = lineNote;
    }
    lineItems.push(itemObj);

    // Registrar cada adicional pagado con su propio código en Loyverse POS
    validExtraLines.forEach(exLine => {
      const exTotal = exLine.price * qty;
      totalMoney += exTotal;
      lineItems.push({
        variant_id: exLine.variant_id,
        quantity: qty,
        price: exLine.price,
        total_money: exTotal,
        line_note: `Adicional en: ${item.name || 'Plato'}`.slice(0, 240)
      });
    });
  });

  // Datos del cliente y de entrega
  const clientName = customer?.name?.trim() || 'Cliente';
  const orderType = customer?.orderType || 'A Enviar'; // 'A Enviar' o 'A Recoger'
  const phone = customer?.phone?.trim() || '';
  const address = customer?.address?.trim() || '';
  const building = customer?.building?.trim() || '';
  const notes = customer?.notes?.trim() || 'Sin observaciones';
  const paymentLabel = customer?.paymentMethod ? customer.paymentMethod.toUpperCase() : 'EFECTIVO';

  // Título de la orden para Loyverse (máximo 20 caracteres)
  const modePrefix = orderType === 'A Enviar' ? 'Delivery' : 'Recojo';
  const orderTitle = `${modePrefix} - ${clientName}`.trim().slice(0, 20);

  // Detalle para nota de comanda (máximo 250 caracteres exigido por Loyverse)
  let deliveryDetails = '';
  if (orderType === 'A Enviar') {
    deliveryDetails = ` | Tel: ${phone} | Dir: ${address}${building ? ' (' + building + ')' : ''}`;
  } else if (phone) {
    deliveryDetails = ` | Tel: ${phone}`;
  }

  let noteDetails = `${orderType.toUpperCase()} | ${clientName}${deliveryDetails} | Pago: ${paymentLabel}`;
  if (notes && notes !== 'Sin observaciones') {
    noteDetails += ` | Notas: ${notes}`;
  }
  noteDetails = noteDetails.slice(0, 240);

  const payload = {
    receipt_date: new Date().toISOString(),
    receipt_type: 'SALE',
    store_id: storeId,
    order: orderTitle,
    note: noteDetails,
    total_money: totalMoney,
    total_tax: 0,
    line_items: lineItems,
    payments: [
      {
        payment_type_id: paymentTypeId,
        money_amount: totalMoney,
        paid_money: totalMoney
      }
    ]
  };

  try {
    // 1. Guardar en Loyverse POS
    const response = await fetch('https://api.loyverse.com/v1.0/receipts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Loyverse error:', data);
      let errMsg = 'Error al comunicarse con Loyverse.';
      if (data && data.errors && Array.isArray(data.errors)) {
        errMsg = data.errors.map(e => e.details || e.message || e.code).join('; ');
      } else if (data && data.message) {
        errMsg = data.message;
      }
      return res.status(400).json({ success: false, error: errMsg, details: data });
    }

    const receiptNumber = data.receipt_number || 'WEB';

    // 2. Enviar notificación instantánea a Telegram a ambos celulares
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN || '8848958079:AAGfrgGoWjMOAgmaAFLVrbftKSXxwV98vTo';
    const rawChatIds = process.env.TELEGRAM_CHAT_ID || '8862958232,8916868444';
    const chatIds = rawChatIds.split(',').map(id => id.trim()).filter(Boolean);

    try {
      const itemsList = items.map(it => {
        let details = '';
        if (!it.isBeverage) {
          const ensaladaText = it.ensalada === 'no' ? '❌ _Sin ensalada_' : '🥗 _Con ensalada_';
          let papaText = '';
          if (it.allowsPotatoChoice || isSandwichItem(it.id)) {
            const papaName = it.tipoPapa === 'hilo' ? 'Al Hilo' : (it.tipoPapa === 'mixta' ? 'Mixtas (Fritas + Hilo)' : 'Fritas');
            papaText = ` • 🍟 _Papas:_ *${papaName}*`;
          }

          let cremasPedText = '';
          if (it.cremasEnPedido && it.cremasEnPedido.length > 0) {
            cremasPedText = `\n    🥫 _Cremas:_ ${it.cremasEnPedido.join(', ')}`;
          } else {
            cremasPedText = `\n    🥫 _Cremas:_ _Sin cremas_`;
          }

          let cremasApText = '';
          if (it.cremasAparte && it.cremasAparte.length > 0) {
            cremasApText = `\n    🥡 _Aparte:_ ${it.cremasAparte.join(', ')}`;
          }

          const pedCntTg = Array.isArray(it.cremasEnPedido) ? it.cremasEnPedido.length : 0;
          const apCntTg = Array.isArray(it.cremasAparte) ? it.cremasAparte.length : 0;
          const exCrCountTg = it.cremasExtraCount !== undefined ? Number(it.cremasExtraCount) : Math.max(0, (pedCntTg + apCntTg) - 9);
          const exCrCostTg = it.cremasExtraCost !== undefined ? Number(it.cremasExtraCost) : (exCrCountTg * 0.50);
          const cremasExtraTgText = exCrCountTg > 0
            ? `\n    🥫 _Cremas adicionales (${exCrCountTg}):_ +S/ ${exCrCostTg.toFixed(2)}`
            : '';

          const extrasText = (it.extras && it.extras.length > 0)
            ? `\n    🧀 _Adicionales:_ ${it.extras.map(e => `${e.name} (+S/ ${Number(e.price).toFixed(2)})`).join(', ')}`
            : '';

          const noteItemText = (it.instrucciones && it.instrucciones.trim())
            ? `\n    ✏️ _Detalle:_ "${it.instrucciones.trim()}"`
            : '';

          details = `\n    ${ensaladaText}${papaText}${cremasPedText}${cremasApText}${cremasExtraTgText}${extrasText}${noteItemText}`;
        }
        return `• *${it.qty}x ${it.name}* (S/ ${(it.price * it.qty).toFixed(2)})${details}`;
      }).join('\n');
      const nowLima = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' });

      let locationBlock = `📍 *Modalidad:* 🛍️ A RECOGER EN LOCAL`;
      if (orderType === 'A Enviar') {
        const buildingLine = building ? `\n🏢 *Torre / Dpto:* ${building}` : '';
        locationBlock =
`📍 *Modalidad:* 🛵 A ENVIAR (Delivery)
🏠 *Dirección:* ${address}${buildingLine}
📞 *Celular:* ${phone}`;
      } else if (phone) {
        locationBlock =
`📍 *Modalidad:* 🛍️ A RECOGER EN LOCAL
📞 *Celular:* ${phone}`;
      }

      const telegramMessage =
`🍔 *¡NUEVO PEDIDO - MICHO BURGUER!*
━━━━━━━━━━━━━━━━━━━━
🧾 *Comanda:* #${receiptNumber}
${locationBlock}
👤 *Cliente:* ${clientName}
💳 *Pago:* ${paymentLabel}
📝 *Notas:* ${notes}
━━━━━━━━━━━━━━━━━━━━
🛒 *DETALLE:*
${itemsList}
━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL A COBRAR:* S/ ${totalMoney.toFixed(2)}
⏰ *Hora:* ${nowLima}`;

      await Promise.all(chatIds.map(chatId => {
        return fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: telegramMessage,
            parse_mode: 'Markdown'
          })
        });
      }));
    } catch (telegramErr) {
      console.error('Error enviando notificación a Telegram:', telegramErr);
    }

    return res.status(200).json({
      success: true,
      receipt_number: receiptNumber,
      order: orderTitle,
      total: totalMoney,
      data
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
