// netlify/functions/midtrans-token.js
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { amount, item_name } = JSON.parse(event.body);
        
        // 🔧 AMOUNT DÜZELTMESİ - Amount olduğu gibi kullan (çarpma yok)
        const finalAmount = parseInt(amount);
        
        console.log('💰 Amount from WordPress:', amount);
        console.log('💰 Final amount for Midtrans:', finalAmount);
        
        // Validation
        if (!amount || finalAmount <= 0) {
            throw new Error('Invalid amount');
        }

        // Generate unique order ID
        const orderId = 'ORDER_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        // Midtrans parameters
        const midtransParams = {
            transaction_details: {
                order_id: orderId,
                gross_amount: finalAmount // Amount olduğu gibi
            },
            item_details: [
                {
                    id: 'ITEM_001',
                    price: finalAmount, // Amount olduğu gibi
                    quantity: 1,
                    name: item_name || 'Product'
                }
            ],
            customer_details: {
                first_name: 'Customer',
                email: 'customer@example.com',
                phone: '08123456789'
            },
            enabled_payments: [
                'credit_card',
                'bca_va',
                'bni_va',
                'bri_va',
                'mandiri_clickpay',
                'gopay',
                'indomaret',
                'danamon_online'
            ],
            credit_card: {
                secure: true,
                bank: 'all',
                installment: {
                    required: false,
                    terms: {
                        bca: [3, 6, 12],
                        bni: [3, 6, 12],
                        mandiri: [3, 6, 12]
                    }
                }
            }
        };

        console.log('�� Midtrans params:', midtransParams);

        // Call Midtrans API
        const response = await fetch('https://api.sandbox.midtrans.com/v2/charge', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from('Mid-server-yIrRbdPgiI6HE1NI:').toString('base64')
            },
            body: JSON.stringify(midtransParams)
        });

        const data = await response.json();

        if (data.status_code === '201') {
            console.log('✅ Midtrans response:', data);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: {
                        token: data.redirect_url,
                        order_id: orderId
                    }
                })
            };
        } else {
            console.error('❌ Midtrans error:', data);
            throw new Error(data.status_message || 'Payment failed');
        }

    } catch (error) {
        console.error('❌ Function error:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};
