const Order = require('./models/orderModel');
const db = require('./config/db');

async function testCreateOrder() {
    try {
        console.log("Testing createOrder with variant 906...");
        const items = [{ variant_id: 906, quantity: 1 }];
        const orderData = {
            user_id: 901, // User 1 exists? 
            address_id: 901, 
            voucher_id: null,
            order_type: 'NORMAL'
        };
        const orderId = await Order.createOrder(orderData, items);
        console.log("Order created successfully:", orderId);
        process.exit(0);
    } catch (e) {
        console.error("Error creating order:", e.message);
        process.exit(1);
    }
}

testCreateOrder();
