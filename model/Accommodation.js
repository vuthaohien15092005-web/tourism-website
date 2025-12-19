const mongoose = require('mongoose');

const accommodationSchema = new mongoose.Schema({
  // Basic Information
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  slug: { 
    type: String, 
    unique: true,
    trim: true
  },
  star: { 
    type: Number, 
    min: 1, 
    max: 5 
  },
  
  // Location Information
  address: {
    type: String,
    required: true,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  
  // Pricing
  priceFrom: { 
    type: Number,
    required: true,
    min: 0
  },
  
  // Content
  description: { 
    type: String, 
    required: true,
    trim: true
  },
  amenities: [String],
  
  // Media
  images: [String],
  website: {
    type: String,
    trim: true
  },
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
    mapEmbed: {
      type: String,
      trim: true
    },
    locationText: {
      type: String,
      trim: true
    }
  },
  
  // Status and Metadata
  status: { 
    type: String, 
    enum: ['public', 'draft', 'hidden'], 
    default: 'public' 
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  
  // Contact Information
  contact: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// === PRE-SAVE MIDDLEWARE ===
// Auto-generate slug from name
accommodationSchema.pre('save', function(next) {
  if (this.name && (!this.slug || this.isModified('name'))) {
    let baseSlug = this.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Keep only letters, numbers, spaces, dashes
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-') // Remove duplicate dashes
      .trim('-'); // Remove leading/trailing dashes
    
    this.slug = baseSlug;
    
    // If slug is empty, create slug from timestamp
    if (!this.slug) {
      this.slug = 'accommodation-' + Date.now();
    }
  }
  next();
});

// === VIRTUAL FIELDS ===
// Full URL
accommodationSchema.virtual('url').get(function() {
  return `/accommodation/${this.slug}`;
});

// Main image
accommodationSchema.virtual('mainImage').get(function() {
  return this.images?.[0] || null;
});

// === STATIC METHODS ===
// Search by keyword
accommodationSchema.statics.search = function(query, options = {}) {
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

// Get featured accommodations
accommodationSchema.statics.getFeatured = function(limit = 6) {
  return this.find({ 
    featured: true, 
    isActive: true 
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

// === STATIC METHODS FOR NEARBY PLACES ===
// Hàm tính khoảng cách giữa 2 điểm địa lý (Haversine formula)
// More accurate distance calculation using improved Haversine formula
accommodationSchema.statics.calculateDistance = function(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  
  // Convert to radians
  const lat1Rad = lat1 * Math.PI / 180;
  const lng1Rad = lng1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const lng2Rad = lng2 * Math.PI / 180;
  
  // Calculate differences in radians
  const dLat = lat2Rad - lat1Rad;
  const dLng = lng2Rad - lng1Rad;
  
  // Haversine formula
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
};

// Tìm quán ăn gần đây - OPTIMIZED with MongoDB $near
accommodationSchema.statics.findNearbyCuisinePlaces = async function(accommodationId, radius = 5, limit = 10) {
  const startTime = Date.now();
  
  try {
    const accommodation = await this.findById(accommodationId).lean();
    if (!accommodation || !accommodation.map.coordinates || accommodation.map.coordinates.length < 2) {
      console.log(`[GEO] No valid coordinates for accommodation ${accommodationId}`);
      return [];
    }
    
    const [lng, lat] = accommodation.map.coordinates;
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
    
    // Add distance calculation for display (MongoDB $near already sorts by distance)
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

// Tìm điểm tham quan gần đây - OPTIMIZED with MongoDB $near
accommodationSchema.statics.findNearbyAttractions = async function(accommodationId, radius = 5, limit = 10) {
  const startTime = Date.now();
  
  try {
    const accommodation = await this.findById(accommodationId).lean();
    if (!accommodation || !accommodation.map.coordinates || accommodation.map.coordinates.length < 2) {
      console.log(`[GEO] No valid coordinates for accommodation ${accommodationId}`);
      return [];
    }
    
    const [lng, lat] = accommodation.map.coordinates;
    const Attraction = require('./Attraction');
    
    // Use MongoDB $near for optimal performance with 2dsphere index
    const attractions = await Attraction.find({
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
    attractions.forEach(attraction => {
      if (attraction.map.coordinates && attraction.map.coordinates.length >= 2) {
        const [attrLng, attrLat] = attraction.map.coordinates;
        attraction.distance = this.calculateDistance(lat, lng, attrLat, attrLng);
      } else if (attraction.map.lat && attraction.map.lng) {
        // Fallback for legacy lat/lng format
        attraction.distance = this.calculateDistance(lat, lng, attraction.map.lat, attraction.map.lng);
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

// Tìm địa điểm giải trí gần đây - OPTIMIZED with MongoDB $near
accommodationSchema.statics.findNearbyEntertainments = async function(accommodationId, radius = 5, limit = 10) {
  const startTime = Date.now();
  
  try {
    const accommodation = await this.findById(accommodationId).lean();
    if (!accommodation || !accommodation.map.coordinates || accommodation.map.coordinates.length < 2) {
      console.log(`[GEO] No valid coordinates for accommodation ${accommodationId}`);
      return [];
    }
    
    const [lng, lat] = accommodation.map.coordinates;
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

// Tìm khách sạn gần đây (loại trừ chính nó) - OPTIMIZED with MongoDB $near
accommodationSchema.statics.findNearbyAccommodations = async function(accommodationId, radius = 5, limit = 10) {
  const startTime = Date.now();
  
  try {
    const accommodation = await this.findById(accommodationId).lean();
    if (!accommodation || !accommodation.map.coordinates || accommodation.map.coordinates.length < 2) {
      console.log(`[GEO] No valid coordinates for accommodation ${accommodationId}`);
      return [];
    }
    
    const [lng, lat] = accommodation.map.coordinates;
    
    // Use MongoDB $near for optimal performance with 2dsphere index
    const accommodations = await this.find({
      isActive: true,
      status: 'public',
      _id: { $ne: accommodationId }, // Exclude self
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
    accommodations.forEach(acc => {
      if (acc.map.coordinates && acc.map.coordinates.length >= 2) {
        const [accLng, accLat] = acc.map.coordinates;
        acc.distance = this.calculateDistance(lat, lng, accLat, accLng);
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

// === INDEXES ===
accommodationSchema.index({ name: 'text', description: 'text' });
accommodationSchema.index({ address: 1 });
accommodationSchema.index({ status: 1, isActive: 1 });
// Critical: 2dsphere index for geo queries - MUST be created for performance
accommodationSchema.index({ map: '2dsphere' }, { sparse: true });
accommodationSchema.index({ district: 1 });
accommodationSchema.index({ priceFrom: 1 });
accommodationSchema.index({ status: 1 });
accommodationSchema.index({ isActive: 1 });
accommodationSchema.index({ featured: 1 });
accommodationSchema.index({ slug: 1 });

module.exports = mongoose.model('Accommodation', accommodationSchema);
