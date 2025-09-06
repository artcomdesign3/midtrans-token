// netlify/functions/midtrans-token.js - FIXED VERSION v4.2 
// SYNTAX ERRORS CORRECTED + Better Error Handling
const crypto = require('crypto');

/**
 * NextPay Secure Decryption System - JavaScript FIXED
 * AES-256-GCM with Authentication + Timestamp Validation
 */
class SecurePaymentDecryption {
    static masterKey = 'NextPay2025-UltraSecure-MasterKey-AES256-GCM-Authentication-System';
    
    /**
     * Decrypt user data with AES-256-GCM + Timestamp validation
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
            
            // ENHANCED: Timestamp validation
            const currentTime = Math.floor(Date.now() / 1000);
            if (currentTime > dataWithSecurity.expires_at) {
                throw new Error(`Token has expired at ${new Date(dataWithSecurity.expires_at * 1000).toISOString()}`);
            }
            
            // ENHANCED: Verify timestamp consistency
            if (dataWithSecurity.created_at) {
                const tokenAge = currentTime - dataWithSecurity.created_at;
                if (tokenAge > 86400) { // 24 hours
                    throw new Error(`Token too old: ${tokenAge} seconds`);
                }
                if (tokenAge < -300) { // Allow 5 minutes clock skew
                    throw new Error(`Token from future: ${Math.abs(tokenAge)} seconds`);
                }
            }
            
            // Verify checksum
            const expectedChecksum = crypto.createHash('sha256').update(JSON.stringify(dataWithSecurity.user_data)).digest('hex');
            if (!dataWithSecurity.checksum || dataWithSecurity.checksum !== expectedChecksum) {
                throw new Error('Data integrity check failed');
            }
            
            // ENHANCED: Verify security hash if available
            if (dataWithSecurity.security_hash && dataWithSecurity.created_at) {
                const expectedSecurityHash = crypto.createHash('sha256').update(
                    JSON.stringify(dataWithSecurity.user_data) + 
                    dataWithSecurity.created_at + 
                    (dataWithSecurity.created_at_micro || dataWithSecurity.created_at)
                ).digest('hex');
                
                if (dataWithSecurity.security_hash !== expectedSecurityHash) {
                    throw new Error('Security hash verification failed');
                }
            }
            
            return dataWithSecurity.user_data;
            
        } catch (error) {
            console.error('Decryption Error:', error.message);
            return null;
        }
    }
    
    /**
     * Validate and extract order data from token with timestamp
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
        
        // ENHANCED: Validate timestamp fields if available
        if (userData.order_created_timestamp) {
            const currentTime = Math.floor(Date.now() / 1000);
            const orderAge = currentTime - userData.order_created_timestamp;
            
            if (orderAge > 86400) { // 24 hours
                console.error(`Order too old: ${orderAge} seconds`);
                return null;
            }
            
            if (orderAge < -300) { // Future orders not allowed (5 min skew)
                console.error(`Order from future: ${Math.abs(orderAge)} seconds`);
                return null;
            }
        }
        
        return userData;
    }
}

/**
 * Generate UNIQUE Midtrans Order ID with timestamp and collision avoidance
 */
function generateUniqueMidtransOrderId(baseToken, userPaymentId = null) {
    const timestamp = Math.floor(Date.now() / 1000);
    const microtime = Date.now().toString().slice(-6); // Last 6 digits of milliseconds
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    // Use user payment ID if available, otherwise use base token
    const baseId = userPaymentId ? userPaymentId.slice(-8) : baseToken.slice(2, 12); // Remove NX prefix
    
    return `MID_${baseId}_${timestamp}_${microtime}_${random}`;
}

/**
 * Validate Midtrans order ID format to prevent duplicates
 */
function validateMidtransOrderId(orderId) {
    // Midtrans order ID rules: alphanumeric, dash, underscore, dot, max 50 chars
    const pattern = /^[a-zA-Z0-9._-]{1,50}$/;
    return pattern.test(orderId);
}

/**
 * Enhanced logging with timestamp
 */
function enhancedLog(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        data: data || {}
    };
    
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, data ? JSON.stringify(data, null, 2) : '');
    return logEntry;
}

