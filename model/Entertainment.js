const mongoose = require('mongoose');

const entertainmentSchema = new mongoose.Schema({
  zone: {
    type: String,
    required: true,
    trim: true,
    enum: [
      'Khu văn hoá – nghệ thuật',
      'Địa điểm ngoài trời – công viên',
      'Trung tâm thương mại – Khu vui chơi trong nhà',
      'Khu vui chơi giải trí quy mô lớn'
    ]
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 200
  },
  openHours: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  ticket: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  history: {
    type: String,
    default: null,
    maxlength: 1000
  },
  architecture: {
    type: String,
    default: null,
    maxlength: 1000
  },
  experience: [{
    type: String,
    trim: true,
    maxlength: 200
  }],
  notes: [{
    type: String,
    trim: true,
    maxlength: 200
  }],
  // Hoạt động của du khách
  activities: [{
    type: String,
    trim: true,
    maxlength: 200
  }],
  // Đối tượng khách hàng
  targetAudience: [{
    type: String,
    trim: true,
    maxlength: 200
  }],
  // Reviews: minimal fields
  reviews: [{
    author: { type: String, trim: true },
    avatar: { type: String, trim: true },
    rating: { type: Number, min: 1, max: 5 },
    text: { type: String, trim: true },
    verified: { type: Boolean, default: false },
    date: { type: Date },
    source: { type: String, default: 'google', trim: true }
  }],
  // Align with attractions: images stored as string URLs, normalized in controllers
  images: [{
    type: String,
    trim: true
  }],
  // Map Information - GeoJSON Point format for optimal geo queries
  map: {
    type: { 
      type: String, 
      enum: ['Point'], 
      default: 'Point' 
    },
    coordinates: { 
      type: [Number], 
      default: [0, 0],
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;     // latitude
        },
        message: 'Coordinates must be [longitude, latitude] with valid ranges'
      }
    },
    // Legacy fields for backward compatibility
    lat: {
      type: Number,
      min: -90,
      max: 90
    },
    lng: {
      type: Number,
      min: -180,
      max: 180
    },
    embedUrl: {
      type: String,
      required: true
    }
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
entertainmentSchema.index({ zone: 1, type: 1 });
entertainmentSchema.index({ isActive: 1, featured: 1 });
// Critical: 2dsphere index for geo queries - MUST be created for performance
entertainmentSchema.index({ map: '2dsphere' }, { sparse: true });
entertainmentSchema.index({ name: 'text', address: 'text' });
// slug index đã được định nghĩa trong field definition

// Ensure virtual fields are serialized
entertainmentSchema.set('toJSON', { virtuals: true });
entertainmentSchema.set('toObject', { virtuals: true });

// Pre-save middleware to generate slug (giống hệt Attraction.js)
entertainmentSchema.pre('save', function(next) {
  // Chỉ tạo slug nếu có name và chưa có slug
  if (this.name && (!this.slug || this.isModified('name'))) {
    let baseSlug = this.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Loại bỏ dấu
      .replace(/[^a-z0-9\s-]/g, '') // Chỉ giữ chữ, số, khoảng trắng, dấu gạch
      .replace(/\s+/g, '-') // Thay khoảng trắng bằng dấu gạch
      .replace(/-+/g, '-') // Loại bỏ dấu gạch trùng lặp
      .trim('-'); // Loại bỏ dấu gạch đầu/cuối
    
    this.slug = baseSlug;
    
    // Nếu slug trống, tạo slug từ timestamp
    if (!this.slug) {
      this.slug = 'entertainment-' + Date.now();
    }
  }
  // Nếu không có name, không tạo slug (để tránh null)
  next();
});

// Virtual: URL đầy đủ (giống Attraction.js)
entertainmentSchema.virtual('url').get(function() {
  return `/entertainment/${this.slug}`;
});

// Virtual: Hình ảnh chính (giống Attraction.js)
entertainmentSchema.virtual('mainImage').get(function() {
  return this.images?.[0] || null;
});

// === STATIC METHODS FOR NEARBY PLACES ===
// Hàm tính khoảng cách giữa 2 điểm địa lý (Haversine formula)
// More accurate distance calculation using improved Haversine formula
entertainmentSchema.statics.calculateDistance = function(lat1, lng1, lat2, lng2) {
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
};

// Tìm quán ăn gần đây - OPTIMIZED with MongoDB $near
entertainmentSchema.statics.findNearbyCuisinePlaces = async function(entertainmentId, radius = 5, limit = 10) {
  const startTime = Date.now();
  
  try {
    const entertainment = await this.findById(entertainmentId).lean();
    if (!entertainment) {
      console.log(`[GEO] Entertainment ${entertainmentId} not found`);
      return [];
    }
    
    // Get coordinates from new or legacy format
    let lng, lat;
    if (entertainment.map.coordinates && entertainment.map.coordinates.length >= 2) {
      [lng, lat] = entertainment.map.coordinates;
    } else if (entertainment.map.lat && entertainment.map.lng) {
      lng = entertainment.map.lng;
      lat = entertainment.map.lat;
    } else {
      console.log(`[GEO] No valid coordinates for entertainment ${entertainmentId}`);
      return [];
    }
    
    const CuisinePlace = require('./CuisinePlace');
    
    // Use MongoDB $near for optimal performance with 2dsphere index
    const places = await CuisinePlace.find({
      isActive: true,
      status: 'published',
      location: {
        $near: {
          $geometry: { 
            type: 'Point', 
            coordinates: [lng, lat] 
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      }
    })
    .limit(limit)
    .lean();
    
    // Add distance calculation for display
    places.forEach(place => {
      if (place.location.coordinates && place.location.coordinates.length >= 2) {
        const [placeLng, placeLat] = place.location.coordinates;
        place.distance = this.calculateDistance(lat, lng, placeLat, placeLng);
      }
    });
    
    const queryTime = Date.now() - startTime;
    console.log(`[GEO] Found ${places.length} nearby cuisine places in ${queryTime}ms`);
    
    return places;
  } catch (error) {
    console.error(`[GEO] Error finding nearby cuisine places:`, error);
    return [];
  }
};

// Tìm khách sạn gần đây
entertainmentSchema.statics.findNearbyAccommodations = function(entertainmentId, radius = 5, limit = 10) {
  return this.findById(entertainmentId).then(entertainment => {
    if (!entertainment || !entertainment.map.coordinates || entertainment.map.coordinates.length < 2) {
      return [];
    }
    
    const Accommodation = require('./Accommodation');
    return Accommodation.find({ 
      isActive: true,
      status: 'public',
      'map.coordinates': { $exists: true, $ne: [0, 0] }
    }).then(accommodations => {
      return accommodations.filter(accommodation => {
        if (!accommodation.map.coordinates || accommodation.map.coordinates.length < 2) return false;
        const [lng, lat] = accommodation.map.coordinates;
        const [entLng, entLat] = entertainment.map.coordinates;
        const distance = this.calculateDistance(
          entLat, 
          entLng, 
          lat, 
          lng
        );
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
entertainmentSchema.statics.findNearbyAttractions = function(entertainmentId, radius = 5, limit = 10) {
  return this.findById(entertainmentId).then(entertainment => {
  if (!entertainment || !entertainment.map.coordinates || entertainment.map.coordinates.length < 2) {
    return [];
  }
  
  const Attraction = require('./Attraction');
    return Attraction.find({ 
      isActive: true,
      'map.coordinates': { $exists: true, $ne: [0, 0] }
    }).then(attractions => {
      return attractions.filter(attraction => {
        if (!attraction.map.coordinates || attraction.map.coordinates.length < 2) return false;
        const [attrLng, attrLat] = attraction.map.coordinates;
        const [entLng, entLat] = entertainment.map.coordinates;
        const distance = this.calculateDistance(
          entLat, 
          entLng, 
          attrLat, 
          attrLng
        );
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

// Tìm địa điểm giải trí gần đây (loại trừ chính nó)
entertainmentSchema.statics.findNearbyEntertainments = function(entertainmentId, radius = 5, limit = 10) {
  return this.findById(entertainmentId).then(entertainment => {
    if (!entertainment || !entertainment.map.coordinates || entertainment.map.coordinates.length < 2) {
      return [];
    }
    
    const Entertainment = require('./Entertainment');
    return Entertainment.find({ 
      isActive: true,
      _id: { $ne: entertainmentId }, // Loại trừ chính nó
      'map.coordinates': { $exists: true, $ne: [0, 0] }
    }).then(entertainments => {
      return entertainments.filter(ent => {
        if (!ent.map.coordinates || ent.map.coordinates.length < 2) return false;
        const [entLng, entLat] = entertainment.map.coordinates;
        const [otherLng, otherLat] = ent.map.coordinates;
        const distance = this.calculateDistance(
          entLat, 
          entLng, 
          otherLat, 
          otherLng
        );
        ent.distance = distance;
        return distance <= radius;
      })
      .sort((a, b) => {
        return a.distance - b.distance;
      })
      .slice(0, limit);
    });
  });
};

module.exports = mongoose.model('Entertainment', entertainmentSchema);
