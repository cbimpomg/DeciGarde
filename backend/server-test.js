const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:8081',
      'http://localhost:8082',
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
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://localhost:19006',
    'exp://localhost:19000',
    'exp://192.168.1.1:19000',
    'http://localhost:19000',
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
    service: 'DeciGrade Test API (No MongoDB)'
  });
});

// Test file upload endpoint
app.post('/api/test-upload', (req, res) => {
  try {
    // Simulate file processing
    const mockResponse = {
      success: true,
      message: 'File uploaded successfully (test mode)',
      timestamp: new Date().toISOString(),
      fileInfo: {
        originalName: 'test-file.jpg',
        size: 1024,
        mimetype: 'image/jpeg',
        uploadedAt: new Date().toISOString()
      }
    };
    
    res.json(mockResponse);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Upload failed in test mode' 
    });
  }
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', (reason) => {
    console.log('🔌 Client disconnected:', socket.id, 'Reason:', reason);
  });
});

// Make io available to routes
app.set('io', io);

// Start server without MongoDB
server.listen(PORT, () => {
  console.log(`🚀 DeciGrade Test API server running on port ${PORT} (No MongoDB)`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket server ready for connections`);
  console.log(`📤 Test upload endpoint: http://localhost:${PORT}/api/test-upload`);
});

module.exports = { app, server, io };
