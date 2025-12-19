#!/usr/bin/env node

/**
 * Script to update CuisinePlace model methods to use optimized MongoDB $near queries
 */

const fs = require('fs');
const path = require('path');

const cuisineModelPath = path.join(__dirname, '../model/CuisinePlace.js');

// Read the current file
let content = fs.readFileSync(cuisineModelPath, 'utf8');

// Update findNearbyAccommodations
const findNearbyAccommodationsOld = `// Tìm khách sạn gần đây
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
};`;

const findNearbyAccommodationsNew = `// Tìm khách sạn gần đây - OPTIMIZED with MongoDB $near
CuisinePlaceSchema.statics.findNearbyAccommodations = async function(cuisinePlaceId, radius = 5, limit = 10) {
  const startTime = Date.now();
  
  try {
    const place = await this.findById(cuisinePlaceId).lean();
    if (!place || !place.location.coordinates || place.location.coordinates.length < 2) {
      console.log(\`[GEO] No valid coordinates for cuisine place \${cuisinePlaceId}\`);
      return [];
    }
    
    const [lng, lat] = place.location.coordinates;
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
    console.log(\`[GEO] Found \${accommodations.length} nearby accommodations in \${queryTime}ms\`);
    
    return accommodations;
  } catch (error) {
    console.error(\`[GEO] Error finding nearby accommodations:\`, error);
    return [];
  }
};`;

// Update findNearbyAttractions
const findNearbyAttractionsOld = `// Tìm điểm tham quan gần đây
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
};`;

const findNearbyAttractionsNew = `// Tìm điểm tham quan gần đây - OPTIMIZED with MongoDB $near
CuisinePlaceSchema.statics.findNearbyAttractions = async function(cuisinePlaceId, radius = 5, limit = 10) {
  const startTime = Date.now();
  
  try {
    const place = await this.findById(cuisinePlaceId).lean();
    if (!place || !place.location.coordinates || place.location.coordinates.length < 2) {
      console.log(\`[GEO] No valid coordinates for cuisine place \${cuisinePlaceId}\`);
      return [];
    }
    
    const [lng, lat] = place.location.coordinates;
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
    console.log(\`[GEO] Found \${attractions.length} nearby attractions in \${queryTime}ms\`);
    
    return attractions;
  } catch (error) {
    console.error(\`[GEO] Error finding nearby attractions:\`, error);
    return [];
  }
};`;

// Update findNearbyEntertainments
const findNearbyEntertainmentsOld = `// Tìm địa điểm giải trí gần đây
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
};`;

const findNearbyEntertainmentsNew = `// Tìm địa điểm giải trí gần đây - OPTIMIZED with MongoDB $near
CuisinePlaceSchema.statics.findNearbyEntertainments = async function(cuisinePlaceId, radius = 5, limit = 10) {
  const startTime = Date.now();
  
  try {
    const place = await this.findById(cuisinePlaceId).lean();
    if (!place || !place.location.coordinates || place.location.coordinates.length < 2) {
      console.log(\`[GEO] No valid coordinates for cuisine place \${cuisinePlaceId}\`);
      return [];
    }
    
    const [lng, lat] = place.location.coordinates;
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
    console.log(\`[GEO] Found \${entertainments.length} nearby entertainments in \${queryTime}ms\`);
    
    return entertainments;
  } catch (error) {
    console.error(\`[GEO] Error finding nearby entertainments:\`, error);
    return [];
  }
};`;

// Update findNearbyCuisinePlaces
const findNearbyCuisinePlacesOld = `// Tìm quán ăn gần đây (loại trừ chính nó)
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
      return places.filter(place => {
        if (!place.location.coordinates || place.location.coordinates.length < 2) return false;
        const [placeLng, placeLat] = place.location.coordinates;
        const distance = this.calculateDistance(lat, lng, placeLat, placeLng);
        place.distance = distance;
        return distance <= radius;
      })
      .sort((a, b) => {
        return a.distance - b.distance;
      })
      .slice(0, limit);
    });
  });
};`;

const findNearbyCuisinePlacesNew = `// Tìm quán ăn gần đây (loại trừ chính nó) - OPTIMIZED with MongoDB $near
CuisinePlaceSchema.statics.findNearbyCuisinePlaces = async function(cuisinePlaceId, radius = 5, limit = 10) {
  const startTime = Date.now();
  
  try {
    const place = await this.findById(cuisinePlaceId).lean();
    if (!place || !place.location.coordinates || place.location.coordinates.length < 2) {
      console.log(\`[GEO] No valid coordinates for cuisine place \${cuisinePlaceId}\`);
      return [];
    }
    
    const [lng, lat] = place.location.coordinates;
    
    // Use MongoDB $near for optimal performance with 2dsphere index
    const places = await this.find({
      isActive: true,
      status: 'published',
      _id: { $ne: cuisinePlaceId }, // Exclude self
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
    console.log(\`[GEO] Found \${places.length} nearby cuisine places in \${queryTime}ms\`);
    
    return places;
  } catch (error) {
    console.error(\`[GEO] Error finding nearby cuisine places:\`, error);
    return [];
  }
};`;

// Apply replacements
content = content.replace(findNearbyAccommodationsOld, findNearbyAccommodationsNew);
content = content.replace(findNearbyAttractionsOld, findNearbyAttractionsNew);
content = content.replace(findNearbyEntertainmentsOld, findNearbyEntertainmentsNew);
content = content.replace(findNearbyCuisinePlacesOld, findNearbyCuisinePlacesNew);

// Write back to file
fs.writeFileSync(cuisineModelPath, content, 'utf8');

console.log('✅ Updated CuisinePlace model methods successfully!');
