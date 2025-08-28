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
		return {
			statusCode: 405,
			headers,
			body: JSON.stringify({ success: false, error: 'Method not allowed' })
		};
	}

	try {
		const { amount, item_name } = JSON.parse(event.body || '{}');
		const finalAmount = parseInt(String(amount).replace(/[^\d]/g, ''), 10);
		
		if (!finalAmount || finalAmount <= 0) {
			return {
				statusCode: 400,
				headers,
				body: JSON.stringify({ success: false, error: 'Invalid amount', received: amount })
			};
		}

		const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

		// Snap API parametreleri
		const snapParams = {
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
			// Sadece kart ödemesi
			enabled_payments: ['credit_card']
		};

		// 🔑 DOĞRU endpoint - Snap API
		const apiUrl = 'https://app.midtrans.com/snap/v1/transactions';
		const serverKey = 'Mid-server-kO-tU3T7Q9MYO_25tJTggZeu';
		const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: authHeader
			},
			body: JSON.stringify(snapParams)
		});

		const responseData = await response.json();

		if (response.ok && responseData.redirect_url) {
			return {
				statusCode: 200,
				headers,
				body: JSON.stringify({
					success: true,
					data: {
						payment_url: responseData.redirect_url,
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
				error: 'Failed to create payment',
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
