// netlify/functions/midtrans-token.js - ArtCom v7.4 - ALL CALLBACKS - success/failed/unfinish routing
exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With, Origin, User-Agent, Referer',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, PUT, DELETE',
        'Access-Control-Allow-Credentials': 'false',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
        'Vary': 'Origin, Access-Control-Request-Headers'
    };

    console.log('🚀 ARTCOM v7.4 - ALL CALLBACKS - success/failed/unfinish routing');
    console.log('🌍 Origin:', event.headers.origin || 'No origin');

    if (event.httpMethod === 'OPTIONS') {
        console.log('✅ CORS Preflight - returning 200');
        return { 
            statusCode: 200, 
            headers,
            body: JSON.stringify({ 
                message: 'CORS preflight successful',
                timestamp: Math.floor(Date.now() / 1000),
                function_version: 'artcom_v7.4_all_callbacks'
            })
        };
    }

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

    // Check if this is a NextPay order (34 char + ARTCOM_)
    function isNextPayOrder(orderId) {
        return orderId && orderId.startsWith('ARTCOM_') && orderId.length === 34;
    }

    // Simple hash function for token generation
    function createSimpleHash(text, secret) {
        let hash = 0;
        const combined = text + secret;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    // *** UPDATED: Create callback token with SOURCE ***
    function createCallbackToken(orderId, source) {
        const timestamp = Math.floor(Date.now() / 1000);
        const secret = 'ARTCOM_CALLBACK_SECRET_2024';
        
        // Include source in hash calculation
        const hash = createSimpleHash(orderId + timestamp + source, secret);
        
        // NEW FORMAT: timestamp|orderId|source|hash
        const data = `${timestamp}|${orderId}|${source}|${hash}`;
        return Buffer.from(data).toString('base64');
    }

    // Advanced Deterministic Customer Data Generator - Credit Card Integrated
    function generateDeterministicContact(name, creditCard = null) {
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return {
                first_name: 'Customer',
                last_name: 'ArtCom',
                email: 'customer@gmail.com',
                phone: '+628123456789'
            };
        }

        const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
        const cleanCreditCard = creditCard ? creditCard.toString().replace(/[^0-9]/g, '') : '';
        
        function ultraSensitiveHash(str, cardData = '') {
            let hash1 = 5381;
            let hash2 = 7919;
            let hash3 = 2166136261;
            
            const combined = str + '|' + cardData + '|artcom_ultra_salt_2024_v2';
            
            for (let i = 0; i < combined.length; i++) {
                const char = combined.charCodeAt(i);
                hash1 = ((hash1 << 5) + hash1) + char;
                hash1 = hash1 & hash1;
                hash2 = ((hash2 << 7) + hash2 + (char * (i + 1)) + (i * 37)) ^ char;
                hash2 = hash2 & hash2;
                hash3 = hash3 ^ char;
                hash3 = hash3 * 16777619;
                hash3 = hash3 & hash3;
            }
            
            const finalHash = Math.abs((hash1 ^ hash2 ^ hash3) + (hash1 * hash2) + (hash2 * hash3));
            return finalHash;
        }

        function seededRandom(seed) {
            const x1 = Math.sin(seed * 12.9898) * 43758.5453;
            const x2 = Math.sin(seed * 78.233) * 23421.6312;
            const x3 = Math.sin(seed * 15.789) * 67291.8472;
            const combined = (x1 + x2 + x3) / 3;
            return combined - Math.floor(combined);
        }

        const baseHash = ultraSensitiveHash(cleanName, cleanCreditCard);
        
        const nameParts = cleanName.split(' ').filter(part => part.length > 0);
        const firstName = nameParts[0] || 'customer';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join('') : 'artcom';
        
        function capitalize(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        const finalFirstName = capitalize(firstName);
        const finalLastName = capitalize(lastName);

        const phoneSeed = (baseHash * 7919 + (cleanCreditCard.length * 1337) + cleanName.length * 2663) % 999999991;
        const phoneRandom1 = seededRandom(phoneSeed);
        const phoneRandom2 = seededRandom(phoneSeed + 7919);
        const phoneRandom3 = seededRandom(phoneSeed + 15887);
        const phoneRandom4 = seededRandom(phoneSeed + 23873);
        
        const countryCodes = [
            { code: '+90', weight: 95 },
            { code: '+49', weight: 1 },
            { code: '+1', weight: 1 },
            { code: '+44', weight: 1 },
            { code: '+33', weight: 1 },
            { code: '+31', weight: 1 }
        ];
        
        let totalWeight = countryCodes.reduce((sum, c) => sum + c.weight, 0);
        let randomWeight = Math.floor(phoneRandom1 * totalWeight);
        let selectedCountryCode = '+90';
        
        let currentWeight = 0;
        for (const country of countryCodes) {
            currentWeight += country.weight;
            if (randomWeight < currentWeight) {
                selectedCountryCode = country.code;
                break;
            }
        }
        
        let phone = '';
        
        if (selectedCountryCode === '+90') {
            const turkishOperators = [
                { prefix: '530', weight: 15 }, { prefix: '531', weight: 15 }, { prefix: '532', weight: 20 },
                { prefix: '533', weight: 15 }, { prefix: '534', weight: 10 }, { prefix: '535', weight: 8 },
                { prefix: '536', weight: 7 }, { prefix: '537', weight: 5 }, { prefix: '538', weight: 3 },
                { prefix: '539', weight: 2 }, { prefix: '540', weight: 8 }, { prefix: '541', weight: 10 },
                { prefix: '542', weight: 12 }, { prefix: '543', weight: 10 }, { prefix: '544', weight: 8 },
                { prefix: '545', weight: 7 }, { prefix: '546', weight: 5 }, { prefix: '547', weight: 3 },
                { prefix: '548', weight: 2 }, { prefix: '549', weight: 2 }, { prefix: '550', weight: 5 },
                { prefix: '551', weight: 6 }, { prefix: '552', weight: 8 }, { prefix: '553', weight: 10 },
                { prefix: '554', weight: 12 }, { prefix: '555', weight: 15 }, { prefix: '556', weight: 8 },
                { prefix: '557', weight: 5 }, { prefix: '558', weight: 3 }, { prefix: '559', weight: 2 },
                { prefix: '500', weight: 3 }, { prefix: '501', weight: 3 }, { prefix: '502', weight: 3 },
                { prefix: '503', weight: 3 }, { prefix: '504', weight: 2 }, { prefix: '505', weight: 2 },
                { prefix: '506', weight: 2 }, { prefix: '507', weight: 1 }, { prefix: '508', weight: 1 },
                { prefix: '509', weight: 1 }
            ];
            
            let operatorTotalWeight = turkishOperators.reduce((sum, op) => sum + op.weight, 0);
            let operatorRandomWeight = Math.floor(phoneRandom2 * operatorTotalWeight);
            let selectedPrefix = '532';
            
            let operatorCurrentWeight = 0;
            for (const operator of turkishOperators) {
                operatorCurrentWeight += operator.weight;
                if (operatorRandomWeight < operatorCurrentWeight) {
                    selectedPrefix = operator.prefix;
                    break;
                }
            }
            
            const firstPart = Math.floor(phoneRandom3 * 900) + 100;
            const secondPart = Math.floor(phoneRandom4 * 9000) + 1000;
            phone = `+90${selectedPrefix}${firstPart}${secondPart}`;
        } else {
            const phoneNum1 = Math.floor(phoneRandom2 * 900) + 100;
            const phoneNum2 = Math.floor(phoneRandom3 * 900000) + 100000;
            phone = `${selectedCountryCode}${phoneNum1}${phoneNum2}`;
        }

        const lastFourDigits = (cleanCreditCard.slice(-4) || '0000');
        const emailSeed = (baseHash * 16777619 + parseInt(lastFourDigits) * 2663 + cleanName.length * 7919) % 999999991;
        const emailRandom1 = seededRandom(emailSeed + 19937);
        const emailRandom2 = seededRandom(emailSeed + 23209);
        const emailRandom3 = seededRandom(emailSeed + 29873);
        const emailRandom4 = seededRandom(emailSeed + 31607);
        const emailRandom5 = seededRandom(emailSeed + 37283);
        
        const emailDomains = [
            { domain: 'gmail.com', weight: 30 }, { domain: 'yahoo.com', weight: 15 },
            { domain: 'hotmail.com', weight: 12 }, { domain: 'outlook.com', weight: 10 },
            { domain: 'icloud.com', weight: 6 }, { domain: 'protonmail.com', weight: 4 },
            { domain: 'yandex.com', weight: 4 }, { domain: 'mail.ru', weight: 4 },
            { domain: 'live.com', weight: 3 }, { domain: 'msn.com', weight: 2 },
            { domain: 'aol.com', weight: 2 }, { domain: 'zoho.com', weight: 2 },
            { domain: 'tutanota.com', weight: 2 }, { domain: 'fastmail.com', weight: 2 },
            { domain: 'gmx.com', weight: 1 }, { domain: 'mail.com', weight: 1 }
        ];
        
        let emailTotalWeight = emailDomains.reduce((sum, d) => sum + d.weight, 0);
        let emailRandomWeight = Math.floor(emailRandom1 * emailTotalWeight);
        let selectedDomain = 'gmail.com';
        
        let emailCurrentWeight = 0;
        for (const domain of emailDomains) {
            emailCurrentWeight += domain.weight;
            if (emailRandomWeight < emailCurrentWeight) {
                selectedDomain = domain.domain;
                break;
            }
        }
        
        const emailStyleChoice = Math.floor(emailRandom2 * 8);
        let emailPrefix = '';
        
        const randomWords = [
            'phoenix', 'dragon', 'thunder', 'ocean', 'mountain', 'eagle', 'storm', 'fire',
            'galaxy', 'cosmic', 'ninja', 'warrior', 'mystic', 'shadow', 'crystal', 'golden',
            'silver', 'diamond', 'emerald', 'sapphire', 'ruby', 'platinum', 'bronze', 'steel',
            'winter', 'summer', 'spring', 'autumn', 'sunset', 'sunrise', 'midnight', 'dawn',
            'hunter', 'ranger', 'knight', 'wizard', 'mage', 'sorcerer', 'paladin', 'rogue',
            'tiger', 'lion', 'wolf', 'bear', 'shark', 'falcon', 'hawk', 'raven',
            'cyber', 'tech', 'digital', 'quantum', 'matrix', 'virtual', 'pixel', 'binary',
            'star', 'comet', 'asteroid', 'meteor', 'planet', 'universe', 'cosmos', 'nebula',
            'crypto', 'blockchain', 'neon', 'laser', 'turbo', 'ultra', 'mega', 'hyper',
            'alpha', 'beta', 'gamma', 'delta', 'omega', 'sigma', 'chrome', 'fusion',
            'reactor', 'engine', 'power', 'energy', 'voltage', 'circuit', 'network', 'system',
            'core', 'pulse', 'wave', 'beam', 'flux', 'zone', 'vertex', 'apex',
            'legend', 'myth', 'epic', 'saga', 'quest', 'blade', 'sword', 'shield',
            'crown', 'throne', 'castle', 'fortress', 'tower', 'gate', 'bridge', 'realm',
            'kingdom', 'empire', 'dynasty', 'clan', 'tribe', 'guild', 'order', 'covenant',
            'oracle', 'prophet', 'sage', 'master', 'guardian', 'sentinel', 'warden', 'keeper',
            'kaplan', 'aslan', 'kartal', 'ejder', 'yildiz', 'ay', 'gunes', 'deniz',
            'dag', 'orman', 'ruzgar', 'firtina', 'simsek', 'gok', 'toprak', 'ates',
            'buz', 'kar', 'yagmur', 'bulut', 'goktem', 'altin', 'gumus', 'elmas',
            'sehir', 'koy', 'ada', 'vadi', 'tepe', 'yayla', 'ova',
            'kahraman', 'savascar', 'avci', 'sovalye', 'prens', 'kral', 'sultan', 'han',
            'drache', 'adler', 'wolf', 'lowe', 'falke', 'sturm', 'feuer',
            'stern', 'mond', 'sonne', 'berg', 'wald', 'meer', 'fluss', 'himmel',
            'gold', 'silber', 'eisen', 'stahl', 'kristall', 'diamant', 'rubin', 'saphir',
            'kaiser', 'konig', 'prinz', 'ritter', 'held', 'krieger', 'jager', 'magier',
            'aigle', 'loup', 'faucon', 'tempete', 'feu',
            'etoile', 'lune', 'soleil', 'montagne', 'foret', 'riviere', 'ciel',
            'or', 'argent', 'fer', 'acier', 'cristal', 'rubis', 'saphir',
            'roi', 'prince', 'chevalier', 'heros', 'guerrier', 'chasseur', 'magicien', 'sage',
            'aguila', 'lobo', 'halcon', 'tormenta', 'fuego',
            'estrella', 'luna', 'sol', 'montana', 'bosque', 'oceano', 'rio', 'cielo',
            'oro', 'plata', 'hierro', 'acero', 'cristal', 'diamante', 'rubi', 'zafiro',
            'rey', 'principe', 'caballero', 'heroe', 'guerrero', 'cazador', 'mago', 'sabio',
            'drago', 'aquila', 'leone', 'tigre', 'lupo', 'falco', 'tempesta', 'fuoco',
            'stella', 'luna', 'sole', 'montagna', 'foresta', 'oceano', 'fiume', 'cielo',
            'oro', 'argento', 'ferro', 'acciaio', 'cristallo', 'diamante', 'rubino', 'zaffiro',
            're', 'principe', 'cavaliere', 'eroe', 'guerriero', 'cacciatore', 'mago', 'saggio',
            'ryu', 'tora', 'ookami', 'taka', 'arashi', 'hi', 'mizu', 'kaze',
            'hoshi', 'tsuki', 'taiyou', 'yama', 'mori', 'umi', 'kawa', 'sora',
            'kin', 'gin', 'tetsu', 'hagane', 'suishou', 'daiya', 'safaia',
            'ou', 'ouji', 'kishi', 'eiyuu', 'senshi', 'ryoushi', 'mahou', 'kenja',
            'yong', 'horangi', 'neukdae', 'maeeul', 'pokpung', 'bul', 'mul', 'baram',
            'byeol', 'dal', 'haetbit', 'san', 'sup', 'bada', 'gang', 'haneul',
            'geum', 'eun', 'cheol', 'suejeong',
            'wang', 'wangja', 'gisa', 'yeongung', 'jeonsa', 'sanyang', 'mabup', 'hyeonin',
            'noor', 'qamar', 'shams', 'jabal', 'bahr', 'nahr', 'sama', 'nar',
            'dhahab', 'fidda', 'hadid', 'fulad', 'mas', 'yaqut', 'zumurrud', 'lali',
            'malik', 'amir', 'faris', 'batal', 'muhrib', 'sayad', 'sahir', 'hakim',
            'drakon', 'orel', 'lev', 'tigr', 'volk', 'sokol', 'burya', 'ogon',
            'zvezda', 'solntse', 'gora', 'les', 'more', 'reka', 'nebo',
            'zoloto', 'serebro', 'zhelezo', 'stal', 'kristall', 'almaz', 'safir',
            'korol', 'prints', 'rytsar', 'geroj', 'voin', 'okhotnik', 'mag', 'mudrets',
            'sher', 'baagh', 'garud', 'toofan', 'aag', 'paani', 'hava', 'dharti',
            'sitara', 'chand', 'suraj', 'parvat', 'jungle', 'samudra', 'nadi', 'aasman',
            'sona', 'chandi', 'loha', 'ispat', 'sphatik', 'heera', 'manik', 'neelam',
            'raja', 'rajkumar', 'yoddha', 'veer', 'shikari', 'jaadugar', 'gyani', 'pandit',
            'pixel', 'codec', 'wifi', 'cloud', 'sync', 'upload', 'stream', 'cache',
            'hash', 'token', 'stack', 'queue', 'array', 'loop', 'function', 'method',
            'class', 'object', 'string', 'integer', 'boolean', 'vector', 'matrix', 'algorithm',
            'rouge', 'bleu', 'vert', 'noir', 'blanc', 'rojo', 'azul', 'verde',
            'rosso', 'blu', 'nero', 'bianco', 'rot', 'blau', 'grun',
            'akai', 'aoi', 'midori', 'kuro', 'shiro', 'kirmizi', 'mavi', 'yesil',
            'uno', 'dos', 'tres', 'quatre', 'cinq', 'six', 'eins', 'zwei',
            'drei', 'ichi', 'ni', 'san', 'bir', 'iki', 'uch', 'ek', 'do', 'teen',
            'griffin', 'sphinx', 'chimera', 'hydra', 'kraken', 'basilisk', 'banshee', 'valkyrie',
            'centaur', 'minotaur', 'cyclops', 'medusa', 'pegasus', 'unicorn', 'werewolf', 'vampire'
        ];
        
        const randomNumbers = Math.floor(emailRandom3 * 99999).toString().padStart(5, '0');
        const yearSuffix = Math.floor(emailRandom4 * 30) + 1990;
        const twoDigitNum = Math.floor(emailRandom5 * 100).toString().padStart(2, '0');
        
        switch (emailStyleChoice) {
            case 0: emailPrefix = firstName.slice(0, 4) + lastName.slice(0, 3) + twoDigitNum; break;
            case 1: emailPrefix = firstName + yearSuffix; break;
            case 2: 
                const randomWord = randomWords[Math.floor(emailRandom3 * randomWords.length)];
                emailPrefix = randomWord + twoDigitNum;
                break;
            case 3:
                const word1 = randomWords[Math.floor(emailRandom3 * randomWords.length)];
                const word2 = randomWords[Math.floor(emailRandom4 * randomWords.length)];
                emailPrefix = word1 + word2 + (Math.floor(emailRandom5 * 100));
                break;
            case 4:
                const randomWordMix = randomWords[Math.floor(emailRandom4 * randomWords.length)];
                emailPrefix = firstName.slice(0, 3) + randomWordMix + twoDigitNum;
                break;
            case 5:
                const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
                emailPrefix = '';
                for (let i = 0; i < 8; i++) {
                    emailPrefix += chars[Math.floor(seededRandom(emailSeed + i * 47) * chars.length)];
                }
                break;
            case 6:
                const nameVar = firstName.charAt(0) + lastName + randomNumbers.slice(0, 3);
                emailPrefix = nameVar.toLowerCase();
                break;
            case 7:
                const word3 = randomWords[Math.floor(emailRandom2 * randomWords.length)];
                const specialNum = Math.floor(emailRandom5 * 9999);
                emailPrefix = word3 + '_' + specialNum;
                break;
        }
        
        emailPrefix = emailPrefix.replace(/[^a-z0-9._-]/gi, '');
        
        if (emailPrefix.length > 15) emailPrefix = emailPrefix.slice(0, 15);
        if (emailPrefix.length < 3) emailPrefix = 'user' + Math.floor(emailRandom5 * 99999);
        
        const email = `${emailPrefix}@${selectedDomain}`;

        return {
            first_name: finalFirstName,
            last_name: finalLastName,
            email: email,
            phone: phone
        };
    }

    function generateFallbackName(order_id, amount) {
        const seed = simpleHash((order_id || 'default') + (amount || '1000').toString());
        const fallbackNames = [
            'Customer ArtCom', 'User Payment', 'Client Design', 'Buyer Digital',
            'Guest Service', 'Member Premium', 'Order Client', 'Payment User'
        ];
        return fallbackNames[seed % fallbackNames.length];
        
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
            custom_name,
            credit_card,
            callback_base_url,
            test_mode = false
        } = requestData;

        const finalAmount = parseInt(String(amount).replace(/[^\d]/g, ''), 10);
        const finalItemName = item_name || 'ArtCom Design Payment';
        
        console.log('💰 Parsed amount:', finalAmount);
        console.log('🎯 Order ID:', order_id);
        console.log('🎨 Payment source:', payment_source);
        console.log('👤 Custom name:', custom_name);
        console.log('💳 Credit card:', credit_card);
        console.log('📏 Order ID length:', order_id ? order_id.length : 0);
        console.log('🧪 Test mode:', test_mode);
        
        // Check if NextPay
        const isNextPay = isNextPayOrder(order_id);
        console.log('🔍 Is NextPay order (34 char):', isNextPay);
        
        // *** DETERMINE SOURCE (nextpay or nextpay1) ***
        let source = 'nextpay'; // default
        
        if (isNextPay) {
            // Check if this is test mode
            const isTestMode = payment_source === 'nextpay_test' || test_mode === true;
            
            if (isTestMode) {
                source = 'nextpay1';
                console.log('🎯 Source: nextpay1 (TEST MODE)');
            } else {
                source = 'nextpay';
                console.log('🎯 Source: nextpay (PRODUCTION)');
            }
        }
        
        if (payment_source === 'wix') {
            console.log('🛒 Wix parameters:', { wix_ref, wix_expiry, wix_signature });
        }
        
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

        if (payment_source === 'legacy' || payment_source === 'nextpay_test') {
            console.log('🔍 Validating legacy/test token...');
            console.log('Token length:', order_id ? order_id.length : 0);
            console.log('Starts with ARTCOM_:', order_id ? order_id.startsWith('ARTCOM_') : false);
            
            if (!order_id || order_id.length !== 34 || !order_id.startsWith('ARTCOM_')) {
                console.error('❌ Invalid legacy token:', order_id);
                
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ 
                        success: false, 
                        error: 'Invalid 34-character token format for legacy system', 
                        received: order_id,
                        received_length: order_id ? order_id.length : 0,
                        expected: 'ARTCOM_ + 27 characters = 34 total'
                    })
                };
            }
            console.log('✅ Legacy/test token validation passed');
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
        
        console.log('✅ All validations passed');

        const now = new Date();
        const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
        const midtransDate = jakartaTime.toISOString().slice(0, 19).replace('T', ' ') + ' +0700';
        
        console.log('📅 Midtrans date format:', midtransDate);

        let nameForGeneration;
        
        if (custom_name && typeof custom_name === 'string' && custom_name.trim()) {
            nameForGeneration = custom_name.trim();
            console.log('👤 Using provided custom name:', nameForGeneration);
        } else {
            nameForGeneration = generateFallbackName(order_id, finalAmount);
            console.log('🎯 Generated fallback name:', nameForGeneration);
        }
        
        const customerData = generateDeterministicContact(nameForGeneration, credit_card);
        
        console.log('✅ Customer data generated:', {
            input_name: nameForGeneration,
            output_name: `${customerData.first_name} ${customerData.last_name}`,
            email: customerData.email,
            phone: customerData.phone
        });

        // *** CREATE TOKEN WITH SOURCE AT PAYMENT START (if NextPay) ***
        let callbackUrl;
        
        if (isNextPay) {
            // Pass source to token creation
            const callbackToken = createCallbackToken(order_id, source);
            console.log('✅ Token created with SOURCE at payment start (1 hour expiry)');
            console.log('🔐 Token timestamp:', Math.floor(Date.now() / 1000));
            console.log('🎯 Token source:', source);
            
            // DYNAMICALLY DETERMINE CALLBACK BASE URL
            let callbackBase;
            
            if (callback_base_url) {
                // If explicitly provided, use it
                callbackBase = callback_base_url;
                console.log('✅ Using provided callback_base_url:', callbackBase);
            } else if (source === 'nextpay1') {
                // Test mode: use nextpays1.de WordPress staging
                callbackBase = 'https://nextpays1staging.wpcomstaging.com';
                console.log('✅ Test mode: Using nextpays1 staging');
            } else {
                // Production: use existing WordPress staging
                callbackBase = 'https://artcomdesign3-umbac.wpcomstaging.com';
                console.log('✅ Production mode: Using artcom staging');
            }
            
            // CRITICAL FIX: Put token FIRST so Midtrans can append its params with &
            // Midtrans will add: &order_id=X&status_code=Y&transaction_status=Z
            callbackUrl = `${callbackBase}?callback_token=${callbackToken}`;
            
            console.log('✅ NextPay: Token included in callback URL');
        } else {
            callbackUrl = `https://www.artcom.design/webhook/payment_complete.php?order_id=${order_id}`;
            console.log('✅ ArtCom: Direct callback (no token)');
        }
        
        console.log('🔗 Callback URL:', callbackUrl);

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
                duration: 5
            },
            custom_field1: order_id,
            custom_field2: payment_source,
            custom_field3: Math.floor(Date.now() / 1000).toString(),
            callbacks: {
                finish: callbackUrl,      // Successful/completed payments
                unfinish: callbackUrl,    // Incomplete payments (user closed)
                error: callbackUrl        // Failed/error payments
            }
        };

        if (payment_source === 'wix' && wix_ref) {
            midtransParams.custom_expiry = wix_expiry;
            midtransParams.custom_reference = wix_ref;
        }

        console.log('📤 Sending webhook notification...');
        try {
            // DYNAMICALLY DETERMINE WEBHOOK URL BASED ON SOURCE
            let webhookUrl;
            
            if (isNextPay) {
                if (source === 'nextpay1') {
                    webhookUrl = 'https://nextpays1.de/webhook/midtrans.php';
                    console.log('📡 Using TEST NextPay1 webhook');
                } else {
                    webhookUrl = 'https://nextpays.de/webhook/midtrans.php';
                    console.log('📡 Using PRODUCTION NextPay webhook');
                }
            } else {
                webhookUrl = 'https://www.artcom.design/webhook/midtrans.php';
                console.log('📡 Using ArtCom webhook');
            }

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
                callback_url: callbackUrl,
                is_nextpay: isNextPay,
                nextpay_source: source, // "nextpay" or "nextpay1"
                token_created_at_start: isNextPay,
                test_mode: test_mode,
                request_details: {
                    referrer: referrer,
                    user_agent: user_agent,
                    origin: origin,
                    custom_name: custom_name,
                    generated_name: nameForGeneration,
                    function_version: 'artcom_v7.4_all_callbacks'
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
                    'User-Agent': 'ArtCom-Payment-Function-v7.4-all-callbacks'
                },
                body: JSON.stringify(webhookData)
            });
            
            const webhookText = await webhookResponse.text();
            console.log('📡 Webhook response status:', webhookResponse.status);
            console.log('📡 Webhook response length:', webhookText.length);
            
        } catch (webhookError) {
            console.error('🚨 Webhook notification failed:', webhookError.message);
        }

        const apiUrl = 'https://app.midtrans.com/snap/v1/transactions';
        const serverKey = 'Mid-server-kO-tU3T7Q9MYO_25tJTggZeu';
        const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

        console.log('🔗 Calling Midtrans API...');
        console.log('🔗 Order ID:', order_id);
        console.log('🔗 Amount IDR:', finalAmount);
        console.log('👤 Customer:', `${customerData.first_name} ${customerData.last_name} (${customerData.email})`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: authHeader,
                'User-Agent': 'ArtCom-v7.4-all-callbacks'
            },
            body: JSON.stringify(midtransParams)
        });

        const responseData = await response.json();
        
        console.log('📡 Midtrans response status:', response.status);
        console.log('📡 Has token:', !!responseData.token);
        console.log('📡 Has redirect_url:', !!responseData.redirect_url);

        if (response.ok && responseData.token) {
            console.log('✅ SUCCESS - Token with SOURCE included in callback URL');
            console.log('🎯 Source in token:', source);
            
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
                        expiry_duration: '5 minutes',
                        midtrans_response: responseData,
                        timestamp: Math.floor(Date.now() / 1000),
                        function_version: 'artcom_v7.4_all_callbacks',
                        payment_source: payment_source,
                        test_mode: test_mode,
                        nextpay_source: source,
                        debug_info: {
                            order_id: order_id,
                            order_id_length: order_id ? order_id.length : 0,
                            amount_idr: finalAmount,
                            system: payment_source,
                            callback_url: callbackUrl,
                            is_nextpay: isNextPay,
                            token_in_callback: isNextPay,
                            source_in_token: source,
                            customer_data: customerData,
                            email_valid: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(customerData.email)
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
            
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Failed to generate payment token',
                    details: responseData,
                    midtrans_status: response.status
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
                function_version: 'artcom_v7.4_all_callbacks'
            })
        };
    }
};
