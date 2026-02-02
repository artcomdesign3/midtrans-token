// netlify/functions/midtrans-token.js - ArtCom v8.8 - File-Based Key Loading
// =============================================================================
// DEPENDENCIES
// =============================================================================

const { createLogger } = require('./utils/logger');
const fs = require('fs');
const path = require('path');

// =============================================================================
// PAYMENT GATEWAY CONFIGURATION
// =============================================================================

// =============================================================================
// DOKU CONFIGURATION - Keys from Files (fallback to Environment Variables)
// =============================================================================
// NOTE: RSA private keys are stored in files to avoid AWS Lambda's 4KB env var limit

/**
 * Read RSA Private Key from file
 * @param {string} filename - The key filename (e.g., 'doku_sandbox.pem')
 * @returns {string} The PEM key content or empty string
 */
function readKeyFromFile(filename) {
    try {
        const keyPath = path.join(__dirname, 'keys', filename);
        if (fs.existsSync(keyPath)) {
            return fs.readFileSync(keyPath, 'utf8').trim();
        }
    } catch (e) {
        // File read failed, will fall back to env var
    }
    return '';
}

/**
 * Decode RSA Private Key from environment variable
 * Supports both base64-encoded and newline-escaped formats
 * @param {string} envVar - The environment variable value
 * @returns {string} The decoded PEM key or empty string
 */
function decodeDokuPrivateKey(envVar) {
    if (!envVar) return '';

    // Check if it's base64 encoded (doesn't contain PEM headers)
    if (!envVar.includes('-----BEGIN')) {
        try {
            return Buffer.from(envVar, 'base64').toString('utf8');
        } catch (e) {
            // Fallback: treat as newline-escaped string
            return envVar.replace(/\\n/g, '\n');
        }
    }

    // Already in PEM format (possibly with escaped newlines)
    return envVar.replace(/\\n/g, '\n');
}

/**
 * Load DOKU private key: try file first, then environment variable
 * @param {string} filename - The key filename
 * @param {string} envVarName - The environment variable name
 * @returns {string} The PEM key content
 */
function loadDokuPrivateKey(filename, envVarName) {
    // Try file first (avoids 4KB env var limit)
    const fromFile = readKeyFromFile(filename);
    if (fromFile && fromFile.includes('-----BEGIN')) {
        return fromFile;
    }
    // Fall back to environment variable
    return decodeDokuPrivateKey(process.env[envVarName]);
}

const DOKU_CONFIG = {
    SANDBOX: {
        CLIENT_ID: process.env.DOKU_SANDBOX_CLIENT_ID || '',
        SECRET_KEY: process.env.DOKU_SANDBOX_SECRET_KEY || '',
        PRIVATE_KEY: loadDokuPrivateKey('doku_sandbox.pem', 'DOKU_SANDBOX_PRIVATE_KEY'),
        API_URL: 'https://api-sandbox.doku.com/checkout/v1/payment'
    },
    PRODUCTION: {
        CLIENT_ID: process.env.DOKU_CLIENT_ID || '',
        SECRET_KEY: process.env.DOKU_SECRET_KEY || '',
        PRIVATE_KEY: loadDokuPrivateKey('doku_production.pem', 'DOKU_PRIVATE_KEY'),
        API_URL: 'https://api.doku.com/checkout/v1/payment'
    }
};

// =============================================================================
// MIDTRANS CONFIGURATION - Credentials from Environment Variables
// =============================================================================

const MIDTRANS_CONFIG = {
    PRODUCTION: {
        SERVER_KEY: process.env.MIDTRANS_SERVER_KEY || '',
        API_URL: 'https://app.midtrans.com/snap/v1/transactions'
    },
    SANDBOX: {
        SERVER_KEY: process.env.MIDTRANS_SANDBOX_SERVER_KEY || '',
        API_URL: 'https://app.sandbox.midtrans.com/snap/v1/transactions'
    }
};

// AIRWALLEX CONFIGURATION (SGD Currency)
const AIRWALLEX_CONFIG = {
    SANDBOX: {
        CLIENT_ID: process.env.AIRWALLEX_SANDBOX_CLIENT_ID || '', // Demo/Sandbox Client ID
        API_KEY: process.env.AIRWALLEX_SANDBOX_API_KEY || '',     // Demo/Sandbox API Key
        API_URL: 'https://api-demo.airwallex.com/api/v1'
    },
    PRODUCTION: {
        CLIENT_ID: process.env.AIRWALLEX_CLIENT_ID || '',   // Production Client ID
        API_KEY: process.env.AIRWALLEX_API_KEY || '',       // Production API Key
        API_URL: 'https://api.airwallex.com/api/v1'
    }
};

// =============================================================================
// CONFIGURATION VALIDATION
// =============================================================================

/**
 * Validate required environment variables for a gateway
 * @param {string} gateway - Gateway name (doku, midtrans, airwallex)
 * @param {boolean} isProduction - Whether to check production or sandbox vars
 * @param {object} logger - Logger instance
 * @returns {object} { valid: boolean, missing: string[] }
 */
function validateGatewayConfig(gateway, isProduction, logger) {
    const missing = [];

    if (gateway === 'doku') {
        const config = isProduction ? DOKU_CONFIG.PRODUCTION : DOKU_CONFIG.SANDBOX;
        if (!config.CLIENT_ID) missing.push(isProduction ? 'DOKU_CLIENT_ID' : 'DOKU_SANDBOX_CLIENT_ID');
        if (!config.SECRET_KEY) missing.push(isProduction ? 'DOKU_SECRET_KEY' : 'DOKU_SANDBOX_SECRET_KEY');
        if (!config.PRIVATE_KEY) missing.push(isProduction ? 'DOKU_PRIVATE_KEY' : 'DOKU_SANDBOX_PRIVATE_KEY');
    } else if (gateway === 'midtrans') {
        const config = isProduction ? MIDTRANS_CONFIG.PRODUCTION : MIDTRANS_CONFIG.SANDBOX;
        if (!config.SERVER_KEY) missing.push(isProduction ? 'MIDTRANS_SERVER_KEY' : 'MIDTRANS_SANDBOX_SERVER_KEY');
    } else if (gateway === 'airwallex') {
        const config = isProduction ? AIRWALLEX_CONFIG.PRODUCTION : AIRWALLEX_CONFIG.SANDBOX;
        if (!config.CLIENT_ID) missing.push(isProduction ? 'AIRWALLEX_CLIENT_ID' : 'AIRWALLEX_SANDBOX_CLIENT_ID');
        if (!config.API_KEY) missing.push(isProduction ? 'AIRWALLEX_API_KEY' : 'AIRWALLEX_SANDBOX_API_KEY');
    }

    if (missing.length > 0 && logger) {
        logger.warn(`Missing ${gateway} configuration`, {
            gateway,
            environment: isProduction ? 'production' : 'sandbox',
            missingVariables: missing
        });
    }

    return { valid: missing.length === 0, missing };
}

