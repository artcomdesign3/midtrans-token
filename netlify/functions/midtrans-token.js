// netlify/functions/midtrans-token.js - ArtCom v8.0 - MULTI-GATEWAY (Midtrans + Doku)
// =============================================================================
// PAYMENT GATEWAY CONFIGURATION
// =============================================================================

// Get Private Key from Environment Variable (Netlify)
// Check if env var exists and is not empty, otherwise use hardcoded fallback
console.log('🔍 ENV VAR CHECK - process.env.DOKU_PRIVATE_KEY exists:', !!process.env.DOKU_PRIVATE_KEY);
console.log('🔍 ENV VAR CHECK - type:', typeof process.env.DOKU_PRIVATE_KEY);
console.log('🔍 ENV VAR CHECK - length:', process.env.DOKU_PRIVATE_KEY ? process.env.DOKU_PRIVATE_KEY.length : 0);
console.log('🔍 ENV VAR CHECK - first 50 chars:', process.env.DOKU_PRIVATE_KEY ? process.env.DOKU_PRIVATE_KEY.substring(0, 50) : 'NULL');

// Handle Netlify environment variable format: convert literal \n strings to actual newlines
const DOKU_PRIVATE_KEY = (process.env.DOKU_PRIVATE_KEY && process.env.DOKU_PRIVATE_KEY.trim().length > 0) 
    ? process.env.DOKU_PRIVATE_KEY.replace(/\\n/g, '\n')  // Convert literal \n to actual newlines
    : `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQBoaLriBtWoRl7OAhvS4ta1gYZTniHgZRcCagQHSiSuKF3wMZFx
Z7J4fGQ2XDF14TNWPe1ZYkP9VgLyTuRPweyUrmqh+wlzE2UORzCqp6g28V6eJZXY
uz2RNbJ2QSvqLUjQKXNLpAVBv/qeLtoy/Dt6UqgIhGBhybmkabMd3VBrGQQY84BH
oPVXDefl/5EeHanVNeDawwtk0eFNLV/3RyBcxXRIoSVz3Y/uj1V9qk28Av5IWjvQ
7ggk8HJf22PlyJ4OQACmuloVPnPKmc6qEYb0tAwSyDb6AFZZbIvmGTdhsryEXBK5
mEJ20SiYKT7r4BJioBBa/M5P+eg3IF5EVWDnAgMBAAECggEATrsiqUw0Etc1qCzI
5GYvN+E69JTawMYZ6rUc4o5TSIyiAXyvSw/B8b8DJkaw+U3fE1pRP0StNjyErkk1
Ortl9dvsBscxIfhvDKw8E4Ongf7StXhsHWlcDMKsFyYfwk9xh56qFVDSsfjdOCjm
Wun+w8fOc9W2hCbEeSlHau63NHpKP6nQn1qkUymku6CwaanUCv/WOfa/8BJ97Jud
YXvb0OM6fcdMTvIFOEXkHGbYdoXr0OaN6v+iGfKfl1qFHgVHUnIGEUkIZOdAENTD
m3pQ2KjbwT8mCHIXthmt7HILpXxyH9h1VRoEZJ6k1ylFwSHOEWlGgNKM/e7FLwJC
n1bJoQKBgQCx04TOmoRejxryHYTeV7zAompFJdZtIW6+GiS1rwh+4sr/E2rCMpnn
rZHO9aHSeqlUHMgOElh8XkHbXxrihv+7S8LY8G4vkiAsgRc+k8V0E2r3JonAg/Ns
wnzKcR2Xqgg3DRtbr3BaiKegPb1zvJbUgpgQBIk17boCSfezYFI0UQKBgQCWTuF4
We/mr8H6CjK+x+ErOzK/+WwP1bByXNCDDVWRLk+fmj9/zT3lYO5LM3tzjjuSO8Mr
MWUm8Mxjgw3Sjn9XPjSmhYqAQUzybhKchK//fZ1pw3SlZ/mm1NkjixTvEJ1e8HC+
rXRaS5uJNCotNm07jvbxgZzV8qi6qEqC/AqLtwKBgGyR9PrjUkAdZVk/dpj9vmtq
fjGbqXBVwjRk59bZd/loZIIaC8tnc5oE2goe5F8KrwmAzQ/yWX4NWm4igdqei9KB
rgQfv1ZiBCzH4DY/qIV3OY6OQ/p7VYsor2I2b9fiY0OhR/vRgGp2Fsn6CAp6sSgs
V8Unz9JSQ4gUOxyUiXwRAoGBAIRYdizLO/HqJaks25uiUUAIgtoIGz8iD5fS44HQ
9tu7ZD6KyYiVRf+3RnqOnQ+VWBydZG6esosEEWM5nK0d7T/7NM6+3MGrPb5kbxzD
tFgI2darVATkNSzRU1P5fXg2L+rNWOh7v+xVkGDRvqVKvAlqC0OAtYCohiq8Tcdh
d0OnAoGBAKlb9ZJ7IhmcH16+YwP6r+2fJYY3Tamd36jo6NT3eQW2HmC1c8dz2hpA
GK3ABuKDWoLAaxT8zsFhitjFseHoJruWc0xG9TcbthBFcPQLy53y9KiEu695pABn
uxYgJIVMhZnzlvvfZNavnP/8wSNWoSz2Pndgd7eLI5ji9mOIrZ10
-----END RSA PRIVATE KEY-----`;

