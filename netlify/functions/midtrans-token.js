// netlify/functions/midtrans-token.js
exports.handler = async function(event, context) {
	// CORS headers
	const headers = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Allow-Methods': 'POST, OPTIONS'
	};

	// Preflight
	if (event.httpMethod === 'OPTIONS') {
		return { statusCode: 200, headers, body: '' };
	}

	// Method guard
	if (event.httpMethod !== 'POST') {
		return {
			statusCode: 405,
			headers,
			body: JSON.stringify({ success: false, error: 'Method not allowed' })
		};
	}

	try {
		const { amount, item_name } = JSON.parse(event.body || '{}');

		// Amount: integer IDR
		const finalAmount = parseInt(String(amount).replace(/[^\d]/g, ''), 10);
		if (!finalAmount || finalAmount <= 0) {
			return {
				statusCode: 400,
				headers,
				body: JSON.stringify({ success: false, error: 'Invalid amount', received: amount })
			};
		}

		// Order id
		const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

		// Midtrans params - Sadece kart ödemesi göster
		const midtransParams = {
			transaction_details: {
				order_id: orderId,
				gross_amount: finalAmount
			},
			item_details: [
				{
					id: 'ITEM_001',
					price: finalAmount,
					quantity: 1,
					name: item_name || 'Product'
				}
			],
			customer_details: {
				first_name: 'Customer',
				email: 'customer@example.com',
				phone: '08123456789'
			},
			// Sadece kart ödemesi aktif - diğer yöntemler gizli
			enabled_payments: ['credit_card']
		};

		// Sandbox endpoint + TEST SERVER KEY
		const apiUrl = 'https://app.sandbox.midtrans.com/snap/v1/transactions';
		const serverKey = 'Mid-server-QuDoWJB3LcWtNz17zGLeBw_F';
		const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: authHeader
			},
			body: JSON.stringify(midtransParams)
		});

		const responseData = await response.json();

		if (response.ok && responseData.token) {
			return {
				statusCode: 200,
				headers,
				body: JSON.stringify({
					success: true,
					data: {
						token: responseData.token,
						redirect_url: responseData.redirect_url,
						order_id: orderId,
						amount: finalAmount
					}
				})
			};
		}

		return {
			statusCode: 400,
			headers,
			body: JSON.stringify({
				success: false,
				error: 'Failed to generate payment token',
				details: responseData
			})
		};
	} catch (error) {
		return {
			statusCode: 500,
			headers,
			body: JSON.stringify({
				success: false,
				error: 'Internal server error',
				message: error.message
			})
		};
	}
};
