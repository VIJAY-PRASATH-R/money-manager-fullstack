// Test script to verify backend API
const testAPI = async () => {
    const baseURL = 'http://localhost:5000';

    console.log('🧪 Testing Money Manager API...\n');

    // Test 1: Health check
    try {
        const healthRes = await fetch(`${baseURL}/health`);
        const health = await healthRes.json();
        console.log('✅ Health Check:', health);
    } catch (err) {
        console.error('❌ Health Check Failed:', err.message);
    }

    // Test 2: Add transaction
    try {
        const transaction = {
            type: 'expense',
            amount: 500,
            category: 'Fuel',
            division: 'Personal',
            account: 'Cash',
            description: 'Test petrol',
            date: new Date().toISOString()
        };

        const addRes = await fetch(`${baseURL}/api/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(transaction)
        });

        if (addRes.ok) {
            const result = await addRes.json();
            console.log('✅ Add Transaction:', result);
        } else {
            const error = await addRes.json();
            console.error('❌ Add Transaction Failed:', error);
        }
    } catch (err) {
        console.error('❌ Add Transaction Error:', err.message);
    }

    // Test 3: Get transactions
    try {
        const getRes = await fetch(`${baseURL}/api/transactions`);
        const transactions = await getRes.json();
        console.log('✅ Get Transactions:', transactions.length, 'transactions found');
    } catch (err) {
        console.error('❌ Get Transactions Failed:', err.message);
    }
};

testAPI();
