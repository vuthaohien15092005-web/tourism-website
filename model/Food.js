const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
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
    enum: ['mon-an-dac-san', 'quan-an', 'cafe', 'tra-sua', 'banh-keo', 'do-uong']
  },
  origin: {
    type: String,
    required: true
  },
  originEn: String,
  description: {
    type: String,
    required: true
  },
  descriptionEn: String,
  ingredients: [String],
  ingredientsEn: [String],
  restaurants: [{
    name: String,
    nameEn: String,
    address: String,
    district: String,
    phone: String,
    openingHours: String,
    priceRange: {
      from: Number,
      to: Number
    },
    rating: {
      average: Number,
      count: Number
    },
    images: [String],
    coordinates: {
      lat: Number,
      lng: Number
    }
  }],
  images: [{
    url: String,
    alt: String,
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  priceRange: {
    from: Number,
    to: Number,
    currency: {
      type: String,
      default: 'VND'
    }
  },
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
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Food', foodSchema);
