const express = require('express');
const router = express.Router();
const axios = require('axios');

// ML Service configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Health check for ML service
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/health`);
    res.json({
      status: 'connected',
      ml_service: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get ML service capabilities
router.get('/capabilities', async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/api/ml/capabilities`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get ML service capabilities',
      details: error.message
    });
  }
});

// Process OCR through ML service
router.post('/ocr', async (req, res) => {
  try {
    // Forward the request to ML service
    const response = await axios.post(`${ML_SERVICE_URL}/api/ml/ocr`, req.body, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: 'OCR processing failed',
      details: error.message
    });
  }
});

// Process marking through ML service
router.post('/mark', async (req, res) => {
  try {
    // Forward the request to ML service
    const response = await axios.post(`${ML_SERVICE_URL}/api/ml/mark`, req.body);
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: 'Marking failed',
      details: error.message
    });
  }
});

// Process batch OCR through ML service
router.post('/batch-ocr', async (req, res) => {
  try {
    // Forward the request to ML service
    const response = await axios.post(`${ML_SERVICE_URL}/api/ml/batch-ocr`, req.body, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: 'Batch OCR processing failed',
      details: error.message
    });
  }
});

// Process batch marking through ML service
router.post('/batch-mark', async (req, res) => {
  try {
    // Forward the request to ML service
    const response = await axios.post(`${ML_SERVICE_URL}/api/ml/batch-mark`, req.body);
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: 'Batch marking failed',
      details: error.message
    });
  }
});

module.exports = router;
