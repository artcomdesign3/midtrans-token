// netlify/functions/midtrans-token.js - UPDATED CALLBACK URL v2.1
exports.handler = async function(event, context) {
    // ENHANCED CORS HEADERS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With, Origin, User-Agent, Referer',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, PUT, DELETE',
        'Access-Control-Allow-Credentials': 'false',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
        'Vary': 'Origin, Access-Control-Request-Headers'
    };

    console.log('🚀 FUNCTION CALLED v2.1 - Method:', event.httpMethod);
    console.log('🌐 Origin:', event.headers.origin || 'No origin');

    // HANDLE PREFLIGHT
    if (event.httpMethod === 'OPTIONS') {
        console.log('✅ CORS Preflight - returning 200');
        return { 
            statusCode: 200, 
            headers,
            body: JSON.stringify({ 
                message: 'CORS preflight successful',
                timestamp: Math.floor(Date.now() / 1000),
                function_version: 'webhook_v2.1'
            })
        };
    }

    // ONLY ALLOW POST REQUESTS
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
            php_webhook_url, 
            auto_redirect, 
            referrer, 
            user_agent, 
            origin,
            short_token,
            unique_payment_id,
            full_decrypted_data
        } = requestData;

        const finalAmount = parseInt(String(amount).replace(/[^\d]/g, ''), 10);
        const finalItemName = item_name || 'NextPay Payment';
        
        console.log('💰 Parsed amount:', finalAmount);
        console.log('🎯 Has short_token:', !!short_token);
        console.log('🎯 Has unique_payment_id:', !!unique_payment_id);
        
        // VALIDATE AMOUNT
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

        // GENERATE UNIQUE ORDER ID
        const timestamp = Math.floor(Date.now() / 1000);
        const random = Math.random().toString(36).slice(2, 9).toUpperCase();
        const baseId = unique_payment_id ? unique_payment_id.slice(-10) : short_token ? short_token.slice(2, 12) : 'DEFAULT';
        const orderId = `MID_${baseId}_${timestamp}_${random}`;
        
        console.log('🎯 Generated order ID:', orderId);

        // SEND NOTIFICATION TO PHP WEBHOOK
        let phpResult = { skipped: true };
        if (php_webhook_url && php_webhook_url.startsWith('https://nextpays.de/')) {
            const notificationPayload = {
                event: 'payment_initiated',
                order_id: orderId,
                amount: finalAmount,
                item_name: finalItemName,
                status: 'PENDING',
                auto_redirect: auto_redirect || false,
                timestamp: new Date().toISOString(),
                timestamp_unix: Math.floor(Date.now() / 1000),
                short_token: short_token || null,
                unique_payment_id: unique_payment_id || null,
                decrypted_user_data: full_decrypted_data || null,
                request_details: {
                    referrer: referrer,
                    user_agent: user_agent,
                    origin: origin,
                    ip: event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'netlify_function'
                }
            };

            console.log('📤 Sending to PHP webhook:', php_webhook_url);
            
            try {
                const phpResponse = await fetch(php_webhook_url, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'User-Agent': 'NextPay-Netlify-Function-v2.1'
                    },
                    body: JSON.stringify(notificationPayload)
                });
                
                console.log('📡 PHP Response Status:', phpResponse.status);
                
                const responseText = await phpResponse.text();
                console.log('📄 PHP Response length:', responseText.length);
                
                try {
                    phpResult = JSON.parse(responseText);
                    console.log('✅ PHP JSON Response received');
                } catch (parseError) {
                    console.log('⚠️ PHP response is not JSON');
                    phpResult = { 
                        success: phpResponse.ok,
                        raw_response: responseText.substring(0, 200),
                        status: phpResponse.status
                    };
                }
                
            } catch (phpError) {
                console.error('🚨 PHP Request Failed:', phpError.message);
                phpResult = { 
                    error: phpError.message,
                    failed: true
                };
            }
        }

        // GENERATE MIDTRANS DATE FORMAT
        const now = new Date();
        const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
        const midtransDate = jakartaTime.toISOString().slice(0, 19).replace('T', ' ') + ' +0700';
        
        console.log('📅 Midtrans date format:', midtransDate);

        // PREPARE MIDTRANS API CALL WITH UPDATED CALLBACK URL
        const customer_name = full_decrypted_data?.user_name || 'NextPay Customer';
        const customer_first = customer_name.split(' ')[0] || 'NextPay';
        const customer_last = customer_name.split(' ').slice(1).join(' ') || 'Customer';

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
                    name: finalItemName
                }
            ],
            customer_details: {
                first_name: customer_first,
                last_name: customer_last,
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
            custom_field1: unique_payment_id || 'not_set',
            custom_field2: short_token || 'not_set',
            custom_field3: Math.floor(Date.now() / 1000).toString(),
            // UPDATED: WEBHOOK FOLDER CALLBACK URL
            callbacks: {
                finish: 'https://nextpays.de/webhook/payment_complete.php?order_id=' + orderId
            }
        };

        // CALL MIDTRANS API
        const apiUrl = 'https://app.midtrans.com/snap/v1/transactions';
        const serverKey = 'Mid-server-kO-tU3T7Q9MYO_25tJTggZeu';
        const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

        console.log('🔗 Calling Midtrans API with WEBHOOK FOLDER callback...');
        console.log('🔗 Callback URL: https://nextpays.de/webhook/payment_complete.php?order_id=' + orderId);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: authHeader,
                'User-Agent': 'NextPay-Netlify-Function-v2.1'
            },
            body: JSON.stringify(midtransParams)
        });

        const responseData = await response.json();
        
        console.log('📡 Midtrans response status:', response.status);
        console.log('📡 Has token:', !!responseData.token);
        console.log('📡 Has redirect_url:', !!responseData.redirect_url);

        if (response.ok && responseData.token) {
            console.log('✅ SUCCESS - Payment token generated with WEBHOOK FOLDER callback');
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: {
                        token: responseData.token,
                        redirect_url: responseData.redirect_url,
                        order_id: orderId,
                        amount: finalAmount,
                        auto_redirect: auto_redirect || false,
                        expiry_duration: '30 minutes',
                        midtrans_response: responseData,
                        php_notification: phpResult,
                        timestamp: Math.floor(Date.now() / 1000),
                        function_version: 'webhook_v2.1',
                        callback_url: 'https://nextpays.de/webhook/payment_complete.php',
                        webhook_configured: true,
                        debug_info: {
                            customer_name: customer_name,
                            unique_payment_id: unique_payment_id,
                            short_token: short_token ? short_token.substring(0, 10) + '...' : null,
                            callback_updated: true
                        }
                    }
                })
            };
        } else {
            console.error('❌ Midtrans error response');
            
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Failed to generate payment token',
                    details: responseData,
                    midtrans_status: response.status,
                    debug_info: {
                        order_id: orderId,
                        amount: finalAmount,
                        php_result: phpResult,
                        callback_url: 'https://nextpays.de/webhook/payment_complete.php'
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
                function_version: 'webhook_v2.1'
            })
        };
    }
};