console.log('🔍 FINAL DOKU_PRIVATE_KEY - length:', DOKU_PRIVATE_KEY ? DOKU_PRIVATE_KEY.length : 0);
console.log('🔍 FINAL DOKU_PRIVATE_KEY - first 50 chars:', DOKU_PRIVATE_KEY ? DOKU_PRIVATE_KEY.substring(0, 50) : 'NULL');

const DOKU_CONFIG = {
    // NOTE: These credentials are PRODUCTION credentials only
    // ALWAYS using PRODUCTION API
    SANDBOX: {
        // Not used - production credentials only
        CLIENT_ID: 'BRN-0275-1760357392509',
        SECRET_KEY: 'SK-bBnDtOM1lK4AAzR72gTC',
        PRIVATE_KEY: DOKU_PRIVATE_KEY,
        API_URL: 'https://api-sandbox.doku.com/checkout/v1/payment'
    },
    PRODUCTION: {
        CLIENT_ID: 'BRN-0275-1760357392509',
        SECRET_KEY: 'SK-bBnDtOM1lK4AAzR72gTC',
        PRIVATE_KEY: DOKU_PRIVATE_KEY,
        API_URL: 'https://api.doku.com/checkout/v1/payment'
    }
};

const MIDTRANS_CONFIG = {
    SERVER_KEY: 'Mid-server-kO-tU3T7Q9MYO_25tJTggZeu',
    API_URL: 'https://app.midtrans.com/snap/v1/transactions'
};