// =============================================================================

exports.handler = async function(event, context) {
    // Initialize logger with correlation ID from headers
    const logger = createLogger(event.headers, 'midtrans-token', 'v8.7');

    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Requested-With, Origin, User-Agent, Referer',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, PUT, DELETE',
        'Access-Control-Allow-Credentials': 'false',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
        'Vary': 'Origin, Access-Control-Request-Headers'
    };

    logger.info('Function invoked', {
        httpMethod: event.httpMethod,
        origin: event.headers.origin || 'none',
        path: event.path,
        functionVersion: 'artcom_v8.7_multi_gateway'
    });

    // =============================================================================
    // AIRWALLEX WEBHOOK HANDLER (Incoming notifications from Airwallex)
    // =============================================================================
    // Check if this is an Airwallex webhook callback
    const queryParams = event.queryStringParameters || {};
    if (queryParams.webhook === 'airwallex' && event.httpMethod === 'POST') {
        logger.info('Airwallex webhook received', {
            hasSignature: !!event.headers['x-signature'],
            contentType: event.headers['content-type']
        });

        try {
            const webhookBody = JSON.parse(event.body || '{}');
            const eventType = webhookBody.name || webhookBody.event_type;
            const paymentIntentId = webhookBody.data?.object?.id || webhookBody.data?.id;
            const merchantOrderId = webhookBody.data?.object?.merchant_order_id || webhookBody.data?.merchant_order_id;
            const status = webhookBody.data?.object?.status || webhookBody.data?.status;

            logger.info('Airwallex webhook details', {
                eventType,
                paymentIntentId,
                merchantOrderId,
                status
            });

            // Map Airwallex status to NextPay status
            let nextpayStatus = 'pending';
            if (eventType === 'payment_intent.succeeded' || status === 'SUCCEEDED') {
                nextpayStatus = 'completed';
            } else if (eventType === 'payment_intent.failed' || status === 'FAILED' || status === 'CANCELLED') {
                nextpayStatus = 'failed';
            } else if (status === 'REQUIRES_CAPTURE' || status === 'REQUIRES_PAYMENT_METHOD') {
                nextpayStatus = 'pending';
            }

            logger.info('Status mapped', {
                airwallexStatus: status,
                airwallexEvent: eventType,
                nextpayStatus
            });

            // Check if this is a NextPay order by:
            // 1. Direct ARTCOM_ order ID
            // 2. Payment Link order (has "Payment ARTCOM_" prefix)
            // 3. Has a valid payment_intent_id (can be looked up in DB)
            const isDirectArtcomOrder = merchantOrderId && merchantOrderId.startsWith('ARTCOM_') && merchantOrderId.length === 34;
            const isPaymentLinkOrder = merchantOrderId && merchantOrderId.startsWith('Payment ARTCOM_');
            const hasPaymentIntentId = !!paymentIntentId;

            // Clean the order_id by removing "Payment " prefix (Payment Links add this prefix)
            let cleanOrderId = merchantOrderId;
            if (isPaymentLinkOrder) {
                cleanOrderId = merchantOrderId.substring(8); // Remove "Payment " prefix
                logger.info('Cleaned Payment Link order ID', {
                    original: merchantOrderId,
                    cleaned: cleanOrderId
                });
            }

            // Forward to NextPay webhook handler if this is a NextPay order
            if (isDirectArtcomOrder || isPaymentLinkOrder || hasPaymentIntentId) {
                // Determine environment based on metadata
                const metadata = webhookBody.data?.object?.metadata || {};
                const isTestModeFromMetadata = metadata.test_mode === 'true';
                const isLocalDev = process.env.NETLIFY_DEV === 'true' || process.env.LOCAL_DEV === 'true';

                // Route based on test_mode in metadata:
                // - test_mode: true  → sandbox → nextpaytest.de
                // - test_mode: false → production → nextpays.de
                let nextpayWebhookUrl;
                if (isLocalDev) {
                    // LOCAL TESTING: Forward to local NextPay
                    nextpayWebhookUrl = 'http://localhost:8888/webhook/airwallex.php';
                } else if (isTestModeFromMetadata) {
                    // SANDBOX: Forward to test server (nextpaytest.de)
                    nextpayWebhookUrl = 'https://nextpaytest.de/webhook/airwallex.php';
                } else {
                    // PRODUCTION: Forward to production NextPay (nextpays.de)
                    nextpayWebhookUrl = 'https://nextpays.de/webhook/airwallex.php';
                }

                logger.info('Forwarding to NextPay', {
                    webhookUrl: nextpayWebhookUrl,
                    orderId: cleanOrderId,
                    originalOrderId: merchantOrderId,
                    paymentIntentId,
                    status: nextpayStatus,
                    isTestMode: isTestModeFromMetadata,
                    environment: isTestModeFromMetadata ? 'sandbox' : 'production',
                    isPaymentLinkOrder
                });

                try {
                    const forwardResponse = await fetch(nextpayWebhookUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent': 'ArtCom-Airwallex-Webhook-Forwarder-v1.0',
                            'X-Forwarded-From': 'netlify-function'
                        },
                        body: JSON.stringify({
                            event_type: eventType,
                            order_id: cleanOrderId, // Use cleaned order_id (without "Payment " prefix)
                            original_order_id: merchantOrderId, // Keep original for reference
                            payment_intent_id: paymentIntentId,
                            status: nextpayStatus,
                            airwallex_status: status,
                            currency: webhookBody.data?.object?.currency || 'SGD',
                            amount: webhookBody.data?.object?.amount,
                            metadata: webhookBody.data?.object?.metadata,
                            raw_webhook: webhookBody,
                            is_payment_link: isPaymentLinkOrder,
                            forwarded_at: new Date().toISOString()
                        })
                    });

                    logger.info('NextPay forward response', {
                        status: forwardResponse.status,
                        ok: forwardResponse.ok
                    });
                } catch (forwardError) {
                    logger.error('Failed to forward to NextPay', forwardError, {
                        webhookUrl: nextpayWebhookUrl,
                        orderId: merchantOrderId
                    });
                }
            }

            // Always return 200 to Airwallex to acknowledge receipt
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Webhook received and processed',
                    event_type: eventType,
                    order_id: merchantOrderId,
                    status: nextpayStatus,
                    timestamp: Math.floor(Date.now() / 1000)
                })
            };

        } catch (webhookError) {
            logger.error('Airwallex webhook processing error', webhookError);
            // Still return 200 to prevent Airwallex from retrying
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Webhook processing error',
                    message: webhookError.message
                })
            };
        }
    }

    if (event.httpMethod === 'OPTIONS') {
        logger.info('CORS preflight request', { origin: event.headers.origin });
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'CORS preflight successful',
                timestamp: Math.floor(Date.now() / 1000),
                function_version: 'artcom_v8.7_multi_gateway',
                supported_gateways: ['midtrans', 'doku', 'airwallex']
            })
        };
    }

    if (event.httpMethod !== 'POST') {
        logger.warn('Invalid HTTP method', {
            method: event.httpMethod,
            allowedMethods: ['POST', 'OPTIONS']
        });
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
        const secret = process.env.ARTCOM_CALLBACK_SECRET || 'ARTCOM_CALLBACK_SECRET_2024';

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
    function createDokuSignature(clientId, requestId, timestamp, requestBody, secretKey, logger) {
        const crypto = require('crypto');

        // Step 1: Minify JSON (no spaces, no newlines)
        const minifiedBody = JSON.stringify(requestBody);

        // Step 2: Create Digest - SHA-256 BASE64 hash of body
        const digest = crypto
            .createHash('sha256')
            .update(minifiedBody)
            .digest('base64');

        // Step 3: Build Component String (Request Header Signature Format)
        const requestTarget = '/checkout/v1/payment';
        const componentString = `Client-Id:${clientId}\nRequest-Id:${requestId}\nRequest-Timestamp:${timestamp}\nRequest-Target:${requestTarget}\nDigest:${digest}`;

        // Step 4: Create HMAC SHA-256 signature
        const hmac = crypto.createHmac('sha256', secretKey);
        hmac.update(componentString);
        const signature = hmac.digest('base64');

        logger.debug('DOKU signature created', {
            gateway: 'doku',
            operation: 'create_signature',
            clientId,
            requestId,
            timestamp,
            requestTarget,
            bodyLength: minifiedBody.length,
            digestPreview: digest.substring(0, 30) + '...',
            hmacAlgorithm: 'SHA256',
            secretKeyLength: secretKey ? secretKey.length : 0,
            signaturePreview: signature.substring(0, 30) + '...'
        });

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
    async function getDokuTokenB2B(clientId, privateKey, isProduction, logger) {
        const crypto = require('crypto');
        const timer = logger.startTimer('doku_token_b2b');

        logger.logAuthAttempt('doku', clientId, 'token_b2b');

        logger.debug('DOKU Token B2B configuration', {
            gateway: 'doku',
            operation: 'token_b2b',
            clientId,
            clientIdLength: clientId ? clientId.length : 0,
            privateKeyExists: !!privateKey,
            privateKeyLength: privateKey ? privateKey.length : 0,
            isProduction
        });

        const timestamp = getDokuTimestamp();
        const stringToSign = `${clientId}|${timestamp}`;

        logger.debug('Creating RSA-SHA256 signature', {
            gateway: 'doku',
            stringToSign,
            timestamp
        });

        let signature;
        try {
            const sign = crypto.createSign('RSA-SHA256');
            sign.update(stringToSign, 'utf8');
            sign.end();
            signature = sign.sign(privateKey, 'base64');

            logger.debug('RSA signature created successfully', {
                gateway: 'doku',
                signatureLength: signature.length,
                signaturePreview: signature.substring(0, 50) + '...'
            });
        } catch (error) {
            logger.error('RSA signing failed', error, {
                gateway: 'doku',
                operation: 'rsa_sign',
                clientId,
                privateKeyLength: privateKey ? privateKey.length : 0,
                hasLiteralNewlines: privateKey ? privateKey.includes('\\n') : false,
                hasRealNewlines: privateKey ? privateKey.includes('\n') : false
            });
            return null;
        }

        const tokenUrl = isProduction
            ? 'https://api.doku.com/authorization/v1/access-token/b2b'
            : 'https://api-sandbox.doku.com/authorization/v1/access-token/b2b';

        logger.logApiCall('doku', tokenUrl, 'POST');

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

            const responseData = await response.json();
            const duration = timer.end();

            logger.logApiResponse('doku', response.status, response.ok, duration);

            if (response.ok && responseData.accessToken) {
                logger.logAuthSuccess('doku', 'token_b2b', responseData.expiresIn);
                logger.debug('Token B2B details', {
                    gateway: 'doku',
                    tokenLength: responseData.accessToken.length,
                    expiresInSeconds: responseData.expiresIn
                });
                return responseData.accessToken;
            } else {
                logger.logAuthFailure('doku', 'Invalid response or missing access token', response.status);
                logger.debug('Token B2B failure details', {
                    gateway: 'doku',
                    status: response.status,
                    responseData
                });
                return null;
            }
        } catch (error) {
            timer.end();
            logger.error('Token B2B network error', error, {
                gateway: 'doku',
                operation: 'token_b2b',
                url: tokenUrl
            });
            return null;
        }
    }

    /**
     * Generate fallback customer name from order_id and amount
     */
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

    /**
     * Handle DOKU Payment Creation
     */
    async function handleDokuPayment(requestData, headers, logger) {
        const dokuLogger = logger.child({ gateway: 'doku', operation: 'payment_creation' });

        dokuLogger.info('DOKU payment request started');
        dokuLogger.debug('Request data received', { requestData });
        
        const {
            amount,
            order_id,
            item_name = 'ArtCom Design Payment',
            callback_base_url,
            test_mode = false,
            payment_source = 'legacy',
            custom_name,
            credit_card,
            auto_redirect,
            wix_ref,
            wix_expiry,
            wix_signature
        } = requestData;

        dokuLogger.debug('Extracted request parameters', {
            amount,
            orderId: order_id,
            itemName: item_name,
            callbackBaseUrl: callback_base_url,
            testMode: test_mode,
            paymentSource: payment_source,
            hasCustomName: !!custom_name,
            hasCreditCard: !!credit_card,
            autoRedirect: auto_redirect,
            ...(payment_source === 'wix' && { wixParams: { wix_ref, wix_expiry, hasSignature: !!wix_signature } })
        });

        // ALWAYS USE PRODUCTION for Doku (credentials are production)
        const dokuEnv = DOKU_CONFIG.PRODUCTION;

        dokuLogger.debug('DOKU environment configuration', {
            environment: 'PRODUCTION',
            apiUrl: dokuEnv.API_URL,
            clientId: dokuEnv.CLIENT_ID,
            secretKeyConfigured: !!dokuEnv.SECRET_KEY,
            secretKeyLength: dokuEnv.SECRET_KEY ? dokuEnv.SECRET_KEY.length : 0,
            privateKeyConfigured: !!dokuEnv.PRIVATE_KEY,
            privateKeyLength: dokuEnv.PRIVATE_KEY ? dokuEnv.PRIVATE_KEY.length : 0
        });

        // Generate Doku request parameters
        const requestId = createDokuRequestId();
        const timestamp = getDokuTimestamp();

        dokuLogger.debug('Request metadata generated', {
            requestId,
            timestamp
        });

        // Trim invoice_number for DOKU 30 char limit
        const invoiceNumber = String(order_id).substring(0, 30);
        
        // Determine callback URL and source based on payment_source (NOT order_id length!)
        let callbackUrl;
        let dokuSource;
        
        if (payment_source === 'wix' || payment_source === 'wix_simple') {
            // WIX orders: Direct callback to ArtCom webhook (NO TOKEN)
            callbackUrl = `https://www.artcom.design/webhook/payment_complete.php?order_id=${invoiceNumber}&gateway=doku`;
            dokuSource = 'wix';
            dokuLogger.info('WIX DOKU payment - direct callback configured', {
                callbackType: 'direct',
                usingInvoiceNumber: true,
                invoiceNumberLength: invoiceNumber.length
            });
        } else {
            // NextPay orders: Use callback_token flow
            if (callback_base_url) {
                callbackUrl = callback_base_url;
            } else if (test_mode || payment_source === 'nextpay_test') {
                callbackUrl = 'https://nextpays1staging.wpcomstaging.com';
            } else {
                callbackUrl = 'https://artcomdesign3-umbac.wpcomstaging.com';
            }

            // Create callback token for DOKU
            dokuSource = (test_mode || payment_source === 'nextpay_test') ? 'nextpay1' : 'nextpay';
            const callbackToken = createCallbackToken(invoiceNumber, dokuSource);

            dokuLogger.info('DOKU callback token created', {
                tokenExpiry: '1 hour',
                tokenTimestamp: Math.floor(Date.now() / 1000),
                tokenSource: dokuSource
            });

            callbackUrl += `?callback_token=${callbackToken}&gateway=doku&order_id=${invoiceNumber}`;
            dokuLogger.debug('NextPay DOKU callback URL prepared', { hasToken: true });
        }

        dokuLogger.debug('Callback URL configured', {
            url: dokuLogger.masker.maskUrl(callbackUrl),
            source: dokuSource
        });        // Generate customer data
        let nameForGeneration;
        if (custom_name && typeof custom_name === 'string' && custom_name.trim()) {
            nameForGeneration = custom_name.trim();
            dokuLogger.debug('Using provided custom name', { name: nameForGeneration });
        } else {
            nameForGeneration = generateFallbackName(order_id, amount);
            dokuLogger.debug('Generated fallback name', { name: nameForGeneration });
        }

        const customerData = generateDeterministicContact(nameForGeneration, credit_card);
        dokuLogger.debug('Customer data generated', {
            inputName: nameForGeneration,
            outputName: `${customerData.first_name} ${customerData.last_name}`,
            hasEmail: !!customerData.email,
            hasPhone: !!customerData.phone
        });

        dokuLogger.debug('Invoice number prepared', {
            originalOrderId: order_id,
            invoiceNumber: invoiceNumber,
            trimmedTo30Chars: true
        });

        // Prepare Doku request body
        const dokuRequestBody = {
            order: {
                invoice_number: invoiceNumber,
                amount: parseInt(amount, 10),
                callback_url: callbackUrl,
                failed_url: callbackUrl,
                auto_redirect: true
            },
            payment: {
                payment_due_date: 5
            },
            customer: {
                name: `${customerData.first_name} ${customerData.last_name}`,
                email: customerData.email
            }
        };

        dokuLogger.debug('DOKU request body prepared', {
            customerName: dokuRequestBody.customer.name,
            amount: dokuRequestBody.order.amount,
            invoiceNumber: dokuRequestBody.order.invoice_number,
            paymentDueMinutes: dokuRequestBody.payment.payment_due_date,
            autoRedirect: dokuRequestBody.order.auto_redirect
        });

        // STEP 1: Get Token B2B
        dokuLogger.info('Step 1: Obtaining Token B2B');
        const tokenB2B = await getDokuTokenB2B(
            dokuEnv.CLIENT_ID,
            dokuEnv.PRIVATE_KEY,
            true,
            dokuLogger
        );

        if (!tokenB2B) {
            dokuLogger.error('Failed to obtain Token B2B', null, {
                hint: 'Check PRIVATE_KEY configuration in DOKU_CONFIG'
            });
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

        dokuLogger.info('Token B2B obtained successfully');

        // STEP 2: Create signature
        dokuLogger.info('Step 2: Creating signature');
        const signature = createDokuSignature(
            dokuEnv.CLIENT_ID,
            requestId,
            timestamp,
            dokuRequestBody,
            dokuEnv.SECRET_KEY,
            dokuLogger
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

        // STEP 3: Send request to DOKU
        dokuLogger.info('Step 3: Sending payment request to DOKU');
        dokuLogger.debug('Request details', {
            requestId,
            timestamp,
            endpoint: dokuEnv.API_URL
        });

        const timer = dokuLogger.startTimer('doku_payment_api_call');

        try {
            const response = await fetch(dokuEnv.API_URL, {
                method: 'POST',
                headers: dokuHeaders,
                body: JSON.stringify(dokuRequestBody)
            });

            const responseText = await response.text();
            const duration = timer.end();

            dokuLogger.logApiResponse('doku', response.status, response.ok, duration);
            dokuLogger.debug('Response received', {
                status: response.status,
                responseLength: responseText.length
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = JSON.parse(responseText);
                } catch (e) {
                    errorData = { error: responseText };
                }

                dokuLogger.logPaymentError('doku', order_id, 'DOKU API returned error', response.status);
                dokuLogger.debug('DOKU API error details', {
                    status: response.status,
                    errorData
                });

                // Request summary for tracking
                logger.info('[REQUEST_COMPLETE]', {
                    success: false,
                    gateway: 'doku',
                    paymentSource: payment_source,
                    totalDurationMs: logger._getElapsedTime(),
                    orderId: order_id,
                    amount: parseInt(amount),
                    errorType: 'payment_failed',
                    statusCode: response.status
                });

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

            dokuLogger.logPaymentSuccess('doku', order_id, !!responseData.response?.payment?.token_id);
            dokuLogger.debug('Payment response details', {
                hasPaymentUrl: !!responseData.response?.payment?.url,
                hasToken: !!responseData.response?.payment?.token_id
            });

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
            }, dokuLogger);

            // Request summary for tracking
            logger.info('[REQUEST_COMPLETE]', {
                success: true,
                gateway: 'doku',
                paymentSource: payment_source,
                totalDurationMs: logger._getElapsedTime(),
                orderId: order_id,
                amount: parseInt(amount)
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
                    order_id: invoiceNumber,  // Return trimmed invoice_number (30 chars)
                    amount: parseInt(amount),
                    expiry_date: responseData.response.payment.expired_date,
                    doku_response: responseData,
                    timestamp: Math.floor(Date.now() / 1000),
                    function_version: 'artcom_v8.6_multi_gateway',
                    payment_source: payment_source,
                    test_mode: test_mode
                }
            })
        };        } catch (error) {
            timer.end();
            dokuLogger.error('DOKU payment creation failed with exception', error, {
                orderId: order_id,
                amount
            });

            // Request summary for tracking
            logger.info('[REQUEST_COMPLETE]', {
                success: false,
                gateway: 'doku',
                paymentSource: payment_source,
                totalDurationMs: logger._getElapsedTime(),
                orderId: order_id,
                errorType: 'exception',
                errorMessage: error.message
            });

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
    async function sendWebhookNotification(data, logger) {
        const isNextPay = data.order_id && data.order_id.startsWith('ARTCOM_') && data.order_id.length === 34;

        let webhookUrl;
        if (isNextPay) {
            // Check if custom webhook URL is provided (for local testing)
            if (data.webhook_url) {
                webhookUrl = data.webhook_url;
                logger.info('Using custom webhook URL for local testing', { webhookUrl });
            } else if (data.test_mode) {
                webhookUrl = 'https://nextpays1.de/webhook/midtrans.php';
            } else {
                webhookUrl = 'https://nextpays.de/webhook/midtrans.php';
            }
        } else {
            webhookUrl = 'https://www.artcom.design/webhook/midtrans.php';
        }

        logger.info('Sending webhook notification', {
            webhookUrl,
            event: data.event,
            orderId: data.order_id,
            gateway: data.gateway
        });

        const timer = logger.startTimer('webhook_notification');

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'ArtCom-Payment-Function-v8.7-multi-gateway'
                },
                body: JSON.stringify({
                    ...data,
                    timestamp: new Date().toISOString(),
                    timestamp_unix: Math.floor(Date.now() / 1000),
                    function_version: 'artcom_v8.7_multi_gateway'
                })
            });

            const duration = timer.end();
            logger.logWebhookSent(webhookUrl, response.ok, response.status, duration);
        } catch (error) {
            timer.end();
            logger.error('Webhook notification failed', error, {
                webhookUrl,
                event: data.event,
                orderId: data.order_id
            });
        }
    }

    // =============================================================================
    // END DOKU FUNCTIONS
    // =============================================================================

    // =============================================================================
    // AIRWALLEX PAYMENT GATEWAY FUNCTIONS (SGD Currency)
    // =============================================================================

    /**
     * Get Airwallex Access Token
     * Uses client_id + api_key to authenticate and get Bearer token
     */
    async function getAirwallexAccessToken(clientId, apiKey, isProduction, logger) {
        const timer = logger.startTimer('airwallex_token');

        logger.logAuthAttempt('airwallex', clientId, 'access_token');

        const baseUrl = isProduction
            ? AIRWALLEX_CONFIG.PRODUCTION.API_URL
            : AIRWALLEX_CONFIG.SANDBOX.API_URL;

        const tokenUrl = `${baseUrl}/authentication/login`;

        logger.debug('Airwallex token request', {
            gateway: 'airwallex',
            operation: 'access_token',
            clientIdLength: clientId ? clientId.length : 0,
            apiKeyLength: apiKey ? apiKey.length : 0,
            isProduction,
            tokenUrl
        });

        try {
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-client-id': clientId,
                    'x-api-key': apiKey
                }
            });

            const responseData = await response.json();
            const duration = timer.end();

            logger.logApiResponse('airwallex', response.status, response.ok, duration);

            if (response.ok && responseData.token) {
                logger.logAuthSuccess('airwallex', 'access_token', responseData.expires_at);
                logger.debug('Airwallex token obtained', {
                    gateway: 'airwallex',
                    tokenLength: responseData.token.length,
                    expiresAt: responseData.expires_at
                });
                return responseData.token;
            } else {
                logger.logAuthFailure('airwallex', 'Invalid response or missing token', response.status);
                logger.debug('Airwallex auth failure details', {
                    gateway: 'airwallex',
                    status: response.status,
                    responseData
                });
                return null;
            }
        } catch (error) {
            timer.end();
            logger.error('Airwallex token network error', error, {
                gateway: 'airwallex',
                operation: 'access_token',
                url: tokenUrl
            });
            return null;
        }
    }

    /**
     * Handle Airwallex Payment Creation
     * Creates a Payment Intent with Hosted Checkout
     */
    async function handleAirwallexPayment(requestData, headers, logger) {
        const airwallexLogger = logger.child({ gateway: 'airwallex', operation: 'payment_creation' });

        airwallexLogger.info('AIRWALLEX payment request started');
        airwallexLogger.debug('Request data received', { requestData });

        const {
            amount,           // Amount in SGD (already converted)
            amount_sgd,       // Explicit SGD amount if provided
            order_id,
            item_name = 'NextPay Payment',
            callback_base_url,
            test_mode = false,
            payment_source = 'legacy',
            custom_name,
            credit_card,
            customer_email,
            customer_phone
        } = requestData;

        // Use SGD amount if provided, otherwise use amount
        const finalAmountSgd = amount_sgd || amount;

        airwallexLogger.debug('Extracted request parameters', {
            amountSgd: finalAmountSgd,
            orderId: order_id,
            itemName: item_name,
            callbackBaseUrl: callback_base_url,
            testMode: test_mode,
            paymentSource: payment_source,
            hasCustomName: !!custom_name
        });

        // Select environment
        const isProduction = !test_mode;
        const airwallexEnv = isProduction ? AIRWALLEX_CONFIG.PRODUCTION : AIRWALLEX_CONFIG.SANDBOX;

        airwallexLogger.debug('AIRWALLEX environment configuration', {
            environment: isProduction ? 'PRODUCTION' : 'SANDBOX',
            apiUrl: airwallexEnv.API_URL,
            clientIdConfigured: !!airwallexEnv.CLIENT_ID,
            apiKeyConfigured: !!airwallexEnv.API_KEY
        });

        // Validate credentials
        if (!airwallexEnv.CLIENT_ID || !airwallexEnv.API_KEY) {
            airwallexLogger.error('Missing Airwallex credentials', null, {
                hasClientId: !!airwallexEnv.CLIENT_ID,
                hasApiKey: !!airwallexEnv.API_KEY,
                environment: isProduction ? 'PRODUCTION' : 'SANDBOX'
            });
            return {
                statusCode: 500,
                headers: headers,
                body: JSON.stringify({
                    success: false,
                    gateway: 'airwallex',
                    error: 'Airwallex credentials not configured',
                    message: isProduction
                        ? 'Set AIRWALLEX_CLIENT_ID and AIRWALLEX_API_KEY environment variables'
                        : 'Set AIRWALLEX_SANDBOX_CLIENT_ID and AIRWALLEX_SANDBOX_API_KEY environment variables'
                })
            };
        }

        // STEP 1: Get Access Token
        airwallexLogger.info('Step 1: Obtaining Access Token');
        const accessToken = await getAirwallexAccessToken(
            airwallexEnv.CLIENT_ID,
            airwallexEnv.API_KEY,
            isProduction,
            airwallexLogger
        );

        if (!accessToken) {
            airwallexLogger.error('Failed to obtain Airwallex access token', null, {
                hint: 'Check CLIENT_ID and API_KEY configuration'
            });
            return {
                statusCode: 500,
                headers: headers,
                body: JSON.stringify({
                    success: false,
                    gateway: 'airwallex',
                    error: 'Failed to obtain Airwallex authentication token',
                    message: 'Check CLIENT_ID and API_KEY in Netlify environment variables'
                })
            };
        }

        airwallexLogger.info('Access Token obtained successfully');

        // Generate customer data
        let nameForGeneration;
        if (custom_name && typeof custom_name === 'string' && custom_name.trim()) {
            nameForGeneration = custom_name.trim();
            airwallexLogger.debug('Using provided custom name', { name: nameForGeneration });
        } else {
            nameForGeneration = generateFallbackName(order_id, finalAmountSgd);
            airwallexLogger.debug('Generated fallback name', { name: nameForGeneration });
        }

        const customerData = generateDeterministicContact(nameForGeneration, credit_card);
        airwallexLogger.debug('Customer data generated', {
            inputName: nameForGeneration,
            outputName: `${customerData.first_name} ${customerData.last_name}`,
            hasEmail: !!customerData.email,
            hasPhone: !!customerData.phone
        });

        // Determine callback URL
        let callbackUrl;
        let airwallexSource;

        if (payment_source === 'wix' || payment_source === 'wix_simple') {
            // WIX orders: Direct callback
            callbackUrl = `https://www.artcom.design/webhook/payment_complete.php?order_id=${order_id}&gateway=airwallex`;
            airwallexSource = 'wix';
            airwallexLogger.info('WIX AIRWALLEX payment - direct callback configured');
        } else {
            // NextPay orders: Use callback_token flow
            if (callback_base_url) {
                callbackUrl = callback_base_url;
            } else if (test_mode || payment_source === 'nextpay_test') {
                callbackUrl = 'https://nextpays1staging.wpcomstaging.com';
            } else {
                callbackUrl = 'https://artcomdesign3-umbac.wpcomstaging.com';
            }

            airwallexSource = (test_mode || payment_source === 'nextpay_test') ? 'nextpay1' : 'nextpay';
            const callbackToken = createCallbackToken(order_id, airwallexSource);

            airwallexLogger.info('AIRWALLEX callback token created', {
                tokenExpiry: '1 hour',
                tokenTimestamp: Math.floor(Date.now() / 1000),
                tokenSource: airwallexSource
            });

            callbackUrl += `?callback_token=${callbackToken}&gateway=airwallex&order_id=${order_id}`;
        }

        airwallexLogger.debug('Callback URL configured', {
            url: airwallexLogger.masker ? airwallexLogger.masker.maskUrl(callbackUrl) : '[masked]',
            source: airwallexSource
        });

        // STEP 2: Create Payment Intent
        airwallexLogger.info('Step 2: Creating Payment Intent');

        // Generate unique request_id for idempotency
        const requestId = `${order_id}_${Date.now()}`;

        // Airwallex Payment Intent request body
        const paymentIntentBody = {
            request_id: requestId,
            amount: parseFloat(finalAmountSgd),
            currency: 'SGD',
            merchant_order_id: order_id,
            descriptor: item_name.substring(0, 22), // Max 22 chars for descriptor
            order: {
                products: [
                    {
                        code: payment_source === 'wix' ? 'ARTCOM_WIX' : 'NEXTPAY_PAYMENT',
                        name: item_name.substring(0, 120), // Max 120 chars
                        quantity: 1,
                        unit_price: parseFloat(finalAmountSgd),
                        desc: `Payment for order ${order_id}`.substring(0, 120)
                    }
                ]
            },
            metadata: {
                order_id: order_id,
                payment_source: payment_source,
                source: airwallexSource,
                test_mode: test_mode ? 'true' : 'false',
                created_at: new Date().toISOString()
            },
            return_url: callbackUrl
        };

        // Add customer info if available
        if (customer_email || customerData.email) {
            paymentIntentBody.customer = {
                email: customer_email || customerData.email,
                first_name: customerData.first_name,
                last_name: customerData.last_name,
                phone_number: customer_phone || customerData.phone
            };
        }

        airwallexLogger.debug('Payment Intent body prepared', {
            requestId,
            amount: paymentIntentBody.amount,
            currency: paymentIntentBody.currency,
            merchantOrderId: paymentIntentBody.merchant_order_id,
            hasCustomer: !!paymentIntentBody.customer
        });

        const paymentIntentUrl = `${airwallexEnv.API_URL}/pa/payment_intents/create`;
        const timer = airwallexLogger.startTimer('airwallex_payment_intent');

        try {
            const response = await fetch(paymentIntentUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(paymentIntentBody)
            });

            const responseText = await response.text();
            const duration = timer.end();

            airwallexLogger.logApiResponse('airwallex', response.status, response.ok, duration);

            if (!response.ok) {
                let errorData;
                try {
                    errorData = JSON.parse(responseText);
                } catch (e) {
                    errorData = { error: responseText };
                }

                airwallexLogger.logPaymentError('airwallex', order_id, 'Airwallex API returned error', response.status);
                airwallexLogger.debug('Airwallex API error details', {
                    status: response.status,
                    errorData
                });

                logger.info('[REQUEST_COMPLETE]', {
                    success: false,
                    gateway: 'airwallex',
                    paymentSource: payment_source,
                    totalDurationMs: logger._getElapsedTime(),
                    orderId: order_id,
                    amount: finalAmountSgd,
                    errorType: 'payment_failed',
                    statusCode: response.status
                });

                return {
                    statusCode: response.status,
                    headers: headers,
                    body: JSON.stringify({
                        success: false,
                        gateway: 'airwallex',
                        error: 'Airwallex payment creation failed',
                        details: errorData,
                        airwallex_status: response.status
                    })
                };
            }

            const responseData = JSON.parse(responseText);

            airwallexLogger.debug('Payment Intent created', {
                paymentIntentId: responseData.id,
                status: responseData.status,
                hasClientSecret: !!responseData.client_secret
            });

            // STEP 3: Create Payment Link for hosted checkout
            airwallexLogger.info('Step 3: Creating Payment Link for hosted checkout');

            const paymentLinkBody = {
                amount: parseFloat(finalAmountSgd),
                currency: 'SGD',
                title: `Payment ${order_id}`,
                reusable: false,
                metadata: {
                    order_id: order_id,
                    payment_intent_id: responseData.id
                }
            };

            const paymentLinkTimer = airwallexLogger.startTimer('airwallex_payment_link');
            const paymentLinkResponse = await fetch(`${airwallexEnv.API_URL}/pa/payment_links/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify(paymentLinkBody)
            });

            const paymentLinkData = await paymentLinkResponse.json();
            const paymentLinkDuration = paymentLinkTimer.end();

            airwallexLogger.debug('Payment Link response', {
                status: paymentLinkResponse.status,
                hasUrl: !!paymentLinkData.url,
                duration: paymentLinkDuration
            });

            // Use Payment Link URL if available, fallback to legacy URL format
            const hostedCheckoutUrl = paymentLinkData.url || (isProduction
                ? `https://checkout.airwallex.com/checkout.html?intent_id=${responseData.id}&client_secret=${responseData.client_secret}&mode=payment`
                : `https://checkout-demo.airwallex.com/checkout.html?intent_id=${responseData.id}&client_secret=${responseData.client_secret}&mode=payment`);

            airwallexLogger.logPaymentSuccess('airwallex', order_id, true);
            airwallexLogger.debug('Payment response details', {
                paymentIntentId: responseData.id,
                paymentLinkId: paymentLinkData.id,
                hasClientSecret: !!responseData.client_secret,
                hostedCheckoutUrl: '[configured]'
            });

            // Send webhook notification
            await sendWebhookNotification({
                event: 'payment_initiated_airwallex',
                order_id: order_id,
                amount: parseFloat(finalAmountSgd),
                currency: 'SGD',
                gateway: 'airwallex',
                payment_source: payment_source,
                test_mode: test_mode,
                payment_intent_id: responseData.id,
                callback_url: callbackUrl
            }, airwallexLogger);

            logger.info('[REQUEST_COMPLETE]', {
                success: true,
                gateway: 'airwallex',
                paymentSource: payment_source,
                totalDurationMs: logger._getElapsedTime(),
                orderId: order_id,
                amountSgd: finalAmountSgd
            });

            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify({
                    success: true,
                    gateway: 'airwallex',
                    data: {
                        payment_intent_id: responseData.id,
                        client_secret: responseData.client_secret,
                        redirect_url: hostedCheckoutUrl,
                        order_id: order_id,
                        amount: parseFloat(finalAmountSgd),
                        currency: 'SGD',
                        expiry_duration: '30 minutes',
                        airwallex_response: {
                            id: responseData.id,
                            status: responseData.status,
                            currency: responseData.currency,
                            amount: responseData.amount
                        },
                        timestamp: Math.floor(Date.now() / 1000),
                        function_version: 'artcom_v8.7_multi_gateway',
                        payment_source: payment_source,
                        test_mode: test_mode,
                        nextpay_source: airwallexSource
                    }
                })
            };

        } catch (error) {
            timer.end();
            airwallexLogger.error('AIRWALLEX payment creation failed with exception', error, {
                orderId: order_id,
                amount: finalAmountSgd
            });

            logger.info('[REQUEST_COMPLETE]', {
                success: false,
                gateway: 'airwallex',
                paymentSource: payment_source,
                totalDurationMs: logger._getElapsedTime(),
                orderId: order_id,
                errorType: 'exception',
                errorMessage: error.message
            });

            return {
                statusCode: 500,
                headers: headers,
                body: JSON.stringify({
                    success: false,
                    gateway: 'airwallex',
                    error: 'Internal error during Airwallex payment creation',
                    message: error.message
                })
            };
        }
    }

    // =============================================================================
    // END AIRWALLEX FUNCTIONS
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
            payment_gateway,
            wix_ref,
            wix_expiry,
            wix_signature,
            custom_name,
            credit_card,
            callback_base_url,
            test_mode = false
        } = requestData;

        logger.logRequest(event.httpMethod, event.headers, requestData);

        logger.info('Payment request received', {
            gateway: payment_gateway,
            amount,
            orderId: order_id,
            paymentSource: payment_source,
            testMode: test_mode
        });

        // Gateway validation
        if (!payment_gateway) {
            logger.logValidationError('payment_gateway', null, 'Required parameter missing');
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'payment_gateway parameter is required',
                    allowed_gateways: ['midtrans', 'doku', 'airwallex'],
                    message: 'Please specify payment_gateway: "midtrans", "doku", or "airwallex"'
                })
            };
        }

        const validGateways = ['midtrans', 'doku', 'airwallex'];
        if (!validGateways.includes(payment_gateway)) {
            logger.logValidationError('payment_gateway', payment_gateway, 'Invalid gateway value');
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Invalid payment_gateway parameter',
                    received: payment_gateway,
                    allowed_gateways: validGateways,
                    message: 'payment_gateway must be "midtrans", "doku", or "airwallex"'
                })
            };
        }

        // Gateway routing
        if (payment_gateway === 'doku') {
            logger.info('Routing to DOKU payment gateway');
            return await handleDokuPayment(requestData, headers, logger);
        }

        if (payment_gateway === 'airwallex') {
            logger.info('Routing to AIRWALLEX payment gateway (SGD)');
            return await handleAirwallexPayment(requestData, headers, logger);
        }

        if (payment_gateway === 'midtrans') {
            logger.info('Routing to MIDTRANS payment gateway');
        }

        // ============================================================================
        // MIDTRANS PAYMENT FLOW (EXISTING CODE BELOW)
        // ============================================================================

        const midtransLogger = logger.child({ gateway: 'midtrans', operation: 'payment_creation' });

        const finalAmount = parseInt(String(amount).replace(/[^\d]/g, ''), 10);
        const finalItemName = item_name || 'ArtCom Design Payment';

        midtransLogger.debug('Midtrans request parameters', {
            parsedAmount: finalAmount,
            orderId: order_id,
            paymentSource: payment_source,
            hasCustomName: !!custom_name,
            hasCreditCard: !!credit_card,
            orderIdLength: order_id ? order_id.length : 0,
            testMode: test_mode
        });

        // Determine source
        let source;
        if (payment_source === 'wix' || payment_source === 'wix_simple') {
            source = 'wix';
            midtransLogger.info('Source determined: WIX/ArtCom', {
                source,
                ...(payment_source === 'wix' && { wixParams: { wix_ref, wix_expiry, hasSignature: !!wix_signature } })
            });
        } else if (payment_source === 'nextpay_test' || test_mode === true) {
            source = 'nextpay1';
            midtransLogger.info('Source determined: NextPay TEST', { source });
        } else {
            source = 'nextpay';
            midtransLogger.info('Source determined: NextPay PRODUCTION', { source });
        }

        // Validate amount
        if (!finalAmount || finalAmount <= 0 || finalAmount > 999999999) {
            midtransLogger.logValidationError('amount', finalAmount, 'Must be between 1 and 999,999,999');
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

        // Validate order ID based on payment source
        if (payment_source === 'legacy' || payment_source === 'nextpay_test') {
            midtransLogger.debug('Validating legacy/test token', {
                tokenLength: order_id ? order_id.length : 0,
                startsWithARTCOM: order_id ? order_id.startsWith('ARTCOM_') : false
            });

            if (!order_id || order_id.length !== 34 || !order_id.startsWith('ARTCOM_')) {
                midtransLogger.logValidationError('order_id', order_id, 'Invalid 34-character token format for legacy system');
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
            midtransLogger.logValidationSuccess('order_id', 'Legacy/test token valid');
        } else if (payment_source === 'wix' || payment_source === 'wix_simple') {
            if (!order_id || !order_id.startsWith('ARTCOM_')) {
                midtransLogger.logValidationError('order_id', order_id, 'Invalid Wix order ID format');
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
                midtransLogger.logValidationError('order_id', order_id, 'Order ID too short');
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

        midtransLogger.info('All validations passed');

        const now = new Date();
        const jakartaTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
        const midtransDate = jakartaTime.toISOString().slice(0, 19).replace('T', ' ') + ' +0700';

        midtransLogger.debug('Midtrans timestamp generated', {
            timestamp: midtransDate,
            timezone: '+0700'
        });

        // Generate customer data
        let nameForGeneration;
        if (custom_name && typeof custom_name === 'string' && custom_name.trim()) {
            nameForGeneration = custom_name.trim();
            midtransLogger.debug('Using provided custom name', { name: nameForGeneration });
        } else {
            nameForGeneration = generateFallbackName(order_id, finalAmount);
            midtransLogger.debug('Generated fallback name', { name: nameForGeneration });
        }

        const customerData = generateDeterministicContact(nameForGeneration, credit_card);
        midtransLogger.debug('Customer data generated', {
            inputName: nameForGeneration,
            outputName: `${customerData.first_name} ${customerData.last_name}`,
            hasEmail: !!customerData.email,
            hasPhone: !!customerData.phone
        });

        // Create callback URL
        let callbackUrl;

        if (payment_source === 'wix' || payment_source === 'wix_simple') {
            callbackUrl = `https://www.artcom.design/webhook/payment_complete.php?order_id=${order_id}`;
            midtransLogger.info('WIX payment - direct callback configured', {
                callbackType: 'direct',
                noToken: true
            });
        } else {
            const callbackToken = createCallbackToken(order_id, source);
            midtransLogger.info('Callback token created', {
                tokenExpiry: '1 hour',
                tokenTimestamp: Math.floor(Date.now() / 1000),
                tokenSource: source
            });

            let callbackBase;
            if (callback_base_url) {
                callbackBase = callback_base_url;
                midtransLogger.debug('Using provided callback_base_url', { url: callbackBase });
            } else if (source === 'nextpay1') {
                callbackBase = 'https://nextpays1staging.wpcomstaging.com';
                midtransLogger.debug('Using test mode callback URL', { url: callbackBase });
            } else {
                callbackBase = 'https://artcomdesign3-umbac.wpcomstaging.com';
                midtransLogger.debug('Using production callback URL', { url: callbackBase });
            }

            callbackUrl = `${callbackBase}?callback_token=${callbackToken}`;
            midtransLogger.debug('NextPay callback URL prepared', { hasToken: true });
        }

        midtransLogger.debug('Callback URL configured', {
            url: midtransLogger.masker.maskUrl(callbackUrl)
        });

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

        midtransLogger.logPaymentInitiated('midtrans', order_id, finalAmount, payment_source);

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
            is_nextpay: (source === 'nextpay' || source === 'nextpay1'),
            nextpay_source: source,
            token_created_at_start: (source === 'nextpay' || source === 'nextpay1'),
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
        }, midtransLogger);

        // Use sandbox or production based on test_mode
        const midtransEnv = test_mode ? MIDTRANS_CONFIG.SANDBOX : MIDTRANS_CONFIG.PRODUCTION;
        const apiUrl = midtransEnv.API_URL;
        const serverKey = midtransEnv.SERVER_KEY;
        const authHeader = 'Basic ' + Buffer.from(serverKey + ':').toString('base64');

        midtransLogger.info('Midtrans environment', {
            test_mode: test_mode,
            environment: test_mode ? 'SANDBOX' : 'PRODUCTION',
            apiUrl: apiUrl
        });

        midtransLogger.logApiCall('midtrans', apiUrl, 'POST');
        midtransLogger.debug('Midtrans request details', {
            orderId: order_id,
            amount: finalAmount,
            customerName: `${customerData.first_name} ${customerData.last_name}`
        });

        const timer = midtransLogger.startTimer('midtrans_payment_api_call');

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                Authorization: authHeader,
                'User-Agent': 'ArtCom-v8.7-multi-gateway'
            },
            body: JSON.stringify(midtransParams)
        });

        const responseData = await response.json();
        const duration = timer.end();

        midtransLogger.logApiResponse('midtrans', response.status, response.ok, duration);
        midtransLogger.debug('Midtrans response received', {
            status: response.status,
            hasToken: !!responseData.token,
            hasRedirectUrl: !!responseData.redirect_url
        });

        if (response.ok && responseData.token) {
            midtransLogger.logPaymentSuccess('midtrans', order_id, true);
            midtransLogger.info('Payment created successfully with callback token', {
                source,
                tokenIncludedInCallback: true
            });

            // Request summary for tracking
            logger.info('[REQUEST_COMPLETE]', {
                success: true,
                gateway: 'midtrans',
                paymentSource: payment_source,
                totalDurationMs: logger._getElapsedTime(),
                orderId: order_id,
                amount: finalAmount
            });

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
                        function_version: 'artcom_v8.6_multi_gateway',
                        payment_source: payment_source,
                        test_mode: test_mode,
                        nextpay_source: source,
                        debug_info: {
                            order_id: order_id,
                            order_id_length: order_id ? order_id.length : 0,
                            amount_idr: finalAmount,
                            system: payment_source,
                            callback_url: callbackUrl,
                            is_nextpay: (source === 'nextpay' || source === 'nextpay1'),
                            token_in_callback: (source === 'nextpay' || source === 'nextpay1'),
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
            midtransLogger.logPaymentError('midtrans', order_id, 'Failed to generate payment token', response.status);
            midtransLogger.debug('Midtrans error details', {
                status: response.status,
                responseData
            });

            // Request summary for tracking
            logger.info('[REQUEST_COMPLETE]', {
                success: false,
                gateway: 'midtrans',
                paymentSource: payment_source,
                totalDurationMs: logger._getElapsedTime(),
                orderId: order_id,
                amount: finalAmount,
                errorType: 'payment_failed',
                statusCode: response.status
            });

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
        logger.error('Function execution failed', error, {
            httpMethod: event.httpMethod,
            path: event.path
        });

        // Request summary for tracking
        logger.info('[REQUEST_COMPLETE]', {
            success: false,
            gateway: payment_gateway || 'unknown',
            totalDurationMs: logger._getElapsedTime(),
            errorType: 'exception',
            errorMessage: error.message
        });

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error',
                message: error.message,
                timestamp: Math.floor(Date.now() / 1000),
                function_version: 'artcom_v8.7_multi_gateway'
            })
        };
    }
};