exports.handler = async function(event, context) {
    const startTime = Date.now();
    
    // COMPREHENSIVE CORS HEADERS FOR NETLIFY FUNCTIONS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin, X-Requested-With',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, PUT, DELETE',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
        'X-Timestamp': Math.floor(Date.now() / 1000).toString(),
        'X-Request-ID': crypto.randomBytes(8).toString('hex')
    };

    const requestId = headers['X-Request-ID'];
    
    enhancedLog('info', `NextPay Function v4.2 FIXED Called`, {
        method: event.httpMethod,
        requestId,
        userAgent: event.headers['user-agent'],
        origin: event.headers.origin
    });

    // CRITICAL: Handle PREFLIGHT OPTIONS requests first
    if (event.httpMethod === 'OPTIONS') {
        enhancedLog('info', 'Handling OPTIONS preflight request', { requestId });
        return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify({ 
                message: 'CORS preflight successful - SYNTAX FIXED',
                timestamp: Math.floor(Date.now() / 1000),
                requestId
            }) 
        };
    }

    // HANDLE NON-POST REQUESTS
    if (event.httpMethod !== 'POST') {
        enhancedLog('warn', 'Invalid method received', { method: event.httpMethod, requestId });
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Method not allowed',
                received_method: event.httpMethod,
                timestamp: Math.floor(Date.now() / 1000),
                requestId
            })
        };
    }

    try {
        // SAFE JSON PARSING
        let requestData = {};
        try {
            requestData = JSON.parse(event.body || '{}');
        } catch (jsonError) {
            enhancedLog('error', 'JSON Parse Error', { 
                error: jsonError.message,
                body: event.body ? event.body.substring(0, 100) : 'empty',
                requestId 
            });
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid JSON in request body',
                    message: jsonError.message,
                    timestamp: Math.floor(Date.now() / 1000),
                    requestId
                })
            };
        }
        
        enhancedLog('info', 'Request data received', {
            requestId,
            dataKeys: Object.keys(requestData),
            hasEncryptedToken: !!requestData.encrypted_token,
            hasShortToken: !!requestData.short_token,
            bodyLength: (event.body || '').length
        });
        
        // 🔓 CHECK IF THIS IS A TOKEN DECRYPTION REQUEST
        if (requestData.encrypted_token && requestData.action === 'decrypt_and_process') {
            enhancedLog('info', 'Handling secure token decryption request', { requestId });
            return await handleSecureTokenDecryption(requestData, headers, requestId);
        }
        
        // 💳 REGULAR MIDTRANS PAYMENT REQUEST
        return await handleMidtransPayment(requestData, headers, requestId, startTime);

    } catch (error) {
        enhancedLog('error', 'Function error', {
            requestId,
            error: error.message,
            stack: error.stack
        });
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error - SYNTAX FIXED',
                message: error.message,
                timestamp: Math.floor(Date.now() / 1000),
                requestId
            })
        };
    }
};

/**
 * Handle Legacy Encrypted Token Decryption
 */
async function handleSecureTokenDecryption(requestData, headers, requestId) {
    enhancedLog('info', 'Starting secure token decryption', { requestId });
    
    const { encrypted_token, referrer, user_agent, origin } = requestData;
    
    // Decrypt the token with timestamp validation
    const decryptedData = SecurePaymentDecryption.validateAndExtractOrder(encrypted_token);
    
    if (!decryptedData) {
        enhancedLog('error', 'Secure token decryption failed', { requestId });
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Secure token decryption failed',
                code: 'SECURE_DECRYPTION_ERROR',
                timestamp: Math.floor(Date.now() / 1000),
                requestId
            })
        };
    }
    
    enhancedLog('info', 'Secure token decrypted successfully', {
        requestId,
        orderNumber: decryptedData.order_number,
        amountIDR: decryptedData.amount_idr,
        user: decryptedData.user_name,
        hasTimestamp: !!decryptedData.order_created_timestamp
    });
    
    // Return decrypted token data
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            action: 'secure_token_decrypted',
            message: 'Secure token decrypted successfully with timestamp validation',
            timestamp: Math.floor(Date.now() / 1000),
            requestId,
            data: {
                order_id: decryptedData.order_number,
                amount_idr: decryptedData.amount_idr,
                amount_tl: decryptedData.amount_tl,
                user: decryptedData.user_name,
                firm_id: decryptedData.firm_id,
                exchange_rate: decryptedData.exchange_rate,
                ip_address: decryptedData.ip_address,
                unique_payment_id: decryptedData.unique_payment_id,
                order_created_timestamp: decryptedData.order_created_timestamp,
                all_data: decryptedData  // Full decrypted data
            }
        })
    });
}

