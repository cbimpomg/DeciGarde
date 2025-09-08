const express = require('express');
const Script = require('../models/Script');
const { authenticateToken } = require('../middleware/auth');
const { validateMarkingUpdate } = require('../middleware/validation');
const { markScript } = require('../services/markingService');

const router = express.Router();

// GET /api/marking/:scriptId - Get marking details for a script
router.get('/:scriptId', authenticateToken, async (req, res, next) => {
  try {
    const script = await Script.findById(req.params.scriptId)
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
    
    // Format marking data for frontend
    const markingData = {
      scriptId: script._id,
      studentId: script.studentId,
      subject: script.subject,
      examTitle: script.examTitle,
      status: script.status,
      totalScore: script.totalScore,
      maxPossibleScore: script.maxPossibleScore,
      percentageScore: script.percentageScore,
      questions: script.questions.map(q => ({
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        maxScore: q.maxScore,
        aiScore: q.aiScore,
        manualScore: q.manualScore,
        finalScore: q.finalScore,
        aiFeedback: q.aiFeedback,
        manualFeedback: q.manualFeedback,
        keywords: q.keywords,
        isManuallyReviewed: q.isManuallyReviewed
      })),
      pages: script.pages.map(p => ({
        pageNumber: p.pageNumber,
        imageUrl: p.imageUrl,
        ocrText: p.ocrText,
        processedAt: p.processedAt
      })),
      uploadedAt: script.uploadedAt,
      processedAt: script.processedAt,
      reviewedAt: script.reviewedAt,
      submittedAt: script.submittedAt,
      uploadedBy: script.uploadedBy,
      reviewedBy: script.reviewedBy
    };
    
    res.json(markingData);
    
  } catch (error) {
    next(error);
  }
});

