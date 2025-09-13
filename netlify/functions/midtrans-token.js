// netlify/functions/midtrans-token.js - ArtCom Design Payment System v6.3 - FIXED VERSION
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

    console.log('🚀 ARTCOM PAYMENT SYSTEM v6.3 - FIXED - Method:', event.httpMethod);
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
                function_version: 'artcom_v6.3_fixed'
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

    // Function to get random customer data
    async function getRandomCustomerData() {
        try {
            console.log('🎲 Fetching random customer data from global sources...');
            
            // Countries focused on Indonesia, Turkey, Central Asia, and global diversity
            const countries = [
                'id', 'tr', 'uz', 'kz', 'kg', 'tj', 'tm', 'ir', 'az', 'ru', 'pk', 'af', 'in', 'bd', 'my', 'sg', 'th', 'ph', 'vn',
                'de', 'fr', 'gb', 'us', 'ca', 'au', 'br', 'mx', 'ar', 'eg', 'ma', 'sa', 'ae', 'ng', 'za', 'jp', 'kr', 'cn'
            ];

            // Randomly select a country with higher probability for priority regions
            let selectedCountry;
            const random = Math.random();
            
            if (random < 0.15) { // 15% chance for Indonesia
                selectedCountry = 'id';
            } else if (random < 0.25) { // 10% chance for Turkey  
                selectedCountry = 'tr';
            } else if (random < 0.35) { // 10% chance for Central Asia
                const centralAsiaCountries = ['uz', 'kz', 'kg', 'tj', 'tm'];
                selectedCountry = centralAsiaCountries[Math.floor(Math.random() * centralAsiaCountries.length)];
            } else if (random < 0.50) { // 15% chance for related regions
                const relatedRegions = ['ir', 'az', 'pk', 'af', 'in', 'bd', 'my', 'sg', 'th', 'ph', 'vn', 'sa', 'ae', 'eg'];
                selectedCountry = relatedRegions[Math.floor(Math.random() * relatedRegions.length)];
            } else { // 50% chance for global diversity
                selectedCountry = countries[Math.floor(Math.random() * countries.length)];
            }

            console.log('🌍 Selected country for random user:', selectedCountry);
            
            // RandomUser.me API call with selected nationality
            const response = await fetch(`https://randomuser.me/api/?nat=${selectedCountry}&inc=name,email,phone,nat`, {
                method: 'GET',
                headers: {
                    'User-Agent': 'ArtCom-Payment-v6.3-Fixed'
                }
            });

            if (!response.ok) {
                throw new Error(`RandomUser API failed for country: ${selectedCountry}`);
            }

            const data = await response.json();
            const user = data.results[0];

            // Generate diverse email domains (NO artcom.design)
            const emailDomains = [
                'gmail.com', 'gmail.com', 'gmail.com', 'gmail.com', 'gmail.com', 'gmail.com', // 30% gmail
                'yahoo.com', 'yahoo.com', 'yahoo.com', 'yahoo.com', // 20% yahoo
                'hotmail.com', 'hotmail.com', 'hotmail.com', // 15% hotmail
                'outlook.com', 'outlook.com', 'outlook.com', // 15% outlook
                'icloud.com', // 5% icloud
                'protonmail.com', // 5% proton
                'yandex.com', // 5% yandex
                'mail.ru' // 5% mail.ru
            ];

            // Country-specific phone formatting with proper country codes
            const countryPhoneFormats = {
                'id': { code: '+62', format: (num) => `+62${num.startsWith('0') ? num.slice(1) : num}` },
                'tr': { code: '+90', format: (num) => `+90${num.startsWith('0') ? num.slice(1) : num}` },
                'uz': { code: '+998', format: (num) => `+998${num}` },
                'kz': { code: '+7', format: (num) => `+7${num}` },
                'kg': { code: '+996', format: (num) => `+996${num}` },
                'tj': { code: '+992', format: (num) => `+992${num}` },
                'tm': { code: '+993', format: (num) => `+993${num}` },
                'ir': { code: '+98', format: (num) => `+98${num}` },
                'az': { code: '+994', format: (num) => `+994${num}` },
                'ru': { code: '+7', format: (num) => `+7${num}` },
                'pk': { code: '+92', format: (num) => `+92${num}` },
                'af': { code: '+93', format: (num) => `+93${num}` },
                'in': { code: '+91', format: (num) => `+91${num}` },
                'bd': { code: '+880', format: (num) => `+880${num}` },
                'my': { code: '+60', format: (num) => `+60${num}` },
                'sg': { code: '+65', format: (num) => `+65${num}` },
                'th': { code: '+66', format: (num) => `+66${num}` },
                'ph': { code: '+63', format: (num) => `+63${num}` },
                'vn': { code: '+84', format: (num) => `+84${num}` },
                'sa': { code: '+966', format: (num) => `+966${num}` },
                'ae': { code: '+971', format: (num) => `+971${num}` },
                'eg': { code: '+20', format: (num) => `+20${num}` },
                'ma': { code: '+212', format: (num) => `+212${num}` },
                'us': { code: '+1', format: (num) => `+1${num}` },
                'ca': { code: '+1', format: (num) => `+1${num}` },
                'gb': { code: '+44', format: (num) => `+44${num}` },
                'de': { code: '+49', format: (num) => `+49${num}` },
                'fr': { code: '+33', format: (num) => `+33${num}` },
                'it': { code: '+39', format: (num) => `+39${num}` },
                'es': { code: '+34', format: (num) => `+34${num}` },
                'br': { code: '+55', format: (num) => `+55${num}` },
                'mx': { code: '+52', format: (num) => `+52${num}` },
                'ar': { code: '+54', format: (num) => `+54${num}` },
                'au': { code: '+61', format: (num) => `+61${num}` },
                'jp': { code: '+81', format: (num) => `+81${num}` },
                'kr': { code: '+82', format: (num) => `+82${num}` },
                'cn': { code: '+86', format: (num) => `+86${num}` }
            };

            // Format phone number with proper country codes
            let phone = user.phone || '08123456789';
            phone = phone.replace(/[^0-9]/g, ''); // Remove non-digits
            
            // Format phone based on country
            if (countryPhoneFormats[selectedCountry]) {
                const phoneFormat = countryPhoneFormats[selectedCountry];
                
                // Clean and format the phone number
                if (phone.length < 8) {
                    phone = phone.padEnd(8, '0');
                } else if (phone.length > 12) {
                    phone = phone.slice(0, 12);
                }
                
                // Remove country code if already present
                if (phone.startsWith(phoneFormat.code.replace('+', ''))) {
                    phone = phone.slice(phoneFormat.code.length - 1);
                }
                
                phone = phoneFormat.format(phone);
            } else {
                // Default fallback to Indonesian format
                if (phone.startsWith('62')) {
                    phone = '+62' + phone.slice(2);
                } else if (phone.startsWith('0')) {
                    phone = '+62' + phone.slice(1);
                } else {
                    phone = '+62' + phone;
                }
            }
            
            // Ensure phone is not too long
            if (phone.length > 17) {
                phone = phone.slice(0, 17);
            }

            // Clean and format email with diverse domains
            let email = user.email || `customer${Math.floor(Math.random() * 10000)}@gmail.com`;
            
            // Replace domain with random selection
            if (email.includes('@')) {
                const emailPrefix = email.split('@')[0];
                const randomDomain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
                email = `${emailPrefix}@${randomDomain}`;
            }

            const customerData = {
                first_name: user.name.first || 'Customer',
                last_name: user.name.last || 'ArtCom',
                email: email,
                phone: phone
            };

            console.log('✅ Global random customer generated:', {
                country: selectedCountry,
                name: `${customerData.first_name} ${customerData.last_name}`,
                email: customerData.email,
                phone: customerData.phone
            });

            return customerData;

        } catch (error) {
            console.warn('⚠️ RandomUser API failed, using enhanced fallback:', error.message);
            
            // Enhanced fallback with global names
            const globalNames = {
                // Indonesian names
                indonesian_first: ['Andi', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fitri', 'Gita', 'Hadi', 'Indra', 'Joko', 'Kartika', 'Linda', 'Made', 'Nita', 'Omar', 'Putri'],
                indonesian_last: ['Pratama', 'Sari', 'Putra', 'Dewi', 'Wijaya', 'Utami', 'Santoso', 'Kurniawan', 'Lestari', 'Nugroho'],
                
                // Turkish names
                turkish_first: ['Ahmet', 'Mehmet', 'Mustafa', 'Ayşe', 'Fatma', 'Emine', 'Hatice', 'Ali', 'Hüseyin', 'İbrahim', 'Zeynep', 'Elif', 'Merve', 'Büşra', 'Oğuz', 'Emre'],
                turkish_last: ['Yılmaz', 'Kaya', 'Demir', 'Çelik', 'Şahin', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kilic', 'Aslan', 'Çetin', 'Kara'],
                
                // Central Asian names
                central_asian_first: ['Azamat', 'Bekzat', 'Damir', 'Erlan', 'Farida', 'Gulnara', 'Husan', 'Jamshid', 'Kamila', 'Leyla', 'Maruf', 'Nodira', 'Otabek', 'Parviz', 'Rustam', 'Sevara'],
                central_asian_last: ['Abdullayev', 'Boboyev', 'Ergashev', 'Ibragimov', 'Karimov', 'Mirzayev', 'Nazarov', 'Rahimov', 'Saidov', 'Tashev', 'Umarov', 'Yusupov'],
                
                // Arabic names
                arabic_first: ['Ahmed', 'Mohammed', 'Omar', 'Fatima', 'Aisha', 'Khadija', 'Ali', 'Hassan', 'Hussein', 'Amina', 'Zahra', 'Layla', 'Yasmin', 'Nour', 'Sara', 'Rania'],
                arabic_last: ['Al-Ahmad', 'Al-Mohammed', 'Al-Hassan', 'Al-Ali', 'Al-Omar', 'Al-Rashid', 'Al-Mahmoud', 'Al-Khalil', 'Al-Mansour', 'Al-Zahra'],
                
                // Global mix
                global_first: ['Alexander', 'Elena', 'David', 'Maria', 'John', 'Anna', 'Michael', 'Sophia', 'Robert', 'Emma', 'James', 'Olivia', 'William', 'Isabella', 'Daniel', 'Mia'],
                global_last: ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Garcia', 'Rodriguez']
            };

            // Randomly select name origin
            const nameOrigins = ['indonesian', 'turkish', 'central_asian', 'arabic', 'global'];
            const selectedOrigin = nameOrigins[Math.floor(Math.random() * nameOrigins.length)];
            
            const firstName = globalNames[`${selectedOrigin}_first`][Math.floor(Math.random() * globalNames[`${selectedOrigin}_first`].length)];
            const lastName = globalNames[`${selectedOrigin}_last`][Math.floor(Math.random() * globalNames[`${selectedOrigin}_last`].length)];
            
            // Generate phone with proper country codes based on selected origin
            const phoneCountryCodes = {
                'indonesian': ['+62'],
                'turkish': ['+90'],
                'central_asian': ['+998', '+7', '+996', '+992', '+993'],
                'arabic': ['+966', '+971', '+20', '+212', '+962', '+964'],
                'global': ['+1', '+44', '+49', '+33', '+39', '+81', '+82', '+86', '+91', '+55', '+52', '+61']
            };
            
            const selectedCountryCode = phoneCountryCodes[selectedOrigin][Math.floor(Math.random() * phoneCountryCodes[selectedOrigin].length)];
            const randomNumber = Math.floor(Math.random() * 900000000) + 100000000;
            
            let phone;
            if (selectedOrigin === 'indonesian') {
                phone = `${selectedCountryCode}${randomNumber.toString().substring(0, 9)}`;
            } else if (selectedOrigin === 'turkish') {
                phone = `${selectedCountryCode}${randomNumber.toString().substring(0, 10)}`;
            } else {
                phone = `${selectedCountryCode}${randomNumber.toString().substring(0, 9)}`;
            }
            
            // Generate diverse email domains for fallback
            const fallbackEmailDomains = [
                'gmail.com', 'gmail.com', 'gmail.com', 'gmail.com', // 40% gmail
                'yahoo.com', 'yahoo.com', // 20% yahoo
                'hotmail.com', 'outlook.com', // 20% microsoft
                'icloud.com', 'protonmail.com' // 20% other
            ];
            
            const randomEmailDomain = fallbackEmailDomains[Math.floor(Math.random() * fallbackEmailDomains.length)];
            
            const emailPrefix = firstName.toLowerCase().replace(/[^a-zA-Z]/g, '') + 
                             lastName.toLowerCase().replace(/[^a-zA-Z]/g, '').substring(0, 3) + 
                             Math.floor(Math.random() * 1000);
            
            console.log('✅ Enhanced fallback customer generated:', {
                origin: selectedOrigin,
                name: `${firstName} ${lastName}`,
                email: `${emailPrefix}@${randomEmailDomain}`,
                phone: phone,
                country_code: selectedCountryCode
            });
            
            return {
                first_name: firstName,
                last_name: lastName,
                email: `${emailPrefix}@${randomEmailDomain}`,
                phone: phone
            };
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
                            function_version: 'artcom_v6.3_fixed'
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

        // Get random customer data
        const customerData = await getRandomCustomerData();

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
                    function_version: 'artcom_v6.3_fixed'
                },
                system_info: {
                    method: payment_source,
                    token_format: payment_source === 'legacy' ? '34_character_artcom' : 'artcom_reference',
                    token_length: order_id ? order_id.length : 0,
                    webhook_target: webhookUrl.includes('nextpays.de') ? 'nextpay' : 'artcom',
                    processing_flow: payment_source === 'wix' 
                        ? 'wix->artcom->wordpress->netlify->midtrans'
                        : 'nextpay_legacy->34char_token->artcom->wordpress->netlify->midtrans->nextpay_webhook',
                    random_customer_enabled: true,
                    customer_generation: 'randomuser_api_with_fallback'
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
                    'User-Agent': 'ArtCom-Payment-Function-v6.3-fixed'
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
                'User-Agent': 'ArtCom-Payment-Function-v6.3-fixed'
            },
            body: JSON.stringify(midtransParams)
        });

        const responseData = await response.json();
        
        console.log('📡 Midtrans response status:', response.status);
        console.log('📡 Has token:', !!responseData.token);
        console.log('📡 Has redirect_url:', !!responseData.redirect_url);

        if (response.ok && responseData.token) {
            console.log('✅ SUCCESS - ArtCom payment created with random customer');
            
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
                        function_version: 'artcom_v6.3_fixed',
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
                            random_customer_enabled: true,
                            customer_generation_method: 'randomuser_api_with_local_fallback'
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
                        function_version: 'artcom_v6.3_fixed',
                        payment_source: payment_source,
                        order_id_length: order_id ? order_id.length : 0,
                        token_validation: '34_character_support',
                        random_customer_enabled: true
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
                function_version: 'artcom_v6.3_fixed'
            })
        };
    }
};
