const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  
  role: {
    type: String,
    enum: ['teacher', 'admin'],
    default: 'teacher'
  },
  
  // Teacher-specific fields
  subjects: [{
    type: String,
    trim: true
  }],
  
  department: {
    type: String,
    trim: true
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Last login tracking
  lastLogin: {
    type: Date,
    default: null
  },
  
  // Password reset
  passwordResetToken: {
    type: String,
    default: null
  },
  
  passwordResetExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for display name
userSchema.virtual('displayName').get(function() {
  return this.fullName;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user can access a subject
userSchema.methods.canAccessSubject = function(subject) {
  if (this.role === 'admin') return true;
  return this.subjects.includes(subject);
};

// Method to get user stats
userSchema.methods.getStats = async function() {
  const Script = mongoose.model('Script');
  
  const stats = await Script.aggregate([
    {
      $match: {
        $or: [
          { uploadedBy: this._id },
          { reviewedBy: this._id }
        ]
      }
    },
    {
      $group: {
        _id: null,
        totalScripts: { $sum: 1 },
        uploadedScripts: {
          $sum: { $cond: [{ $eq: ['$uploadedBy', this._id] }, 1, 0] }
        },
        reviewedScripts: {
          $sum: { $cond: [{ $eq: ['$reviewedBy', this._id] }, 1, 0] }
        },
        averageScore: { $avg: '$totalScore' }
      }
    }
  ]);
  
  return stats[0] || {
    totalScripts: 0,
    uploadedScripts: 0,
    reviewedScripts: 0,
    averageScore: 0
  };
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Method to clear password reset token
userSchema.methods.clearPasswordResetToken = function() {
  this.passwordResetToken = undefined;
  this.passwordResetExpires = undefined;
};

// JSON transformation to exclude sensitive data
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpires;
  return userObject;
};

module.exports = mongoose.model('User', userSchema); 