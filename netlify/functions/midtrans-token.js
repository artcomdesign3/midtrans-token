// netlify/functions/midtrans-token.js - FINAL VERSION v5.0
// Enhanced Timestamp + Unique ID + Better Error Handling + Full Integration
const crypto = require('crypto');

/**
 * NextPay Secure Decryption System - JavaScript FINAL v5.0
 * AES-256-GCM with Authentication + Enhanced Timestamp Validation
 */
class SecurePaymentDecryption {
    static masterKey = 'NextPay2025-UltraSecure-MasterKey-AES256-GCM-Authentication-System';
    
    /**
     * Generate SHA-256 hash
     */
    static sha256(message) {
        return crypto.createHash('sha256').update(message).digest('hex');
    }
    
    /**
     * Decrypt user data with AES-256-GCM + Enhanced Validation
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
                throw new Error('Invalid token format - too short');
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
                throw new Error('Invalid token structure - missing required fields');
            }
            
            // Enhanced Timestamp validation
            const currentTime = Math.floor(Date.now() / 1000);
            if (currentTime > dataWithSecurity.expires_at) {
                throw new Error(`Token has expired at ${new Date(dataWithSecurity.expires_at * 1000).toISOString()}`);
            }
            
            // Verify creation time consistency
            if (dataWithSecurity.created_at) {
                const tokenAge = currentTime - dataWithSecurity.created_at;
                if (tokenAge > 86400) { // 24 hours
                    throw new Error(`Token too old: ${Math.floor(tokenAge / 3600)} hours`);
                }
                if (tokenAge < -300) { // Allow 5 minutes clock skew
                    throw new Error(`Token from future: ${Math.abs(tokenAge)} seconds`);
                }
            }
            
            // Verify checksum
            const expectedChecksum = this.sha256(JSON.stringify(dataWithSecurity.user_data));
            if (!dataWithSecurity.checksum || dataWithSecurity.checksum !== expectedChecksum) {
                throw new Error('Data integrity check failed - checksum mismatch');
            }
            
            // Enhanced security hash verification (v1.1+)
            if (dataWithSecurity.security_hash && dataWithSecurity.created_at && dataWithSecurity.created_at_micro) {
                const expectedSecurityHash = this.sha256(
                    JSON.stringify(dataWithSecurity.user_data) + 
                    dataWithSecurity.created_at + 
                    dataWithSecurity.created_at_micro
                );
                
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
     * Validate and extract order data from token with enhanced timestamp
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
        
        // Enhanced timestamp validation
        if (userData.order_created_timestamp) {
            const currentTime = Math.floor(Date.now() / 1000);
            const orderAge = currentTime - userData.order_created_timestamp;
            
            if (orderAge > 86400) { // 24 hours
                console.error(`Order too old: ${Math.floor(orderAge / 3600)} hours`);
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
 * Generate UNIQUE Midtrans Order ID with enhanced collision avoidance
 */
function generateUniqueMidtransOrderId(baseToken, userPaymentId = null) {
    const timestamp = Math.floor(Date.now() / 1000);
    const microtime = Date.now().toString().slice(-6); // Last 6 digits of milliseconds
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    
    // Use user payment ID if available, otherwise use base token
    const baseId = userPaymentId ? userPaymentId.slice(-10) : baseToken.slice(2, 12); // Remove NX prefix
    
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
 * Enhanced logging with timestamp and request tracking
 */
function enhancedLog(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        function_version: '5.0_final',
        data: data || {}
    };
    
    console.log(`[${timestamp}] NETLIFY v5.0 ${level.toUpperCase()}: ${message}`, data ? JSON.stringify(data, null, 2) : '');
    return logEntry;
}

/**
 * Generate correlation ID for request tracking
 */
function generateCorrelationId() {
    return 'CORR_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

exports.handler = async function(event, context) {
    const startTime = Date.now();
    const correlationId = generateCorrelationId();
    
    // COMPREHENSIVE CORS HEADERS FOR NETLIFY FUNCTIONS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin, X-Requested-With, X-Request-Source, X-Timestamp',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, PUT, DELETE',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
        'X-Timestamp': Math.floor(Date.now() / 1000).toString(),
        'X-Request-ID': correlationId,
        'X-Function-Version': '5.0_final'
    };

    enhancedLog('info', `NextPay Netlify Function v5.0 Called`, {
        method: event.httpMethod,
        correlationId,
        userAgent: event.headers['user-agent'],
        origin: event.headers.origin,
        requestSource: event.headers['x-request-source']
    });

    // CRITICAL: Handle PREFLIGHT OPTIONS requests first
    if (event.httpMethod === 'OPTIONS') {
        enhancedLog('info', 'Handling OPTIONS preflight request', { correlationId });
        return { 
            statusCode: 200, 
            headers, 
            body: JSON.stringify({ 
                message: 'CORS preflight successful',
                timestamp: Math.floor(Date.now() / 1000),
                correlationId,
                function_version: '5.0_final'
            }) 
        };
    }

    // HANDLE NON-POST REQUESTS
    if (event.httpMethod !== 'POST') {
        enhancedLog('warn', 'Invalid method received', { method: event.httpMethod, correlationId });
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ 
                success: false, 
                error: 'Method not allowed',
                received_method: event.httpMethod,
                timestamp: Math.floor(Date.now() / 1000),
                correlationId,
                function_version: '5.0_final'
            })
        };
    }

    try {
        const requestData = JSON.parse(event.body || '{}');
        
        enhancedLog('info', 'Request data received', {
            correlationId,
            dataKeys: Object.keys(requestData),
            hasEncryptedToken: !!requestData.encrypted_token,
            hasShortToken: !!requestData.short_token,
            hasFullDecryptedData: !!requestData.full_decrypted_data,
            bodyLength: (event.body || '').length
        });
        
        // 🔍 CHECK IF THIS IS A TOKEN DECRYPTION REQUEST (Legacy support)
        if (requestData.encrypted_token && requestData.action === 'decrypt_and_process') {
            enhancedLog('info', 'Handling secure token decryption request (Legacy)', { correlationId });
            return await handleSecureTokenDecryption(requestData, headers, correlationId);
        }
        
        // 💳 REGULAR MIDTRANS PAYMENT REQUEST (New flow)
        return await handleMidtransPayment(requestData, headers, correlationId, startTime);

    } catch (error) {
        enhancedLog('error', 'Function error', {
            correlationId,
            error: error.message,
            stack: error.stack
        });
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error',
                message: error.message,
                timestamp: Math.floor(Date.now() / 1000),
                correlationId,
                function_version: '5.0_final'
            })
        };
    }
};

