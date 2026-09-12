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

  // Token de Loyverse (usa la variable de entorno o el token por defecto)
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

    return {
      variant_id: item.variant_id || '6d767227-33a4-4738-9bad-426be19362fe',
      quantity: qty,
      price: price,
      total_money: lineTotal
    };
  });

  // Datos del cliente y la mesa para la comanda impresa
  const clientName = customer?.name?.trim() || 'Cliente';
  const tableOrType = customer?.table?.trim() || 'Mesa';
  const notes = customer?.notes?.trim() || 'Sin observaciones';
  const paymentLabel = customer?.paymentMethod ? customer.paymentMethod.toUpperCase() : 'EFECTIVO';

  // Loyverse limita 'order' a 20 caracteres máximo
  const orderTitle = `${tableOrType} - ${clientName}`.trim().slice(0, 20);
  const noteDetails = `COMANDA WEB | ${tableOrType} | ${clientName} | Pago: ${paymentLabel} | Notas: ${notes}`;

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
      return res.status(400).json({ success: false, error: data });
    }

    return res.status(200).json({
      success: true,
      receipt_number: data.receipt_number,
      order: orderTitle,
      total: totalMoney,
      data
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
