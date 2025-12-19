const mongoose = require('mongoose');

const attractionSchema = new mongoose.Schema({
  // === THÔNG TIN CƠ BẢN ===
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['nhan-van', 'tu-nhien'],
    index: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  opening_hours: {
    type: String,
    trim: true
  },
  ticket_info: {
    type: String,
    trim: true
  },
  intro: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  highlights: [{
    type: String,
    trim: true
  }],
  visitor_notes: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String,
    trim: true
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
    lat: { type: Number },
    lng: { type: Number },
    link: { type: String }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  featured: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// === VIRTUAL FIELDS ===
// Tạo slug tự động từ name
attractionSchema.pre('save', function(next) {
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
      this.slug = 'attraction-' + Date.now();
    }
  }
  // Nếu không có name, không tạo slug (để tránh null)
  next();
});

// Virtual: URL đầy đủ
attractionSchema.virtual('url').get(function() {
  return `/attraction/${this.slug}`;
});

// Virtual: Hình ảnh chính
attractionSchema.virtual('mainImage').get(function() {
  return this.images?.[0] || null;
});

// === STATIC METHODS ===
// Tìm kiếm theo từ khóa
attractionSchema.statics.search = function(query, options = {}) {
  const searchQuery = {
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ],
    isActive: true
  };

  return this.find(searchQuery)
    .sort(options.sort || { featured: -1, createdAt: -1 })
    .limit(options.limit || 20)
    .skip(options.skip || 0);
};

