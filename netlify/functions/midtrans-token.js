// netlify/functions/midtrans-token.js - ArtCom Design Payment System v6.5 - ULTRA DIVERSE GENERATION
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

    console.log('🚀 ARTCOM PAYMENT SYSTEM v6.5 - ULTRA DIVERSE GENERATION - Method:', event.httpMethod);
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
                function_version: 'artcom_v6.5_ultra_diverse'
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

    // Advanced Deterministic Customer Data Generator - Credit Card Integrated
    function generateDeterministicContact(name, creditCard = null) {
        // Input validation
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return {
                first_name: 'Customer',
                last_name: 'ArtCom',
                email: 'customer@gmail.com',
                phone: '+628123456789'
            };
        }

        // Clean and normalize inputs - ULTRA SENSITIVE TO CHANGES
        const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '');
        const cleanCreditCard = creditCard ? creditCard.toString().replace(/[^0-9]/g, '') : '';
        
        // ULTRA ADVANCED HASH FUNCTION - EXTREMELY SENSITIVE TO INPUT CHANGES
        function ultraSensitiveHash(str, cardData = '') {
            // Multiple hash algorithms combined for maximum sensitivity
            let hash1 = 5381; // djb2
            let hash2 = 7919; // custom prime
            let hash3 = 2166136261; // fnv prime
            
            const combined = str + '|' + cardData + '|artcom_ultra_salt_2024_v2';
            
            for (let i = 0; i < combined.length; i++) {
                const char = combined.charCodeAt(i);
                
                // DJB2 hash
                hash1 = ((hash1 << 5) + hash1) + char;
                hash1 = hash1 & hash1; // 32-bit
                
                // Custom hash with position sensitivity
                hash2 = ((hash2 << 7) + hash2 + (char * (i + 1)) + (i * 37)) ^ char;
                hash2 = hash2 & hash2; // 32-bit
                
                // FNV-like hash
                hash3 = hash3 ^ char;
                hash3 = hash3 * 16777619;
                hash3 = hash3 & hash3; // 32-bit
            }
            
            // Combine all three hashes for maximum chaos
            const finalHash = Math.abs((hash1 ^ hash2 ^ hash3) + (hash1 * hash2) + (hash2 * hash3));
            return finalHash;
        }

        // Ultra sensitive seeded random function (deterministic but chaotic)
        function seededRandom(seed) {
            // Multiple sine waves for more chaos
            const x1 = Math.sin(seed * 12.9898) * 43758.5453;
            const x2 = Math.sin(seed * 78.233) * 23421.6312;
            const x3 = Math.sin(seed * 15.789) * 67291.8472;
            const combined = (x1 + x2 + x3) / 3;
            return combined - Math.floor(combined);
        }

        // Generate base hash from name + credit card
        const baseHash = ultraSensitiveHash(cleanName, cleanCreditCard);
        
        // Parse name parts
        const nameParts = cleanName.split(' ').filter(part => part.length > 0);
        const firstName = nameParts[0] || 'customer';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'artcom';
        
        // Capitalize function
        function capitalize(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        const finalFirstName = capitalize(firstName);
        const finalLastName = capitalize(lastName);

        // Generate phone number (ULTRA SENSITIVE to name + credit card changes)
        const phoneSeed = (baseHash * 7919 + (cleanCreditCard.length * 1337) + cleanName.length * 2663) % 999999991;
        const phoneRandom1 = seededRandom(phoneSeed);
        const phoneRandom2 = seededRandom(phoneSeed + 7919);
        const phoneRandom3 = seededRandom(phoneSeed + 15887);
        const phoneRandom4 = seededRandom(phoneSeed + 23873);
        
        // TÜRK AĞIRLIKLI ÜLKE KODLARI (%95 Türkiye)
        const countryCodes = [
            { code: '+90', weight: 95 }, // Turkey (95%)
            { code: '+49', weight: 1 },  // Germany
            { code: '+1', weight: 1 },   // US/Canada
            { code: '+44', weight: 1 },  // UK
            { code: '+33', weight: 1 },  // France
            { code: '+31', weight: 1 }   // Netherlands
        ];
        
        // Select country code deterministically
        let totalWeight = countryCodes.reduce((sum, c) => sum + c.weight, 0);
        let randomWeight = Math.floor(phoneRandom1 * totalWeight);
        let selectedCountryCode = '+90'; // default Turkey
        
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
            // GERÇEK TÜRK TELEFON NUMARALARI
            const turkishOperators = [
                // Turkcell (53x serisi)
                { prefix: '530', weight: 15 },
                { prefix: '531', weight: 15 },
                { prefix: '532', weight: 20 }, // En popüler
                { prefix: '533', weight: 15 },
                { prefix: '534', weight: 10 },
                { prefix: '535', weight: 8 },
                { prefix: '536', weight: 7 },
                { prefix: '537', weight: 5 },
                { prefix: '538', weight: 3 },
                { prefix: '539', weight: 2 },
                
                // Vodafone (54x serisi)
                { prefix: '540', weight: 8 },
                { prefix: '541', weight: 10 },
                { prefix: '542', weight: 12 },
                { prefix: '543', weight: 10 },
                { prefix: '544', weight: 8 },
                { prefix: '545', weight: 7 },
                { prefix: '546', weight: 5 },
                { prefix: '547', weight: 3 },
                { prefix: '548', weight: 2 },
                { prefix: '549', weight: 2 },
                
                // Türk Telekom (55x serisi)
                { prefix: '550', weight: 5 },
                { prefix: '551', weight: 6 },
                { prefix: '552', weight: 8 },
                { prefix: '553', weight: 10 },
                { prefix: '554', weight: 12 },
                { prefix: '555', weight: 15 }, // Çok popüler
                { prefix: '556', weight: 8 },
                { prefix: '557', weight: 5 },
                { prefix: '558', weight: 3 },
                { prefix: '559', weight: 2 },
                
                // BiP (50x serisi - yeni)
                { prefix: '500', weight: 3 },
                { prefix: '501', weight: 3 },
                { prefix: '502', weight: 3 },
                { prefix: '503', weight: 3 },
                { prefix: '504', weight: 2 },
                { prefix: '505', weight: 2 },
                { prefix: '506', weight: 2 },
                { prefix: '507', weight: 1 },
                { prefix: '508', weight: 1 },
                { prefix: '509', weight: 1 }
            ];
            
            // Operator seçimi
            let operatorTotalWeight = turkishOperators.reduce((sum, op) => sum + op.weight, 0);
            let operatorRandomWeight = Math.floor(phoneRandom2 * operatorTotalWeight);
            let selectedPrefix = '532'; // default
            
            let operatorCurrentWeight = 0;
            for (const operator of turkishOperators) {
                operatorCurrentWeight += operator.weight;
                if (operatorRandomWeight < operatorCurrentWeight) {
                    selectedPrefix = operator.prefix;
                    break;
                }
            }
            
            // 7 haneli numara oluştur (xxx xxxx formatında)
            const firstPart = Math.floor(phoneRandom3 * 900) + 100; // 100-999
            const secondPart = Math.floor(phoneRandom4 * 9000) + 1000; // 1000-9999
            
            phone = `+90${selectedPrefix}${firstPart}${secondPart}`;
            
        } else {
            // Diğer ülkeler için basit format
            const phoneNum1 = Math.floor(phoneRandom2 * 900) + 100;
            const phoneNum2 = Math.floor(phoneRandom3 * 900000) + 100000;
            phone = `${selectedCountryCode}${phoneNum1}${phoneNum2}`;
        }

        // ULTRA ADVANCED EMAIL GENERATION (MAXIMUM SENSITIVITY TO INPUT CHANGES)
        const lastFourDigits = (cleanCreditCard.slice(-4) || '0000');
        const emailSeed = (baseHash * 16777619 + parseInt(lastFourDigits) * 2663 + cleanName.length * 7919) % 999999991;
        const emailRandom1 = seededRandom(emailSeed + 19937);
        const emailRandom2 = seededRandom(emailSeed + 23209);
        const emailRandom3 = seededRandom(emailSeed + 29873);
        const emailRandom4 = seededRandom(emailSeed + 31607);
        const emailRandom5 = seededRandom(emailSeed + 37283);
        
        // Much more diverse email domains
        const emailDomains = [
            { domain: 'gmail.com', weight: 30 },
            { domain: 'yahoo.com', weight: 15 },
            { domain: 'hotmail.com', weight: 12 },
            { domain: 'outlook.com', weight: 10 },
            { domain: 'icloud.com', weight: 6 },
            { domain: 'protonmail.com', weight: 4 },
            { domain: 'yandex.com', weight: 4 },
            { domain: 'mail.ru', weight: 4 },
            { domain: 'live.com', weight: 3 },
            { domain: 'msn.com', weight: 2 },
            { domain: 'aol.com', weight: 2 },
            { domain: 'zoho.com', weight: 2 },
            { domain: 'tutanota.com', weight: 2 },
            { domain: 'fastmail.com', weight: 2 },
            { domain: 'gmx.com', weight: 1 },
            { domain: 'mail.com', weight: 1 }
        ];
        
        // Select email domain
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
        
        // SUPER DIVERSE EMAIL PREFIX GENERATION
        const emailStyleChoice = Math.floor(emailRandom2 * 8);
        let emailPrefix = '';
        
        // MEGA DIVERSE MULTILINGUAL RANDOM WORDS (10x bigger, multiple languages)
        const randomWords = [
            // English - Nature & Elements
            'phoenix', 'dragon', 'thunder', 'ocean', 'mountain', 'eagle', 'storm', 'fire',
            'galaxy', 'cosmic', 'ninja', 'warrior', 'mystic', 'shadow', 'crystal', 'golden',
            'silver', 'diamond', 'emerald', 'sapphire', 'ruby', 'platinum', 'bronze', 'steel',
            'winter', 'summer', 'spring', 'autumn', 'sunset', 'sunrise', 'midnight', 'dawn',
            'hunter', 'ranger', 'knight', 'wizard', 'mage', 'sorcerer', 'paladin', 'rogue',
            'tiger', 'lion', 'wolf', 'bear', 'shark', 'falcon', 'hawk', 'raven',
            'cyber', 'tech', 'digital', 'quantum', 'matrix', 'virtual', 'pixel', 'binary',
            'star', 'comet', 'asteroid', 'meteor', 'planet', 'universe', 'cosmos', 'nebula',
            
            // English - Modern & Tech
            'crypto', 'blockchain', 'neon', 'laser', 'turbo', 'ultra', 'mega', 'hyper',
            'alpha', 'beta', 'gamma', 'delta', 'omega', 'sigma', 'chrome', 'fusion',
            'reactor', 'engine', 'power', 'energy', 'voltage', 'circuit', 'network', 'system',
            'core', 'pulse', 'wave', 'beam', 'flux', 'zone', 'vertex', 'apex',
            
            // English - Fantasy & Adventure
            'legend', 'myth', 'epic', 'saga', 'quest', 'blade', 'sword', 'shield',
            'crown', 'throne', 'castle', 'fortress', 'tower', 'gate', 'bridge', 'realm',
            'kingdom', 'empire', 'dynasty', 'clan', 'tribe', 'guild', 'order', 'covenant',
            'oracle', 'prophet', 'sage', 'master', 'guardian', 'sentinel', 'warden', 'keeper',
            
            // Turkish Words
            'kaplan', 'aslan', 'kartal', 'ejder', 'yildiz', 'ay', 'gunes', 'deniz',
            'dag', 'orman', 'ruzgar', 'firtina', 'simsek', 'gok', 'toprak', 'ates',
            'buz', 'kar', 'yagmur', 'bulut', 'goktem', 'altin', 'gumus', 'elmas',
            'sehir', 'koy', 'ada', 'koy', 'vadi', 'tepe', 'yayla', 'ovা',
            'kahraman', 'savascar', 'avcı', 'sovalye', 'prens', 'kral', 'sultan', 'han',
            
            // German Words
            'drache', 'adler', 'wolf', 'tiger', 'lowe', 'falke', 'sturm', 'feuer',
            'stern', 'mond', 'sonne', 'berg', 'wald', 'meer', 'fluss', 'himmel',
            'gold', 'silber', 'eisen', 'stahl', 'kristall', 'diamant', 'rubin', 'saphir',
            'kaiser', 'konig', 'prinz', 'ritter', 'held', 'krieger', 'jager', 'magier',
            
            // French Words
            'dragon', 'aigle', 'lion', 'tigre', 'loup', 'faucon', 'tempete', 'feu',
            'etoile', 'lune', 'soleil', 'montagne', 'foret', 'ocean', 'riviere', 'ciel',
            'or', 'argent', 'fer', 'acier', 'cristal', 'diamant', 'rubis', 'saphir',
            'roi', 'prince', 'chevalier', 'heros', 'guerrier', 'chasseur', 'magicien', 'sage',
            
            // Spanish Words
            'dragon', 'aguila', 'leon', 'tigre', 'lobo', 'halcon', 'tormenta', 'fuego',
            'estrella', 'luna', 'sol', 'montana', 'bosque', 'oceano', 'rio', 'cielo',
            'oro', 'plata', 'hierro', 'acero', 'cristal', 'diamante', 'rubi', 'zafiro',
            'rey', 'principe', 'caballero', 'heroe', 'guerrero', 'cazador', 'mago', 'sabio',
            
            // Italian Words
            'drago', 'aquila', 'leone', 'tigre', 'lupo', 'falco', 'tempesta', 'fuoco',
            'stella', 'luna', 'sole', 'montagna', 'foresta', 'oceano', 'fiume', 'cielo',
            'oro', 'argento', 'ferro', 'acciaio', 'cristallo', 'diamante', 'rubino', 'zaffiro',
            're', 'principe', 'cavaliere', 'eroe', 'guerriero', 'cacciatore', 'mago', 'saggio',
            
            // Japanese (Romanized)
            'ryu', 'tora', 'ookami', 'taka', 'arashi', 'hi', 'mizu', 'kaze',
            'hoshi', 'tsuki', 'taiyou', 'yama', 'mori', 'umi', 'kawa', 'sora',
            'kin', 'gin', 'tetsu', 'hagane', 'suishou', 'daiya', 'ruby', 'safaia',
            'ou', 'ouji', 'kishi', 'eiyuu', 'senshi', 'ryoushi', 'mahou', 'kenja',
            
            // Korean (Romanized)
            'yong', 'horangi', 'neukdae', 'maeeul', 'pokpung', 'bul', 'mul', 'baram',
            'byeol', 'dal', 'haetbit', 'san', 'sup', 'bada', 'gang', 'haneul',
            'geum', 'eun', 'cheol', 'gang', 'suejeong', 'daiya', 'ruby', 'safaia',
            'wang', 'wangja', 'gisa', 'yeongung', 'jeonsa', 'sanyang', 'mabup', 'hyeonin',
            
            // Arabic (Romanized)
            'noor', 'qamar', 'shams', 'jabal', 'bahr', 'nahr', 'sama', 'nar',
            'dhahab', 'fidda', 'hadid', 'fulad', 'mas', 'yaqut', 'zumurrud', 'la\'li',
            'malik', 'amir', 'faris', 'batal', 'muhrib', 'sayad', 'sahir', 'hakim',
            
            // Russian (Romanized)
            'drakon', 'orel', 'lev', 'tigr', 'volk', 'sokol', 'burya', 'ogon',
            'zvezda', 'luna', 'solntse', 'gora', 'les', 'more', 'reka', 'nebo',
            'zoloto', 'serebro', 'zhelezo', 'stal', 'kristall', 'almaz', 'rubin', 'safir',
            'korol', 'prints', 'rytsar', 'geroj', 'voin', 'okhotnik', 'mag', 'mudrets',
            
            // Hindi (Romanized)
            'sher', 'baagh', 'garud', 'toofan', 'aag', 'paani', 'hava', 'dharti',
            'sitara', 'chand', 'suraj', 'parvat', 'jungle', 'samudra', 'nadi', 'aasman',
            'sona', 'chandi', 'loha', 'ispat', 'sphatik', 'heera', 'manik', 'neelam',
            'raja', 'rajkumar', 'yoddha', 'veer', 'shikari', 'jaadugar', 'gyani', 'pandit',
            
            // Modern Tech Terms (Mixed Languages)
            'pixel', 'codec', 'wifi', 'cloud', 'sync', 'upload', 'stream', 'cache',
            'hash', 'token', 'stack', 'queue', 'array', 'loop', 'function', 'method',
            'class', 'object', 'string', 'integer', 'boolean', 'vector', 'matrix', 'algorithm',
            
            // Colors in Different Languages
            'rouge', 'bleu', 'vert', 'noir', 'blanc', 'rojo', 'azul', 'verde',
            'rosso', 'blu', 'verde', 'nero', 'bianco', 'rot', 'blau', 'grun',
            'akai', 'aoi', 'midori', 'kuro', 'shiro', 'kirmizi', 'mavi', 'yesil',
            
            // Numbers in Different Languages
            'uno', 'dos', 'tres', 'quatre', 'cinq', 'six', 'eins', 'zwei',
            'drei', 'ichi', 'ni', 'san', 'bir', 'iki', 'uch', 'ek', 'do', 'teen',
            
            // Mythological Creatures
            'griffin', 'sphinx', 'chimera', 'hydra', 'kraken', 'basilisk', 'banshee', 'valkyrie',
            'centaur', 'minotaur', 'cyclops', 'medusa', 'pegasus', 'unicorn', 'werewolf', 'vampire'
        ];
        
        const randomNumbers = Math.floor(emailRandom3 * 99999).toString().padStart(5, '0');
        const yearSuffix = Math.floor(emailRandom4 * 30) + 1990; // 1990-2019
        const twoDigitNum = Math.floor(emailRandom5 * 100).toString().padStart(2, '0');
        
        switch (emailStyleChoice) {
            case 0: // Simple name based
                emailPrefix = firstName.slice(0, 4) + lastName.slice(0, 3) + twoDigitNum;
                break;
            case 1: // Name with year
                emailPrefix = firstName + yearSuffix;
                break;
            case 2: // Completely random word
                const randomWord = randomWords[Math.floor(emailRandom3 * randomWords.length)];
                emailPrefix = randomWord + twoDigitNum;
                break;
            case 3: // Mixed random
                const word1 = randomWords[Math.floor(emailRandom3 * randomWords.length)];
                const word2 = randomWords[Math.floor(emailRandom4 * randomWords.length)];
                emailPrefix = word1 + word2 + (Math.floor(emailRandom5 * 100));
                break;
            case 4: // Name + random word
                const randomWordMix = randomWords[Math.floor(emailRandom4 * randomWords.length)];
                emailPrefix = firstName.slice(0, 3) + randomWordMix + twoDigitNum;
                break;
            case 5: // Complex alphanumeric
                const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
                emailPrefix = '';
                for (let i = 0; i < 8; i++) {
                    emailPrefix += chars[Math.floor(seededRandom(emailSeed + i * 47) * chars.length)];
                }
                break;
            case 6: // Name variations
                const nameVar = firstName.charAt(0) + lastName + randomNumbers.slice(0, 3);
                emailPrefix = nameVar.toLowerCase();
                break;
            case 7: // Ultra random
                const word3 = randomWords[Math.floor(emailRandom2 * randomWords.length)];
                const specialNum = Math.floor(emailRandom5 * 9999);
                emailPrefix = word3 + '_' + specialNum;
                break;
        }
        
        // Ensure email prefix is not too long
        if (emailPrefix.length > 15) {
            emailPrefix = emailPrefix.slice(0, 15);
        }
        
        const email = `${emailPrefix}@${selectedDomain}`;

        // Return result with more diversity
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
            custom_name,
            credit_card
        } = requestData;

        const finalAmount = parseInt(String(amount).replace(/[^\d]/g, ''), 10);
        const finalItemName = item_name || 'ArtCom Design Payment';
        
        console.log('💰 Parsed amount:', finalAmount);
        console.log('🎯 Order ID:', order_id);
        console.log('🎨 Payment source:', payment_source);
        console.log('👤 Custom name:', custom_name);
        console.log('� Credit card:', credit_card);
        console.log('�📏 Order ID length:', order_id ? order_id.length : 0);
        
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
        customerData = generateDeterministicContact(nameForGeneration, credit_card);
        
        console.log('✅ ULTRA SENSITIVE customer data generated:', {
            input_name: nameForGeneration,
            input_credit_card: credit_card ? 'PROVIDED' : 'NOT_PROVIDED',
            input_cc_length: credit_card ? credit_card.toString().replace(/[^0-9]/g, '').length : 0,
            output_name: `${customerData.first_name} ${customerData.last_name}`,
            email: customerData.email,
            phone: customerData.phone,
            method: 'ultra_sensitive_multilingual_algorithm_v2',
            note: 'ONE_CHARACTER_CHANGE_RESULTS_IN_COMPLETELY_DIFFERENT_OUTPUT'
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
                    customer_generation: 'advanced_deterministic_algorithm_with_credit_card',
                    email_generation: 'ultra_diverse_8_styles',
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
                            customer_generation_method: 'advanced_deterministic_algorithm_with_credit_card',
                            input_name: nameForGeneration,
                            input_credit_card: credit_card ? 'PROVIDED' : 'NOT_PROVIDED',
                            custom_name_provided: !!custom_name,
                            credit_card_provided: !!credit_card,
                            email_generation: 'ultra_diverse_8_styles',
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
                        customer_generation_method: 'advanced_deterministic_algorithm_with_credit_card',
                        custom_name_provided: !!custom_name,
                        credit_card_provided: !!credit_card,
                        email_generation: 'ultra_diverse_8_styles',
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
