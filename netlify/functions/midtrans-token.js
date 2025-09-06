// netlify/functions/midtrans-token.js - 32 CHARACTER TOKEN SYSTEM v1.0
exports.handler = async function(event, context) {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With, Origin, User-Agent, Referer',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, PUT, DELETE',
        'Access-Control-Allow-Credentials': 'false',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
        'Vary': 'Origin, Access-Control-Request-Headers'
    };

    console.log('🚀 32-CHAR TOKEN FUNCTION v1.0 - Method:', event.httpMethod);
    console.log('🌍 Origin:', event.headers.origin || 'No origin');

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        console.log('✅ CORS Preflight - returning 200');
        return { 
            statusCode: 200, 
            headers,
            body: JSON.stringify({ 
                message: 'CORS preflight successful',
                timestamp: Math.floor(Date.now() / 1000),
                function_version: '32_char_token_v1.0'
            })
        };
    }

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        console.log('❌ Method not allowed:', event.httpMethod);
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Method not allowed',
                allowed_methods: ['POST', 'OPTIONS']
            })
        };
    }

    try {
        const requestData = JSON.parse(event.body || '{}');
        const { 
            amount, 
            item_name,
            order_id,  // This will be the 32-char NEXT_ token
            auto_redirect, 
            referrer, 
            user_agent, 
            origin,
            decoded_data
        } = requestData;

        const finalAmount = parseInt(String(amount).replace(/[^\d]/g, ''), 10);
        const finalItemName = item_name || 'NextPay 32-Char Payment';
        
        console.log('💰 Parsed amount:', finalAmount);
        console.log('🎯 Order ID (32-char NEXT_ token):', order_id);
        console.log('🎯 Has decoded data:', !!decoded_data);
        
        // Validate amount
        if (!finalAmount || finalAmount <= 0 || finalAmount > 999999999) {
            console.error('❌ Invalid amount:', finalAmount);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Invalid amount: must be between 1 and 999,999,999', 
                    received: amount,
                    parsed: finalAmount 
                })
            };
        }

        // Validate 32-char token format
        if (!order_id || order_id.length !== 32 || !order_id.startsWith('NEXT_')) {
            console.error('❌ Invalid 32-char token:', order_id);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Invalid 32-character token format', 
                    received: order_id,
                    expected: 'NEXT_ + 27 characters = 32 total'
                })
            };
        }
        
        console.log('✅ Amount and token validation passed');
        console.log('🎯 Using 32-char NEXT_ token as order ID:', order_id);

        // Generate Midtrans date format
        const now = new Date();
        const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
        const midtransDate = jakartaTime.toISOString().slice(0, 19).replace('T', ' ') + ' +0700';
        
        console.log('📅 Midtrans date format:', midtransDate);

        // Prepare Midtrans API call
        const midtransParams = {
            transaction_details: {
                order_id: order_id, // Use 32-char NEXT_ token as order_id
                gross_amount: finalAmount
            },
            credit_card: {
                secure: true
            },
            item_details: [
                {
                    id: 'ITEM_32CHAR',
                    price: finalAmount,
                    quantity: 1,
                    name: finalItemName
                }
            ],
            customer_details: {
                first_name: 'NextPay',
                last_name: 'Customer',
                email: 'customer@nextpay.com',
                phone: '08123456789'
            },
            enabled_payments: [
                'credit_card', 'gopay', 'shopeepay', 'other_qris',
                'bank_transfer', 'echannel', 'permata_va', 'bca_va', 'bni_va', 'bri_va', 'other_va'
            ],
            expiry: {
                start_time: midtransDate,
                unit: "minute", 
                duration: 30
            },
            custom_field1: order_id,
            custom_field2: 'token_32_system',
            custom_field3: Math.floor(Date.now() / 1000).toString(),
            // Webhook callback URL
            callbacks: {
                finish: 'https://nextpays.de/webhook/payment_complete.php?order_id=' + order_id
            }
        };

        // Send webhook notification to NextPay
        console.log('📤 Sending webhook notification to NextPay...');
        try {
            const webhookResponse = await fetch('https://nextpays.de/webhook/midtrans.php', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'User-Agent': 'NextPay-32Char-Function-v1.0'
                },
                body: JSON.stringify({
                    event: 'payment_initiated_32_char_token',
                    order_id: order_id,
                    amount: finalAmount,
                    item_name: finalItemName,
                    status: 'PENDING',
                    timestamp: new Date().toISOString(),
                    timestamp_unix: Math.floor(Date.now() / 1000),
                    decoded_data: decoded_data,
                    request_details: {
                        referrer: referrer,
                        user_agent: user_agent,
                        origin: origin,
                        function_version: '32_char_token_v1.0'
                    },
                    system_info: {
                        token_format: '32_character',
                        token_length: order_id ? order_id.length : 0,
                        token_source: '32_char_nextpay_system',
                        processing_flow: 'nextpay->32char_encode->pay_local->wordpress->decode->netlify->midtrans'
                    }
                })
            });
            
            const webhookText = await webhookResponse.text();
            console.log('📡 Webhook response status:', webhookResponse.status);
            console.log('📡 Webhook response length:', webhookText.length);
            
        } catch (webhookError) {
            console.error('🚨 Webhook notification failed:', webhookError.message);
        }

        // Call Midtrans API
        const apiUrl = 'https://app.midtrans.com/snap/v1/transactions';
        const serverKey = 'Mid-server-kO-tU3T7Q9MYO_25tJTggZeu';
        const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

        console.log('🔗 Calling Midtrans API with 32-char token data...');
        console.log('🔗 Order ID (32-char NEXT_ token):', order_id);
        console.log('🔗 Amount IDR:', finalAmount);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: authHeader,
                'User-Agent': 'NextPay-32Char-Function-v1.0'
            },
            body: JSON.stringify(midtransParams)
        });

        const responseData = await response.json();
        
        console.log('📡 Midtrans response status:', response.status);
        console.log('📡 Has token:', !!responseData.token);
        console.log('📡 Has redirect_url:', !!responseData.redirect_url);

        if (response.ok && responseData.token) {
            console.log('✅ SUCCESS - 32-char token payment created');
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: {
                        token: responseData.token,
                        redirect_url: responseData.redirect_url,
                        order_id: order_id, // This is the 32-char NEXT_ token
                        amount: finalAmount,
                        auto_redirect: auto_redirect || false,
                        expiry_duration: '30 minutes',
                        midtrans_response: responseData,
                        timestamp: Math.floor(Date.now() / 1000),
                        function_version: '32_char_token_v1.0',
                        token_system: '32_character',
                        debug_info: {
                            token_32: order_id,
                            token_length: order_id ? order_id.length : 0,
                            amount_idr: finalAmount,
                            system: '32_character_token_system',
                            encoding_method: 'base36_with_timestamp_and_hash',
                            callback_url: 'https://nextpays.de/webhook/payment_complete.php',
                            webhook_notification_sent: true
                        }
                    }
                })
            };
        } else {
            console.error('❌ Midtrans error response');
            console.error('❌ Error details:', responseData);
            
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Failed to generate payment token',
                    details: responseData,
                    midtrans_status: response.status,
                    debug_info: {
                        order_id: order_id,
                        amount: finalAmount,
                        function_version: '32_char_token_v1.0',
                        token_length: order_id ? order_id.length : 0
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
                timestamp: Math.floor(Date.now() / 1000),
                function_version: '32_char_token_v1.0'
            })
        };
    }
};
