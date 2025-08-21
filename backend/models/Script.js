const mongoose = require('mongoose');

const scriptSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  // Script metadata
  subject: {
    type: String,
    required: true,
    trim: true
  },
  
  examTitle: {
    type: String,
    required: true,
    trim: true
  },
  
  examDate: {
    type: Date,
    default: Date.now
  },
  
  // File storage
  pages: [{
    pageNumber: {
      type: Number,
      required: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    ocrText: {
      type: String,
      default: ''
    },
    processedAt: {
      type: Date,
      default: null
    }
  }],
  
  // Marking information
  markingRubric: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  questions: [{
    questionNumber: {
      type: Number,
      required: true
    },
    questionText: {
      type: String,
      required: true
    },
    maxScore: {
      type: Number,
      required: true
    },
    aiScore: {
      type: Number,
      default: 0
    },
    manualScore: {
      type: Number,
      default: null
    },
    finalScore: {
      type: Number,
      default: 0
    },
    aiFeedback: {
      type: String,
      default: ''
    },
    manualFeedback: {
      type: String,
      default: ''
    },
    keywords: [{
      type: String,
      trim: true
    }],
    isManuallyReviewed: {
      type: Boolean,
      default: false
    }
  }],
  
  // Processing status
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'marked', 'reviewed', 'submitted'],
    default: 'uploaded'
  },
  
  // Total scores
  totalScore: {
    type: Number,
    default: 0
  },
  
  maxPossibleScore: {
    type: Number,
    required: true
  },
  
  // Timestamps
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  
  processedAt: {
    type: Date,
    default: null
  },
  
  reviewedAt: {
    type: Date,
    default: null
  },
  
  submittedAt: {
    type: Date,
    default: null
  },
  
  // Teacher information
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
scriptSchema.index({ studentId: 1, subject: 1 });
scriptSchema.index({ status: 1 });
scriptSchema.index({ uploadedAt: -1 });

// Virtual for percentage score
scriptSchema.virtual('percentageScore').get(function() {
  if (this.maxPossibleScore === 0) return 0;
  return Math.round((this.totalScore / this.maxPossibleScore) * 100);
});

// Method to calculate total score
scriptSchema.methods.calculateTotalScore = function() {
  this.totalScore = this.questions.reduce((total, question) => {
    return total + (question.finalScore || 0);
  }, 0);
  return this.totalScore;
};

// Method to update final scores
scriptSchema.methods.updateFinalScores = function() {
  this.questions.forEach(question => {
    question.finalScore = question.manualScore !== null ? question.manualScore : question.aiScore;
  });
  this.calculateTotalScore();
  return this;
};

// Pre-save middleware to update timestamps
scriptSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'processing') {
      this.processedAt = new Date();
    } else if (this.status === 'reviewed') {
      this.reviewedAt = new Date();
    } else if (this.status === 'submitted') {
      this.submittedAt = new Date();
    }
  }
  next();
});

module.exports = mongoose.model('Script', scriptSchema); 