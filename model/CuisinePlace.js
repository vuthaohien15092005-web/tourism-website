const mongoose = require('mongoose');

const CuisinePlaceSchema = new mongoose.Schema({
  // Basic info
  name: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  mapLink: { type: String, trim: true },
  
  // Location
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: null } // [lng, lat] - optional
  },
  
  // Business info
  openingHours: { type: String, trim: true },
  priceRange: { type: String, trim: true },
  phone: { type: String, trim: true },
  website: { type: String, trim: true },
  
  // Media
  images: [{ type: String, trim: true }],
  
  // Cuisine reference
  cuisine: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Cuisine', 
    required: true,
    index: true 
  },
  
  // Reviews
  reviews: [{
    author: { type: String, trim: true },
    avatar: { type: String, trim: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    text: { type: String, trim: true },
    verified: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
    source: { type: String, default: 'google', trim: true }
  }],
  
  // Meta
  avgRating: { type: Number, min: 0, max: 5, default: 0 },
  reviewCount: { type: Number, default: 0 },
  status: { type: String, enum: ['published', 'draft', 'hidden'], default: 'published', index: true },
  isActive: { type: Boolean, default: true, index: true },
  featured: { type: Boolean, default: false, index: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
// Only create 2dsphere index if location coordinates exist
CuisinePlaceSchema.index({ location: '2dsphere' }, { sparse: true });
CuisinePlaceSchema.index({ name: 'text', address: 'text' });
CuisinePlaceSchema.index({ cuisine: 1, status: 1 });
CuisinePlaceSchema.index({ featured: 1, isActive: 1 });

// Auto-update average rating when reviews change
CuisinePlaceSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.avgRating = Math.round((totalRating / this.reviews.length) * 10) / 10;
    this.reviewCount = this.reviews.length;
  } else {
    this.avgRating = 0;
    this.reviewCount = 0;
  }
  next();
});

// Virtuals
CuisinePlaceSchema.virtual('url').get(function() {
  return `/cuisine-place/${this._id}`;
});

CuisinePlaceSchema.virtual('mainImage').get(function() {
  return this.images?.[0] || null;
});

// === STATIC METHODS FOR NEARBY PLACES ===
// More accurate distance calculation using improved Haversine formula
CuisinePlaceSchema.statics.calculateDistance = function(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  
  // Convert to radians with higher precision
  const lat1Rad = lat1 * Math.PI / 180;
  const lng1Rad = lng1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const lng2Rad = lng2 * Math.PI / 180;
  
  // Calculate differences
  const dLat = lat2Rad - lat1Rad;
  const dLng = lng2Rad - lng1Rad;
  
  // Haversine formula with better precision
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
};;

// Tìm khách sạn gần đây
CuisinePlaceSchema.statics.findNearbyAccommodations = function(cuisinePlaceId, radius = 5, limit = 10) {
  return this.findById(cuisinePlaceId).then(place => {
    if (!place || !place.location.coordinates || place.location.coordinates.length < 2) {
      return [];
    }
    
    const [lng, lat] = place.location.coordinates;
    const Accommodation = require('./Accommodation');
    return Accommodation.find({ 
      isActive: true,
      status: 'public',
      'map.coordinates': { $exists: true, $ne: [0, 0] }
    }).then(accommodations => {
      return accommodations.filter(accommodation => {
        if (!accommodation.map.coordinates || accommodation.map.coordinates.length < 2) return false;
        const [accLng, accLat] = accommodation.map.coordinates;
        const distance = this.calculateDistance(lat, lng, accLat, accLng);
        accommodation.distance = distance;
        return distance <= radius;
      })
      .sort((a, b) => {
        return a.distance - b.distance;
      })
      .slice(0, limit);
    });
  });
};

// Tìm điểm tham quan gần đây
CuisinePlaceSchema.statics.findNearbyAttractions = function(cuisinePlaceId, radius = 5, limit = 10) {
  return this.findById(cuisinePlaceId).then(place => {
    if (!place || !place.location.coordinates || place.location.coordinates.length < 2) {
      return [];
    }
    
    const [lng, lat] = place.location.coordinates;
    const Attraction = require('./Attraction');
    return Attraction.find({ 
      isActive: true,
      'map.lat': { $exists: true },
      'map.lng': { $exists: true }
    }).then(attractions => {
      return attractions.filter(attraction => {
        if (!attraction.map.lat || !attraction.map.lng) return false;
        const distance = this.calculateDistance(lat, lng, attraction.map.lat, attraction.map.lng);
        attraction.distance = distance;
        return distance <= radius;
      })
      .sort((a, b) => {
        return a.distance - b.distance;
      })
      .slice(0, limit);
    });
  });
};

// Tìm địa điểm giải trí gần đây
CuisinePlaceSchema.statics.findNearbyEntertainments = function(cuisinePlaceId, radius = 5, limit = 10) {
  return this.findById(cuisinePlaceId).then(place => {
    if (!place || !place.location.coordinates || place.location.coordinates.length < 2) {
      return [];
    }
    
    const [lng, lat] = place.location.coordinates;
    const Entertainment = require('./Entertainment');
    return Entertainment.find({ 
      isActive: true,
      'map.lat': { $exists: true },
      'map.lng': { $exists: true }
    }).then(entertainments => {
      return entertainments.filter(entertainment => {
        if (!entertainment.map.lat || !entertainment.map.lng) return false;
        const distance = this.calculateDistance(lat, lng, entertainment.map.lat, entertainment.map.lng);
        entertainment.distance = distance;
        return distance <= radius;
      })
      .sort((a, b) => {
        return a.distance - b.distance;
      })
      .slice(0, limit);
    });
  });
};

// Tìm quán ăn gần đây (loại trừ chính nó)
CuisinePlaceSchema.statics.findNearbyCuisinePlaces = function(cuisinePlaceId, radius = 5, limit = 10) {
  return this.findById(cuisinePlaceId).then(place => {
    if (!place || !place.location.coordinates || place.location.coordinates.length < 2) {
      return [];
    }
    
    const [lng, lat] = place.location.coordinates;
    const CuisinePlace = require('./CuisinePlace');
    return CuisinePlace.find({ 
      isActive: true,
      status: 'published',
      _id: { $ne: cuisinePlaceId }, // Loại trừ chính nó
      location: { $exists: true },
      'location.coordinates': { $exists: true, $ne: null }
    }).then(places => {
      return places.filter(p => {
        if (!p.location.coordinates || p.location.coordinates.length < 2) return false;
        const [placeLng, placeLat] = p.location.coordinates;
        const distance = this.calculateDistance(lat, lng, placeLat, placeLng);
        p.distance = distance;
        return distance <= radius;
      })
      .sort((a, b) => {
        return a.distance - b.distance;
      })
      .slice(0, limit);
    });
  });
};

module.exports = mongoose.model('CuisinePlace', CuisinePlaceSchema);
