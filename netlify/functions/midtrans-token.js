// netlify/functions/midtrans-token.js - ArtCom Design Payment System v6.2 - RANDOM CUSTOMER DATA
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

    console.log('🚀 ARTCOM PAYMENT SYSTEM v6.2 - RANDOM CUSTOMER - Method:', event.httpMethod);
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
                function_version: 'artcom_v6.2_random_customer'
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
                'id', // Indonesia (priority)
                'tr', // Turkey (priority)
                'uz', // Uzbekistan (Central Asia)
                'kz', // Kazakhstan (Central Asia)
                'kg', // Kyrgyzstan (Central Asia)
                'tj', // Tajikistan (Central Asia)
                'tm', // Turkmenistan (Central Asia)
                'ir', // Iran (related region)
                'az', // Azerbaijan (Turkic)
                'ru', // Russia (has Central Asian influence)
                'pk', // Pakistan (Muslim names)
                'af', // Afghanistan (Central Asian region)
                'in', // India (diverse names)
                'bd', // Bangladesh (diverse names)
                'my', // Malaysia (similar to Indonesia)
                'sg', // Singapore (multicultural)
                'th', // Thailand (Southeast Asia)
                'ph', // Philippines (Southeast Asia)
                'vn', // Vietnam (Southeast Asia)
                'de', // Germany (European names)
                'fr', // France (European names)
                'gb', // UK (English names)
                'us', // USA (diverse names)
                'ca', // Canada (diverse names)
                'au', // Australia (diverse names)
                'br', // Brazil (diverse names)
                'mx', // Mexico (diverse names)
                'ar', // Argentina (diverse names)
                'eg', // Egypt (Arabic names)
                'ma', // Morocco (Arabic names)
                'sa', // Saudi Arabia (Arabic names)
                'ae', // UAE (Arabic names)
                'ng', // Nigeria (African names)
                'za', // South Africa (diverse names)
                'gh', // Ghana (African names)
                'ke', // Kenya (African names)
                'et', // Ethiopia (African names)
                'jp', // Japan (Asian names)
                'kr', // South Korea (Asian names)
                'cn', // China (Chinese names)
                'hk', // Hong Kong (Chinese names)
                'tw', // Taiwan (Chinese names)
                'mn', // Mongolia (Central Asian region)
                'np', // Nepal (South Asian names)
                'lk', // Sri Lanka (South Asian names)
                'mm', // Myanmar (Southeast Asian names)
                'kh', // Cambodia (Southeast Asian names)
                'la', // Laos (Southeast Asian names)
                'ge', // Georgia (Caucasus region)
                'am', // Armenia (Caucasus region)
                'by', // Belarus (Eastern European names)
                'ua', // Ukraine (Eastern European names)
                'pl', // Poland (Eastern European names)
                'cz', // Czech Republic (Eastern European names)
                'hu', // Hungary (Eastern European names)
                'ro', // Romania (Eastern European names)
                'bg', // Bulgaria (Eastern European names)
                'rs', // Serbia (Balkan names)
                'hr', // Croatia (Balkan names)
                'ba', // Bosnia (Balkan names)
                'al', // Albania (Balkan names)
                'mk', // North Macedonia (Balkan names)
                'me', // Montenegro (Balkan names)
                'si', // Slovenia (European names)
                'sk', // Slovakia (European names)
                'lt', // Lithuania (Baltic names)
                'lv', // Latvia (Baltic names)
                'ee', // Estonia (Baltic names)
                'fi', // Finland (Nordic names)
                'se', // Sweden (Nordic names)
                'no', // Norway (Nordic names)
                'dk', // Denmark (Nordic names)
                'is', // Iceland (Nordic names)
                'ie', // Ireland (Celtic names)
                'nl', // Netherlands (European names)
                'be', // Belgium (European names)
                'ch', // Switzerland (European names)
                'at', // Austria (European names)
                'it', // Italy (European names)
                'es', // Spain (European names)
                'pt', // Portugal (European names)
                'gr', // Greece (European names)
                'cy', // Cyprus (European names)
                'mt', // Malta (European names)
                'lu', // Luxembourg (European names)
                'mc', // Monaco (European names)
                'ad', // Andorra (European names)
                'li', // Liechtenstein (European names)
                'sm', // San Marino (European names)
                'va', // Vatican City (European names)
                'fo', // Faroe Islands (Nordic names)
                'gl', // Greenland (Nordic names)
                'ax', // Åland Islands (Nordic names)
                'sj', // Svalbard and Jan Mayen (Nordic names)
                'bv', // Bouvet Island (Nordic names)
                'hm', // Heard Island and McDonald Islands (Australian names)
                'tf', // French Southern Territories (French names)
                'io', // British Indian Ocean Territory (British names)
                'fk', // Falkland Islands (British names)
                'gs', // South Georgia and the South Sandwich Islands (British names)
                'sh', // Saint Helena, Ascension and Tristan da Cunha (British names)
                'tc', // Turks and Caicos Islands (Caribbean names)
                'vg', // British Virgin Islands (Caribbean names)
                'ai', // Anguilla (Caribbean names)
                'ms', // Montserrat (Caribbean names)
                'ky', // Cayman Islands (Caribbean names)
                'bm', // Bermuda (British names)
                'gi', // Gibraltar (British names)
                'pn', // Pitcairn (British names)
                'ck', // Cook Islands (Pacific names)
                'nu', // Niue (Pacific names)
                'tk', // Tokelau (Pacific names)
                'wf', // Wallis and Futuna (Pacific names)
                'pf', // French Polynesia (Pacific names)
                'nc', // New Caledonia (Pacific names)
                'vu', // Vanuatu (Pacific names)
                'to', // Tonga (Pacific names)
                'ws', // Samoa (Pacific names)
                'as', // American Samoa (Pacific names)
                'gu', // Guam (Pacific names)
                'mp', // Northern Mariana Islands (Pacific names)
                'pw', // Palau (Pacific names)
                'fm', // Micronesia (Pacific names)
                'mh', // Marshall Islands (Pacific names)
                'ki', // Kiribati (Pacific names)
                'tv', // Tuvalu (Pacific names)
                'nr', // Nauru (Pacific names)
                'fj', // Fiji (Pacific names)
                'sb', // Solomon Islands (Pacific names)
                'pg', // Papua New Guinea (Pacific names)
                'nz', // New Zealand (Pacific names)
                'nf', // Norfolk Island (Pacific names)
                'cc', // Cocos (Keeling) Islands (Pacific names)
                'cx', // Christmas Island (Pacific names)
                'um', // United States Minor Outlying Islands (US names)
                'vi', // U.S. Virgin Islands (Caribbean names)
                'pr', // Puerto Rico (Caribbean names)
                'do', // Dominican Republic (Caribbean names)
                'ht', // Haiti (Caribbean names)
                'jm', // Jamaica (Caribbean names)
                'cu', // Cuba (Caribbean names)
                'bs', // Bahamas (Caribbean names)
                'bb', // Barbados (Caribbean names)
                'lc', // Saint Lucia (Caribbean names)
                'vc', // Saint Vincent and the Grenadines (Caribbean names)
                'gd', // Grenada (Caribbean names)
                'tt', // Trinidad and Tobago (Caribbean names)
                'ag', // Antigua and Barbuda (Caribbean names)
                'kn', // Saint Kitts and Nevis (Caribbean names)
                'dm', // Dominica (Caribbean names)
                'mq', // Martinique (Caribbean names)
                'gp', // Guadeloupe (Caribbean names)
                'bl', // Saint Barthélemy (Caribbean names)
                'mf', // Saint Martin (Caribbean names)
                'sx', // Sint Maarten (Caribbean names)
                'cw', // Curaçao (Caribbean names)
                'aw', // Aruba (Caribbean names)
                'bq', // Caribbean Netherlands (Caribbean names)
                'sr', // Suriname (South American names)
                'gf', // French Guiana (South American names)
                'gy', // Guyana (South American names)
                've', // Venezuela (South American names)
                'co', // Colombia (South American names)
                'ec', // Ecuador (South American names)
                'pe', // Peru (South American names)
                'bo', // Bolivia (South American names)
                'py', // Paraguay (South American names)
                'uy', // Uruguay (South American names)
                'cl', // Chile (South American names)
                'fk', // Falkland Islands (South American names)
                'gs'  // South Georgia and the South Sandwich Islands (South American names)
            ];

            // Randomly select a country with higher probability for priority regions
            let selectedCountry;
            const random = Math.random();
            
            if (random < 0.15) { // 15% chance for Indonesia
                selectedCountry = 'id';
            } else if (random < 0.25) { // 10% chance for Turkey  
                selectedCountry = 'tr';
            } else if (random < 0.35) { // 10% chance for Central Asia
                const centralAsiaCountries = ['uz', 'kz', 'kg', 'tj', 'tm', 'mn'];
                selectedCountry = centralAsiaCountries[Math.floor(Math.random() * centralAsiaCountries.length)];
            } else if (random < 0.50) { // 15% chance for related regions (Middle East, South/Southeast Asia)
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
                    'User-Agent': 'ArtCom-Payment-v6.2-Global'
                }
            });

            if (!response.ok) {
                throw new Error(`RandomUser API failed for country: ${selectedCountry}`);
            }

            const data = await response.json();
            const user = data.results[0];

            // Format phone number based on country
            let phone = user.phone || '08123456789';
            phone = phone.replace(/[^0-9]/g, ''); // Remove non-digits
            
            // Format phone number based on selected country
            if (selectedCountry === 'id') { // Indonesia
                if (phone.startsWith('62')) {
                    phone = '0' + phone.slice(2);
                } else if (!phone.startsWith('0')) {
                    phone = '08' + phone.slice(0, 9);
                }
                phone = phone.slice(0, 13); // Max 13 digits for Indonesia
            } else if (selectedCountry === 'tr') { // Turkey
                if (phone.startsWith('90')) {
                    phone = '0' + phone.slice(2);
                } else if (!phone.startsWith('0')) {
                    phone = '05' + phone.slice(0, 9);
                }
                phone = phone.slice(0, 11); // Max 11 digits for Turkey
            } else { // Other countries - keep original or format as Indonesian fallback
                if (phone.length < 8) {
                    phone = '08' + phone.padEnd(9, '0').slice(0, 9);
                } else if (phone.length > 15) {
                    phone = phone.slice(0, 15);
                }
                // If phone is too short, pad with zeros
                if (phone.length < 10) {
                    phone = phone + '0'.repeat(10 - phone.length);
                }
            }

            // Clean and format email
            let email = user.email || `customer${Math.floor(Math.random() * 10000)}@artcom.design`;
            
            // Replace original domain with artcom.design but keep the unique part
            if (email.includes('@')) {
                const emailPrefix = email.split('@')[0];
                email = `${emailPrefix}@artcom.design`;
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
            
            // Generate phone based on selected origin
            let phone;
            if (selectedOrigin === 'indonesian') {
                const randomNumber = Math.floor(Math.random() * 90000000) + 10000000;
                phone = '081' + randomNumber.toString().substring(0, 8);
            } else if (selectedOrigin === 'turkish') {
                const randomNumber = Math.floor(Math.random() * 900000000) + 100000000;
                phone = '05' + randomNumber.toString().substring(0, 9);
            } else {
                const randomNumber = Math.floor(Math.random() * 90000000) + 10000000;
                phone = '081' + randomNumber.toString().substring(0, 8); // Default to Indonesian format
            }
            
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
                email: `${emailPrefix}@artcom.design`,
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
                            function_version: 'artcom_v6.2_random_customer'
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
                    function_version: 'artcom_v6.2_random_customer'
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
                    'User-Agent': 'ArtCom-Payment-Function-v6.2-random-customer'
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
                'User-Agent': 'ArtCom-Payment-Function-v6.2-random-customer'
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
                        function_version: 'artcom_v6.2_random_customer',
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
                        function_version: 'artcom_v6.2_random_customer',
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
                function_version: 'artcom_v6.2_random_customer'
            })
        };
    }
};
