// netlify/functions/midtrans-token.js
exports.handler = async function(event, context) {
    // CORS headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
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
        // Parse request body
        const { amount, item_name } = JSON.parse(event.body);

        if (!amount || amount < 1000) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid amount' })
            };
        }

        // Create order ID
        const order_id = 'WIX-' + Date.now() + '-' + Math.floor(Math.random() * 9000 + 1000);

        // Midtrans parameters
        const params = {
            transaction_details: {
                order_id: order_id,
                gross_amount: amount
            },
            item_details: [{
                id: 'ITEM-' + Date.now(),
                price: amount,
                quantity: 1,
                name: item_name || 'Wix Product'
            }],
            customer_details: {
                first_name: 'Customer',
                email: 'customer@example.com',
                phone: '+6281234567890'
            }
        };

        // Midtrans API URL (Production)
        const api_url = 'https://app.midtrans.com/snap/v1/transactions';
        
        // Get server key from environment variable
        const server_key = process.env.MIDTRANS_SERVER_KEY || 'Mid-server-kO-tU3T7Q9MYO_25tJTggZeu';

        // Make API call to Midtrans
        const response = await fetch(api_url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + btoa(server_key + ':')
            },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            throw new Error(`Midtrans API error: ${response.status}`);
        }

        const response_data = await response.json();

        if (!response_data || !response_data.token) {
            throw new Error('Invalid response from Midtrans');
        }

        // Return success response
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                data: {
                    token: response_data.token,
                    order_id: order_id
                }
            })
        };

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Server error: ' + error.message 
            })
        };
    }
};
