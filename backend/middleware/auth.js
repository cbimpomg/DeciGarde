const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token - user not found' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }
    
    // Add full user document to request (with methods)
    req.user = user;
    
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    } else {
      return res.status(500).json({ error: 'Authentication error' });
    }
  }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Middleware to check if user is teacher
const requireTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Teacher access required' });
  }
  next();
};

// Middleware to check if user can access a specific subject
const canAccessSubject = (subjectField = 'subject') => {
  return (req, res, next) => {
    const subject = req.body[subjectField] || req.params[subjectField] || req.query[subjectField];
    
    if (!subject) {
      return res.status(400).json({ error: 'Subject is required' });
    }
    
    // Admin can access all subjects
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Check if teacher has access to this subject
    const user = req.user;
    if (user.subjects && user.subjects.includes(subject)) {
      return next();
    }
    
    return res.status(403).json({ 
      error: `You do not have permission to access ${subject}` 
    });
  };
};

// Middleware to check if user owns the resource or is admin
const ownsResource = (resourceModel, resourceIdField = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdField];
      
      if (!resourceId) {
        return res.status(400).json({ error: 'Resource ID is required' });
      }
      
      const resource = await resourceModel.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      
      // Admin can access all resources
      if (req.user.role === 'admin') {
        return next();
      }
      
      // Check if user owns the resource
      const ownerField = resource.uploadedBy ? 'uploadedBy' : 'createdBy';
      if (resource[ownerField] && resource[ownerField].toString() === req.user.userId) {
        return next();
      }
      
      return res.status(403).json({ error: 'Access denied - you do not own this resource' });
      
    } catch (error) {
      return res.status(500).json({ error: 'Authorization error' });
    }
  };
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireTeacher,
  canAccessSubject,
  ownsResource
}; 