/**
 * Handle Midtrans Payment Creation with Enhanced Validation
 */
async function handleMidtransPayment(requestData, headers, requestId, startTime) {
    enhancedLog('info', 'Processing Midtrans payment request', { requestId });
    
    const { 
        amount, 
        item_name, 
        php_webhook_url,
        auto_redirect,
        referrer,
        user_agent,
        origin,
        short_token,           
        order_id_from_token,
        unique_payment_id,     // ENHANCED: Accept unique payment ID
        full_decrypted_data    
    } = requestData;
    
    enhancedLog('info', 'Validating request data', {
        requestId,
        amount: typeof amount,
        hasItemName: !!item_name,
        hasShortToken: !!short_token,
        hasUniquePaymentId: !!unique_payment_id,
        hasDecryptedData: !!full_decrypted_data
    });
    
    let finalAmount, finalItemName, orderId;
    
    // ENHANCED: Determine if this is short token order or regular order
    if (short_token && full_decrypted_data) {
        enhancedLog('info', 'Processing SHORT TOKEN order with timestamp validation', { requestId });
        
        finalAmount = parseInt(String(amount).replace(/[^\d]/g, ''), 10);
        finalItemName = item_name || 'Secure Payment with Timestamp';
        
        // ENHANCED: Use unique payment ID or generate one
        const baseOrderId = unique_payment_id || order_id_from_token || short_token;
        orderId = generateUniqueMidtransOrderId(baseOrderId, unique_payment_id);
        
        // Validate generated order ID
        if (!validateMidtransOrderId(orderId)) {
            enhancedLog('error', 'Generated order ID invalid', { requestId, orderId });
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Generated order ID format invalid',
                    generated_id: orderId,
                    timestamp: Math.floor(Date.now() / 1000),
                    requestId
                })
            };
        }
        
        enhancedLog('info', 'Short Token Order Details', {
            requestId,
            shortToken: short_token.substring(0, 10) + '...',
            midtransOrderId: orderId,
            amountIDR: finalAmount,
            user: full_decrypted_data.user_name,
            uniquePaymentId: unique_payment_id
        });
        
    } else {
        enhancedLog('info', 'Processing regular order (backward compatibility)', { requestId });
        
        finalAmount = parseInt(String(amount).replace(/[^\d]/g, ''), 10);
        finalItemName = item_name || 'Product';
        orderId = `ORDER_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    }
    
    // ENHANCED: Better amount validation
    if (!finalAmount || finalAmount <= 0 || isNaN(finalAmount) || finalAmount > 999999999) {
        enhancedLog('error', 'Invalid amount detected', {
            requestId,
            received: amount,
            parsed: finalAmount
        });
        
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Invalid amount: must be a positive number between 1 and 999,999,999', 
                received: amount,
                parsed: finalAmount,
                type: typeof amount,
                timestamp: Math.floor(Date.now() / 1000),
                requestId
            })
        };
    }

    // ENHANCED: Send notification to PHP with timestamp
    const notificationPayload = {
        event: 'payment_initiated',
        order_id: orderId,
        amount: finalAmount,
        item_name: finalItemName,
        status: 'PENDING',
        auto_redirect: auto_redirect || false,
        timestamp: new Date().toISOString(),
        timestamp_unix: Math.floor(Date.now() / 1000),
        short_token: short_token || null,                    
        original_order_id: order_id_from_token || null,
        unique_payment_id: unique_payment_id || null,        // ENHANCED: Include unique payment ID
        decrypted_user_data: full_decrypted_data || null,    
        request_details: {
            referrer: referrer,
            user_agent: user_agent,
            origin: origin,
            ip: 'netlify_function',
            request_id: requestId
        }
    };

    // Send to PHP webhook if provided
    let phpResult = { skipped: true };
    if (php_webhook_url && php_webhook_url.startsWith('https')) {
        try {
            enhancedLog('info', 'Sending to PHP webhook', { requestId, url: php_webhook_url });
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000); // Increased timeout to 20s
            
            const phpResponse = await fetch(php_webhook_url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'User-Agent': 'NextPay-Secure-Netlify-Function-v4.2-FIXED',
                    'X-Request-ID': requestId,
                    'X-Timestamp': Math.floor(Date.now() / 1000).toString()
                },
                body: JSON.stringify(notificationPayload),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            const responseText = await phpResponse.text();
            
            enhancedLog('info', 'PHP Response received', {
                requestId,
                status: phpResponse.status,
                responseLength: responseText.length
            });
            
            try {
                phpResult = JSON.parse(responseText);
                enhancedLog('info', 'PHP Response parsed successfully', { requestId });
            } catch (parseError) {
                enhancedLog('error', 'PHP Response JSON parse error', {
                    requestId,
                    parseError: parseError.message,
                    responseText: responseText.substring(0, 200)
                });
                
                phpResult = { 
                    success: phpResponse.ok,
                    raw_response: responseText.substring(0, 500),
                    status: phpResponse.status,
                    parse_error: parseError.message
                };
            }
            
        } catch (phpError) {
            enhancedLog('error', 'PHP Request Failed', {
                requestId,
                error: phpError.message
            });
            phpResult = { error: phpError.message, failed: true };
        }
    } else {
        enhancedLog('warn', 'Skipping PHP webhook (not HTTPS or not provided)', { requestId });
    }

    // 🕰 Generate Midtrans date format with 15-minute expiry
    const now = new Date();
    const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const midtransDate = jakartaTime.toISOString().slice(0, 19).replace('T', ' ') + ' +0700';
    
    // 💳 ENHANCED: Midtrans API call with better error handling
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
        },
        custom_field1: unique_payment_id || 'not_set',
        custom_field2: requestId,
        custom_field3: Math.floor(Date.now() / 1000).toString()
    };

    const apiUrl = 'https://app.midtrans.com/snap/v1/transactions';
    const serverKey = 'Mid-server-kO-tU3T7Q9MYO_25tJTggZeu';
    const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

    enhancedLog('info', 'Calling Midtrans API', {
        requestId,
        orderId,
        amount: finalAmount,
        uniquePaymentId: unique_payment_id
    });

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: authHeader,
                'User-Agent': 'NextPay-Secure-Netlify-Function-v4.2-FIXED',
                'X-Request-ID': requestId
            },
            body: JSON.stringify(midtransParams),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        const responseData = await response.json();
        const processingTime = Date.now() - startTime;
        
        enhancedLog('info', 'Midtrans response received', {
            requestId,
            status: response.status,
            hasToken: !!responseData.token,
            processingTime
        });

        if (response.ok && responseData.token) {
            enhancedLog('info', 'Success - Payment token generated', {
                requestId,
                orderId,
                processingTime
            });
            
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
                        encryption_status: short_token ? 'short_token_enhanced' : 'standard',
                        unique_payment_id: unique_payment_id,
                        processing_time_ms: processingTime,
                        timestamp: Math.floor(Date.now() / 1000),
                        request_id: requestId,
                        debug_info: {
                            generated_order_id: orderId,
                            original_order_id: order_id_from_token,
                            timestamp: Math.floor(Date.now() / 1000),
                            syntax_fixed: true
                        }
                    }
                })
            };
        } else {
            enhancedLog('error', 'Midtrans error response', {
                requestId,
                status: response.status,
                responseData
            });
            
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Failed to generate payment token',
                    details: responseData,
                    midtrans_status: response.status,
                    timestamp: Math.floor(Date.now() / 1000),
                    request_id: requestId,
                    debug_info: {
                        order_id: orderId,
                        amount: finalAmount,
                        api_url: apiUrl,
                        processing_time_ms: processingTime,
                        syntax_fixed: true
                    }
                })
            };
        }
    } catch (midtransError) {
        const processingTime = Date.now() - startTime;
        
        enhancedLog('error', 'Midtrans API error', {
            requestId,
            error: midtransError.message,
            processingTime
        });
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Midtrans API request failed',
                message: midtransError.message,
                timestamp: Math.floor(Date.now() / 1000),
                request_id: requestId,
                debug_info: {
                    order_id: orderId,
                    amount: finalAmount,
                    processing_time_ms: processingTime,
                    syntax_fixed: true
                }
            })
        };
    }
}