// =============================================================================

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

    console.log('🚀 ARTCOM v8.0 - MULTI-GATEWAY (Midtrans + Doku)');
    console.log('🌍 Origin:', event.headers.origin || 'No origin');

    if (event.httpMethod === 'OPTIONS') {
        console.log('✅ CORS Preflight - returning 200');
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'CORS preflight successful',
                timestamp: Math.floor(Date.now() / 1000),
                function_version: 'artcom_v8.0_multi_gateway',
                supported_gateways: ['midtrans', 'doku']
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

    // =============================================================================
    // DOKU PAYMENT GATEWAY FUNCTIONS
    // =============================================================================

    /**
     * Create DOKU Signature for Checkout API (Request Header Signature Format)
     * Reference: https://developers.doku.com/accept-payment/direct-api/snap
     * Uses: Client-Id, Request-Id, Request-Timestamp, Request-Target, Digest
     */
    function createDokuSignature(clientId, requestId, timestamp, requestBody, secretKey) {
        const crypto = require('crypto');

        // Step 1: Minify JSON (no spaces, no newlines)
        const minifiedBody = JSON.stringify(requestBody);

        // Step 2: Create Digest - SHA-256 BASE64 hash of body
        const digest = crypto
            .createHash('sha256')
            .update(minifiedBody)
            .digest('base64');

        // Step 3: Build Component String (Request Header Signature Format)
        // Each component on new line with \n separator
        // Format: Client-Id:value\nRequest-Id:value\nRequest-Timestamp:value\nRequest-Target:value\nDigest:value
        const requestTarget = '/checkout/v1/payment';
        
        const componentString = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;

        // Step 4: Create HMAC SHA-256 signature (Request Header uses SHA-256, not SHA-512!)
        const hmac = crypto.createHmac('sha256', secretKey);
        hmac.update(componentString);
        const signature = hmac.digest('base64');

        console.log('🔐 DOKU Signature Debug (Request Header Format):');
        console.log('   Client-Id:', clientId);
        console.log('   Request-Id:', requestId);
        console.log('   Request-Timestamp:', timestamp);
        console.log('   Request-Target:', requestTarget);
        console.log('   Body length:', minifiedBody.length);
        console.log('   Digest (SHA-256 base64):', digest.substring(0, 30) + '...');
        console.log('   Component String:');
        console.log('   ', componentString.replace(/\n/g, '\\n'));
        console.log('   HMAC Algorithm: SHA256');
        console.log('   Secret Key length:', secretKey ? secretKey.length : 0);
        console.log('   Final signature:', signature.substring(0, 30) + '...');

        return signature;
    }

    /**
     * Generate unique Request ID for DOKU
     */
    function createDokuRequestId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `ARTCOM-${timestamp}-${random}`;
    }

    /**
     * Get ISO8601 timestamp for DOKU (UTC Z format as per documentation)
     * DOKU expects: 2020-08-11T08:45:42Z (UTC+0 with Z suffix)
     */
    function getDokuTimestamp() {
        // Return UTC timestamp with Z suffix, no milliseconds
        const now = new Date();
        return now.toISOString().replace(/\.\d{3}Z$/, 'Z');
    }

    /**
     * Get DOKU Token B2B
     * Required before making payment API calls
     * Uses RSA-SHA256 signature with Private Key
     */
    async function getDokuTokenB2B(clientId, privateKey, isProduction) {
        const crypto = require('crypto');
        
        console.log('🔑 ========== DOKU TOKEN B2B REQUEST START ==========');
        console.log('🔍 Configuration Check:');
        console.log('   Client ID:', clientId);
        console.log('   Client ID Length:', clientId ? clientId.length : 0);
        console.log('   Private Key Exists:', !!privateKey);
        console.log('   Private Key Type:', typeof privateKey);
        console.log('   Private Key Length:', privateKey ? privateKey.length : 0);
        console.log('   Private Key First 100 chars:', privateKey ? privateKey.substring(0, 100) : 'NULL');
        console.log('   Is Production:', isProduction);
        
        const timestamp = getDokuTimestamp();
        console.log('   Timestamp:', timestamp);
        
        // Create signature for token request: clientId|timestamp
        // MUST use RSA-SHA256 with Private Key
        const stringToSign = `${clientId}|${timestamp}`;
        console.log('   String to Sign:', stringToSign);
        
        let signature;
        try {
            console.log('🔐 Creating RSA-SHA256 signature...');
            console.log('   Private Key has \\n literal check:', privateKey.includes('\\n'));
            console.log('   Private Key has real newline check:', privateKey.includes('\n'));
            console.log('   Private Key char codes (first 60):', privateKey.substring(0, 60).split('').map(c => c.charCodeAt(0)).join(','));
            
            const sign = crypto.createSign('RSA-SHA256');
            sign.update(stringToSign, 'utf8');
            sign.end();
            signature = sign.sign(privateKey, 'base64');
            console.log('✅ Signature created successfully');
            console.log('   Signature Length:', signature.length);
            console.log('   Signature First 50 chars:', signature.substring(0, 50));
        } catch (error) {
            console.error('❌ RSA SIGNING ERROR:', error);
            console.error('   Error Name:', error.name);
            console.error('   Error Message:', error.message);
            console.error('   Error Stack:', error.stack);
            console.error('   Private key length:', privateKey ? privateKey.length : 0);
            console.error('   Private key has literal \\n:', privateKey ? privateKey.includes('\\n') : false);
            console.error('   Private key has real newline:', privateKey ? privateKey.includes('\n') : false);
            console.error('   Private key first 150 chars:', privateKey ? privateKey.substring(0, 150) : 'NULL');
            return null;
        }

        const tokenUrl = isProduction 
            ? 'https://api.doku.com/authorization/v1/access-token/b2b'
            : 'https://api-sandbox.doku.com/authorization/v1/access-token/b2b';

        console.log('� Sending Token B2B Request...');
        console.log('   URL:', tokenUrl);
        console.log('   Headers:');
        console.log('      Content-Type: application/json');
        console.log('      X-CLIENT-KEY:', clientId);
        console.log('      X-TIMESTAMP:', timestamp);
        console.log('      X-SIGNATURE:', signature.substring(0, 50) + '...');
        console.log('   Body:', JSON.stringify({ grantType: 'client_credentials' }));

        try {
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CLIENT-KEY': clientId,
                    'X-TIMESTAMP': timestamp,
                    'X-SIGNATURE': signature
                },
                body: JSON.stringify({
                    grantType: 'client_credentials'
                })
            });

            console.log('📥 Response received');
            console.log('   Status:', response.status);
            console.log('   Status Text:', response.statusText);

            const responseData = await response.json();
            console.log('📥 Response Body:', JSON.stringify(responseData, null, 2));

            if (response.ok && responseData.accessToken) {
                console.log('✅ Token B2B obtained successfully');
                console.log('   Token Length:', responseData.accessToken.length);
                console.log('   Token First 50 chars:', responseData.accessToken.substring(0, 50));
                console.log('   Expires in:', responseData.expiresIn, 'seconds');
                console.log('🔑 ========== DOKU TOKEN B2B REQUEST END (SUCCESS) ==========');
                return responseData.accessToken;
            } else {
                console.error('❌ TOKEN B2B REQUEST FAILED');
                console.error('   HTTP Status:', response.status);
                console.error('   Response:', JSON.stringify(responseData, null, 2));
                console.log('🔑 ========== DOKU TOKEN B2B REQUEST END (FAILED) ==========');
                return null;
            }
        } catch (error) {
            console.error('❌ TOKEN B2B NETWORK ERROR:', error);
            console.error('   Error Name:', error.name);
            console.error('   Error Message:', error.message);
            console.log('🔑 ========== DOKU TOKEN B2B REQUEST END (ERROR) ==========');
            return null;
        }
    }

    /**
     * Handle DOKU Payment Creation
     */
    async function handleDokuPayment(requestData, headers) {
        console.log('💳 ========== DOKU PAYMENT REQUEST START ==========');
        console.log('📦 Request Data:', JSON.stringify(requestData, null, 2));
        
        const {
            amount,
            order_id,
            item_name = 'ArtCom Design Payment',
            callback_base_url,
            test_mode = false,
            payment_source = 'legacy',
            custom_name,
            credit_card,
            auto_redirect
        } = requestData;

        console.log('🔍 Extracted Parameters:');
        console.log('   Amount:', amount);
        console.log('   Order ID:', order_id);
        console.log('   Item Name:', item_name);
        console.log('   Callback Base URL:', callback_base_url);
        console.log('   Test Mode:', test_mode);
        console.log('   Payment Source:', payment_source);
        console.log('   Custom Name:', custom_name);
        console.log('   Credit Card:', credit_card ? 'PROVIDED' : 'NOT PROVIDED');
        console.log('   Auto Redirect:', auto_redirect);

        // ALWAYS USE PRODUCTION for Doku (credentials are production)
        const dokuEnv = DOKU_CONFIG.PRODUCTION;

        console.log('⚙️ DOKU Configuration:');
        console.log('   Environment: PRODUCTION (FORCED)');
        console.log('   API URL:', dokuEnv.API_URL);
        console.log('   Client ID:', dokuEnv.CLIENT_ID);
        console.log('   Secret Key Exists:', !!dokuEnv.SECRET_KEY);
        console.log('   Secret Key Length:', dokuEnv.SECRET_KEY ? dokuEnv.SECRET_KEY.length : 0);
        console.log('   Private Key Exists:', !!dokuEnv.PRIVATE_KEY);
        console.log('   Private Key Length:', dokuEnv.PRIVATE_KEY ? dokuEnv.PRIVATE_KEY.length : 0);
        console.log('   Private Key First 100 chars:', dokuEnv.PRIVATE_KEY ? dokuEnv.PRIVATE_KEY.substring(0, 100) : 'NULL');

        // Generate Doku request parameters
        const requestId = createDokuRequestId();
        const timestamp = getDokuTimestamp();

        console.log('🆔 Request Metadata:');
        console.log('   Request ID:', requestId);
        console.log('   Timestamp:', timestamp);

        // Determine callback URL
        let callbackUrl;
        if (callback_base_url) {
            callbackUrl = callback_base_url;
        } else if (test_mode) {
            callbackUrl = 'https://nextpays1staging.wpcomstaging.com';
        } else {
            callbackUrl = 'https://artcomdesign3-umbac.wpcomstaging.com';
        }

        // Add gateway parameter to callback URL
        callbackUrl += `?gateway=doku&order_id=${order_id}`;

        console.log('🔗 Callback URL:', callbackUrl);

        // Generate customer data using Advanced Deterministic Generator (same as Midtrans)
        // Uses custom_name and credit_card from WordPress URL parameters
        let nameForGeneration;
        if (custom_name && typeof custom_name === 'string' && custom_name.trim()) {
            nameForGeneration = custom_name.trim();
            console.log('👤 Using provided custom name:', nameForGeneration);
        } else {
            nameForGeneration = generateFallbackName(order_id, amount);
            console.log('🎯 Generated fallback name:', nameForGeneration);
        }
        
        const customerData = generateDeterministicContact(nameForGeneration, credit_card);
        console.log('✅ Customer data generated:', {
            input_name: nameForGeneration,
            output_name: `${customerData.first_name} ${customerData.last_name}`,
            email: customerData.email,
            phone: customerData.phone
        });

        // CRITICAL FIX: Trim invoice_number to 30 chars (DOKU Credit Card requirement)
        // DOKU Documentation: Max 64 chars normally, but 30 chars if Credit Card is enabled
        const invoiceNumber = String(order_id).substring(0, 30);

        // Prepare Doku request body (DOKU Checkout API format)
        // Reference: https://developers.doku.com/accept-payment/direct-api/checkout
        // MANDATORY FIELDS: order (amount, invoice_number) + payment (payment_due_date)
        const dokuRequestBody = {
            order: {
                invoice_number: invoiceNumber,
                amount: parseInt(amount, 10)
            },
            payment: {
                payment_due_date: 5  // MANDATORY: minutes until payment expires (5 minutes like Midtrans)
            },
            customer: {
                name: `${customerData.first_name} ${customerData.last_name}`,
                email: customerData.email
            }
        };
        
        console.log('👤 Customer:', dokuRequestBody.customer.name);
        console.log('📧 Email:', dokuRequestBody.customer.email);
        console.log('💰 Order amount:', dokuRequestBody.order.amount);
        console.log('📋 Invoice number (trimmed to 30):', dokuRequestBody.order.invoice_number);
        console.log('⏱️  Payment due date:', dokuRequestBody.payment.payment_due_date, 'minutes');

        // STEP 1: Get Token B2B (required for signature)
        console.log('📍 Step 1: Obtaining Token B2B...');
        const tokenB2B = await getDokuTokenB2B(
            dokuEnv.CLIENT_ID,
            dokuEnv.PRIVATE_KEY,  // Using RSA Private Key
            true  // Production
        );

        if (!tokenB2B) {
            console.error('❌ Failed to obtain Token B2B - cannot proceed');
            console.error('   HINT: Make sure PRIVATE_KEY is configured in DOKU_CONFIG');
            console.error('   Get your Private Key from DOKU Dashboard → Settings → API Keys');
            return {
                statusCode: 500,
                headers: headers,
                body: JSON.stringify({
                    success: false,
                    gateway: 'doku',
                    error: 'Failed to obtain DOKU authentication token (Token B2B)',
                    message: 'RSA Private Key is required. Please configure PRIVATE_KEY in DOKU_CONFIG.',
                    hint: 'Get your Private/Public Key pair from DOKU Dashboard'
                })
            };
        }

        console.log('✅ Token B2B obtained successfully');

        // STEP 2: Create signature (Request Header Format - NO Token B2B in signature!)
        console.log('📍 Step 2: Creating signature (Request Header Format)...');
        const signature = createDokuSignature(
            dokuEnv.CLIENT_ID,
            requestId,
            timestamp,
            dokuRequestBody,  // Pass object, not string
            dokuEnv.SECRET_KEY
        );

        // STEP 3: Prepare headers for Doku API (NO Authorization header per documentation)
        // DOKU Checkout API Documentation: Only requires Client-Id, Request-Id, Request-Timestamp, Signature
        // Authorization Bearer token is NOT used for Checkout endpoint
        const dokuHeaders = {
            'Content-Type': 'application/json',
            'Client-Id': dokuEnv.CLIENT_ID,
            'Request-Id': requestId,
            'Request-Timestamp': timestamp,
            'Signature': `HMACSHA256=${signature}`
            // NO Authorization header - Checkout uses HMAC Signature only
        };

        console.log('📤 Step 3: Sending request to Doku (Request Header Signature)...');
        console.log('   Request-Id:', requestId);
        console.log('   Timestamp (UTC Z format):', timestamp);
        console.log('   Headers:', JSON.stringify({...dokuHeaders, 'Signature': 'HMACSHA256=***'}, null, 2));

        try {
            const response = await fetch(dokuEnv.API_URL, {
                method: 'POST',
                headers: dokuHeaders,
                body: JSON.stringify(dokuRequestBody)  // Stringify here, not earlier
            });

            const responseText = await response.text();
            console.log('📡 Doku response status:', response.status);
            console.log('📡 Response length:', responseText.length);

            if (!response.ok) {
                console.error('❌ Doku API Error');
                console.error('   Status:', response.status);
                console.error('   Response:', responseText.substring(0, 500));

                let errorData;
                try {
                    errorData = JSON.parse(responseText);
                } catch (e) {
                    errorData = { error: responseText };
                }

                return {
                    statusCode: response.status,
                    headers: headers,
                    body: JSON.stringify({
                        success: false,
                        gateway: 'doku',
                        error: 'Doku payment creation failed',
                        details: errorData,
                        doku_status: response.status
                    })
                };
            }

            const responseData = JSON.parse(responseText);

            console.log('✅ Doku payment created successfully');
            console.log('   Has payment URL:', !!responseData.response?.payment?.url);
            console.log('   Has token:', !!responseData.response?.payment?.token_id);

            // Send webhook notification
            await sendWebhookNotification({
                event: 'payment_initiated_doku',
                order_id: order_id,
                amount: parseInt(amount),
                gateway: 'doku',
                payment_source: payment_source,
                test_mode: test_mode,
                doku_token: responseData.response?.payment?.token_id,
                callback_url: callbackUrl
            });

            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify({
                    success: true,
                    gateway: 'doku',
                    data: {
                        token: responseData.response.payment.token_id,
                        redirect_url: responseData.response.payment.url,
                        order_id: order_id,
                        amount: parseInt(amount),
                        expiry_date: responseData.response.payment.expired_date,
                        doku_response: responseData,
                        timestamp: Math.floor(Date.now() / 1000),
                        function_version: 'artcom_v8.0_multi_gateway',
                        payment_source: payment_source,
                        test_mode: test_mode
                    }
                })
            };

        } catch (error) {
            console.error('🚨 Doku payment error:', error);
            return {
                statusCode: 500,
                headers: headers,
                body: JSON.stringify({
                    success: false,
                    gateway: 'doku',
                    error: 'Internal error during Doku payment creation',
                    message: error.message
                })
            };
        }
    }

    /**
     * Send webhook notification
     */
    async function sendWebhookNotification(data) {
        const isNextPay = data.order_id && data.order_id.startsWith('ARTCOM_') && data.order_id.length === 34;

        let webhookUrl;
        if (isNextPay) {
            if (data.test_mode) {
                webhookUrl = 'https://nextpays1.de/webhook/midtrans.php';
            } else {
                webhookUrl = 'https://nextpays.de/webhook/midtrans.php';
            }
        } else {
            webhookUrl = 'https://www.artcom.design/webhook/midtrans.php';
        }

        console.log('📡 Sending webhook to:', webhookUrl);

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'ArtCom-Payment-Function-v8.0-multi-gateway'
                },
                body: JSON.stringify({
                    ...data,
                    timestamp: new Date().toISOString(),
                    timestamp_unix: Math.floor(Date.now() / 1000),
                    function_version: 'artcom_v8.0_multi_gateway'
                })
            });

            console.log('📡 Webhook response:', response.status);
        } catch (error) {
            console.error('🚨 Webhook notification failed:', error.message);
        }
    }

    // =============================================================================
    // END DOKU FUNCTIONS
    // =============================================================================

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
            payment_gateway,  // REQUIRED: Gateway selection (midtrans or doku) - NO DEFAULT
            wix_ref,
            wix_expiry,
            wix_signature,
            custom_name,
            credit_card,
            callback_base_url,
            test_mode = false
        } = requestData;

        console.log('🎯 Payment Gateway:', payment_gateway);
        console.log('💰 Amount:', amount);
        console.log('📦 Order ID:', order_id);
        console.log('🎨 Payment Source:', payment_source);
        console.log('🧪 Test Mode:', test_mode);

        // ============================================================================
        // GATEWAY VALIDATION: payment_gateway is REQUIRED
        // ============================================================================

        if (!payment_gateway) {
            console.error('❌ Missing payment_gateway parameter');
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'payment_gateway parameter is required',
                    allowed_gateways: ['midtrans', 'doku'],
                    message: 'Please specify payment_gateway: "midtrans" or "doku"'
                })
            };
        }

        if (payment_gateway !== 'midtrans' && payment_gateway !== 'doku') {
            console.error('❌ Invalid payment_gateway:', payment_gateway);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid payment_gateway parameter',
                    received: payment_gateway,
                    allowed_gateways: ['midtrans', 'doku'],
                    message: 'payment_gateway must be either "midtrans" or "doku"'
                })
            };
        }

        // ============================================================================
        // GATEWAY ROUTING: Route to appropriate payment gateway
        // ============================================================================

        if (payment_gateway === 'doku') {
            console.log('🔀 Routing to DOKU payment gateway...');
            return await handleDokuPayment(requestData, headers);
        }

        if (payment_gateway === 'midtrans') {
            console.log('🔀 Routing to MIDTRANS payment gateway...');
        }

        // ============================================================================
        // MIDTRANS PAYMENT FLOW (EXISTING CODE BELOW)
        // ============================================================================

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

        console.log('📤 Sending webhook notification (Midtrans)...');
        await sendWebhookNotification({
            event: `payment_initiated_${payment_source}`,
            order_id: order_id,
            amount: finalAmount,
            item_name: finalItemName,
            gateway: 'midtrans',
            status: 'PENDING',
            payment_source: payment_source,
            customer_data: customerData,
            callback_url: callbackUrl,
            is_nextpay: isNextPay,
            nextpay_source: source,
            token_created_at_start: isNextPay,
            test_mode: test_mode,
            request_details: {
                referrer: referrer,
                user_agent: user_agent,
                origin: origin,
                custom_name: custom_name,
                generated_name: nameForGeneration
            },
            ...(payment_source === 'wix' && {
                wix_data: {
                    reference: wix_ref,
                    expiry: wix_expiry,
                    signature: wix_signature
                }
            })
        });

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
                'User-Agent': 'ArtCom-v8.0-multi-gateway'
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
                    gateway: 'midtrans',
                    data: {
                        token: responseData.token,
                        redirect_url: responseData.redirect_url,
                        order_id: order_id,
                        amount: finalAmount,
                        auto_redirect: auto_redirect || false,
                        expiry_duration: '5 minutes',
                        midtrans_response: responseData,
                        timestamp: Math.floor(Date.now() / 1000),
                        function_version: 'artcom_v8.0_multi_gateway',
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
                    gateway: 'midtrans',
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
                function_version: 'artcom_v8.0_multi_gateway'
            })
        };
    }
};