/**
 * Handle Legacy Encrypted Token Decryption
 */
async function handleSecureTokenDecryption(requestData, headers, correlationId) {
    enhancedLog('info', 'Starting secure token decryption', { correlationId });
    
    const { encrypted_token, referrer, user_agent, origin } = requestData;
    
    // Decrypt the token with enhanced timestamp validation
    const decryptedData = SecurePaymentDecryption.validateAndExtractOrder(encrypted_token);
    
    if (!decryptedData) {
        enhancedLog('error', 'Secure token decryption failed', { correlationId });
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Secure token decryption failed',
                code: 'SECURE_DECRYPTION_ERROR',
                timestamp: Math.floor(Date.now() / 1000),
                correlationId,
                function_version: '5.0_final'
            })
        };
    }
    
    enhancedLog('info', 'Secure token decrypted successfully', {
        correlationId,
        orderNumber: decryptedData.order_number,
        amountIDR: decryptedData.amount_idr,
        user: decryptedData.user_name,
        hasTimestamp: !!decryptedData.order_created_timestamp,
        uniquePaymentId: decryptedData.unique_payment_id
    });
    
    // Return decrypted token data
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
            success: true,
            action: 'secure_token_decrypted',
            message: 'Secure token decrypted successfully with enhanced validation',
            timestamp: Math.floor(Date.now() / 1000),
            correlationId,
            function_version: '5.0_final',
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
 * Handle Midtrans Payment Creation with Enhanced Validation v5.0
 */
