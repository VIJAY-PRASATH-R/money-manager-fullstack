const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

console.log('🔍 Testing MongoDB Atlas Connection...\n');
console.log('📋 Connection Details:');
console.log(`   URI: ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`); // Hide password
console.log(`   Database: ${MONGO_URI.split('/').pop().split('?')[0]}`);
console.log(`   Type: ${MONGO_URI.includes('mongodb+srv') ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB'}`);
console.log('');

async function testConnection() {
    try {
        console.log('⏳ Connecting to MongoDB...');

        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
        });

        console.log('✅ Successfully connected to MongoDB Atlas!');
        console.log(`📊 Database Name: ${mongoose.connection.name}`);
        console.log(`🌐 Host: ${mongoose.connection.host}`);
        console.log('');

        // Test creating a document
        const Transaction = require('./models/Transaction');

        console.log('🧪 Testing document creation...');
        const testTransaction = new Transaction({
            type: 'income',
            amount: 100,
            category: 'Test',
            division: 'Personal',
            account: 'Test Account',
            description: 'Test transaction to verify MongoDB Atlas connection',
            date: new Date()
        });

        await testTransaction.save();
        console.log('✅ Test transaction created successfully!');
        console.log(`   ID: ${testTransaction._id}`);
        console.log('');

        // Count documents
        const count = await Transaction.countDocuments();
        console.log(`📊 Total transactions in database: ${count}`);
        console.log('');

        // Delete test transaction
        await Transaction.findByIdAndDelete(testTransaction._id);
        console.log('🧹 Test transaction cleaned up');
        console.log('');

        console.log('🎉 All tests passed! Your MongoDB Atlas connection is working perfectly!');

    } catch (error) {
        console.error('❌ Connection failed!');
        console.error('');
        console.error('Error details:', error.message);
        console.error('');

        if (error.message.includes('authentication failed')) {
            console.error('🔐 Authentication Error:');
            console.error('   - Check your username and password in the connection string');
            console.error('   - Verify the database user exists in MongoDB Atlas');
            console.error('');
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.error('🌐 Network Error:');
            console.error('   - Check your internet connection');
            console.error('   - Verify the cluster URL is correct');
            console.error('');
        } else if (error.message.includes('IP') || error.message.includes('whitelist')) {
            console.error('🔒 IP Whitelist Error:');
            console.error('   - Add your IP address to MongoDB Atlas Network Access');
            console.error('   - Or use 0.0.0.0/0 for development (allows all IPs)');
            console.error('');
        }

        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('👋 Connection closed');
    }
}

testConnection();
