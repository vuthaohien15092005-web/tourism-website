const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  titleEn: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: ['su-kien', 'tin-tuc', 'huong-dan', 'kinh-nghiem', 'khuyen-mai']
  },
  summary: {
    type: String,
    required: true
  },
  summaryEn: String,
  content: {
    type: String,
    required: true
  },
  contentEn: String,
  author: {
    type: String,
    required: true
  },
  images: [{
    url: String,
    alt: String,
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  tags: [String],
  featured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  views: {
    type: Number,
    default: 0
  },
  relatedAttractions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attraction'
  }],
  relatedFoods: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food'
  }],
  relatedTours: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('News', newsSchema);
