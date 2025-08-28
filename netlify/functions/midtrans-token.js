// netlify/functions/midtrans-token.js
exports.handler = async function(event, context) {
	const timestamp = new Date().toISOString();
	console.log(`[${timestamp}] Function started - Event:`, {
		httpMethod: event.httpMethod,
		origin: event.headers.origin,
		userAgent: event.headers['user-agent'],
		ip: event.headers['x-forwarded-for'] || event.headers['x-real-ip']
	});

	// CORS headers
	const headers = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Allow-Methods': 'POST, OPTIONS'
	};

	// Preflight
	if (event.httpMethod === 'OPTIONS') {
		console.log(`[${timestamp}] CORS preflight request handled`);
		return { statusCode: 200, headers, body: '' };
	}

	// Method guard
	if (event.httpMethod !== 'POST') {
		console.error(`[${timestamp}] Invalid HTTP method: ${event.httpMethod}`);
		return {
			statusCode: 405,
			headers,
			body: JSON.stringify({ success: false, error: 'Method not allowed' })
		};
	}

	try {
		// Environment info logging
		console.log(`[${timestamp}] Environment info:`, {
			nodeVersion: process.version,
			region: process.env.AWS_REGION,
			hasEnvServerKey: !!process.env.MIDTRANS_SERVER_KEY_PROD,
			environment: process.env.MIDTRANS_ENVIRONMENT || 'not-set'
		});

		// Parse request body with detailed logging
		let parsedBody = {};
		try {
			parsedBody = JSON.parse(event.body || '{}');
			console.log(`[${timestamp}] Request body parsed successfully:`, parsedBody);
		} catch (parseError) {
			console.error(`[${timestamp}] JSON parse error:`, {
				error: parseError.message,
				body: event.body ? event.body.substring(0, 200) : 'null'
			});
			throw parseError;
		}

		const { amount, item_name } = parsedBody;

		// Amount: integer IDR
		const finalAmount = parseInt(String(amount).replace(/[^\d]/g, ''), 10);
		console.log(`[${timestamp}] Amount processing:`, {
			originalAmount: amount,
			cleanedAmount: String(amount).replace(/[^\d]/g, ''),
			finalAmount: finalAmount
		});

		if (!finalAmount || finalAmount <= 0) {
			console.error(`[${timestamp}] Invalid amount validation failed:`, {
				received: amount,
				parsed: finalAmount
			});
			return {
				statusCode: 400,
				headers,
				body: JSON.stringify({ success: false, error: 'Invalid amount', received: amount })
			};
		}

		// Production minimum amount check
		if (finalAmount < 1000) {
			console.error(`[${timestamp}] Amount below production minimum:`, {
				amount: finalAmount,
				minimum: 1000
			});
		}

		// Order id
		const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
		console.log(`[${timestamp}] Generated Order ID: ${orderId}`);

		// Midtrans params - Sadece kart Ã¶demesi gÃ¶ster
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
			// Sadece kart Ã¶demesi aktif - diÄŸer yÃ¶ntemler gizli
			enabled_payments: ['credit_card']
		};

		// PRODUCTION endpoint + PRODUCTION SERVER KEY
		const apiUrl = 'https://app.midtrans.com/snap/v1/transactions';
		const serverKey = process.env.MIDTRANS_SERVER_KEY_PROD || 'Mid-server-kO-tU3T7Q9MYO_25tJTggZeu';
		const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

		// DEBUG LOG'LAR
		console.log(`[${timestamp}] DEBUG - Amount:`, finalAmount);
		console.log(`[${timestamp}] DEBUG - Item:`, item_name);
		console.log(`[${timestamp}] DEBUG - Order ID:`, orderId);
		console.log(`[${timestamp}] DEBUG - Midtrans Params:`, JSON.stringify(midtransParams, null, 2));
		console.log(`[${timestamp}] DEBUG - API URL:`, apiUrl);
		console.log(`[${timestamp}] DEBUG - Server Key:`, serverKey.substring(0, 15) + '...');
		console.log(`[${timestamp}] DEBUG - Auth Header Length:`, authHeader.length);

		// API call with detailed logging
		console.log(`[${timestamp}] Making API call to Midtrans...`);
		let response, responseData;

		try {
			response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
					Authorization: authHeader
				},
				body: JSON.stringify(midtransParams)
			});

			console.log(`[${timestamp}] API Response received:`, {
				status: response.status,
				statusText: response.statusText,
				ok: response.ok,
				headers: {
					'content-type': response.headers.get('content-type'),
					'content-length': response.headers.get('content-length'),
					'server': response.headers.get('server')
				}
			});

		} catch (fetchError) {
			console.error(`[${timestamp}] Fetch request failed:`, {
				name: fetchError.name,
				message: fetchError.message,
				code: fetchError.code,
				stack: fetchError.stack
			});
			throw fetchError;
		}

		// Parse response with detailed logging
		let responseText = '';
		try {
			responseText = await response.text();
			console.log(`[${timestamp}] Raw response text (first 500 chars):`, responseText.substring(0, 500));
			
			responseData = JSON.parse(responseText);
			console.log(`[${timestamp}] Response parsed successfully. Keys:`, Object.keys(responseData));
		} catch (responseParseError) {
			console.error(`[${timestamp}] Response parsing failed:`, {
				error: responseParseError.message,
				responseStatus: response.status,
				responseText: responseText.substring(0, 200)
			});
			throw responseParseError;
		}
		
		// DEBUG - Midtrans Response
		console.log(`[${timestamp}] DEBUG - Midtrans Response Status:`, response.status);
		console.log(`[${timestamp}] DEBUG - Midtrans Response Data:`, JSON.stringify(responseData, null, 2));

		// Success response handling
		if (response.ok && responseData.token) {
			console.log(`[${timestamp}] SUCCESS - Token generated successfully:`, {
				orderId: orderId,
				tokenLength: responseData.token.length,
				hasRedirectUrl: !!responseData.redirect_url
			});

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

		// Error response handling
		console.error(`[${timestamp}] Midtrans API returned error:`, {
			status: response.status,
			statusText: response.statusText,
			hasErrorMessages: !!responseData.error_messages,
			errorMessages: responseData.error_messages,
			fullResponse: responseData
		});

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
		console.error(`[${timestamp}] Function execution error:`, {
			name: error.name,
			message: error.message,
			code: error.code,
			stack: error.stack,
			type: typeof error
		});

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
