// netlify/functions/midtrans-token.js
const crypto = require('crypto');

/**
 * NextPay Secure Decryption System - JavaScript
 * AES-256-GCM with Authentication
 */
class SecurePaymentDecryption {
    static masterKey = 'NextPay2025-UltraSecure-MasterKey-AES256-GCM-Authentication-System';
    
    /**
     * Decrypt user data with AES-256-GCM
     */
    static decryptUserData(encryptedToken) {
        try {
            // Generate same 256-bit key
            const key = crypto.createHash('sha256').update(this.masterKey).digest();
            
            // Restore base64 padding and decode
            const paddedToken = encryptedToken.replace(/-/g, '+').replace(/_/g, '/');
            const finalToken = paddedToken + '='.repeat((4 - paddedToken.length % 4) % 4);
            const combined = Buffer.from(finalToken, 'base64');
            
            if (combined.length < 28) { // 12 IV + 16 tag + data
                throw new Error('Invalid token format');
            }
            
            // Extract components
            const iv = combined.slice(0, 12);        // 96-bit IV
            const tag = combined.slice(12, 28);      // 128-bit authentication tag
            const encrypted = combined.slice(28);    // Encrypted data
            
            // Decrypt with AES-256-GCM
            const decipher = crypto.createDecipherGCM('aes-256-gcm');
            decipher.setAuthTag(tag);
            
            let decrypted = decipher.update(encrypted, null, 'utf8');
            decrypted += decipher.final('utf8');
            
            // Parse JSON
            const dataWithSecurity = JSON.parse(decrypted);
            
            // Verify structure
            if (!dataWithSecurity.user_data || !dataWithSecurity.expires_at) {
                throw new Error('Invalid token structure');
            }
            
            // Check expiry
            if (Date.now() / 1000 > dataWithSecurity.expires_at) {
                throw new Error('Token has expired');
            }
            
            // Verify checksum
            const expectedChecksum = crypto.createHash('sha256').update(JSON.stringify(dataWithSecurity.user_data)).digest('hex');
            if (!dataWithSecurity.checksum || dataWithSecurity.checksum !== expectedChecksum) {
                throw new Error('Data integrity check failed');
            }
            
            return dataWithSecurity.user_data;
            
        } catch (error) {
            console.error('Decryption Error:', error.message);
            return null;
        }
    }
    
    /**
     * Validate and extract order data from token
     */
    static validateAndExtractOrder(token) {
        const userData = this.decryptUserData(token);
        
        if (!userData) {
            return null;
        }
        
        // Validate required fields
        const requiredFields = ['order_number', 'amount_tl', 'amount_idr', 'user_name', 'firm_id'];
        for (const field of requiredFields) {
            if (!userData[field]) {
                console.error(`Missing required field: ${field}`);
                return null;
            }
        }
        
        return userData;
    }
}

