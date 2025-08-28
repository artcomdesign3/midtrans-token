// netlify/functions/midtrans-token.js
exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode:200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode:405, headers, body: JSON.stringify({error:'Method not allowed'}) };

  try {
    const payload = JSON.parse(event.body || '{}');
    // prefer parsed_idr (already integer IDR units)
    let finalAmount = null;
    if (payload.parsed_idr) {
      finalAmount = parseInt(payload.parsed_idr, 10);
    } else if (payload.amount) {
      // fallback: attempt to robust-parse amount (string or number)
      let a = String(payload.amount).trim();
      // remove non-digits, but decide if amount is cents (×100)
      const onlyDigits = a.replace(/[^\d]/g,'');
      let num = parseInt(onlyDigits,10);
      if (!num || isNaN(num)) return { statusCode:400, headers, body: JSON.stringify({success:false, error:'Invalid amount'}) };
      // heuristic: if number is extremely large (> 1e6), assume it's cents and divide by 100
      if (num > 1000000) finalAmount = Math.round(num / 100);
      else finalAmount = num;
    } else {
      return { statusCode:400, headers, body: JSON.stringify({success:false, error:'No amount provided'}) };
    }

    console.log('Netlify DEBUG - finalAmount:', finalAmount, 'payload:', payload);

    if (!finalAmount || finalAmount <= 0) return { statusCode:400, headers, body: JSON.stringify({success:false, error:'Invalid final amount'}) };

    // build Midtrans params
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2,8)}`;
    const midtransParams = {
      transaction_details: { order_id: orderId, gross_amount: finalAmount },
      item_details: [{ id:'ITEM_001', price: finalAmount, quantity:1, name: payload.item_name || 'Product' }],
      customer_details: { first_name:'Customer', email: payload.customer_email || 'customer@example.com', phone: payload.customer_phone || '08123456789' }
    };

    console.log('Netlify DEBUG - calling midtrans with:', midtransParams);

    const api_url = 'https://app.midtrans.com/snap/v1/transactions';
    const server_key = process.env.MIDTRANS_SERVER_KEY || 'Mid-server-kO-tU3T7Q9MYO_25tJTggZeu';

    const response = await fetch(api_url, {
      method: 'POST',
      headers: {
        'Accept':'application/json','Content-Type':'application/json',
        'Authorization':'Basic ' + Buffer.from(server_key + ':').toString('base64')
      },
      body: JSON.stringify(midtransParams)
    });

    const responseData = await response.json();
    console.log('Netlify DEBUG - midtrans response:', responseData);

    if (response.ok && responseData.token) {
      return { statusCode:200, headers, body: JSON.stringify({ success:true, data:{ token: responseData.token, order_id: orderId, amount: finalAmount } }) };
    } else {
      return { statusCode:400, headers, body: JSON.stringify({ success:false, error:'Midtrans error', details: responseData }) };
    }
  } catch (err) {
    console.error('Netlify function error:', err);
    return { statusCode:500, headers, body: JSON.stringify({ success:false, error:'Internal server error', message: err.message }) };
  }
};
