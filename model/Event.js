const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 20,
    maxlength: 500
  },
  image: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'URL hình ảnh không hợp lệ'
    }
  },
  details: {
    time: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 100
    },
    language: {
      type: String,
      trim: true,
      maxlength: 50
    },
    price: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    }
  },
  action: {
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    href: {
      type: String,
      required: true,
      trim: true
    }
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Âm nhạc & Biểu diễn',
      'Điện ảnh & Phim ảnh',
      'Nghệ thuật & Triển lãm',
      'Karaoke & Ca hát',
      'Thể thao & Vận động',
      'Ẩm thực & Du lịch',
      'Văn hóa & Lịch sử',
      'Giải trí & Vui chơi'
    ]
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Add indexes for better performance
eventSchema.index({ category: 1, isActive: 1 });
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ featured: 1, isActive: 1 });

// Ensure virtual fields are serialized
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