exports.handler = async function(event, context) {
    // COMPREHENSIVE CORS HEADERS FOR NETLIFY FUNCTIONS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin, X-Requested-With',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, PUT, DELETE',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json'
    };

    console.log('🚀 NextPay Function Called - Method:', event.httpMethod);
    console.log('📥 Headers:', event.headers);

    // CRITICAL: Handle PREFLIGHT OPTIONS requests first
    if (event.httpMethod === 'OPTIONS') {
        console.log('✅ Handling OPTIONS preflight request');
        return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify({ message: 'CORS preflight successful' }) 
        };
    }

    // HANDLE NON-POST REQUESTS
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, error: 'Method not allowed' })
        };
    }

    try {
        const requestData = JSON.parse(event.body || '{}');
        
        console.log('📥 Request Data:', requestData);
        
        // 🔍 CHECK IF THIS IS A TOKEN DECRYPTION REQUEST
        if (requestData.encrypted_token && requestData.action === 'decrypt_and_process') {
            console.log('🔓 SECURE TOKEN DECRYPTION REQUEST');
            return await handleSecureTokenDecryption(requestData, headers);
        }
        
        // 💳 REGULAR MIDTRANS PAYMENT REQUEST
        return await handleMidtransPayment(requestData, headers);

    } catch (error) {
        console.error('🚨 Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};

/**
 * Handle Legacy Encrypted Token Decryption
 */
async function handleSecureTokenDecryption(requestData, headers) {
    console.log('🔍 Starting secure token decryption...');
    
    const { encrypted_token, referrer, user_agent, origin } = requestData;
    
    // Decrypt the token
    const decryptedData = SecurePaymentDecryption.validateAndExtractOrder(encrypted_token);
    
    if (!decryptedData) {
        console.error('❌ Secure token decryption failed');
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Secure token decryption failed',
                code: 'SECURE_DECRYPTION_ERROR'
            })
        };
    }
    
    console.log('✅ Secure token decrypted successfully');
    console.log('🔍 Decrypted order:', decryptedData.order_number);
    console.log('💰 Amount IDR:', decryptedData.amount_idr);
    console.log('👤 User:', decryptedData.user_name);
    
    // Return decrypted token data
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            action: 'secure_token_decrypted',
            message: 'Secure token decrypted successfully',
            data: {
                order_id: decryptedData.order_number,
                amount_idr: decryptedData.amount_idr,
                amount_tl: decryptedData.amount_tl,
                user: decryptedData.user_name,
                firm_id: decryptedData.firm_id,
                exchange_rate: decryptedData.exchange_rate,
                ip_address: decryptedData.ip_address,
                all_data: decryptedData  // Full decrypted data
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
        short_token,           // NEW: short token from URL
        order_id_from_token,
        full_decrypted_data    // NEW: Full user data from URL/decrypted token
    } = requestData;
    
    let finalAmount, finalItemName, orderId;
    
    // Determine if this is short token order or regular order
    if (short_token && order_id_from_token && full_decrypted_data) {
        console.log('🆕 Processing SHORT TOKEN order with URL data (NO DECRYPTION NEEDED)');
        
        finalAmount = parseInt(String(amount).replace(/[^\d]/g, ''), 10);
        finalItemName = item_name || 'Secure Payment';
        orderId = `${order_id_from_token}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        
        console.log('🔍 Short Token Order Details:');
        console.log('  - Short Token:', short_token);
        console.log('  - Midtrans Order ID:', orderId);
        console.log('  - Amount IDR:', finalAmount);
        console.log('  - User:', full_decrypted_data.user_name);
        
    } else {
        console.log('🔍 Processing regular order (backward compatibility)');
        
        finalAmount = parseInt(String(amount).replace(/[^\d]/g, ''), 10);
        finalItemName = item_name || 'Product';
        orderId = `ORDER_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
    
    if (!finalAmount || finalAmount <= 0) {
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
        short_token: short_token || null,                    // NEW: include short token
        original_order_id: order_id_from_token || null,
        decrypted_user_data: full_decrypted_data || null,    // NEW: Include full user data from URL
        request_details: {
            referrer: referrer,
            user_agent: user_agent,
            origin: origin,
            ip: 'unknown'
        }
    };

    // Send to PHP webhook if provided
    let phpResult = { skipped: true };
    if (php_webhook_url && php_webhook_url.startsWith('https')) { // ONLY HTTPS
        try {
            console.log('📤 Sending to PHP webhook (HTTPS)...');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const phpResponse = await fetch(php_webhook_url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'User-Agent': 'NextPay-Secure-Netlify-Function'
                },
                body: JSON.stringify(notificationPayload),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            const responseText = await phpResponse.text();
            console.log('📡 PHP Response:', responseText);
            
            try {
                phpResult = JSON.parse(responseText);
            } catch (parseError) {
                phpResult = { 
                    success: phpResponse.ok,
                    raw_response: responseText,
                    status: phpResponse.status
                };
            }
            
        } catch (phpError) {
            console.error('🚨 PHP Request Failed:', phpError.message);
            phpResult = { error: phpError.message };
        }
    } else {
        console.log('⚠️ Skipping PHP webhook (not HTTPS or not provided)');
    }

    // 🕰 Generate Midtrans date format with 15-minute expiry
    const now = new Date();
    const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const midtransDate = jakartaTime.toISOString().slice(0, 19).replace('T', ' ') + ' +0700';
    
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
            first_name: full_decrypted_data?.user_name?.split(' ')[0] || 'NextPay',
            last_name: full_decrypted_data?.user_name?.split(' ').slice(1).join(' ') || 'Customer',
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
            duration: 15  // 15 minutes
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
            'User-Agent': 'NextPay-Secure-Netlify-Function'
        },
        body: JSON.stringify(midtransParams)
    });

    const responseData = await response.json();
    
    console.log('📡 Midtrans response status:', response.status);

    if (response.ok && responseData.token) {
        console.log('✅ Success - 15-min expiry token generated');
        
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
                    expiry_duration: '15 minutes',
                    midtrans_response: responseData,
                    php_notification: phpResult,
                    encryption_status: short_token ? 'short_token' : 'standard'
                }
            })
        };
    } else {
        console.error('❌ Midtrans error:', responseData);
        
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Failed to generate payment token',
                details: responseData
            })
        };
    }
}
