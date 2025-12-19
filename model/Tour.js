const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  nameEn: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['1-ngay', '2-ngay', '3-ngay', 'van-hoa', 'lich-su', 'am-thuc', 'giai-tri']
  },
  duration: {
    type: String,
    required: true
  },
  durationEn: String,
  description: {
    type: String,
    required: true
  },
  descriptionEn: String,
  highlights: [String],
  highlightsEn: [String],
  itinerary: [{
    day: Number,
    time: String,
    activity: String,
    activityEn: String,
    location: String,
    duration: String,
    note: String
  }],
  attractions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attraction'
  }],
  foods: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food'
  }],
  entertainments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Entertainment'
  }],
  priceRange: {
    from: Number,
    to: Number,
    currency: {
      type: String,
      default: 'VND'
    },
    includes: [String],
    excludes: [String]
  },
  groupSize: {
    min: Number,
    max: Number
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  images: [{
    url: String,
    alt: String,
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: [String],
  bookingInfo: {
    contact: String,
    website: String,
    note: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tour', tourSchema);
