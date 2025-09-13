// netlify/functions/midtrans-token.js - ArtCom Design Payment System v6.0 - 34 CHARACTER SUPPORT
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

    console.log('🚀 ARTCOM PAYMENT SYSTEM v6.0 - 34 CHAR SUPPORT - Method:', event.httpMethod);
    console.log('🌐 Origin:', event.headers.origin || 'No origin');

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        console.log('✅ CORS Preflight - returning 200');
        return { 
            statusCode: 200, 
            headers,
            body: JSON.stringify({ 
                message: 'CORS preflight successful',
                timestamp: Math.floor(Date.now() / 1000),
                function_version: 'artcom_v6.0_34char'
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
            order_id,  
            auto_redirect, 
            referrer, 
            user_agent, 
            origin,
            payment_source = 'legacy',
            wix_ref,
            wix_expiry,
            wix_signature
        } = requestData;

        const finalAmount = parseInt(String(amount).replace(/[^\d]/g, ''), 10);
        const finalItemName = item_name || 'ArtCom Design Payment';
        
        console.log('💰 Parsed amount:', finalAmount);
        console.log('🎯 Order ID:', order_id);
        console.log('🎨 Payment source:', payment_source);
        console.log('📏 Order ID length:', order_id ? order_id.length : 0);
        
        if (payment_source === 'wix') {
            console.log('🛒 Wix parameters:', { wix_ref, wix_expiry, wix_signature });
        }
        
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

        // *** UPDATED: 34 CHARACTER TOKEN VALIDATION ***
        if (payment_source === 'legacy') {
            // Legacy system: validate 34-char ARTCOM_ token
            console.log('🔍 Validating legacy token...');
            console.log('Token length:', order_id ? order_id.length : 0);
            console.log('Starts with ARTCOM_:', order_id ? order_id.startsWith('ARTCOM_') : false);
            
            if (!order_id || order_id.length !== 34 || !order_id.startsWith('ARTCOM_')) {
                console.error('❌ Invalid legacy token:', order_id);
                console.error('❌ Length:', order_id ? order_id.length : 'undefined');
                console.error('❌ Starts with ARTCOM_:', order_id ? order_id.startsWith('ARTCOM_') : false);
                
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'Invalid 34-character token format for legacy system', 
                        received: order_id,
                        received_length: order_id ? order_id.length : 0,
                        expected: 'ARTCOM_ + 27 characters = 34 total',
                        validation_details: {
                            has_order_id: !!order_id,
                            actual_length: order_id ? order_id.length : 0,
                            expected_length: 34,
                            starts_with_artcom: order_id ? order_id.startsWith('ARTCOM_') : false,
                            function_version: 'artcom_v6.0_34char'
                        }
                    })
                };
            }
            console.log('✅ Legacy token validation passed');
        } else if (payment_source === 'wix' || payment_source === 'wix_simple') {
            // Wix system: validate ARTCOM_ order ID  
            if (!order_id || !order_id.startsWith('ARTCOM_')) {
                console.error('❌ Invalid Wix order ID:', order_id);
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'Invalid order ID format for Wix system', 
                        received: order_id,
                        expected: 'ARTCOM_ + reference'
                    })
                };
            }
        } else {
            // Fallback: basic order ID validation
            if (!order_id || order_id.length < 5) {
                console.error('❌ Invalid order ID:', order_id);
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'Invalid order ID', 
                        received: order_id
                    })
                };
            }
        }
        
        console.log('✅ All validations passed - Payment source:', payment_source);

        // Generate Midtrans date format
        const now = new Date();
        const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
        const midtransDate = jakartaTime.toISOString().slice(0, 19).replace('T', ' ') + ' +0700';
        
        console.log('📅 Midtrans date format:', midtransDate);

        // Prepare Midtrans API call
        const midtransParams = {
            transaction_details: {
                order_id: order_id,
                gross_amount: finalAmount
            },
            credit_card: {
                secure: true
            },
            item_details: [
                {
                    id: payment_source === 'wix' ? 'ARTCOM_WIX' : 'ARTCOM_LEGACY',
                    price: finalAmount,
                    quantity: 1,
                    name: finalItemName
                }
            ],
            customer_details: {
                first_name: 'ArtCom',
                last_name: 'Customer',
                email: 'customer@artcom.design',
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
            custom_field2: payment_source,
            custom_field3: Math.floor(Date.now() / 1000).toString(),
            // Webhook callback URL - Legacy token ise nextpays.de, yoksa artcom.design
            callbacks: {
                finish: (payment_source === 'legacy' && order_id.startsWith('ARTCOM_') && order_id.length === 34)
                    ? 'https://nextpays.de/webhook/payment_complete.php?order_id=' + order_id
                    : 'https://www.artcom.design/webhook/payment_complete.php?order_id=' + order_id
            }
        };

        // Add Wix-specific data if available
        if (payment_source === 'wix' && wix_ref) {
            midtransParams.custom_expiry = wix_expiry;
            midtransParams.custom_reference = wix_ref;
        }

        // Send webhook notification
        console.log('📤 Sending webhook notification...');
        try {
            // Legacy token ise nextpays.de, yoksa artcom.design
            const webhookUrl = (payment_source === 'legacy' && order_id.startsWith('ARTCOM_') && order_id.length === 34)
                ? 'https://nextpays.de/webhook/midtrans.php'
                : 'https://www.artcom.design/webhook/midtrans.php';

            console.log('📡 Webhook URL:', webhookUrl);

            const webhookData = {
                event: `payment_initiated_${payment_source}`,
                order_id: order_id,
                amount: finalAmount,
                item_name: finalItemName,
                status: 'PENDING',
                timestamp: new Date().toISOString(),
                timestamp_unix: Math.floor(Date.now() / 1000),
                payment_source: payment_source,
                request_details: {
                    referrer: referrer,
                    user_agent: user_agent,
                    origin: origin,
                    function_version: 'artcom_v6.0_34char'
                },
                system_info: {
                    method: payment_source,
                    token_format: payment_source === 'legacy' ? '34_character_artcom' : 'artcom_reference',
                    token_length: order_id ? order_id.length : 0,
                    webhook_target: webhookUrl.includes('nextpays.de') ? 'nextpay' : 'artcom',
                    processing_flow: payment_source === 'wix' 
                        ? 'wix->artcom->wordpress->netlify->midtrans'
                        : 'nextpay_legacy->34char_token->artcom->wordpress->netlify->midtrans->nextpay_webhook'
                }
            };

            // Add Wix-specific webhook data
            if (payment_source === 'wix') {
                webhookData.wix_data = {
                    reference: wix_ref,
                    expiry: wix_expiry,
                    signature: wix_signature
                };
            }

            const webhookResponse = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'User-Agent': 'ArtCom-Payment-Function-v6.0-34char'
                },
                body: JSON.stringify(webhookData)
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

        console.log('🔗 Calling Midtrans API...');
        console.log('🔗 Order ID:', order_id);
        console.log('🔗 Amount IDR:', finalAmount);
        console.log('🔗 Payment source:', payment_source);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: authHeader,
                'User-Agent': 'ArtCom-Payment-Function-v6.0-34char'
            },
            body: JSON.stringify(midtransParams)
        });

        const responseData = await response.json();
        
        console.log('📡 Midtrans response status:', response.status);
        console.log('📡 Has token:', !!responseData.token);
        console.log('📡 Has redirect_url:', !!responseData.redirect_url);

        if (response.ok && responseData.token) {
            console.log('✅ SUCCESS - ArtCom payment created (34-char support)');
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: {
                        token: responseData.token,
                        redirect_url: responseData.redirect_url,
                        order_id: order_id,
                        amount: finalAmount,
                        auto_redirect: auto_redirect || false,
                        expiry_duration: '30 minutes',
                        midtrans_response: responseData,
                        timestamp: Math.floor(Date.now() / 1000),
                        function_version: 'artcom_v6.0_34char',
                        payment_source: payment_source,
                        debug_info: {
                            order_id: order_id,
                            order_id_length: order_id ? order_id.length : 0,
                            amount_idr: finalAmount,
                            system: payment_source,
                            callback_url: (payment_source === 'legacy' && order_id.startsWith('ARTCOM_') && order_id.length === 34)
                                ? 'https://nextpays.de/webhook/payment_complete.php'
                                : 'https://www.artcom.design/webhook/payment_complete.php',
                            webhook_notification_sent: true,
                            company: payment_source === 'legacy' ? 'NextPay (via ArtCom)' : 'ArtCom Design',
                            token_validation: '34_character_support'
                        },
                        // Wix-specific data
                        ...(payment_source === 'wix' && {
                            wix_info: {
                                reference: wix_ref,
                                expiry: wix_expiry,
                                signature: wix_signature
                            }
                        })
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
                        function_version: 'artcom_v6.0_34char',
                        payment_source: payment_source,
                        order_id_length: order_id ? order_id.length : 0,
                        token_validation: '34_character_support'
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
                function_version: 'artcom_v6.0_34char'
            })
        };
    }
};
