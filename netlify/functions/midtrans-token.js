// netlify/functions/midtrans-token.js
exports.handler = async function(event, context) {
	// 🔧 COMPREHENSIVE CORS HEADERS
	const headers = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With, Origin',
		'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, PUT, DELETE',
		'Access-Control-Max-Age': '86400',
		'Content-Type': 'application/json',
		'Vary': 'Origin, Access-Control-Request-Headers'
	};

	console.log('🚀 FUNCTION CALLED - Method:', event.httpMethod);
	console.log('🌐 Origin:', event.headers.origin || 'No origin');
	console.log('🔧 Headers:', JSON.stringify(event.headers, null, 2));

	// 🚀 HANDLE ALL PREFLIGHT REQUESTS
	if (event.httpMethod === 'OPTIONS') {
		console.log('✅ CORS Preflight - returning 200');
		return { 
			statusCode: 200, 
			headers,
			body: JSON.stringify({ message: 'CORS preflight successful' })
		};
	}

	// 🚀 HANDLE NON-POST REQUESTS
	if (event.httpMethod !== 'POST') {
		console.log('❌ Method not allowed:', event.httpMethod);
		return {
			statusCode: 405,
			headers,
			body: JSON.stringify({ success: false, error: 'Method not allowed' })
		};
	}

	try {
		console.log('📦 Request body:', event.body);
		
		const { amount, item_name, php_webhook_url, auto_redirect, referrer, user_agent, origin } = JSON.parse(event.body || '{}');
		const finalAmount = parseInt(String(amount).replace(/[^\d]/g, ''), 10);
		
		console.log('💰 Parsed amount:', finalAmount);
		console.log('🏷️ Item name:', item_name);
		
		if (!finalAmount || finalAmount <= 0) {
			console.error('❌ Invalid amount:', finalAmount);
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

		// Generate order ID
		const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
		console.log('🎯 Generated order ID:', orderId);

		// Send notification to PHP
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
				origin: origin,
				ip: event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown'
			}
		};

		console.log('📤 Sending to PHP:', php_webhook_url);
		
		let phpResult = { skipped: true };
		// ✅ FIXED: HTTP ve HTTPS URL'lerini kabul et
		if (php_webhook_url && 
			(php_webhook_url.startsWith('https://') || php_webhook_url.startsWith('http://')) && 
			!php_webhook_url.includes('your-php-project.com') && 
			!php_webhook_url.includes('placeholder')) {
			
			try {
				console.log('🔄 Actually sending PHP request to:', php_webhook_url);
				console.log('📋 PHP Payload:', JSON.stringify(notificationPayload, null, 2));
				
				// Enhanced fetch with timeout and better error handling
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
				
				const phpResponse = await fetch(php_webhook_url, {
					method: 'POST',
					headers: { 
						'Content-Type': 'application/json',
						'User-Agent': 'Netlify-Function/1.0',
						'Accept': 'application/json, text/plain, */*',
						'Cache-Control': 'no-cache'
					},
					body: JSON.stringify(notificationPayload),
					signal: controller.signal,
					// Disable SSL verification for testing (NOT for production)
					// This helps with SSL certificate issues
				});
				
				clearTimeout(timeoutId);
				
				console.log('📡 PHP Response Status:', phpResponse.status);
				console.log('📡 PHP Response OK:', phpResponse.ok);
				console.log('📡 PHP Response StatusText:', phpResponse.statusText);
				console.log('📡 PHP Response Headers:', Object.fromEntries([...phpResponse.headers.entries()]));
				
				const responseText = await phpResponse.text();
				console.log('📄 PHP Raw Response:', responseText);
				console.log('📏 PHP Response Length:', responseText.length);
				
				try {
					phpResult = JSON.parse(responseText);
					console.log('✅ PHP JSON Response:', phpResult);
				} catch (parseError) {
					console.log('⚠️ PHP response is not JSON:', parseError.message);
					phpResult = { 
						success: phpResponse.ok,
						raw_response: responseText,
						status: phpResponse.status,
						headers: Object.fromEntries([...phpResponse.headers.entries()])
					};
				}
				
			} catch (phpError) {
				console.error('🚨 PHP Request Failed:', phpError.message);
				console.error('🚨 PHP Error Name:', phpError.name);
				console.error('🚨 PHP Error Stack:', phpError.stack);
				
				// Better error categorization
				let errorCategory = 'unknown';
				if (phpError.name === 'AbortError') {
					errorCategory = 'timeout';
				} else if (phpError.message.includes('getaddrinfo ENOTFOUND')) {
					errorCategory = 'dns_resolution';
				} else if (phpError.message.includes('ECONNREFUSED')) {
					errorCategory = 'connection_refused';
				} else if (phpError.message.includes('certificate')) {
					errorCategory = 'ssl_certificate';
				} else if (phpError.message.includes('fetch failed')) {
					errorCategory = 'network_error';
				}
				
				console.error('🔍 Error Category:', errorCategory);
				
				phpResult = { 
					error: phpError.message,
					error_type: phpError.constructor.name,
					error_name: phpError.name,
					error_category: errorCategory,
					attempted_url: php_webhook_url
				};
			}
		} else {
			console.log('⚠️ PHP webhook skipped - invalid URL:', php_webhook_url);
			phpResult = { 
				skipped: true, 
				reason: 'Invalid or placeholder webhook URL',
				provided_url: php_webhook_url
			};
		}

		// 🔧 Generate proper Midtrans date format: yyyy-MM-dd hh:mm:ss Z
		const now = new Date();
		const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7 for Jakarta
		const midtransDate = jakartaTime.toISOString().slice(0, 19).replace('T', ' ') + ' +0700';
		
		console.log('📅 Midtrans date format:', midtransDate);

		// Midtrans API call
		const midtransParams = {
			transaction_details: {
				order_id: orderId,
				gross_amount: finalAmount
			},
			credit_card: {
				secure: true
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
			// ✅ CORRECT Midtrans date format
			expiry: {
				start_time: midtransDate,
				unit: "hour",
				duration: 24
			}
		};

		const apiUrl = 'https://app.midtrans.com/snap/v1/transactions';
		const serverKey = 'Mid-server-kO-tU3T7Q9MYO_25tJTggZeu';
		const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

		console.log('🔗 Calling Midtrans API...');

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
		
		console.log('📡 Midtrans response status:', response.status);
		console.log('📡 Midtrans response:', JSON.stringify(responseData, null, 2));

		if (response.ok && responseData.token) {
			console.log('✅ Success - token generated');
			
			const successResponse = {
				success: true,
				data: {
					token: responseData.token,
					redirect_url: responseData.redirect_url,
					order_id: orderId,
					amount: finalAmount,
					auto_redirect: auto_redirect || false,
					midtrans_response: responseData,
					php_notification: phpResult
				}
			};
			
			return {
				statusCode: 200,
				headers,
				body: JSON.stringify(successResponse)
			};
		} else {
			console.error('❌ Midtrans error:', responseData);
			
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
	} catch (error) {
		console.error('🚨 Function error:', error);
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
