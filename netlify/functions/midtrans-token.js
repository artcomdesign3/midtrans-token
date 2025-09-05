// netlify/functions/midtrans-token.js
const crypto = require('crypto');

/**
 * NextPay Secure Decryption - Simplified
 */
class SecurePaymentDecryption {
    static masterKey = 'NextPay2025-UltraSecure-MasterKey-AES256-GCM-Authentication-System';
    
    static decryptUserData(encryptedToken) {
        try {
            const key = crypto.createHash('sha256').update(this.masterKey).digest();
            const paddedToken = encryptedToken.replace(/-/g, '+').replace(/_/g, '/');
            const finalToken = paddedToken + '='.repeat((4 - paddedToken.length % 4) % 4);
            const combined = Buffer.from(finalToken, 'base64');
            
            if (combined.length < 28) throw new Error('Invalid token format');
            
            const iv = combined.slice(0, 12);
            const tag = combined.slice(12, 28);
            const encrypted = combined.slice(28);
            
            const decipher = crypto.createDecipherGCM('aes-256-gcm');
            decipher.setAuthTag(tag);
            
            let decrypted = decipher.update(encrypted, null, 'utf8');
            decrypted += decipher.final('utf8');
            
            const dataWithSecurity = JSON.parse(decrypted);
            
            if (!dataWithSecurity.user_data || !dataWithSecurity.expires_at) {
                throw new Error('Invalid token structure');
            }
            
            if (Date.now() / 1000 > dataWithSecurity.expires_at) {
                throw new Error('Token has expired');
            }
            
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
}

exports.handler = async function(event, context) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, error: 'Method not allowed' })
        };
    }

    try {
        const requestData = JSON.parse(event.body || '{}');
        console.log('Request received:', {
            action: requestData.action,
            hasToken: !!requestData.token || !!requestData.encrypted_token,
            hasAmount: !!requestData.amount
        });

        // Short token processing
        if (requestData.token && requestData.token.startsWith('NX')) {
            return await handleShortToken(requestData, headers);
        }
        
        // Encrypted token processing  
        if (requestData.encrypted_token) {
            return await handleEncryptedToken(requestData, headers);
        }
        
        // Regular payment processing
        return await handleMidtransPayment(requestData, headers);

    } catch (error) {
        console.error('Function error:', error);
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
 * Handle Short Token - Fetch from database and decrypt
 */
async function handleShortToken(requestData, headers) {
    const { token } = requestData;
    
    console.log('Processing short token:', token);
    
    // Validate short token format
    if (!token || !token.startsWith('NX') || token.length !== 58) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Invalid short token format'
            })
        };
    }
    
    // Mock data - replace with actual database call to your PHP backend
    const mockData = {
        order_number: 'NXP20250905123456',
        amount_idr: 150000,
        amount_tl: 375.94,
        user_name: 'Test User',
        firm_id: 1,
        exchange_rate: 399.15
    };
    
    // Create Midtrans payment
    return await createMidtransPayment({
        amount: mockData.amount_idr,
        item_name: `Payment for ${mockData.user_name}`,
        original_order: mockData.order_number,
        token_type: 'short_token'
    }, headers);
}

/**
 * Handle Encrypted Token - Direct decryption
 */
async function handleEncryptedToken(requestData, headers) {
    const { encrypted_token } = requestData;
    
    console.log('Processing encrypted token');
    
    const decryptedData = SecurePaymentDecryption.decryptUserData(encrypted_token);
    
    if (!decryptedData) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Token decryption failed'
            })
        };
    }
    
    // Create Midtrans payment
    return await createMidtransPayment({
        amount: decryptedData.amount_idr,
        item_name: `Payment for ${decryptedData.user_name}`,
        original_order: decryptedData.order_number,
        token_type: 'encrypted',
        encrypted_token: encrypted_token,
        user_data: decryptedData
    }, headers);
}

/**
 * Handle regular payment (legacy)
 */
async function handleMidtransPayment(requestData, headers) {
    const { amount, item_name } = requestData;
    
    console.log('Processing regular payment:', { amount, item_name });
    
    if (!amount || amount <= 0) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Invalid amount'
            })
        };
    }
    
    return await createMidtransPayment({
        amount: parseInt(String(amount).replace(/[^\d]/g, ''), 10),
        item_name: item_name || 'Payment',
        token_type: 'legacy'
    }, headers);
}

/**
 * Create Midtrans Payment Token
 */
async function createMidtransPayment(paymentData, headers) {
    const { amount, item_name, original_order, token_type, encrypted_token, user_data } = paymentData;
    
    // Generate unique order ID
    const orderId = original_order ? 
        `${original_order}_${Date.now()}` : 
        `ORDER_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    
    console.log('Creating Midtrans payment:', {
        orderId,
        amount,
        token_type
    });

    // Notify PHP webhook first
    const phpResult = await notifyPHPWebhook({
        event: 'payment_initiated',
        order_id: orderId,
        amount: amount,
        token_type: token_type,
        encrypted_token: encrypted_token,
        user_data: user_data,
        original_order: original_order
    });

    // Midtrans API call
    const midtransParams = {
        transaction_details: {
            order_id: orderId,
            gross_amount: amount
        },
        item_details: [{
            id: 'ITEM_001',
            price: amount,
            quantity: 1,
            name: item_name
        }],
        customer_details: {
            first_name: 'NextPay',
            last_name: 'Customer',
            email: 'customer@nextpay.com'
        },
        enabled_payments: [
            'credit_card', 'gopay', 'shopeepay', 'other_qris',
            'bank_transfer', 'bca_va', 'bni_va', 'bri_va'
        ],
        expiry: {
            start_time: new Date(Date.now() + (7 * 60 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' ') + ' +0700',
            unit: "minute",
            duration: 15
        }
    };

    const serverKey = 'Mid-server-kO-tU3T7Q9MYO_25tJTggZeu';
    const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

    try {
        const response = await fetch('https://app.midtrans.com/snap/v1/transactions', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify(midtransParams)
        });

        const responseData = await response.json();
        
        console.log('Midtrans response:', {
            status: response.status,
            success: response.ok,
            hasToken: !!responseData.token
        });

        if (response.ok && responseData.token) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: {
                        token: responseData.token,
                        redirect_url: responseData.redirect_url,
                        order_id: orderId,
                        amount: amount,
                        php_notification: phpResult
                    }
                })
            };
        } else {
            console.error('Midtrans error:', responseData);
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
    } catch (error) {
        console.error('Midtrans API error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Payment gateway error'
            })
        };
    }
}

/**
 * Notify PHP Webhook
 */
async function notifyPHPWebhook(data) {
    const webhookUrl = 'http://nextpays.de/webhook/midtrans.php';
    
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'NextPay-Netlify-Function'
            },
            body: JSON.stringify(data),
            timeout: 5000
        });

        const result = await response.text();
        
        console.log('PHP webhook response:', {
            status: response.status,
            success: response.ok
        });
        
        try {
            return JSON.parse(result);
        } catch (e) {
            return { success: response.ok, raw_response: result };
        }
        
    } catch (error) {
        console.error('PHP webhook error:', error.message);
        return { error: error.message };
    }
}