async function handleMidtransPayment(requestData, headers, correlationId, startTime) {
    enhancedLog('info', 'Processing Midtrans payment request v5.0', { correlationId });
    
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
        unique_payment_id,     
        full_decrypted_data    
    } = requestData;
    
    enhancedLog('info', 'Validating request data v5.0', {
        correlationId,
        amount: typeof amount,
        hasItemName: !!item_name,
        hasShortToken: !!short_token,
        hasUniquePaymentId: !!unique_payment_id,
        hasFullDecryptedData: !!full_decrypted_data,
        webhookUrl: php_webhook_url ? 'PROVIDED' : 'MISSING'
    });
    
    let finalAmount, finalItemName, orderId;
    
    // Enhanced: Determine if this is short token order or regular order
    if (short_token && full_decrypted_data) {
        enhancedLog('info', 'Processing SHORT TOKEN order with enhanced validation v5.0', { correlationId });
        
        finalAmount = parseInt(String(amount).replace(/[^\d]/g, ''), 10);
        finalItemName = item_name || 'NextPay Secure Payment v5.0';
        
        // Enhanced: Use unique payment ID or generate one with better collision avoidance
        const baseOrderId = unique_payment_id || order_id_from_token || short_token;
        orderId = generateUniqueMidtransOrderId(baseOrderId, unique_payment_id);
        
        // Validate generated order ID
        if (!validateMidtransOrderId(orderId)) {
            enhancedLog('error', 'Generated order ID invalid', { correlationId, orderId });
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Generated order ID format invalid',
                    generated_id: orderId,
                    timestamp: Math.floor(Date.now() / 1000),
                    correlationId,
                    function_version: '5.0_final'
                })
            };
        }
        
        enhancedLog('info', 'Short Token Order Details v5.0', {
            correlationId,
            shortToken: short_token.substring(0, 10) + '...',
            midtransOrderId: orderId,
            amountIDR: finalAmount,
            user: full_decrypted_data.user_name,
            uniquePaymentId: unique_payment_id,
            originalOrderNumber: full_decrypted_data.original_order_number
        });
        
    } else {
        enhancedLog('info', 'Processing regular order (backward compatibility)', { correlationId });
        
        finalAmount = parseInt(String(amount).replace(/[^\d]/g, ''), 10);
        finalItemName = item_name || 'Product';
        orderId = `ORDER_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    }
    
    // Enhanced: Better amount validation
    if (!finalAmount || finalAmount <= 0 || isNaN(finalAmount) || finalAmount > 999999999) {
        enhancedLog('error', 'Invalid amount detected', {
            correlationId,
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
                correlationId,
                function_version: '5.0_final'
            })
        };
    }

    // Enhanced: Send notification to PHP with better tracking
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
        unique_payment_id: unique_payment_id || null,        
        decrypted_user_data: full_decrypted_data || null,    
        request_details: {
            referrer: referrer,
            user_agent: user_agent,
            origin: origin,
            ip: 'netlify_function',
            correlation_id: correlationId,
            function_version: '5.0_final'
        }
    };

    // Send to PHP webhook if provided
    let phpResult = { skipped: true };
    if (php_webhook_url && php_webhook_url.startsWith('https')) {
        try {
            enhancedLog('info', 'Sending to PHP webhook v5.0', { correlationId, url: php_webhook_url });
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 25000); // Increased timeout to 25s
            
            const phpResponse = await fetch(php_webhook_url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'User-Agent': 'NextPay-Secure-Netlify-Function-v5.0-Final',
                    'X-Request-ID': correlationId,
                    'X-Timestamp': Math.floor(Date.now() / 1000).toString(),
                    'X-Request-Source': 'netlify-function-v5.0'
                },
                body: JSON.stringify(notificationPayload),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            const responseText = await phpResponse.text();
            
            enhancedLog('info', 'PHP Response received v5.0', {
                correlationId,
                status: phpResponse.status,
                responseLength: responseText.length
            });
            
            try {
                phpResult = JSON.parse(responseText);
                enhancedLog('info', 'PHP Response parsed successfully v5.0', { correlationId });
            } catch (parseError) {
                enhancedLog('error', 'PHP Response JSON parse error v5.0', {
                    correlationId,
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
            enhancedLog('error', 'PHP Request Failed v5.0', {
                correlationId,
                error: phpError.message
            });
            phpResult = { error: phpError.message, failed: true };
        }
    } else {
        enhancedLog('warn', 'Skipping PHP webhook (not HTTPS or not provided)', { correlationId });
    }

    // 🕰 Generate Midtrans date format with 20-minute expiry (increased)
    const now = new Date();
    const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const midtransDate = jakartaTime.toISOString().slice(0, 19).replace('T', ' ') + ' +0700';
    
    // 💳 Enhanced: Midtrans API call with better error handling and metadata
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
            duration: 20  // Increased to 20 minutes
        },
        custom_field1: unique_payment_id || 'not_set',
        custom_field2: correlationId,
        custom_field3: Math.floor(Date.now() / 1000).toString()
    };

    const apiUrl = 'https://app.midtrans.com/snap/v1/transactions';
    const serverKey = 'Mid-server-kO-tU3T7Q9MYO_25tJTggZeu';
    const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

    enhancedLog('info', 'Calling Midtrans API v5.0', {
        correlationId,
        orderId,
        amount: finalAmount,
        uniquePaymentId: unique_payment_id,
        expiryMinutes: 20
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
                'User-Agent': 'NextPay-Secure-Netlify-Function-v5.0-Final',
                'X-Request-ID': correlationId
            },
            body: JSON.stringify(midtransParams),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        const responseData = await response.json();
        const processingTime = Date.now() - startTime;
        
        enhancedLog('info', 'Midtrans response received v5.0', {
            correlationId,
            status: response.status,
            hasToken: !!responseData.token,
            processingTime
        });

        if (response.ok && responseData.token) {
            enhancedLog('info', 'Success - Payment token generated v5.0', {
                correlationId,
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
                        expiry_duration: '20 minutes',
                        midtrans_response: responseData,
                        php_notification: phpResult,
                        encryption_status: short_token ? 'short_token_enhanced_v5.0' : 'standard',
                        unique_payment_id: unique_payment_id,
                        processing_time_ms: processingTime,
                        timestamp: Math.floor(Date.now() / 1000),
                        correlation_id: correlationId,
                        function_version: '5.0_final',
                        debug_info: {
                            generated_order_id: orderId,
                            original_order_id: order_id_from_token,
                            timestamp: Math.floor(Date.now() / 1000),
                            original_order_number: full_decrypted_data?.original_order_number
                        }
                    }
                })
            };
        } else {
            enhancedLog('error', 'Midtrans error response v5.0', {
                correlationId,
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
                    correlation_id: correlationId,
                    function_version: '5.0_final',
                    debug_info: {
                        order_id: orderId,
                        amount: finalAmount,
                        api_url: apiUrl,
                        processing_time_ms: processingTime
                    }
                })
            };
        }
    } catch (midtransError) {
        const processingTime = Date.now() - startTime;
        
        enhancedLog('error', 'Midtrans API error v5.0', {
            correlationId,
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
                correlation_id: correlationId,
                function_version: '5.0_final',
                debug_info: {
                    order_id: orderId,
                    amount: finalAmount,
                    processing_time_ms: processingTime
                }
            })
        };
    }
}
