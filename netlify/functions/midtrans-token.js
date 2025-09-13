// netlify/functions/midtrans-token.js - ArtCom Design Payment System v6.4 - DETERMINISTIC VERSION
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

    console.log('🚀 ARTCOM PAYMENT SYSTEM v6.4 - DETERMINISTIC - Method:', event.httpMethod);
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
                function_version: 'artcom_v6.4_deterministic'
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

    // Deterministic Customer Data Generator - Same name always generates same phone & email
    function generateDeterministicContact(name) {
        // Input validation
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return {
                first_name: 'Customer',
                last_name: 'ArtCom',
                email: 'customer@gmail.com',
                phone: '+628123456789'
            };
        }

        // Clean and normalize name
        const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
        
        // Simple but effective hash function (same input = same output)
        function simpleHash(str) {
            let hash = 5381;
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) + hash) + str.charCodeAt(i);
                hash = hash & hash; // Convert to 32-bit integer
            }
            return Math.abs(hash);
        }

        // Seeded random function (deterministic)
        function seededRandom(seed) {
            const x = Math.sin(seed) * 10000;
            return x - Math.floor(x);
        }

        // Generate base hash from name
        const baseHash = simpleHash(cleanName);
        
        // Parse name parts
        const nameParts = cleanName.split(' ').filter(part => part.length > 0);
        const firstName = nameParts[0] || 'customer';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'artcom';
        
        // Capitalize first letter of each part
        function capitalize(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        const finalFirstName = capitalize(firstName);
        const finalLastName = capitalize(lastName);

        // Generate phone number (deterministic)
        const phoneSeed = baseHash % 1000000;
        const phoneRandom1 = seededRandom(phoneSeed);
        const phoneRandom2 = seededRandom(phoneSeed + 1);
        const phoneRandom3 = seededRandom(phoneSeed + 2);
        
        // Country codes with probabilities (deterministic selection)
        const countryCodes = [
            { code: '+62', weight: 30 }, // Indonesia
            { code: '+90', weight: 15 }, // Turkey
            { code: '+1', weight: 10 },  // US/Canada
            { code: '+7', weight: 8 },   // Russia/Kazakhstan
            { code: '+91', weight: 8 },  // India
            { code: '+44', weight: 5 },  // UK
            { code: '+49', weight: 5 },  // Germany
            { code: '+33', weight: 5 },  // France
            { code: '+81', weight: 4 },  // Japan
            { code: '+82', weight: 4 },  // South Korea
            { code: '+86', weight: 3 },  // China
            { code: '+55', weight: 3 }   // Brazil
        ];
        
        // Select country code deterministically
        let totalWeight = countryCodes.reduce((sum, c) => sum + c.weight, 0);
        let randomWeight = Math.floor(phoneRandom1 * totalWeight);
        let selectedCountryCode = '+62'; // default
        
        let currentWeight = 0;
        for (const country of countryCodes) {
            currentWeight += country.weight;
            if (randomWeight < currentWeight) {
                selectedCountryCode = country.code;
                break;
            }
        }
        
        // Generate phone number digits
        const phoneNum1 = Math.floor(phoneRandom2 * 900) + 100; // 3 digits
        const phoneNum2 = Math.floor(phoneRandom3 * 900000) + 100000; // 6 digits
        const phone = `${selectedCountryCode}${phoneNum1}${phoneNum2}`;

        // Generate email (deterministic)
        const emailSeed = baseHash % 500000;
        const emailRandom1 = seededRandom(emailSeed + 10);
        const emailRandom2 = seededRandom(emailSeed + 20);
        
        // Email domains with weights
        const emailDomains = [
            { domain: 'gmail.com', weight: 35 },
            { domain: 'yahoo.com', weight: 20 },
            { domain: 'hotmail.com', weight: 15 },
            { domain: 'outlook.com', weight: 10 },
            { domain: 'icloud.com', weight: 5 },
            { domain: 'protonmail.com', weight: 5 },
            { domain: 'yandex.com', weight: 5 },
            { domain: 'mail.ru', weight: 5 }
        ];
        
        // Select email domain deterministically
        let emailTotalWeight = emailDomains.reduce((sum, d) => sum + d.weight, 0);
        let emailRandomWeight = Math.floor(emailRandom1 * emailTotalWeight);
        let selectedDomain = 'gmail.com'; // default
        
        let emailCurrentWeight = 0;
        for (const domain of emailDomains) {
            emailCurrentWeight += domain.weight;
            if (emailRandomWeight < emailCurrentWeight) {
                selectedDomain = domain.domain;
                break;
            }
        }
        
        // Create email prefix (deterministic)
        const emailPrefix = firstName.slice(0, 4) + 
                           lastName.slice(0, 3) + 
                           Math.floor(emailRandom2 * 999).toString().padStart(3, '0');
        
        const email = `${emailPrefix}@${selectedDomain}`;

        // Return consistent result
        return {
            first_name: finalFirstName,
            last_name: finalLastName,
            email: email,
            phone: phone
        };
    }

    // Generate fallback customer name when no custom_name provided
    function generateFallbackName(order_id, amount) {
        // Use order_id and amount as seed for consistent fallback names
        const seed = simpleHash((order_id || 'default') + (amount || '1000').toString());
        
        const fallbackNames = [
            'Customer ArtCom', 'User Payment', 'Client Design', 'Buyer Digital',
            'Guest Service', 'Member Premium', 'Order Client', 'Payment User'
        ];
        
        const selectedName = fallbackNames[seed % fallbackNames.length];
        return selectedName;
        
        function simpleHash(str) {
            let hash = 5381;
            for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) + hash) + str.charCodeAt(i);
                hash = hash & hash;
            }
            return Math.abs(hash);
        }
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
            wix_signature,
            custom_name
        } = requestData;

        const finalAmount = parseInt(String(amount).replace(/[^\d]/g, ''), 10);
        const finalItemName = item_name || 'ArtCom Design Payment';
        
        console.log('💰 Parsed amount:', finalAmount);
        console.log('🎯 Order ID:', order_id);
        console.log('🎨 Payment source:', payment_source);
        console.log('👤 Custom name:', custom_name);
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

        // *** 34 CHARACTER TOKEN VALIDATION ***
        if (payment_source === 'legacy') {
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
                            function_version: 'artcom_v6.4_deterministic'
                        }
                    })
                };
            }
            console.log('✅ Legacy token validation passed');
        } else if (payment_source === 'wix' || payment_source === 'wix_simple') {
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

        // DETERMINISTIC CUSTOMER DATA GENERATION
        let customerData;
        let nameForGeneration;
        
        if (custom_name && typeof custom_name === 'string' && custom_name.trim()) {
            nameForGeneration = custom_name.trim();
            console.log('👤 Using provided custom name:', nameForGeneration);
        } else {
            nameForGeneration = generateFallbackName(order_id, finalAmount);
            console.log('🎯 Generated fallback name:', nameForGeneration);
        }
        
        // Generate deterministic customer data
        customerData = generateDeterministicContact(nameForGeneration);
        
        console.log('✅ Deterministic customer data generated:', {
            input_name: nameForGeneration,
            output_name: `${customerData.first_name} ${customerData.last_name}`,
            email: customerData.email,
            phone: customerData.phone,
            method: 'deterministic_algorithm'
        });

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
            customer_details: customerData,
            enabled_payments: [
                'credit_card', 'gopay', 'shopeepay', 'other_qris',
                'bank_transfer', 'echannel', 'permata_va', 'bca_va', 'bni_va', 'bri_va', 'other_va'
            ],
            expiry: {
                start_time: midtransDate,
                unit: "minute", 
                duration: 15
            },
            custom_field1: order_id,
            custom_field2: payment_source,
            custom_field3: Math.floor(Date.now() / 1000).toString(),
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
                customer_data: customerData,
                request_details: {
                    referrer: referrer,
                    user_agent: user_agent,
                    origin: origin,
                    custom_name: custom_name,
                    generated_name: nameForGeneration,
                    function_version: 'artcom_v6.4_deterministic'
                },
                system_info: {
                    method: payment_source,
                    token_format: payment_source === 'legacy' ? '34_character_artcom' : 'artcom_reference',
                    token_length: order_id ? order_id.length : 0,
                    webhook_target: webhookUrl.includes('nextpays.de') ? 'nextpay' : 'artcom',
                    processing_flow: payment_source === 'wix' 
                        ? 'wix->artcom->wordpress->netlify->midtrans'
                        : 'nextpay_legacy->34char_token->artcom->wordpress->netlify->midtrans->nextpay_webhook',
                    customer_generation: 'deterministic_algorithm',
                    random_customer_enabled: false
                }
            };

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
                    'User-Agent': 'ArtCom-Payment-Function-v6.4-deterministic'
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
        console.log('👤 Customer:', `${customerData.first_name} ${customerData.last_name} (${customerData.email})`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: authHeader,
                'User-Agent': 'ArtCom-Payment-Function-v6.4-deterministic'
            },
            body: JSON.stringify(midtransParams)
        });

        const responseData = await response.json();
        
        console.log('📡 Midtrans response status:', response.status);
        console.log('📡 Has token:', !!responseData.token);
        console.log('📡 Has redirect_url:', !!responseData.redirect_url);

        if (response.ok && responseData.token) {
            console.log('✅ SUCCESS - ArtCom payment created with deterministic customer data');
            
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
                        expiry_duration: '15 minutes',
                        midtrans_response: responseData,
                        timestamp: Math.floor(Date.now() / 1000),
                        function_version: 'artcom_v6.4_deterministic',
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
                            token_validation: '34_character_support',
                            customer_data: customerData,
                            customer_generation_method: 'deterministic_algorithm',
                            input_name: nameForGeneration,
                            custom_name_provided: !!custom_name,
                            random_customer_enabled: false
                        },
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
                        function_version: 'artcom_v6.4_deterministic',
                        payment_source: payment_source,
                        order_id_length: order_id ? order_id.length : 0,
                        token_validation: '34_character_support',
                        customer_generation_method: 'deterministic_algorithm_with_credit_card',
                        custom_name_provided: !!custom_name,
                        credit_card_provided: !!credit_card,
                        random_customer_enabled: false
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
                function_version: 'artcom_v6.4_deterministic'
            })
        };
    }
};
