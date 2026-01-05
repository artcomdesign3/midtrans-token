// logger.js - Structured Logging System for Serverless Functions
// Follows SOLID and DRY principles

const crypto = require('crypto');

/**
 * SensitiveDataMasker - Single Responsibility: Redact sensitive information
 * Protects: API keys, tokens, signatures, PII (emails, phones, credit cards)
 */
class SensitiveDataMasker {
    constructor() {
        this.patterns = {
            privateKey: /-----BEGIN[^-]+-----[\s\S]+?-----END[^-]+-----/gi,
            secretKey: /SK-[A-Za-z0-9]+/g,
            serverKey: /Mid-server-[A-Za-z0-9_-]+/g,
            clientId: /BRN-\d+-\d+/g,
            bearer: /Bearer [A-Za-z0-9._-]+/gi,
            signature: /HMACSHA256=[A-Za-z0-9+/=]+/gi,
            token: /[A-Za-z0-9._-]{30,}/g,
            email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
            phone: /\+?\d{10,15}/g,
            creditCard: /\b\d{13,19}\b/g
        };
    }

    mask(data) {
        if (!data) return data;

        const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
        const masked = this._applyPatterns(dataStr);

        return typeof data === 'string' ? masked : this._safeParse(masked, data);
    }

    _applyPatterns(str) {
        return Object.values(this.patterns).reduce(
            (result, pattern) => result.replace(pattern, match => this._redact(match)),
            str
        );
    }

    _redact(value) {
        if (value.length <= 10) return '[REDACTED]';
        const visibleChars = Math.min(4, Math.floor(value.length * 0.1));
        return value.substring(0, visibleChars) + '[REDACTED]';
    }

    _safeParse(str, fallback) {
        try {
            return JSON.parse(str);
        } catch {
            return fallback;
        }
    }

    maskUrl(url) {
        try {
            const urlObj = new URL(url);
            const sensitiveParams = ['callback_token', 'token', 'signature', 'key', 'secret'];
            const params = new URLSearchParams(urlObj.search);

            sensitiveParams.forEach(param => {
                if (params.has(param)) params.set(param, '[REDACTED]');
            });

            urlObj.search = params.toString();
            return urlObj.toString();
        } catch {
            return url;
        }
    }
}

/**
 * LogFormatter - Single Responsibility: Format log entries consistently
 * Ensures all logs have standard structure for parsing/querying
 */
class LogFormatter {
    constructor(serviceName = 'payment-function', version = 'v8.7') {
        this.serviceName = serviceName;
        this.version = version;
        this.environment = process.env.CONTEXT || process.env.NODE_ENV || 'production';
    }

    format(level, message, correlationId, context, metadata, elapsedMs = null) {
        const entry = {
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            correlationId,
            message,
            service: this.serviceName,
            version: this.version,
            environment: this.environment,
            ...context,
            ...metadata
        };

        if (elapsedMs !== null) {
            entry.elapsedMs = elapsedMs;
        }

        return entry;
    }

    toJSON(entry) {
        return JSON.stringify(entry);
    }
}

/**
 * CorrelationIdGenerator - Single Responsibility: Generate unique request IDs
 * Enables request tracing across distributed systems
 */
