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
    // COMPREHENSIVE CORS HEADERS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With, Origin',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, PUT, DELETE',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
        'Vary': 'Origin, Access-Control-Request-Headers'
    };

    console.log('🚀 NextPay Secure Function Called - Method:', event.httpMethod);

    // HANDLE PREFLIGHT REQUESTS
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: JSON.stringify({ message: 'CORS preflight successful' }) };
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
        
        // 🔐 CHECK IF THIS IS A TOKEN DECRYPTION REQUEST
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
 * Handle Short Token Fetch & Decrypt from Database
 */
async function handleShortTokenFetch(requestData, headers) {
    console.log('🔐 Starting short token fetch & decrypt...');
    
    const { short_token, referrer, user_agent, origin } = requestData;
    
    // Validate short token format
    if (!short_token || !short_token.startsWith('NX') || short_token.length !== 58) {
        console.error('❌ Invalid short token format');
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Invalid short token format',
                code: 'SHORT_TOKEN_INVALID'
            })
        };
    }
    
    // For now, we'll simulate database fetch by returning mock data
    // In real implementation, you'd query your database here
    console.log('🔍 Would fetch from database with token:', short_token);
    
    // Mock successful response - replace with actual database call
    const mockDecryptedData = {
        order_number: 'NXP20250905123456',
        amount_idr: 150000,
        amount_tl: 375.94,
        user: 'Test User',
        firm_id: 1,
        exchange_rate: 399.15,
        user_name: 'Test User',
        tc_no: '12345678901',
        card_number: '1234****5678',
        commission_tl: 13.16,
        commission_idr: 5256
    };
    
    console.log('✅ Short token processed successfully');
    
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            action: 'short_token_fetched',
            message: 'Short token fetched and decrypted successfully',
            data: mockDecryptedData
        })
    };
}

/**
 * Handle Legacy Encrypted Token Decryption
 */
async function handleSecureTokenDecryption(requestData, headers) {
    console.log('🔐 Starting secure token decryption...');
    
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
        encrypted_order_token,
        order_id_from_token,
        decrypted_user_data  // NEW: Full user data from decrypted token
    } = requestData;
    
    let finalAmount, finalItemName, orderId;
    
    // Determine if this is encrypted order or regular order
    if (encrypted_order_token && order_id_from_token) {
        console.log('🔐 Processing encrypted order with full user data');
        
        finalAmount = parseInt(String(amount).replace(/[^\d]/g, ''), 10);
        finalItemName = item_name || 'Secure Payment';
        orderId = `${order_id_from_token}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        
        console.log('🔐 Encrypted Order Details:');
        console.log('  - Original Order ID:', order_id_from_token);
        console.log('  - Midtrans Order ID:', orderId);
        console.log('  - Amount IDR:', finalAmount);
        
    } else {
        console.log('📝 Processing regular order (backward compatibility)');
        
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
        encrypted_token: encrypted_order_token || null,
        original_order_id: order_id_from_token || null,
        decrypted_user_data: decrypted_user_data || null,  // NEW: Include full user data
        request_details: {
            referrer: referrer,
            user_agent: user_agent,
            origin: origin,
            ip: 'unknown'
        }
    };

    // Send to PHP webhook if provided
    let phpResult = { skipped: true };
    if (php_webhook_url && php_webhook_url.startsWith('http')) {
        try {
            console.log('📤 Sending to PHP webhook...');
            
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
    }

    // 🕐 Generate Midtrans date format with 15-minute expiry
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
            first_name: 'NextPay',
            last_name: 'Customer',
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
                    encryption_status: encrypted_order_token ? 'encrypted' : 'standard'
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
