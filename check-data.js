const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

async function checkData() {
    try {
        await mongoose.connect(MONGO_URI);

        const Transaction = require('./models/Transaction');

        const transactions = await Transaction.find().sort({ date: -1 }).limit(10);

        console.log(`\n📊 Found ${transactions.length} transactions in MongoDB Atlas:\n`);

        if (transactions.length === 0) {
            console.log('   ⚠️  No transactions found in the database.');
            console.log('   💡 This means your data was being stored in the in-memory database.');
            console.log('   ✅ After restarting the server, new data will be saved to MongoDB Atlas.');
        } else {
            console.log('Recent transactions:');
            transactions.forEach((t, i) => {
                console.log(`\n${i + 1}. ${t.type.toUpperCase()} - $${t.amount}`);
                console.log(`   Category: ${t.category}`);
                console.log(`   Division: ${t.division}`);
                console.log(`   Date: ${t.date.toISOString().split('T')[0]}`);
                console.log(`   Description: ${t.description}`);
            });
        }

        console.log('\n');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

checkData();
