// netlify/functions/midtrans-token.js
exports.handler = async function(event, context) {
	// 🔧 ENHANCED CORS HEADERS - Fix for preflight
	const headers = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With',
		'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
		'Access-Control-Max-Age': '86400', // 24 hours cache
		'Content-Type': 'application/json'
	};

	// 🚀 PREFLIGHT CORS REQUEST HANDLER
	if (event.httpMethod === 'OPTIONS') {
		console.log('🔄 CORS Preflight request received');
		console.log('🌐 Origin:', event.headers.origin || 'No origin');
		console.log('🔧 Method:', event.headers['access-control-request-method'] || 'No method');
		console.log('📋 Headers:', event.headers['access-control-request-headers'] || 'No headers');
		
		return { 
			statusCode: 200, 
			headers,
			body: JSON.stringify({ message: 'CORS preflight OK' })
		};
	}

	if (event.httpMethod !== 'POST') {
		return {
			statusCode: 405,
			headers,
			body: JSON.stringify({ success: false, error: 'Method not allowed' })
		};
	}

	try {
		const { amount, item_name, php_webhook_url, auto_redirect, referrer, user_agent } = JSON.parse(event.body || '{}');
		const finalAmount = parseInt(String(amount).replace(/[^\d]/g, ''), 10);
		
		// 🔍 DETAILED REQUEST LOGGING
		console.log('📡 NETLIFY FUNCTION CALLED');
		console.log('🔍 Request Headers:', JSON.stringify(event.headers, null, 2));
		console.log('📦 Request Body:', event.body);
		console.log('💰 Parsed Amount:', finalAmount);
		console.log('🏷️ Item Name:', item_name);
		console.log('🔗 PHP Webhook:', php_webhook_url);
		console.log('🚀 Auto Redirect:', auto_redirect);
		console.log('📍 Referrer:', referrer);
		console.log('🌐 User Agent:', user_agent);
		
		if (!finalAmount || finalAmount <= 0) {
			console.error('❌ INVALID AMOUNT ERROR:', finalAmount, 'from original:', amount);
			return {
				statusCode: 400,
				headers,
				body: JSON.stringify({ 
					success: false, 
					error: 'Invalid amount', 
					received: amount,
					parsed: finalAmount 
				})
			};
		}

		// Unique order ID with timestamp
		const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

		console.log('🔥 PRODUCTION MODE ACTIVATED');
		console.log('🎯 Generated Order ID:', orderId);
		console.log('💰 Final Amount:', finalAmount, 'IDR');

		// 🎯 DETAILED PHP NOTIFICATION
		const notificationPayload = {
			event: 'payment_initiated',
			order_id: orderId,
			amount: finalAmount,
			item_name: item_name || 'Product',
			status: 'PENDING',
			auto_redirect: auto_redirect || false,
			timestamp: new Date().toISOString(),
			request_details: {
				referrer: referrer,
				user_agent: user_agent,
				ip: event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown'
			}
		};

		console.log('📤 Sending to PHP:', JSON.stringify(notificationPayload, null, 2));

		const notificationCall = php_webhook_url ? 
			fetch(php_webhook_url, {
				method: 'POST',
				headers: { 
					'Content-Type': 'application/json',
					'User-Agent': 'Netlify-Function/1.0'
				},
				body: JSON.stringify(notificationPayload)
			})
			.then(phpRes => phpRes.json())
			.then(phpData => {
				console.log('✅ PHP Response:', JSON.stringify(phpData, null, 2));
				return phpData;
			})
			.catch(err => {
				console.log('🚨 PHP webhook failed:', err.message);
				return { error: err.message };
			})
			: Promise.resolve({ skipped: true });

		// Wait for PHP notification before proceeding
		const phpResult = await notificationCall;
		console.log('📨 PHP Notification Result:', phpResult);

		// Midtrans production parameters
		const midtransParams = {
			transaction_details: {
				order_id: orderId,
				gross_amount: finalAmount
			},
			credit_card: {
				secure: true  // 3D-Secure authentication
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
				last_name: 'Midtrans',
				email: 'customer@example.com',
				phone: '08123456789'
			},
			// Production için tüm payment methods aktif
			enabled_payments: [
				'credit_card',
				'gopay', 
				'shopeepay',
				'other_qris',
				'bank_transfer',
				'echannel',
				'permata_va',
				'bca_va',
				'bni_va',
				'bri_va',
				'other_va'
			],
			// Expiry 24 hours
			expiry: {
				start_time: new Date().toISOString(),
				unit: "hour",
				duration: 24
			}
		};

		// PRODUCTION ayarları
		const apiUrl = 'https://app.midtrans.com/snap/v1/transactions';
		const serverKey = 'Mid-server-kO-tU3T7Q9MYO_25tJTggZeu';
		const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

		// PRODUCTION ayarları
		const apiUrl = 'https://app.midtrans.com/snap/v1/transactions';
		const serverKey = 'Mid-server-kO-tU3T7Q9MYO_25tJTggZeu';
		const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

		console.log('🔗 Midtrans API URL:', apiUrl);
		console.log('🔑 Auth Header Length:', authHeader.length);
		console.log('📋 Midtrans Payload:', JSON.stringify(midtransParams, null, 2));

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: authHeader,
				'User-Agent': 'Netlify-Function/1.0'
			},
			body: JSON.stringify(midtransParams)
		});

		const responseData = await response.json();
		
		console.log('📡 MIDTRANS API RESPONSE:');
		console.log('  - Status Code:', response.status);
		console.log('  - Status Text:', response.statusText);
		console.log('  - Headers:', Object.fromEntries([...response.headers.entries()]));
		console.log('  - Response Data:', JSON.stringify(responseData, null, 2));

		if (response.ok && responseData.token) {
			console.log('✅ MIDTRANS SUCCESS - TOKEN GENERATED');
			console.log('🎯 Token:', responseData.token);
			console.log('🔗 Redirect URL:', responseData.redirect_url);
			
			// 🚀 OTOMATIK REDIRECT IÇIN BOTH TOKEN VE REDIRECT_URL DÖNDER
			const successResponse = {
				success: true,
				data: {
					token: responseData.token,
					redirect_url: responseData.redirect_url,
					order_id: orderId,
					amount: finalAmount,
					auto_redirect: auto_redirect || false,
					midtrans_response: responseData, // 🔍 FULL MIDTRANS RESPONSE
					php_notification: phpResult // 🔍 PHP RESPONSE
				}
			};
			
			console.log('📤 FINAL SUCCESS RESPONSE:', JSON.stringify(successResponse, null, 2));
			
			return {
				statusCode: 200,
				headers,
				body: JSON.stringify(successResponse)
			};
		} else {
			console.error('❌ MIDTRANS API ERROR:');
			console.error('  - Status:', response.status);
			console.error('  - Response:', JSON.stringify(responseData, null, 2));
			
			return {
				statusCode: 400,
				headers,
				body: JSON.stringify({
					success: false,
					error: 'Failed to generate payment token',
					details: responseData,
					debug_info: {
						order_id: orderId,
						amount: finalAmount,
						php_result: phpResult
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
		console.error('🚨 NETLIFY FUNCTION ERROR - FULL DETAILS:');
		console.error('  - Error Message:', error.message);
		console.error('  - Error Stack:', error.stack);
		console.error('  - Request Body:', event.body);
		console.error('  - Timestamp:', new Date().toISOString());
		
		return {
			statusCode: 500,
			headers,
			body: JSON.stringify({
				success: false,
				error: 'Internal server error',
				message: error.message,
				debug_info: {
					timestamp: new Date().toISOString(),
					request_body: event.body
				}
			})
		};
	}
};
