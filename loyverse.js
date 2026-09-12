function isStoreOpen(bypass) {
  if (bypass) return true;
  try {
    const now = new Date();
    const limaString = now.toLocaleString('en-US', { timeZone: 'America/Lima' });
    const limaDate = new Date(limaString);
    const day = limaDate.getDay(); // 0 = Domingo
    const minutes = limaDate.getHours() * 60 + limaDate.getMinutes();

    // Domingo descanso
    if (day === 0) return false;

    // Lunes a Sábado de 6:30 PM (1110) a 10:30 PM (1350)
    return minutes >= 1110 && minutes <= 1350;
  } catch (e) {
    return true; // En caso de fallo de timezone, no bloquear
  }
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

  // Verificación de horario laboral (Perú: Lun - Sáb 6:30 PM a 10:30 PM)
  const isTestOrder = customer?.isTestOrder === true;
  if (!isStoreOpen(isTestOrder)) {
    return res.status(400).json({
      success: false,
      error: 'En este momento nuestra cocina se encuentra cerrada. Atendemos de Lunes a Sábado de 6:30 PM a 10:30 PM (Domingos descanso).'
    });
  }

  // Token de Loyverse
  const token = process.env.LOYVERSE_TOKEN || 'c26d1ad904604b0fba6b1b3d148b60ed';
  const storeId = "6ad54167-dd5c-482b-806c-0b917f8b4545";

  // Mapeo de métodos de pago configurados en Loyverse
  const paymentTypeMap = {
    'efectivo': '31f10bd0-9fec-43c4-85c9-d610e12e3f6c',
    'yape': '598c4e51-5709-4f55-bcf7-52122d6ab53e',
    'plin': '1d359e17-40b3-4cbc-901c-e8fe40b8b9b8',
    'tarjeta': '3639a195-afc7-43ce-920e-9daf1c58eb61'
  };

  const paymentKey = (customer?.paymentMethod || 'efectivo').toLowerCase();
  const paymentTypeId = paymentTypeMap[paymentKey] || paymentTypeMap['efectivo'];

  let totalMoney = 0;
  const lineItems = items.map(item => {
    const qty = Number(item.qty) || 1;
    const price = Number(item.price) || 0;
    const lineTotal = price * qty;
    totalMoney += lineTotal;

    let lineNote = '';
    if (!item.isBeverage) {
      const parts = [];
      parts.push(`Ens: ${item.ensalada === 'no' ? 'NO' : 'SÍ'}`);
      const papaLabel = item.tipoPapa === 'hilo' ? 'Hilo' : (item.tipoPapa === 'mixta' ? 'Mixta' : 'Fritas');
      parts.push(`Papa: ${papaLabel}`);
      if (item.cremasEnPedido && item.cremasEnPedido.length > 0) {
        parts.push(`En ped: ${item.cremasEnPedido.join(',')}`);
      }
      if (item.cremasAparte && item.cremasAparte.length > 0) {
        parts.push(`Aparte: ${item.cremasAparte.join(',')}`);
      }
      if (item.extras && item.extras.length > 0) {
        parts.push(`+${item.extras.map(e => e.name).join(',')}`);
      }
      if (item.instrucciones && item.instrucciones.trim()) {
        parts.push(`Nota: ${item.instrucciones.trim()}`);
      }
      lineNote = parts.join(' | ');
    }

    const itemObj = {
      variant_id: item.variant_id || '6d767227-33a4-4738-9bad-426be19362fe',
      quantity: qty,
      price: price,
      total_money: lineTotal
    };
    if (lineNote) {
      itemObj.line_note = lineNote;
    }
    return itemObj;
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
  }

  let noteDetails = `WEB | ${orderType.toUpperCase()} | ${clientName}${deliveryDetails} | Pago: ${paymentLabel}`;
  if (notes && notes !== 'Sin observaciones') {
    noteDetails += ` | Notas: ${notes}`;
  }
  // Recortar a 240 caracteres para asegurar el límite estricto de Loyverse
  noteDetails = noteDetails.slice(0, 240);

  const payload = {
    receipt_date: new Date().toISOString(),
    receipt_type: "SALE",
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
      let errMsg = "Error al comunicarse con Loyverse.";
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
          const papaName = it.tipoPapa === 'hilo' ? 'Al Hilo' : (it.tipoPapa === 'mixta' ? 'Mixtas (Fritas + Hilo)' : 'Fritas');
          const papaText = `🍟 _Papas:_ *${papaName}*`;
          
          let cremasPedText = '';
          if (it.cremasEnPedido && it.cremasEnPedido.length > 0) {
            cremasPedText = `\n    🥫 _En pedido:_ ${it.cremasEnPedido.join(', ')}`;
          } else {
            cremasPedText = `\n    🥫 _En pedido:_ _Sin cremas_`;
          }

          let cremasApText = '';
          if (it.cremasAparte && it.cremasAparte.length > 0) {
            cremasApText = `\n    🥡 _Aparte:_ ${it.cremasAparte.join(', ')}`;
          }

          const extrasText = (it.extras && it.extras.length > 0)
            ? `\n    🧀 _Adicionales:_ ${it.extras.map(e => `${e.name} (+S/ ${Number(e.price).toFixed(2)})`).join(', ')}`
            : '';

          const noteItemText = (it.instrucciones && it.instrucciones.trim())
            ? `\n    ✏️ _Detalle:_ "${it.instrucciones.trim()}"`
            : '';

          details = `\n    ${ensaladaText} • ${papaText}${cremasPedText}${cremasApText}${extrasText}${noteItemText}`;
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
