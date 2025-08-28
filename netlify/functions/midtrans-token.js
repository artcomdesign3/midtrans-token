// netlify/functions/midtrans-token.js
exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const payload = JSON.parse(event.body || '{}');

    // If Wix sends parsed_idr, use it directly (this is the recommended change)
    let finalAmount = null;

    if (payload.parsed_idr) {
      finalAmount = parseInt(payload.parsed_idr, 10);
    } else if (payload.amount) {
      // fallback: payload.amount might be cents (×100) or units; try to detect
      let aStr = String(payload.amount).replace(/[^\d]/g, '');
      let aNum = parseInt(aStr, 10);
      if (!aNum || isNaN(aNum)) {
        return { statusCode: 400, headers, body: JSON.stringify({ success:false, error: 'Invalid amount' }) };
      }
      // Heuristic: if number looks like cents (has 2 implied decimals), divide by 100
      // If the number > 1_000_000 and dividing by 100 gives a reasonable unit, do it.
      if (aNum > 1000000) {
        finalAmount = Math.round(aNum / 100);
      } else {
        finalAmount = aNum;
      }
    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ success:false, error: 'No amount provided' }) };
    }

    console.log('💰 Received payload:', payload);
    console.log('💰 Final amount (IDR units) to send to Midtrans:', finalAmount);

    if (!finalAmount || finalAmount <= 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ success:false, error: 'Invalid final amount' }) };
    }

    // Create order and call Midtrans...
    const timestamp = Date.now();
    const orderId = `ORDER_${timestamp}_${Math.random().toString(36).substr(2,9)}`;
    const midtransParams = {
      transaction_details: { order_id: orderId, gross_amount: finalAmount },
      item_details: [{ id:'ITEM_001', price: finalAmount, quantity:1, name: payload.item_name || 'Product' }],
      customer_details: { first_name:'Customer', email:'customer@example.com', phone:'08123456789' }
    };

    console.log('🚀 Calling Midtrans with:', midtransParams);

    const api_url = 'https://app.midtrans.com/snap/v1/transactions';
    const server_key = process.env.MIDTRANS_SERVER_KEY || 'Mid-server-kO-tU3T7Q9MYO_25tJTggZeu';

    const response = await fetch(api_url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(server_key + ':').toString('base64')
      },
      body: JSON.stringify(midtransParams)
    });

    const responseData = await response.json();
    console.log('📡 Midtrans response:', responseData);

    if (response.ok && responseData.token) {
      return { statusCode: 200, headers, body: JSON.stringify({ success:true, data:{ token: responseData.token, order_id: orderId, amount: finalAmount } }) };
    } else {
      return { statusCode: 400, headers, body: JSON.stringify({ success:false, error:'Midtrans error', details: responseData }) };
    }

  } catch (err) {
    console.error('Function error', err);
    return { statusCode: 500, headers, body: JSON.stringify({ success:false, error:'Internal server error', message: err.message }) };
  }
};
