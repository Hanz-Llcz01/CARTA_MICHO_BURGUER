export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { items } = req.body;
  // En Vercel, este token se configurará en las variables de entorno por seguridad.
  // Por ahora, usamos el tuyo para que funcione de inmediato.
  const token = process.env.LOYVERSE_TOKEN || 'c26d1ad904604b0fba6b1b3d148b60ed';
  
  const receiptNumber = 'WEB-' + Date.now();
  const receiptDate = new Date().toISOString();
  
  let totalMoney = 0;
  const lineItems = items.map(item => {
    const lineTotal = item.price * item.qty;
    totalMoney += lineTotal;
    return {
      item_name: item.name,
      quantity: item.qty,
      price: item.price,
      total_money: lineTotal
    };
  });

  const payload = {
    receipt_number: receiptNumber,
    receipt_date: receiptDate,
    receipt_type: "SALE",
    store_id: "6ad54167-dd5c-482b-806c-0b917f8b4545", // Tu tienda: Micho burguer
    total_money: totalMoney,
    total_tax: 0,
    line_items: lineItems
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

    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
