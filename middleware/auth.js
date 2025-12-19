const User = require("../model/User");

// Optional auth middleware - sets user in res.locals if logged in, but doesn't require login
module.exports.optionalAuth = async (req, res, next) => {
  try {
    if (req.cookies && req.cookies.tokenUser) {
      const user = await User.findOne({
        tokenUser: req.cookies.tokenUser,
        deleted: false,
      });
      
      if (user) {
        res.locals.user = user;
      }
    }
  } catch (error) {
    console.error('Optional auth error:', error);
  }
  next();
};

// Client authentication middleware - checks for tokenUser cookie
module.exports.requireAuth = async (req, res, next) => {
  // If this is an admin route, use admin auth instead
  if (req.originalUrl && req.originalUrl.startsWith('/admin')) {
    return module.exports.requireAdmin(req, res, next);
  }

  // Check if this is an API request
  const isApiRequest = req.originalUrl && req.originalUrl.startsWith('/api/');

  if (!req.cookies || !req.cookies.tokenUser) {
    if (isApiRequest) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để tiếp tục'
      });
    }
    res.redirect(`/auth/login`);
    return;
  }
  
  try {
    const user = await User.findOne({
      tokenUser: req.cookies.tokenUser,
      deleted: false,
    });

    if (!user) {
      if (isApiRequest) {
        return res.status(401).json({
          success: false,
          message: 'Phiên đăng nhập không hợp lệ'
        });
      }
      res.redirect(`/auth/login`);
      return;
    }
    
    res.locals.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    if (isApiRequest) {
      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra, vui lòng thử lại'
      });
    }
    res.redirect(`/auth/login`);
  }
};

// Admin authentication middleware - checks for cookie and role
module.exports.requireAdmin = async (req, res, next) => {
  // Check if this is an API request
  const isApiRequest = req.headers.accept && req.headers.accept.includes('application/json');
  
  // Chỉ kiểm tra cookie
  if (!req.cookies || !req.cookies.tokenUser) {
    if (isApiRequest) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để tiếp tục'
      });
    }
    req.flash('error', 'Vui lòng đăng nhập để tiếp tục');
    return res.redirect('/auth/login');
  }

  try {
    const user = await User.findOne({
      tokenUser: req.cookies.tokenUser,
      deleted: false,
    });

    if (!user) {
      if (isApiRequest) {
        return res.status(401).json({
          success: false,
          message: 'Phiên đăng nhập không hợp lệ'
        });
      }
      req.flash('error', 'Phiên đăng nhập không hợp lệ');
      return res.redirect('/auth/login');
    }

    // Kiểm tra role admin hoặc editor
    if (user.role !== 'admin' && user.role !== 'editor') {
      if (isApiRequest) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền truy cập trang quản trị'
        });
      }
      req.flash('error', 'Bạn không có quyền truy cập trang quản trị');
      return res.redirect('/auth/login');
    }

    // Store user in request for controllers to use
    req.user = user;
    res.locals.user = user;
    
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    if (isApiRequest) {
      return res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra, vui lòng thử lại'
      });
    }
    req.flash('error', 'Có lỗi xảy ra, vui lòng đăng nhập lại');
    return res.redirect('/auth/login');
  }
};

// Editor middleware - checks for cookie and role
module.exports.requireEditor = async (req, res, next) => {
  // Chỉ kiểm tra cookie
  if (!req.cookies || !req.cookies.tokenUser) {
    req.flash('error', 'Vui lòng đăng nhập để tiếp tục');
    return res.redirect('/auth/login');
  }

  try {
    const user = await User.findOne({
      tokenUser: req.cookies.tokenUser,
      deleted: false,
    });

    if (!user) {
      req.flash('error', 'Phiên đăng nhập không hợp lệ');
      return res.redirect('/auth/login');
    }

    // Kiểm tra role editor hoặc admin
    if (user.role !== 'editor' && user.role !== 'admin') {
      req.flash('error', 'Bạn không có quyền truy cập');
      return res.redirect('/auth/login');
    }

    req.user = user;
    res.locals.user = user;
    
    next();
  } catch (error) {
    console.error('Editor auth error:', error);
    req.flash('error', 'Có lỗi xảy ra, vui lòng đăng nhập lại');
    return res.redirect('/auth/login');
  }
};