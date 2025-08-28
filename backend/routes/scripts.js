const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

const Script = require('../models/Script');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { validateScriptUpload } = require('../middleware/validation');
const { processOCR } = require('../services/ocrService');
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/scripts';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png) and PDFs are allowed'));
    }
  }
});

// Middleware to parse JSON fields in multipart form data
const parseJsonFields = (req, res, next) => {
  console.log('=== BACKEND UPLOAD DEBUG ===');
  console.log('Raw req.body:', req.body);
  console.log('Raw req.files:', req.files?.length || 'No files');
  
  if (req.body.markingRubric) {
    console.log('Raw markingRubric string:', req.body.markingRubric);
    try {
      req.body.markingRubric = JSON.parse(req.body.markingRubric);
      console.log('Parsed markingRubric:', req.body.markingRubric);
    } catch (error) {
      console.error('JSON parse error:', error.message);
      return res.status(400).json({ 
        error: 'Validation error', 
        details: ['Invalid markingRubric JSON format'] 
      });
    }
  }
  console.log('Final req.body before validation:', req.body);
  next();
};

// ML Service OCR processing function
const processMLServiceOCR = async (scriptId) => {
  try {
    console.log(`🚀 Starting ML Service OCR for script: ${scriptId}`);
    
    // Get the script with pages
    const script = await Script.findById(scriptId).populate('pages');
    if (!script) {
      throw new Error('Script not found');
    }
    
    const results = [];
    
    // Process each page through ML service
    for (let i = 0; i < script.pages.length; i++) {
      const page = script.pages[i];
      console.log(`📄 Processing page ${i + 1} for script ${scriptId}`);
      
      try {
        // Read the image file - extract filename from imageUrl
        const filename = page.imageUrl.split('/').pop(); // Get filename from /uploads/scripts/filename
        const imagePath = path.join(__dirname, '..', 'uploads', 'scripts', filename);
        const imageBuffer = fs.readFileSync(imagePath);
        
        // Create form data for ML service
        const form = new FormData();
        form.append('image', imageBuffer, {
          filename: filename,
          contentType: 'image/jpeg'
        });
        form.append('language', 'eng');
        form.append('enhance_handwriting', 'true');
        
        // Send to ML service with extended timeout for OCR processing
        console.log(`📤 Sending page ${i + 1} to ML service...`);
        const startTime = Date.now();
        
        const mlResponse = await axios.post('http://localhost:8000/api/ml/ocr', form, {
          headers: {
            ...form.getHeaders(),
          },
          timeout: 120000 // 2 minute timeout for OCR processing
        });
        
        const processingTime = Date.now() - startTime;
        console.log(`📥 ML service response received in ${processingTime}ms`);
        console.log(`📊 Response status: ${mlResponse.status}, data:`, mlResponse.data);
        
        if (mlResponse.data.success) {
          results.push({
            pageNumber: i + 1,
            text: mlResponse.data.text,
            confidence: mlResponse.data.confidence,
            provider: mlResponse.data.provider
          });
          console.log(`✅ Page ${i + 1} OCR completed with ${mlResponse.data.confidence}% confidence`);
        } else {
          throw new Error(`ML service OCR failed: ${mlResponse.data.error}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing page ${i + 1}:`, error.message);
        results.push({
          pageNumber: i + 1,
          text: '',
          confidence: 0,
          provider: 'failed',
          error: error.message
        });
      }
    }
    
    // Update script with OCR results - save to pages[].ocrText
    const updateOperations = results.map(result => ({
      updateOne: {
        filter: { _id: scriptId, 'pages.pageNumber': result.pageNumber },
        update: {
          $set: {
            'pages.$.ocrText': result.text,
            'pages.$.processedAt': new Date(),
            'pages.$.ocrConfidence': result.confidence,
            'pages.$.ocrProvider': result.provider
          }
        }
      }
    }));

    // Update each page with its OCR text
    if (updateOperations.length > 0) {
      await Script.bulkWrite(updateOperations);
    }

    // Update script status
    await Script.findByIdAndUpdate(scriptId, {
      $set: {
        status: 'processed',
        processedAt: new Date()
      }
    });
    
    console.log(`🎉 ML Service OCR completed for script ${scriptId}`);
    
  } catch (error) {
    console.error(`❌ ML Service OCR failed for script ${scriptId}:`, error);
    // Update script status to indicate failure
    await Script.findByIdAndUpdate(scriptId, {
      $set: {
        status: 'ocr_failed',
        error: error.message
      }
    });
  }
};

// POST /api/scripts/upload - Upload new script
router.post('/upload', 
  authenticateToken, 
  upload.array('pages', 10), 
  parseJsonFields,
  validateScriptUpload,
  async (req, res, next) => {
    try {
      const { studentId, subject, examTitle, markingRubric } = req.body;
      
      // Check if user can access this subject
      if (!req.user.canAccessSubject(subject)) {
        return res.status(403).json({
          error: 'You do not have permission to upload scripts for this subject'
        });
      }
      
      // Process uploaded files
      const pages = req.files.map((file, index) => ({
        pageNumber: index + 1,
        imageUrl: `/uploads/scripts/${file.filename}`,
        originalName: file.originalname
      }));
      
      // Calculate max possible score from rubric
      const maxPossibleScore = markingRubric.questions.reduce((total, q) => total + q.maxScore, 0);
      
      // Create script document
      const script = new Script({
        studentId,
        subject,
        examTitle,
        pages,
        markingRubric,
        maxPossibleScore,
        uploadedBy: req.user._id
      });
      
      await script.save();
      
      // Emit real-time update to all connected clients
      const io = req.app.get('io');
      if (io) {
        io.emit('script-uploaded', {
          scriptId: script._id,
          studentId: script.studentId,
          subject: script.subject,
          examTitle: script.examTitle,
          status: script.status,
          uploadedBy: req.user._id,
          uploadedAt: script.uploadedAt
        });
        
        // Emit to specific user room
        io.to(`user-${req.user._id}`).emit('script-uploaded-user', {
          scriptId: script._id,
          studentId: script.studentId,
          subject: script.subject,
          examTitle: script.examTitle,
          status: script.status,
          message: 'Your script has been uploaded successfully'
        });
      }
      
      // Start ML Service OCR processing in background (completely non-blocking)
      console.log('🚀 Starting background OCR processing...');
      // Use process.nextTick to ensure it runs after response is sent
      process.nextTick(() => {
        processMLServiceOCR(script._id).catch(error => {
          console.error('ML Service OCR processing error:', error);
        });
      });
      
      res.status(201).json({
        message: 'Script uploaded successfully',
        scriptId: script._id,
        status: script.status
      });
      
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/scripts - Get all scripts for user
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, subject, studentId } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    
    if (status) query.status = status;
    if (subject) query.subject = subject;
    if (studentId) query.studentId = { $regex: studentId, $options: 'i' };
    
    // Filter by user permissions
    if (req.user.role === 'teacher') {
      query.$or = [
        { uploadedBy: req.user._id },
        { reviewedBy: req.user._id }
      ];
    }
    
    const scripts = await Script.find(query)
      .populate('uploadedBy', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Script.countDocuments(query);
    
    res.json({
      scripts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    next(error);
  }
});

// GET /api/scripts/stats - Get basic script statistics  
router.get('/stats', authenticateToken, async (req, res, next) => {
  try {
    console.log('📊 STATS ENDPOINT: Request received');
    const userId = req.user._id;
    console.log('📊 STATS ENDPOINT: User ID:', userId);
    
    // Get basic counts for the user
    const totalScripts = await Script.countDocuments({
      $or: [
        { uploadedBy: userId },
        { reviewedBy: userId }
      ]
    });
    
    const uploadedScripts = await Script.countDocuments({ uploadedBy: userId });
    const reviewedScripts = await Script.countDocuments({ reviewedBy: userId });
    
    // Get average score
    const scoreStats = await Script.aggregate([
      {
        $match: {
          $or: [
            { uploadedBy: userId },
            { reviewedBy: userId }
          ]
        }
      },
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$totalScore' },
          totalPossibleScore: { $avg: '$maxPossibleScore' }
        }
      }
    ]);
    
    const averageScore = scoreStats[0]?.averageScore || 0;
    const averagePercentage = scoreStats[0]?.totalPossibleScore ? 
      (averageScore / scoreStats[0].totalPossibleScore) * 100 : 0;
    
    // Get status-based counts for pending and completed
    const pendingScripts = await Script.countDocuments({
      $or: [
        { uploadedBy: userId },
        { reviewedBy: userId }
      ],
      status: { $in: ['uploaded', 'processing', 'marked'] } // Scripts that need review
    });
    
    const completedScripts = await Script.countDocuments({
      $or: [
        { uploadedBy: userId },
        { reviewedBy: userId }
      ],
      status: { $in: ['reviewed', 'submitted'] } // Scripts that are complete
    });

    const responseData = {
      totalScripts,
      pendingScripts,
      completedScripts,
      averageScore: Math.round(averagePercentage * 10) / 10, // Return as percentage
    };
    
    console.log('📊 STATS ENDPOINT: Sending response:', responseData);
    res.json(responseData);
    
  } catch (error) {
    next(error);
  }
});

// GET /api/scripts/stats/overview - Get detailed script statistics
router.get('/stats/overview', authenticateToken, async (req, res, next) => {
  try {
    const { subject, dateRange } = req.query;
    
    const matchStage = {};
    
    // Filter by user permissions
    if (req.user.role === 'teacher') {
      matchStage.$or = [
        { uploadedBy: req.user._id },
        { reviewedBy: req.user._id }
      ];
    }
    
    // Filter by subject if provided
    if (subject) {
      matchStage.subject = subject;
    }
    
    // Filter by date range if provided
    if (dateRange) {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(0); // All time
      }
      
      matchStage.createdAt = { $gte: startDate };
    }
    
    const stats = await Script.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalScripts: { $sum: 1 },
          averageScore: { $avg: '$totalScore' },
          maxScore: { $max: '$totalScore' },
          minScore: { $min: '$totalScore' },
          totalPossibleScore: { $avg: '$maxPossibleScore' }
        }
      }
    ]);
    
    // Get status breakdown
    const statusStats = await Script.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get subject breakdown
    const subjectStats = await Script.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 },
          averageScore: { $avg: '$totalScore' }
        }
      }
    ]);
    
    const result = {
      overview: stats[0] || {
        totalScripts: 0,
        averageScore: 0,
        maxScore: 0,
        minScore: 0,
        totalPossibleScore: 0
      },
      statusBreakdown: statusStats,
      subjectBreakdown: subjectStats
    };
    
    res.json(result);
    
  } catch (error) {
    next(error);
  }
});