// PUT /api/marking/:scriptId/process - Trigger AI marking for a script
router.put('/:scriptId/process', authenticateToken, async (req, res, next) => {
  try {
    const script = await Script.findById(req.params.scriptId);
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    // Check permissions
    if (req.user.role === 'teacher' && 
        script.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if script is ready for marking
    if (script.status !== 'uploaded' && script.status !== 'processing') {
      return res.status(400).json({ 
        error: 'Script must be in uploaded or processing status to start marking' 
      });
    }
    
    // Start marking process
    await markScript(script._id);
    
    res.json({ 
      message: 'AI marking process started',
      scriptId: script._id,
      status: 'processing'
    });
    
  } catch (error) {
    next(error);
  }
});

// PUT /api/marking/:scriptId/questions/:questionNumber - Update question score and feedback
router.put('/:scriptId/questions/:questionNumber', 
  authenticateToken, 
  validateMarkingUpdate,
  async (req, res, next) => {
    try {
      const { scriptId, questionNumber } = req.params;
      const { manualScore, manualFeedback } = req.body;
      
      const script = await Script.findById(scriptId);
      
      if (!script) {
        return res.status(404).json({ error: 'Script not found' });
      }
      
      // Check permissions
      if (req.user.role === 'teacher' && 
          script.uploadedBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Find and update the question
      const question = script.questions.find(q => q.questionNumber === parseInt(questionNumber));
      
      if (!question) {
        return res.status(404).json({ error: 'Question not found' });
      }
      
      // Validate score
      if (manualScore !== null && (manualScore < 0 || manualScore > question.maxScore)) {
        return res.status(400).json({ 
          error: `Score must be between 0 and ${question.maxScore}` 
        });
      }
      
      // Update question with both naming conventions for consistency
      question.teacherScore = manualScore;
      question.teacherFeedback = manualFeedback;
      question.manualScore = manualScore;
      question.manualFeedback = manualFeedback;
      question.isManuallyReviewed = true;
      
      // Update final score
      question.finalScore = manualScore !== null ? manualScore : question.aiScore;
      
      // Update script status and scores
      script.updateFinalScores();
      script.status = 'reviewed';
      script.reviewedBy = req.user._id;
      
      await script.save();
      
      res.json({
        message: 'Question updated successfully',
        question: {
          questionNumber: question.questionNumber,
          manualScore: question.manualScore,
          finalScore: question.finalScore,
          manualFeedback: question.manualFeedback,
          isManuallyReviewed: question.isManuallyReviewed
        },
        totalScore: script.totalScore,
        percentageScore: script.percentageScore
      });
      
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/marking/:scriptId/submit - Submit final marking results
router.put('/:scriptId/submit', authenticateToken, async (req, res, next) => {
  try {
    const script = await Script.findById(req.params.scriptId);
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    // Check permissions
    if (req.user.role === 'teacher' && 
        script.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if script is ready for submission
    if (script.status !== 'reviewed' && script.status !== 'marked') {
      return res.status(400).json({ 
        error: 'Script must be reviewed or marked before submission' 
      });
    }
    
    // Update script status
    script.status = 'submitted';
    script.submittedAt = new Date();
    
    await script.save();
    
    res.json({
      message: 'Script submitted successfully',
      scriptId: script._id,
      totalScore: script.totalScore,
      percentageScore: script.percentageScore,
      submittedAt: script.submittedAt
    });
    
  } catch (error) {
    next(error);
  }
});

// PUT /api/marking/:scriptId/review - Mark script as reviewed
router.put('/:scriptId/review', authenticateToken, async (req, res, next) => {
  try {
    const script = await Script.findById(req.params.scriptId);
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }
    
    // Check permissions
    if (req.user.role === 'teacher' && 
        script.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Update script status
    script.status = 'reviewed';
    script.reviewedBy = req.user._id;
    script.reviewedAt = new Date();
    
    await script.save();
    
    res.json({
      message: 'Script marked as reviewed',
      scriptId: script._id,
      reviewedAt: script.reviewedAt
    });
    
  } catch (error) {
    next(error);
  }
});

// GET /api/marking/stats - Get marking statistics
router.get('/stats/overview', authenticateToken, async (req, res, next) => {
  try {
    const { subject, dateRange } = req.query;
    
    const matchStage = {};
    
    if (subject) matchStage.subject = subject;
    if (dateRange) {
      const [startDate, endDate] = dateRange.split(',');
      matchStage.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Filter by user permissions
    if (req.user.role === 'teacher') {
      matchStage.$or = [
        { uploadedBy: req.user._id },
        { reviewedBy: req.user._id }
      ];
    }
    
    const stats = await Script.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalScripts: { $sum: 1 },
          averageScore: { $avg: '$totalScore' },
          averagePercentage: { $avg: { $multiply: [{ $divide: ['$totalScore', '$maxPossibleScore'] }, 100] } },
          totalQuestions: { $sum: { $size: '$questions' } },
          manuallyReviewedQuestions: {
            $sum: {
              $size: {
                $filter: {
                  input: '$questions',
                  cond: { $eq: ['$$this.isManuallyReviewed', true] }
                }
              }
            }
          },
          submittedScripts: { $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] } }
        }
      }
    ]);
    
    res.json(stats[0] || {
      totalScripts: 0,
      averageScore: 0,
      averagePercentage: 0,
      totalQuestions: 0,
      manuallyReviewedQuestions: 0,
      submittedScripts: 0
    });
    
  } catch (error) {
    next(error);
  }
});

// GET /api/marking/rubrics - Get available marking rubrics
router.get('/rubrics/available', authenticateToken, async (req, res, next) => {
  try {
    // This would typically come from a separate Rubric model
    // For now, return sample rubrics
    const rubrics = [
      {
        id: 'math-basic',
        name: 'Basic Mathematics',
        subject: 'Mathematics',
        description: 'Standard mathematics marking rubric',
        questions: [
          {
            questionNumber: 1,
            questionText: 'Solve the equation: 2x + 5 = 13',
            maxScore: 5,
            keywords: ['x = 4', 'x=4', '4', 'solution']
          },
          {
            questionNumber: 2,
            questionText: 'Calculate the area of a circle with radius 7cm',
            maxScore: 10,
            keywords: ['154', '153.94', 'πr²', 'area', 'circle']
          }
        ]
      },
      {
        id: 'english-essay',
        name: 'English Essay',
        subject: 'English',
        description: 'Essay writing assessment rubric',
        questions: [
          {
            questionNumber: 1,
            questionText: 'Write an essay on the given topic',
            maxScore: 25,
            keywords: ['introduction', 'conclusion', 'paragraphs', 'grammar', 'spelling']
          }
        ]
      }
    ];
    
    res.json(rubrics);
    
  } catch (error) {
    next(error);
  }
});

module.exports = router; 