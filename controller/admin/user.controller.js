const User = require('../../model/User');

// [GET] /admin/users - Danh sách users
module.exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const search = req.query.search || '';
    const role = req.query.role || '';
    const status = req.query.status || '';
    
    // Build query
    let query = { deleted: false };
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (status) {
      query.status = status;
    }
    
    // Get users with pagination
    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password'); // Exclude password from results
    
    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    // Get statistics
    const stats = await User.aggregate([
      { $match: { deleted: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
          admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
          editors: { $sum: { $cond: [{ $eq: ['$role', 'editor'] }, 1, 0] } },
          users: { $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] } }
        }
      }
    ]);
    
    const statsObj = stats[0] || {
      total: 0,
      active: 0,
      inactive: 0,
      admins: 0,
      editors: 0,
      users: 0
    };
    
    // Check if request wants JSON (API)
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: page,
            totalPages,
            total,
            limit
          },
          filters: { search, role, status },
          stats: statsObj
        }
      });
    }
    
    res.render('admin/layout', {
      pageTitle: 'Quản lý Người dùng',
      page: 'users',
      user: req.user,
      users,
      currentPage: page,
      totalPages,
      total,
      search,
      role,
      status,
      stats: statsObj,
      req: req,
      body: 'admin/pages/users/index'
    });
    
  } catch (error) {
    console.error('Users index error:', error);
    
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
        error: error.message
      });
    }
    
    req.flash('error', 'Có lỗi xảy ra khi tải danh sách người dùng');
    res.render('admin/layout', {
      pageTitle: 'Quản lý Người dùng',
      page: 'users',
      user: req.user,
      users: [],
      currentPage: 1,
      totalPages: 0,
      total: 0,
      search: '',
      role: '',
      status: '',
      stats: { total: 0, active: 0, inactive: 0, admins: 0, editors: 0, users: 0 },
      req: req,
      body: 'admin/pages/users/index'
    });
  }
};

// [GET] /admin/users/:id - Chi tiết user
module.exports.show = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }
      req.flash('error', 'Không tìm thấy người dùng');
      return res.redirect('/admin/users');
    }
    
    // Check if request wants JSON (API)
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({
        success: true,
        data: user
      });
    }
    
    res.render('admin/layout', {
      pageTitle: `Chi tiết người dùng: ${user.fullName}`,
      page: 'users',
      user: req.user,
      userDetail: user,
      req: req,
      body: 'admin/pages/users/show'
    });
    
  } catch (error) {
    console.error('Show user error:', error);
    
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
        error: error.message
      });
    }
    
    req.flash('error', 'Có lỗi xảy ra');
    res.redirect('/admin/users');
  }
};

// [DELETE] /admin/users/:id - Xóa user (soft delete)
module.exports.delete = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng'
        });
      }
      req.flash('error', 'Không tìm thấy người dùng');
      return res.redirect('/admin/users');
    }
    
    // Không cho phép xóa admin chính
    if (user.role === 'admin' && user.email === process.env.ADMIN_EMAIL) {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(400).json({
          success: false,
          message: 'Không thể xóa tài khoản admin chính'
        });
      }
      req.flash('error', 'Không thể xóa tài khoản admin chính');
      return res.redirect('/admin/users');
    }
    
    // Soft delete
    await User.updateOne(
      { _id: req.params.id },
      {
        deleted: true,
        deletedAt: new Date(),
        status: 'inactive'
      }
    );
    
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({
        success: true,
        message: 'Xóa người dùng thành công'
      });
    }
    
    req.flash('success', 'Xóa người dùng thành công');
    res.redirect('/admin/users');
    
  } catch (error) {
    console.error('Delete user error:', error);
    
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi server',
        error: error.message
      });
    }
    
    req.flash('error', 'Có lỗi xảy ra khi xóa người dùng');
    res.redirect('/admin/users');
  }
};

// [PATCH] /admin/users/:id/toggle-status - Toggle trạng thái user
module.exports.toggleStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }
    
    // Không cho phép thay đổi trạng thái admin chính
    if (user.role === 'admin' && user.email === process.env.ADMIN_EMAIL) {
      return res.status(400).json({
        success: false,
        message: 'Không thể thay đổi trạng thái admin chính'
      });
    }
    
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    
    await User.updateOne(
      { _id: req.params.id },
      { status: newStatus }
    );
    
    return res.json({
      success: true,
      message: `Đã ${newStatus === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} người dùng`,
      newStatus
    });
    
  } catch (error) {
    console.error('Toggle user status error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message
    });
  }
};
