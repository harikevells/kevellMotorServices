// middleware/roleCheck.js
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin only.' 
    });
  }
  next();
};

const isAdminOrVendor = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'vendor') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin or Vendor only.' 
    });
  }
  next();
};

const isUser = (req, res, next) => {
  if (req.user.role !== 'user') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. User only.' 
    });
  }
  next();
};

const hasRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }
    next();
  };
};

module.exports = { isAdmin, isUser, hasRole, isAdminOrVendor };