class CorrelationIdGenerator {
    static generate() {
        return `req_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }

    static extractFromHeaders(headers = {}) {
        return headers['x-correlation-id'] ||
               headers['x-request-id'] ||
               headers['x-trace-id'] ||
               this.generate();
    }
}

/**
 * StructuredLogger - Main logging orchestrator
 * Dependency Inversion: Depends on abstractions (masker, formatter)
 * Open/Closed: Can be extended without modification
 */
class StructuredLogger {
    constructor(correlationId = null, masker = null, formatter = null) {
        this.correlationId = correlationId || CorrelationIdGenerator.generate();
        this.context = {};
        this.startTime = Date.now();
        this.masker = masker || new SensitiveDataMasker();
        this.formatter = formatter || new LogFormatter();
    }

    // Fluent interface for context building
    addContext(key, value) {
        this.context[key] = value;
        return this;
    }

    addContextBulk(contextObj) {
        this.context = { ...this.context, ...contextObj };
        return this;
    }

    _getElapsedTime() {
        return Date.now() - this.startTime;
    }

    _shouldLogDebug() {
        return process.env.DEBUG === 'true' || process.env.CONTEXT === 'dev';
    }

    _write(level, message, metadata = {}) {
        const maskedMetadata = level === 'debug' ? this.masker.mask(metadata) : metadata;
        const entry = this.formatter.format(
            level,
            message,
            this.correlationId,
            this.context,
            maskedMetadata,
            level !== 'debug' ? this._getElapsedTime() : null
        );

        const output = this.formatter.toJSON(entry);

        switch (level) {
            case 'error':
                console.error(output);
                break;
            case 'warn':
                console.warn(output);
                break;
            default:
                console.log(output);
        }
    }

    // Core logging methods
    debug(message, metadata = {}) {
        if (this._shouldLogDebug()) {
            this._write('debug', message, metadata);
        }
    }

    info(message, metadata = {}) {
        this._write('info', message, metadata);
    }

    warn(message, metadata = {}) {
        this._write('warn', message, metadata);
    }

    error(message, error = null, metadata = {}) {
        const errorMetadata = error ? {
            ...metadata,
            error: {
                message: error.message,
                name: error.name,
                stack: error.stack,
                code: error.code
            }
        } : metadata;

        this._write('error', message, errorMetadata);
    }

    // Generic event logger (DRY principle)
    logEvent(eventName, level = 'info', data = {}) {
        this._write(level, eventName, { event: eventName, ...data });
    }

    // Domain-specific logging methods

    logRequest(method, headers = {}, body = null) {
        this.logEvent('Request received', 'info', {
            httpMethod: method,
            origin: headers.origin,
            userAgent: headers['user-agent'],
            contentType: headers['content-type'],
            bodySize: body ? JSON.stringify(body).length : 0,
            hasBody: !!body
        });
    }

    logResponse(statusCode, success, responseSize = 0) {
        this.logEvent('Response sent', 'info', {
            statusCode,
            success,
            responseSize
        });
    }

    logApiCall(gateway, endpoint, method = 'POST', requestData = {}) {
        this.logEvent(`External API call: ${gateway}`, 'info', {
            gateway,
            endpoint,
            method,
            requestSize: JSON.stringify(requestData).length
        });
    }

    logApiResponse(gateway, statusCode, success, responseTime = null) {
        const level = success ? 'info' : 'warn';
        this.logEvent(`External API response: ${gateway}`, level, {
            gateway,
            statusCode,
            success,
            responseTimeMs: responseTime
        });
    }

    // Payment-specific logging
    logPaymentInitiated(gateway, orderId, amount, source) {
        this.logEvent('Payment initiated', 'info', {
            gateway,
            orderId,
            amount,
            paymentSource: source,
            stage: 'initiated'
        });
    }

    logPaymentSuccess(gateway, orderId, tokenReceived = true) {
        this.logEvent('Payment created successfully', 'info', {
            gateway,
            orderId,
            tokenReceived,
            stage: 'success'
        });
    }

    logPaymentError(gateway, orderId, errorMessage, errorCode = null) {
        this.logEvent('Payment creation failed', 'error', {
            gateway,
            orderId,
            errorMessage,
            errorCode,
            stage: 'error'
        });
    }

    // Webhook logging
    logWebhookSent(url, success, statusCode = null, responseTime = null) {
        const level = success ? 'info' : 'warn';
        this.logEvent('Webhook notification sent', level, {
            webhookUrl: this.masker.maskUrl(url),
            success,
            statusCode,
            responseTimeMs: responseTime
        });
    }

    // Validation logging
    logValidationError(field, value, reason) {
        this.logEvent('Validation failed', 'warn', {
            field,
            receivedValue: String(value).substring(0, 100),
            reason,
            validationFailed: true
        });
    }

    logValidationSuccess(field, value) {
        this.debug('Validation passed', {
            field,
            value: String(value).substring(0, 100),
            validationPassed: true
        });
    }

    // Authentication/Authorization logging
    logAuthAttempt(gateway, clientId, method = 'token_b2b') {
        this.info(`Authentication attempt: ${gateway}`, {
            gateway,
            clientId,
            authMethod: method
        });
    }

    logAuthSuccess(gateway, method = 'token_b2b', expiresIn = null) {
        this.info(`Authentication successful: ${gateway}`, {
            gateway,
            authMethod: method,
            tokenExpiresIn: expiresIn
        });
    }

    logAuthFailure(gateway, reason, statusCode = null) {
        this.error(`Authentication failed: ${gateway}`, null, {
            gateway,
            reason,
            statusCode
        });
    }

    // Performance tracking
    startTimer(operationName) {
        const timerStartTime = Date.now();
        return {
            end: () => {
                const duration = Date.now() - timerStartTime;
                this.debug(`Operation completed: ${operationName}`, {
                    operation: operationName,
                    durationMs: duration
                });
                return duration;
            }
        };
    }

    // Child logger for scoped contexts (e.g., per gateway)
    child(additionalContext) {
        const child = new StructuredLogger(this.correlationId, this.masker, this.formatter);
        child.context = { ...this.context, ...additionalContext };
        child.startTime = this.startTime;
        return child;
    }
}

/**
 * Factory function for easy logger creation
 * Automatically extracts correlation ID from headers if available
 */
function createLogger(headers = null, serviceName = 'payment-function', version = 'v8.7') {
    const correlationId = headers ?
        CorrelationIdGenerator.extractFromHeaders(headers) :
        CorrelationIdGenerator.generate();

    const formatter = new LogFormatter(serviceName, version);
    const logger = new StructuredLogger(correlationId, null, formatter);

    return logger;
}

// Export classes and factory
module.exports = {
    StructuredLogger,
    SensitiveDataMasker,
    LogFormatter,
    CorrelationIdGenerator,
    createLogger
};
