const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
dotenv.config();

// Import routes
const scriptRoutes = require('./routes/scripts');
const markingRoutes = require('./routes/marking');
const userRoutes = require('./routes/users');
const analyticsRoutes = require('./routes/analytics');

// Import ML service routes
const mlServiceRoutes = require('./routes/mlService');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:8082', // Expo development server (alternate port)
      'http://localhost:19006',
      'exp://localhost:19000',
      'exp://192.168.1.1:19000',
      'http://localhost:19000',
    ],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:8081', // Expo development server
    'http://localhost:8082', // Expo development server (alternate port)
    'http://localhost:19006', // Expo web
    'exp://localhost:19000', // Expo Go
    'exp://192.168.1.1:19000', // Expo Go on local network
    'http://localhost:19000', // Expo Go web
  ],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploaded images
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'DeciGrade API'
  });
});

// API routes
app.use('/api/scripts', scriptRoutes);
app.use('/api/marking', markingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);

// ML Service routes
app.use('/api/ml', mlServiceRoutes);

// Enhanced WebSocket connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  // Store user information for this socket
  socket.userData = {};
  
  // Join user to their room for personalized updates
  socket.on('join-user', (userId) => {
    socket.userData.userId = userId;
    socket.join(`user-${userId}`);
    console.log(`👤 User ${userId} joined their room`);
    
    // Send welcome message
    socket.emit('welcome', {
      message: 'Connected to DeciGrade real-time updates',
      userId: userId,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle script upload progress
  socket.on('script-upload-progress', (data) => {
    const { scriptId, progress, message } = data;
    socket.emit('script-upload-update', {
      scriptId,
      progress,
      message,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle OCR processing progress
  socket.on('ocr-progress', (data) => {
    const { scriptId, pageNumber, totalPages, progress, message } = data;
    socket.emit('ocr-update', {
      scriptId,
      pageNumber,
      totalPages,
      progress,
      message,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle marking progress
  socket.on('marking-progress', (data) => {
    const { scriptId, questionNumber, totalQuestions, progress, message } = data;
    socket.emit('marking-update', {
      scriptId,
      questionNumber,
      totalQuestions,
      progress,
      message,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle real-time notifications
  socket.on('send-notification', (data) => {
    const { userId, type, title, message, data: notificationData } = data;
    
    // Send to specific user
    io.to(`user-${userId}`).emit('notification', {
      type,
      title,
      message,
      data: notificationData,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle dashboard updates
  socket.on('request-dashboard-update', (userId) => {
    // This would trigger a dashboard refresh for the user
    io.to(`user-${userId}`).emit('dashboard-update-required');
  });
  
  // Handle typing indicators for chat/feedback
  socket.on('typing-start', (data) => {
    const { scriptId, userId } = data;
    socket.to(`script-${scriptId}`).emit('user-typing', {
      userId,
      isTyping: true
    });
  });
  
  socket.on('typing-stop', (data) => {
    const { scriptId, userId } = data;
    socket.to(`script-${scriptId}`).emit('user-typing', {
      userId,
      isTyping: false
    });
  });
  
  // Join script-specific room for collaborative features
  socket.on('join-script', (scriptId) => {
    socket.join(`script-${scriptId}`);
    console.log(`📄 Socket ${socket.id} joined script room: ${scriptId}`);
  });
  
  // Leave script room
  socket.on('leave-script', (scriptId) => {
    socket.leave(`script-${scriptId}`);
    console.log(`📄 Socket ${socket.id} left script room: ${scriptId}`);
  });
  
  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log('🔌 Client disconnected:', socket.id, 'Reason:', reason);
    
    // Clean up user data
    if (socket.userData.userId) {
      console.log(`👤 User ${socket.userData.userId} disconnected`);
    }
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Make io available to routes and services
app.set('io', io);

// Global error handler
app.use(errorHandler);

// Database connection
console.log('🔍 Environment variables check:');
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/decigrade', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  
  // Start server
  server.listen(PORT, () => {
    console.log(`🚀 DeciGrade API server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔌 WebSocket server ready for connections`);
  });
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(() => {
      console.log('✅ Database connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(() => {
      console.log('✅ Database connection closed');
      process.exit(0);
    });
  });
});

module.exports = { app, server, io }; 