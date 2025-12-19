const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    name: {
      type: String,
      required: true
    },
    email: String,
    avatar: String
  },
  targetType: {
    type: String,
    required: true,
    enum: ['attraction', 'accommodation', 'food', 'entertainment', 'tour', 'cuisine-place']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: String,
  content: {
    type: String,
    required: true
  },
  images: [String],
  helpful: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
reviewSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('Review', reviewSchema);
