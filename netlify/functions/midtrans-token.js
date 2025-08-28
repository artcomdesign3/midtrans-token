// netlify/functions/midtrans-token.js
exports.handler = async function(event, context) {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: headers,
            body: ''
        };
    }

    // Only allow POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { amount, item_name } = JSON.parse(event.body);
        
        // 🔧 AMOUNT DÜZELTMESİ - Amount olduğu gibi kullan (bölme yok)
        const finalAmount = parseInt(amount);
        
        console.log('💰 Amount from WordPress:', amount);
        console.log('💰 Final amount for Midtrans:', finalAmount);
        
        // Validate amount
        if (!finalAmount || finalAmount <= 0) {
            return {
                statusCode: 400,
                headers: headers,
                body: JSON.stringify({ 
                    success: false, 
                    error: 'Invalid amount' 
                })
            };
        }

        // Create unique order ID
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substr(2, 9);
        const orderId = `ORDER_${timestamp}_${randomId}`;

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
            }
        };

        // Midtrans API call
        const api_url = 'https://app.midtrans.com/snap/v1/transactions';
        const server_key = process.env.MIDTRANS_SERVER_KEY || 'Mid-server-QuDoWJB3LcWtNz17zGLeBw_F';
        
        console.log('🚀 Calling Midtrans API with params:', midtransParams);

        const response = await fetch(api_url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(server_key + ':')
            },
            body: JSON.stringify(midtransParams)
        });

        const responseData = await response.json();
        
        console.log('📡 Midtrans API response:', responseData);

        if (response.ok && responseData.token) {
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify({
                    success: true,
                    data: {
                        token: responseData.token,
                        order_id: orderId,
                        amount: finalAmount
                    }
                })
            };
        } else {
            console.error('❌ Midtrans API error:', responseData);
            return {
                statusCode: 400,
                headers: headers,
                body: JSON.stringify({
                    success: false,
                    error: 'Failed to generate payment token',
                    details: responseData
                })
            };
        }

    } catch (error) {
        console.error('💥 Function error:', error);
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({
                success: false,
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};