// Lấy điểm nổi bật
attractionSchema.statics.getFeatured = function(limit = 6) {
  return this.find({ 
    featured: true, 
    isActive: true 
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Lấy theo danh mục
attractionSchema.statics.getByCategory = function(category, limit = 10) {
  return this.find({ 
    category, 
    isActive: true 
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

// === STATIC METHODS FOR NEARBY PLACES ===
// Hàm tính khoảng cách giữa 2 điểm địa lý (Haversine formula)
// More accurate distance calculation using improved Haversine formula
attractionSchema.statics.calculateDistance = function(lat1, lng1, lat2, lng2) {
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
attractionSchema.statics.findNearbyCuisinePlaces = async function(attractionId, radius = 5, limit = 10) {
  const startTime = Date.now();
  
  try {
    const attraction = await this.findById(attractionId).lean();
    if (!attraction) {
      console.log(`[GEO] Attraction ${attractionId} not found`);
      return [];
    }
    
    // Get coordinates from new or legacy format
    let lng, lat;
    if (attraction.map.coordinates && attraction.map.coordinates.length >= 2) {
      [lng, lat] = attraction.map.coordinates;
    } else if (attraction.map.lat && attraction.map.lng) {
      lng = attraction.map.lng;
      lat = attraction.map.lat;
    } else {
      console.log(`[GEO] No valid coordinates for attraction ${attractionId}`);
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

// Tìm khách sạn gần đây - OPTIMIZED with MongoDB $near
attractionSchema.statics.findNearbyAccommodations = async function(attractionId, radius = 5, limit = 10) {
  const startTime = Date.now();
  
  try {
    const attraction = await this.findById(attractionId).lean();
    if (!attraction) {
      console.log(`[GEO] Attraction ${attractionId} not found`);
      return [];
    }
    
    // Get coordinates from new or legacy format
    let lng, lat;
    if (attraction.map.coordinates && attraction.map.coordinates.length >= 2) {
      [lng, lat] = attraction.map.coordinates;
    } else if (attraction.map.lat && attraction.map.lng) {
      lng = attraction.map.lng;
      lat = attraction.map.lat;
    } else {
      console.log(`[GEO] No valid coordinates for attraction ${attractionId}`);
      return [];
    }
    
    const Accommodation = require('./Accommodation');
    
    // Use MongoDB $near for optimal performance with 2dsphere index
    const accommodations = await Accommodation.find({
      isActive: true,
      status: 'public',
      map: {
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
    accommodations.forEach(accommodation => {
      if (accommodation.map.coordinates && accommodation.map.coordinates.length >= 2) {
        const [accLng, accLat] = accommodation.map.coordinates;
        accommodation.distance = this.calculateDistance(lat, lng, accLat, accLng);
      }
    });
    
    const queryTime = Date.now() - startTime;
    console.log(`[GEO] Found ${accommodations.length} nearby accommodations in ${queryTime}ms`);
    
    return accommodations;
  } catch (error) {
    console.error(`[GEO] Error finding nearby accommodations:`, error);
    return [];
  }
};

// Tìm địa điểm giải trí gần đây - OPTIMIZED with MongoDB $near
attractionSchema.statics.findNearbyEntertainments = async function(attractionId, radius = 5, limit = 10) {
  const startTime = Date.now();
  
  try {
    const attraction = await this.findById(attractionId).lean();
    if (!attraction) {
      console.log(`[GEO] Attraction ${attractionId} not found`);
      return [];
    }
    
    // Get coordinates from new or legacy format
    let lng, lat;
    if (attraction.map.coordinates && attraction.map.coordinates.length >= 2) {
      [lng, lat] = attraction.map.coordinates;
    } else if (attraction.map.lat && attraction.map.lng) {
      lng = attraction.map.lng;
      lat = attraction.map.lat;
    } else {
      console.log(`[GEO] No valid coordinates for attraction ${attractionId}`);
      return [];
    }
    
    const Entertainment = require('./Entertainment');
    
    // Use MongoDB $near for optimal performance with 2dsphere index
    const entertainments = await Entertainment.find({
      isActive: true,
      map: {
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
    entertainments.forEach(entertainment => {
      if (entertainment.map.coordinates && entertainment.map.coordinates.length >= 2) {
        const [entLng, entLat] = entertainment.map.coordinates;
        entertainment.distance = this.calculateDistance(lat, lng, entLat, entLng);
      } else if (entertainment.map.lat && entertainment.map.lng) {
        // Fallback for legacy lat/lng format
        entertainment.distance = this.calculateDistance(lat, lng, entertainment.map.lat, entertainment.map.lng);
      }
    });
    
    const queryTime = Date.now() - startTime;
    console.log(`[GEO] Found ${entertainments.length} nearby entertainments in ${queryTime}ms`);
    
    return entertainments;
  } catch (error) {
    console.error(`[GEO] Error finding nearby entertainments:`, error);
    return [];
  }
};

// Tìm điểm tham quan gần đây (loại trừ chính nó) - OPTIMIZED with MongoDB $near
attractionSchema.statics.findNearbyAttractions = async function(attractionId, radius = 5, limit = 10) {
  const startTime = Date.now();
  
  try {
    const attraction = await this.findById(attractionId).lean();
    if (!attraction) {
      console.log(`[GEO] Attraction ${attractionId} not found`);
      return [];
    }
    
    // Get coordinates from new or legacy format
    let lng, lat;
    if (attraction.map.coordinates && attraction.map.coordinates.length >= 2) {
      [lng, lat] = attraction.map.coordinates;
    } else if (attraction.map.lat && attraction.map.lng) {
      lng = attraction.map.lng;
      lat = attraction.map.lat;
    } else {
      console.log(`[GEO] No valid coordinates for attraction ${attractionId}`);
      return [];
    }
    
    // Use MongoDB $near for optimal performance with 2dsphere index
    const attractions = await this.find({
      isActive: true,
      _id: { $ne: attractionId }, // Exclude self
      map: {
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
    attractions.forEach(attr => {
      if (attr.map.coordinates && attr.map.coordinates.length >= 2) {
        const [attrLng, attrLat] = attr.map.coordinates;
        attr.distance = this.calculateDistance(lat, lng, attrLat, attrLng);
      } else if (attr.map.lat && attr.map.lng) {
        // Fallback for legacy lat/lng format
        attr.distance = this.calculateDistance(lat, lng, attr.map.lat, attr.map.lng);
      }
    });
    
    const queryTime = Date.now() - startTime;
    console.log(`[GEO] Found ${attractions.length} nearby attractions in ${queryTime}ms`);
    
    return attractions;
  } catch (error) {
    console.error(`[GEO] Error finding nearby attractions:`, error);
    return [];
  }
};

// === INDEXES ===
// Critical: 2dsphere index for geo queries - MUST be created for performance
attractionSchema.index({ map: '2dsphere' }, { sparse: true });
attractionSchema.index({ category: 1, isActive: 1 });
attractionSchema.index({ district: 1, isActive: 1 });
attractionSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Attraction', attractionSchema);
