const mongoose = require('mongoose');

const rubricTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  questionType: {
    type: String,
    required: true,
    enum: ['definition', 'explanation', 'calculation', 'essay', 'multiple_choice', 'true_false', 'fill_blank', 'matching'],
    index: true
  },
  
  subject: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  
  description: {
    type: String,
    required: true,
    trim: true
  },
  
  scoringMethod: {
    type: String,
    required: true,
    enum: ['keyword_matching', 'semantic_analysis', 'numerical_verification', 'content_analysis', 'exact_match'],
    default: 'keyword_matching'
  },
  
  defaultMaxScore: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  
  templateStructure: {
    keywords: [{
      word: {
        type: String,
        required: true,
        trim: true
      },
      weight: {
        type: Number,
        required: true,
        min: 0.1,
        max: 10,
        default: 1
      },
      synonyms: [String],
      required: {
        type: Boolean,
        default: false
      }
    }],
    
    scoringCriteria: [{
      criterion: {
        type: String,
        required: true,
        trim: true
      },
      points: {
        type: Number,
        required: true,
        min: 0
      },
      description: String
    }],
    
    bonusCriteria: [{
      criterion: String,
      bonusPoints: Number,
      description: String
    }]
  },
  
  instructions: {
    type: String,
    trim: true
  },
  
  examples: [{
    question: String,
    sampleAnswer: String,
    expectedScore: Number,
    explanation: String
  }],
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  usageCount: {
    type: Number,
    default: 0
  },
  
  averageEffectiveness: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
rubricTemplateSchema.index({ questionType: 1, subject: 1, isActive: 1 });
rubricTemplateSchema.index({ subject: 1, isActive: 1 });

// Virtual for template summary
rubricTemplateSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    name: this.name,
    questionType: this.questionType,
    subject: this.subject,
    maxScore: this.defaultMaxScore,
    keywordCount: this.templateStructure.keywords.length,
    usageCount: this.usageCount,
    effectiveness: this.averageEffectiveness
  };
});

// Method to increment usage count
rubricTemplateSchema.methods.incrementUsage = function() {
  this.usageCount += 1;
  return this.save();
};

// Method to update effectiveness rating
rubricTemplateSchema.methods.updateEffectiveness = function(newRating) {
  if (this.averageEffectiveness === 0) {
    this.averageEffectiveness = newRating;
  } else {
    this.averageEffectiveness = (this.averageEffectiveness + newRating) / 2;
  }
  return this.save();
};

// Static method to get templates by type and subject
rubricTemplateSchema.statics.getTemplates = function(questionType, subject) {
  return this.find({
    questionType: questionType,
    subject: subject,
    isActive: true
  }).sort({ usageCount: -1, averageEffectiveness: -1 });
};

// Static method to get popular templates
rubricTemplateSchema.statics.getPopularTemplates = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ usageCount: -1, averageEffectiveness: -1 })
    .limit(limit);
};

module.exports = mongoose.model('RubricTemplate', rubricTemplateSchema);
