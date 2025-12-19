const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  // === THÔNG TIN CƠ BẢN ===
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    maxlength: 100
  },
  country: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  
  // === TRẠNG THÁI ===
  status: {
    type: String,
    enum: ['new', 'read', 'replied'],
    default: 'new',
    index: true
  },
  
  // === TIMESTAMPS ===
  readAt: {
    type: Date
  },
  repliedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// === VIRTUAL FIELDS ===
// Trạng thái hiển thị
contactSchema.virtual('statusText').get(function() {
  switch(this.status) {
    case 'new': return 'Mới';
    case 'read': return 'Đã đọc';
    case 'replied': return 'Đã trả lời';
    default: return 'Không xác định';
  }
});

// Thời gian từ lúc tạo
contactSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  if (hours < 24) return `${hours} giờ trước`;
  return `${days} ngày trước`;
});

// === STATIC METHODS ===
// Lấy danh sách liên hệ với phân trang
contactSchema.statics.getPaginated = function(page = 1, limit = 10, filters = {}) {
  const skip = (page - 1) * limit;
  let query = {};
  
  // Lọc theo trạng thái
  if (filters.status) {
    query.status = filters.status;
  }
  
  // Lọc theo từ khóa tìm kiếm
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } },
      { message: { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Đếm tổng số liên hệ
contactSchema.statics.getCount = function(filters = {}) {
  let query = {};
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { email: { $regex: filters.search, $options: 'i' } },
      { message: { $regex: filters.search, $options: 'i' } }
    ];
  }
  
  return this.countDocuments(query);
};

// Lấy thống kê
contactSchema.statics.getStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
};

// === INSTANCE METHODS ===
// Đánh dấu đã đọc
contactSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  return this.save();
};

// Đánh dấu đã trả lời
contactSchema.methods.markAsReplied = function() {
  this.status = 'replied';
  this.repliedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Contact', contactSchema);
