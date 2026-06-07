const fetch = require('node-fetch'); // wait, native fetch is available in modern Node

async function testPayment() {
    try {
        const response = await fetch('http://localhost:5000/api/payments/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: 917, payment_method: 'VNPAY' })
        });
        const data = await response.json();
        console.log("Payment response:", data);
    } catch(e) {
        console.error("Error:", e);
    }
}
testPayment();
