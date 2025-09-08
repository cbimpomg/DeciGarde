const Joi = require('joi');

// Validation schema for user registration
const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'any.required': 'Password is required'
  }),
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
    'any.required': 'First name is required'
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters',
    'any.required': 'Last name is required'
  }),
  role: Joi.string().valid('teacher', 'admin').default('teacher').messages({
    'any.only': 'Role must be either teacher or admin'
  }),
  subjects: Joi.array().items(Joi.string()).default([]).messages({
    'array.base': 'Subjects must be an array'
  }),
  department: Joi.string().max(100).optional().messages({
    'string.max': 'Department cannot exceed 100 characters'
  })
});

// Validation schema for user login
const userLoginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

// Validation schema for script upload
const scriptUploadSchema = Joi.object({
  studentId: Joi.string().min(1).max(50).required().messages({
    'string.min': 'Student ID must be at least 1 character long',
    'string.max': 'Student ID cannot exceed 50 characters',
    'any.required': 'Student ID is required'
  }),
  subject: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Subject must be at least 2 characters long',
    'string.max': 'Subject cannot exceed 100 characters',
    'any.required': 'Subject is required'
  }),
  examTitle: Joi.string().min(2).max(200).required().messages({
    'string.min': 'Exam title must be at least 2 characters long',
    'string.max': 'Exam title cannot exceed 200 characters',
    'any.required': 'Exam title is required'
  }),
  markingRubric: Joi.object({
    questions: Joi.array().items(
      Joi.object({
        questionNumber: Joi.number().integer().min(1).required(),
        questionText: Joi.string().min(1).required(),
        questionType: Joi.string().valid('definition', 'explanation', 'calculation', 'essay', 'multiple_choice', 'true_false', 'fill_blank', 'matching').required(),
        subject: Joi.string().min(2).max(100).required(),
        maxScore: Joi.number().integer().min(1).required(),
        keywords: Joi.array().items(Joi.string()).default([]),
        rubric: Joi.object({
          keywords: Joi.array().items(Joi.string()).default([]),
          description: Joi.string().optional(),
          scoringCriteria: Joi.array().items(
            Joi.object({
              criterion: Joi.string().required(),
              points: Joi.number().required()
            })
          ).default([])
        }).optional()
      })
    ).min(1).required()
  }).required().messages({
    'object.base': 'Marking rubric must be an object',
    'any.required': 'Marking rubric is required'
  })
});

// Validation schema for marking update
const markingUpdateSchema = Joi.object({
  manualScore: Joi.number().integer().min(0).allow(null).messages({
    'number.base': 'Manual score must be a number',
    'number.integer': 'Manual score must be an integer',
    'number.min': 'Manual score cannot be negative'
  }),
  manualFeedback: Joi.string().max(1000).allow('').optional().messages({
    'string.max': 'Manual feedback cannot exceed 1000 characters'
  }),
  teacherScore: Joi.number().integer().min(0).allow(null).messages({
    'number.base': 'Teacher score must be a number',
    'number.integer': 'Teacher score must be an integer',
    'number.min': 'Teacher score cannot be negative'
  }),
  teacherFeedback: Joi.string().max(1000).allow('').optional().messages({
    'string.max': 'Teacher feedback cannot exceed 1000 characters'
  })
});

// Validation schema for password change
const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'any.required': 'New password is required'
  })
});

// Validation schema for password reset
const passwordResetSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters long',
    'any.required': 'New password is required'
  })
});

// Validation schema for forgot password
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
});

// Validation schema for profile update
const profileUpdateSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters'
  }),
  lastName: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters'
  }),
  subjects: Joi.array().items(Joi.string()).optional().messages({
    'array.base': 'Subjects must be an array'
  }),
  department: Joi.string().max(100).optional().messages({
    'string.max': 'Department cannot exceed 100 characters'
  })
});

// Middleware functions
const validateUserRegistration = (req, res, next) => {
  const { error } = userRegistrationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Validation error', 
      details: error.details.map(detail => detail.message) 
    });
  }
  next();
};

const validateUserLogin = (req, res, next) => {
  const { error } = userLoginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Validation error', 
      details: error.details.map(detail => detail.message) 
    });
  }
  next();
};

const validateScriptUpload = (req, res, next) => {
  // Remove file-related fields from body before validation
  const bodyToValidate = { ...req.body };
  delete bodyToValidate.pages; // Remove pages field if it exists
  
  const { error } = scriptUploadSchema.validate(bodyToValidate);
  if (error) {
    return res.status(400).json({ 
      error: 'Validation error', 
      details: error.details.map(detail => detail.message) 
    });
  }
  
  // Check if files were uploaded
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'At least one script page must be uploaded' });
  }
  
  next();
};

const validateMarkingUpdate = (req, res, next) => {
  const { error } = markingUpdateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Validation error', 
      details: error.details.map(detail => detail.message) 
    });
  }
  next();
};

const validatePasswordChange = (req, res, next) => {
  const { error } = passwordChangeSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Validation error', 
      details: error.details.map(detail => detail.message) 
    });
  }
  next();
};

const validatePasswordReset = (req, res, next) => {
  const { error } = passwordResetSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Validation error', 
      details: error.details.map(detail => detail.message) 
    });
  }
  next();
};

const validateForgotPassword = (req, res, next) => {
  const { error } = forgotPasswordSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Validation error', 
      details: error.details.map(detail => detail.message) 
    });
  }
  next();
};

const validateProfileUpdate = (req, res, next) => {
  const { error } = profileUpdateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      error: 'Validation error', 
      details: error.details.map(detail => detail.message) 
    });
  }
  next();
};

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateScriptUpload,
  validateMarkingUpdate,
  validatePasswordChange,
  validatePasswordReset,
  validateForgotPassword,
  validateProfileUpdate
}; 