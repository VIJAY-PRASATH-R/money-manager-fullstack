const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow ALL domains (easiest fix for Hackathon deployment)
  credentials: true
}));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

const PORT = process.env.PORT || 5000;
let MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/money-manager';

// Check if we should use in-memory MongoDB
const useInMemory = !MONGO_URI.includes('mongodb+srv') && !process.env.USE_REAL_MONGO;

const connectDB = async () => {
  try {
    if (useInMemory) {
      // Use in-memory MongoDB for testing
      const { MongoMemoryServer } = require('mongodb-memory-server');
      console.log('🔧 Starting in-memory MongoDB for testing...');
      const mongod = await MongoMemoryServer.create();
      MONGO_URI = mongod.getUri();
      console.log('✅ In-memory MongoDB started');
    }

    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);

    if (useInMemory) {
      console.log('⚠️  Using IN-MEMORY database (data will be lost on restart)');
      console.log('💡 To use MongoDB Atlas, update MONGO_URI in .env file');
    } else {
      console.log(`🌐 Connection: ${MONGO_URI.includes('mongodb+srv') ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB'}`);
    }
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('');
    console.error('📋 SETUP INSTRUCTIONS:');
    console.error('');
    console.error('You need to set up MongoDB Atlas (Cloud Database):');
    console.error('1. Go to: https://www.mongodb.com/cloud/atlas/register');
    console.error('2. Create a FREE account (no credit card needed)');
    console.error('3. Create a FREE M0 cluster');
    console.error('4. Create database user with username & password');
    console.error('5. Add your IP to Network Access (or use 0.0.0.0/0 for development)');
    console.error('6. Get connection string from "Connect" button');
    console.error('7. Update backend/.env file with: MONGO_URI=your_connection_string');
    console.error('8. Restart this server');
    console.error('');
    console.error('📖 Detailed guide: See MONGODB_SETUP.md file');
    console.error('');
    process.exit(1);
  }
};

connectDB();

// MongoDB connection event listeners
mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

// Routes
const transactionRoutes = require('./routes/transactions');
app.use('/api/transactions', transactionRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Money Manager API is running',
    version: '1.0.0',
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    databaseType: useInMemory ? 'In-Memory (Testing)' : (MONGO_URI.includes('mongodb+srv') ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB')
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    databaseType: useInMemory ? 'In-Memory' : (MONGO_URI.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local'),
    uptime: process.uptime()
  });
});

const path = require('path');

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Any other route -> serve index.html (SPA support)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next(); // Pass API 404s to the error handler
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler for API routes
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ================================');
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌐 API available at http://localhost:${PORT}`);
  console.log('🚀 ================================');
  console.log('');
});
