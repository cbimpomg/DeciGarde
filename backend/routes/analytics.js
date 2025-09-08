const express = require('express');
const Script = require('../models/Script');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { processOCR } = require('../services/ocrService');
const { markScript, getMarkingStats } = require('../services/markingService');

const router = express.Router();

// Test route to check if analytics routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Analytics routes are working!' });
});

// GET /api/analytics/dashboard - Get dashboard analytics (with auth)
router.get('/dashboard', authenticateToken, async (req, res, next) => {
  try {
    const { dateRange = '30', subject = 'all', status = 'all' } = req.query;
    
    // Calculate date filter
    const daysAgo = parseInt(dateRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    
    // Build match conditions
    const matchConditions = {
      uploadedAt: { $gte: startDate }
    };
    
    if (subject !== 'all') {
      matchConditions.subject = subject;
    }
    
    if (status !== 'all') {
      matchConditions.status = status;
    }
    
    // Get analytics data
    const analyticsData = await Script.aggregate([
      { $match: matchConditions },
      {
        $project: {
          totalScripts: 1,
          totalPages: { $size: '$pages' },
          processedPages: {
            $size: {
              $filter: {
                input: '$pages',
                cond: { $ne: ['$$this.ocrText', ''] }
              }
            }
          },
          avgConfidence: {
            $avg: {
              $map: {
                input: {
                  $filter: {
                    input: '$pages',
                    cond: { $ne: ['$$this.ocrText', ''] }
                  }
                },
                as: 'page',
                in: '$$page.confidence'
              }
            }
          },
          totalScore: 1,
          maxPossibleScore: 1,
          status: 1,
          subject: 1,
          uploadedAt: 1
        }
      },
      {
        $group: {
          _id: null,
          totalScripts: { $sum: 1 },
          totalPages: { $sum: '$totalPages' },
          processedPages: { $sum: '$processedPages' },
          avgConfidence: { $avg: '$avgConfidence' },
          avgScore: { $avg: { $divide: ['$totalScore', '$maxPossibleScore'] } },
          totalScore: { $sum: '$totalScore' },
          maxPossibleScore: { $sum: '$maxPossibleScore' }
        }
      }
    ]);
    
    // Get subject statistics
    const subjectStats = await Script.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$subject',
          scripts: { $sum: 1 },
          avgScore: { $avg: { $divide: ['$totalScore', '$maxPossibleScore'] } },
          avgConfidence: {
            $avg: {
              $avg: {
                $map: {
                  input: {
                    $filter: {
                      input: '$pages',
                      cond: { $ne: ['$$this.ocrText', ''] }
                    }
                  },
                  as: 'page',
                  in: '$$page.confidence'
                }
              }
            }
          }
        }
      },
      {
        $project: {
          subject: '$_id',
          scripts: 1,
          avgScore: { $multiply: ['$avgScore', 100] },
          avgConfidence: { $multiply: ['$avgConfidence', 100] }
        }
      },
      { $sort: { scripts: -1 } }
    ]);
    
    // Get recent activity
    const recentActivity = await Script.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: 'users',
          localField: 'uploadedBy',
          foreignField: '_id',
          as: 'uploadedByUser'
        }
      },
      {
        $project: {
          id: '$_id',
          type: 'script_upload',
          timestamp: '$uploadedAt',
          description: `Script uploaded for ${subject !== 'all' ? subject : 'all subjects'}`,
          status: '$status',
          studentId: 1,
          subject: 1,
          examTitle: 1,
          uploadedBy: { $arrayElemAt: ['$uploadedByUser.firstName', 0] }
        }
      },
      { $sort: { timestamp: -1 } },
      { $limit: 10 }
    ]);
    
    // Get performance metrics over time
    const performanceMetrics = await Script.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$uploadedAt'
            }
          },
          scriptsProcessed: { $sum: 1 },
          avgProcessingTime: { $avg: { $subtract: ['$processedAt', '$uploadedAt'] } },
          successRate: {
            $avg: {
              $cond: [
                { $eq: ['$status', 'marked'] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);
    
    const result = {
      totalScripts: analyticsData[0]?.totalScripts || 0,
      processedScripts: analyticsData[0]?.totalScripts || 0,
      totalPages: analyticsData[0]?.totalPages || 0,
      processedPages: analyticsData[0]?.processedPages || 0,
      avgConfidence: (analyticsData[0]?.avgConfidence || 0) * 100,
      avgScore: (analyticsData[0]?.avgScore || 0) * 100,
      subjectStats,
      recentActivity,
      performanceMetrics: performanceMetrics.map(metric => ({
        date: metric._id,
        scriptsProcessed: metric.scriptsProcessed,
        avgProcessingTime: metric.avgProcessingTime || 0,
        successRate: metric.successRate * 100
      }))
    };
    
    res.json(result);
    
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/dashboard-test - Get dashboard analytics (without auth for testing)
router.get('/dashboard-test', async (req, res, next) => {
  try {
    // Return mock data for testing
    const result = {
      totalScripts: 150,
      processedScripts: 142,
      totalPages: 450,
      processedPages: 428,
      avgConfidence: 87.5,
      avgScore: 78.3,
      subjectStats: [
        { subject: 'Mathematics', scripts: 45, avgScore: 82.1, avgConfidence: 89.2 },
        { subject: 'English', scripts: 38, avgScore: 75.6, avgConfidence: 85.4 },
        { subject: 'Science', scripts: 32, avgScore: 79.2, avgConfidence: 88.1 },
        { subject: 'History', scripts: 35, avgScore: 76.8, avgConfidence: 83.7 }
      ],
      recentActivity: [
        {
          id: '1',
          type: 'script_upload',
          timestamp: new Date().toISOString(),
          description: 'Script uploaded for Mathematics',
          status: 'marked',
          studentId: 'STU001',
          subject: 'Mathematics',
          examTitle: 'Midterm Exam',
          uploadedBy: 'John Doe'
        }
      ],
      performanceMetrics: [
        {
          date: new Date().toISOString().split('T')[0],
          scriptsProcessed: 15,
          avgProcessingTime: 120000,
          successRate: 93.3
        }
      ]
    };
    
    res.json(result);
    
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/export - Export analytics data
router.get('/export', authenticateToken, async (req, res, next) => {
  try {
    const { format = 'json', dateRange = '30', subject = 'all' } = req.query;
    
    // Calculate date filter
    const daysAgo = parseInt(dateRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    
    // Build match conditions
    const matchConditions = {
      uploadedAt: { $gte: startDate }
    };
    
    if (subject !== 'all') {
      matchConditions.subject = subject;
    }
    
    // Get detailed analytics data
    const analyticsData = await Script.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: 'users',
          localField: 'uploadedBy',
          foreignField: '_id',
          as: 'uploadedByUser'
        }
      },
      {
        $project: {
          scriptId: '$_id',
          studentId: 1,
          subject: 1,
          examTitle: 1,
          status: 1,
          totalScore: 1,
          maxPossibleScore: 1,
          percentageScore: 1,
          uploadedAt: 1,
          processedAt: 1,
          reviewedAt: 1,
          uploadedBy: { $arrayElemAt: ['$uploadedByUser.firstName', 0] },
          totalPages: { $size: '$pages' },
          processedPages: {
            $size: {
              $filter: {
                input: '$pages',
                cond: { $ne: ['$$this.ocrText', ''] }
              }
            }
          },
          avgConfidence: {
            $avg: {
              $map: {
                input: {
                  $filter: {
                    input: '$pages',
                    cond: { $ne: ['$$this.ocrText', ''] }
                  }
                },
                as: 'page',
                in: '$$page.confidence'
              }
            }
          }
        }
      },
      { $sort: { uploadedAt: -1 } }
    ]);
    
    console.log('Export format requested:', format);
    if (format === 'csv' || format === 'excel') {
      // Convert to CSV format (Excel can read CSV files)
      const csvHeaders = [
        'Script ID',
        'Student ID',
        'Subject',
        'Exam Title',
        'Status',
        'Total Score',
        'Max Possible Score',
        'Percentage Score',
        'Uploaded At',
        'Processed At',
        'Reviewed At',
        'Uploaded By',
        'Total Pages',
        'Processed Pages',
        'Average Confidence'
      ];
      
      const csvData = analyticsData.map(script => [
        script.scriptId,
        script.studentId,
        script.subject,
        script.examTitle,
        script.status,
        script.totalScore,
        script.maxPossibleScore,
        script.percentageScore,
        script.uploadedAt,
        script.processedAt,
        script.reviewedAt,
        script.uploadedBy,
        script.totalPages,
        script.processedPages,
        (script.avgConfidence * 100).toFixed(2)
      ]);
      
      const csvContent = [csvHeaders, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      // Set appropriate headers based on format
      if (format === 'excel') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=analytics-${Date.now()}.xlsx`);
      } else {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=analytics-${Date.now()}.csv`);
      }
      res.send(csvContent);
    } else {
      // Return JSON format
      res.json({
        exportDate: new Date().toISOString(),
        filters: { dateRange, subject },
        data: analyticsData
      });
    }
    
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/ocr-stats - Get OCR statistics
router.get('/ocr-stats', authenticateToken, async (req, res, next) => {
  try {
    const { getOCRStats } = require('../services/ocrService');
    const stats = await getOCRStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/marking-stats - Get marking statistics
router.get('/marking-stats', authenticateToken, async (req, res, next) => {
  try {
    const stats = await getMarkingStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// GET /api/analytics/user-stats - Get user statistics
router.get('/user-stats', authenticateToken, async (req, res, next) => {
  try {
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: {
              $cond: [
                { $gte: ['$lastLogin', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          },
          newUsersThisMonth: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);
    
    res.json(userStats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      newUsersThisMonth: 0
    });
    
  } catch (error) {
    next(error);
  }
});

module.exports = router; 