// GET /api/scripts/:id - Get specific script
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const script = await Script.findById(req.params.id)
      .populate('uploadedBy', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName email');
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    // Check permissions
    if (req.user.role === 'teacher' && 
        script.uploadedBy._id.toString() !== req.user._id.toString() &&
        script.reviewedBy?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(script);
    
  } catch (error) {
    next(error);
  }
});

// PUT /api/scripts/:id/process - Manually trigger OCR processing
router.put('/:id/process', authenticateToken, async (req, res, next) => {
  try {
    const script = await Script.findById(req.params.id);
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    // Check permissions
    if (req.user.role === 'teacher' && 
        script.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Start ML Service OCR processing
    await processMLServiceOCR(script._id);
    
    res.json({ 
      message: 'OCR processing started',
      scriptId: script._id 
    });
    
  } catch (error) {
    next(error);
  }
});

// PUT /api/scripts/:id/mark - Manually trigger marking
router.put('/:id/mark', authenticateToken, async (req, res, next) => {
  try {
    const script = await Script.findById(req.params.id);
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    // Check permissions
    if (req.user.role === 'teacher' && 
        script.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Start marking process
    await markScript(script._id);
    
    res.json({ 
      message: 'Marking process started',
      scriptId: script._id 
    });
    
  } catch (error) {
    next(error);
  }
});

// DELETE /api/scripts/:id - Delete script
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const script = await Script.findById(req.params.id);
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    // Check permissions
    if (req.user.role === 'teacher' && 
        script.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Delete associated files
    script.pages.forEach(page => {
      const filePath = path.join(__dirname, '..', page.imageUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    
    await Script.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Script deleted successfully' });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router; 