// netlify/functions/midtrans-token.js
const crypto = require('crypto');

/**
 * NextPay v3.0 - Encrypted Token System
 * Netlify Function with Token Decryption & 15-min Expiry
 */

// Encryption/Decryption functions (must match PHP)
class PaymentEncryption {
    static key = 'NextPay2025-SecurePayment-System-Key-v3.0'; // Must match PHP
    static method = 'aes-256-cbc';
    
    static encrypt(data) {
        const key = crypto.createHash('sha256').update(this.key).digest();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(this.method, key, iv);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
        encrypted += cipher.final('base64');
        
        // Prepend IV and encode
        return Buffer.concat([iv, Buffer.from(encrypted, 'base64')]).toString('base64');
    }
    
    static decrypt(encryptedData) {
        try {
            const key = crypto.createHash('sha256').update(this.key).digest();
            const data = Buffer.from(encryptedData, 'base64');
            
            if (data.length < 16) {
                return null;
            }
            
            const iv = data.slice(0, 16);
            const encrypted = data.slice(16);
            
            const decipher = crypto.createDecipheriv(this.method, key, iv);
            let decrypted = decipher.update(encrypted, null, 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    }
}

exports.handler = async function(event, context) {
    // COMPREHENSIVE CORS HEADERS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With, Origin',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, PUT, DELETE',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
        'Vary': 'Origin, Access-Control-Request-Headers'
    };

    console.log('🚀 NextPay v3.0 Function Called - Method:', event.httpMethod);
    console.log('🌐 Origin:', event.headers.origin || 'No origin');

    // HANDLE PREFLIGHT REQUESTS
    if (event.httpMethod === 'OPTIONS') {
        console.log('✅ CORS Preflight - returning 200');
        return { 
            statusCode: 200, 
            headers,
            body: JSON.stringify({ message: 'CORS preflight successful' })
        };
    }

    // HANDLE NON-POST REQUESTS
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
        
        const requestData = JSON.parse(event.body || '{}');
        
        // 🔐 CHECK IF THIS IS A TOKEN DECRYPTION REQUEST
        if (requestData.encrypted_token && requestData.action === 'decrypt_and_process') {
            console.log('🔓 TOKEN DECRYPTION REQUEST DETECTED');
            return await handleTokenDecryption(requestData, headers);
        }
        
        // 💳 REGULAR MIDTRANS PAYMENT REQUEST (backward compatibility + new encrypted)
        return await handleMidtransPayment(requestData, headers);

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

/**
 * Handle Token Decryption
 */
async function handleTokenDecryption(requestData, headers) {
    console.log('🔐 Starting token decryption...');
    
    const { encrypted_token, referrer, user_agent, origin } = requestData;
    
    // Decrypt the token
    const decryptedData = PaymentEncryption.decrypt(encrypted_token);
    
    if (!decryptedData) {
        console.error('❌ Token decryption failed');
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Token decryption failed',
                code: 'DECRYPTION_ERROR'
            })
        };
    }
    
    console.log('✅ Token decrypted successfully:', decryptedData);
    
    // Validate token expiry
    const now = Math.floor(Date.now() / 1000);
    if (decryptedData.expires_at && now > decryptedData.expires_at) {
        console.error('❌ Token has expired');
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Payment token has expired',
                code: 'TOKEN_EXPIRED'
            })
        };
    }
    
    // Return decrypted token data
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            action: 'token_decrypted',
            message: 'Token decrypted successfully',
            data: {
                order_id: decryptedData.order_id,
                amount_idr: decryptedData.amount_idr,
                amount_tl: decryptedData.amount_tl,
                user: decryptedData.user,
                firm_id: decryptedData.firm_id,
                timestamp: decryptedData.timestamp,
                expires_at: decryptedData.expires_at,
                hash: decryptedData.hash
            }
        })
    });
}

/**
 * Handle Midtrans Payment Creation
 */
async function handleMidtransPayment(requestData, headers) {
    console.log('💳 Processing Midtrans payment request...');
    
    const { 
        amount, 
        item_name, 
        php_webhook_url,
        auto_redirect,
        referrer,
        user_agent,
        origin,
        encrypted_order_token,  // NEW: For encrypted orders
        order_id_from_token     // NEW: Original order ID from token
    } = requestData;
    
    let finalAmount, finalItemName, orderId;
    
    // Determine if this is encrypted order or regular order
    if (encrypted_order_token && order_id_from_token) {
        // 🔐 ENCRYPTED ORDER PROCESSING
        console.log('🔐 Processing encrypted order');
        
        finalAmount = parseInt(String(amount).replace(/[^\d]/g, ''), 10);
        finalItemName = item_name || 'Secure Payment';
        
        // Use a combination for Midtrans order ID
        orderId = `${order_id_from_token}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        
        console.log('🔐 Encrypted Order Details:');
        console.log('  - Original Order ID:', order_id_from_token);
        console.log('  - Midtrans Order ID:', orderId);
        console.log('  - Amount IDR:', finalAmount);
        console.log('  - Token Length:', encrypted_order_token.length);
        
    } else {
        // 📝 REGULAR ORDER PROCESSING (backward compatibility)
        console.log('📝 Processing regular order (backward compatibility)');
        
        finalAmount = parseInt(String(amount).replace(/[^\d]/g, ''), 10);
        finalItemName = item_name || 'Product';
        orderId = `ORDER_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        
        console.log('📝 Regular Order Details:');
        console.log('  - Generated Order ID:', orderId);
        console.log('  - Amount IDR:', finalAmount);
    }
    
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

    // Send notification to PHP
    const notificationPayload = {
        event: 'payment_initiated',
        order_id: orderId,
        amount: finalAmount,
        item_name: finalItemName,
        status: 'PENDING',
        auto_redirect: auto_redirect || false,
        timestamp: new Date().toISOString(),
        // 🔐 CRITICAL: Include encrypted token for matching
        encrypted_token: encrypted_order_token || null,
        original_order_id: order_id_from_token || null,
        request_details: {
            referrer: referrer,
            user_agent: user_agent,
            origin: origin,
            ip: event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown'
        }
    };

    console.log('📤 Sending to PHP:', php_webhook_url);
    
    let phpResult = { skipped: true };
    
    if (php_webhook_url && 
        (php_webhook_url.startsWith('https://') || php_webhook_url.startsWith('http://')) && 
        !php_webhook_url.includes('placeholder')) {
        
        try {
            console.log('📤 Sending PHP notification...');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const phpResponse = await fetch(php_webhook_url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'User-Agent': 'NextPay-v3.0-Netlify-Function',
                    'Accept': 'application/json, text/plain, */*'
                },
                body: JSON.stringify(notificationPayload),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            console.log('📡 PHP Response Status:', phpResponse.status);
            
            const responseText = await phpResponse.text();
            console.log('📄 PHP Response:', responseText);
            
            try {
                phpResult = JSON.parse(responseText);
                console.log('✅ PHP JSON Response:', phpResult);
            } catch (parseError) {
                phpResult = { 
                    success: phpResponse.ok,
                    raw_response: responseText,
                    status: phpResponse.status
                };
            }
            
        } catch (phpError) {
            console.error('🚨 PHP Request Failed:', phpError.message);
            phpResult = { 
                error: phpError.message,
                error_type: phpError.constructor.name
            };
        }
    } else {
        console.log('⚠️ PHP webhook skipped - invalid URL');
        phpResult = { skipped: true, reason: 'Invalid webhook URL' };
    }

    // 🕐 Generate Midtrans date format with 15-minute expiry
    const now = new Date();
    const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000)); // UTC+7
    const midtransDate = jakartaTime.toISOString().slice(0, 19).replace('T', ' ') + ' +0700';
    
    console.log('🕐 Midtrans date format:', midtransDate);

    // 💳 Midtrans API call with 15-minute expiry
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
            first_name: 'NextPay',
            last_name: 'Customer',
            email: 'customer@nextpay.com',
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
        // 🕐 CRITICAL: 15-minute expiry limit
        expiry: {
            start_time: midtransDate,
            unit: "minute",
            duration: 15  // 15 minutes as requested
        }
    };

    const apiUrl = 'https://app.midtrans.com/snap/v1/transactions';
    const serverKey = 'Mid-server-kO-tU3T7Q9MYO_25tJTggZeu';
    const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

    console.log('🔗 Calling Midtrans API with 15-min expiry...');

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: authHeader,
            'User-Agent': 'NextPay-v3.0-Netlify-Function'
        },
        body: JSON.stringify(midtransParams)
    });

    const responseData = await response.json();
    
    console.log('📡 Midtrans response status:', response.status);
    console.log('📡 Midtrans response:', JSON.stringify(responseData, null, 2));

    if (response.ok && responseData.token) {
        console.log('✅ Success - 15-min expiry token generated');
        
        const successResponse = {
            success: true,
            data: {
                token: responseData.token,
                redirect_url: responseData.redirect_url,
                order_id: orderId,
                amount: finalAmount,
                auto_redirect: auto_redirect || false,
                expiry_duration: '15 minutes',
                midtrans_response: responseData,
                php_notification: phpResult,
                // 🔐 Include encrypted token info if available
                encrypted_order: encrypted_order_token ? {
                    has_encrypted_token: true,
                    original_order_id: order_id_from_token,
                    token_length: encrypted_order_token.length
                } : null
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
                    expiry: '15 minutes',
                    php_result: phpResult
                }
            })
        };
    }
}
