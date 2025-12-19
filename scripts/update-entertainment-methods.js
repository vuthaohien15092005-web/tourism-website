#!/usr/bin/env node

/**
 * Script to update remaining Entertainment model methods to use optimized MongoDB $near queries
 */

const fs = require('fs');
const path = require('path');

const entertainmentModelPath = path.join(__dirname, '../model/Entertainment.js');

// Read the current file
let content = fs.readFileSync(entertainmentModelPath, 'utf8');

// Update findNearbyAccommodations
const findNearbyAccommodationsOld = `// Tìm khách sạn gần đây
entertainmentSchema.statics.findNearbyAccommodations = function(entertainmentId, radius = 5, limit = 10) {
  return this.findById(entertainmentId).then(entertainment => {
    if (!entertainment || !entertainment.map.lat || !entertainment.map.lng) {
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
        const distance = this.calculateDistance(
          entertainment.map.lat, 
          entertainment.map.lng, 
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
};`;

const findNearbyAccommodationsNew = `// Tìm khách sạn gần đây - OPTIMIZED with MongoDB $near
entertainmentSchema.statics.findNearbyAccommodations = async function(entertainmentId, radius = 5, limit = 10) {
  const startTime = Date.now();
  
  try {
    const entertainment = await this.findById(entertainmentId).lean();
    if (!entertainment) {
      console.log(\`[GEO] Entertainment \${entertainmentId} not found\`);
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
      console.log(\`[GEO] No valid coordinates for entertainment \${entertainmentId}\`);
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
    console.log(\`[GEO] Found \${accommodations.length} nearby accommodations in \${queryTime}ms\`);
    
    return accommodations;
  } catch (error) {
    console.error(\`[GEO] Error finding nearby accommodations:\`, error);
    return [];
  }
};`;

// Update findNearbyAttractions
const findNearbyAttractionsOld = `// Tìm điểm tham quan gần đây
entertainmentSchema.statics.findNearbyAttractions = function(entertainmentId, radius = 5, limit = 10) {
  return this.findById(entertainmentId).then(entertainment => {
    if (!entertainment || !entertainment.map.lat || !entertainment.map.lng) {
      return [];
    }
    
    const Attraction = require('./Attraction');
    return Attraction.find({ 
      isActive: true,
      'map.lat': { $exists: true },
      'map.lng': { $exists: true }
    }).then(attractions => {
      return attractions.filter(attraction => {
        if (!attraction.map.lat || !attraction.map.lng) return false;
        const distance = this.calculateDistance(
          entertainment.map.lat, 
          entertainment.map.lng, 
          attraction.map.lat, 
          attraction.map.lng
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
};`;

const findNearbyAttractionsNew = `// Tìm điểm tham quan gần đây - OPTIMIZED with MongoDB $near
entertainmentSchema.statics.findNearbyAttractions = async function(entertainmentId, radius = 5, limit = 10) {
  const startTime = Date.now();
  
  try {
    const entertainment = await this.findById(entertainmentId).lean();
    if (!entertainment) {
      console.log(\`[GEO] Entertainment \${entertainmentId} not found\`);
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
      console.log(\`[GEO] No valid coordinates for entertainment \${entertainmentId}\`);
      return [];
    }
    
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
const findNearbyEntertainmentsOld = `// Tìm địa điểm giải trí gần đây (loại trừ chính nó)
entertainmentSchema.statics.findNearbyEntertainments = function(entertainmentId, radius = 5, limit = 10) {
  return this.findById(entertainmentId).then(entertainment => {
    if (!entertainment || !entertainment.map.lat || !entertainment.map.lng) {
      return [];
    }
    
    const Entertainment = require('./Entertainment');
    return Entertainment.find({ 
      isActive: true,
      _id: { $ne: entertainmentId }, // Loại trừ chính nó
      'map.lat': { $exists: true },
      'map.lng': { $exists: true }
    }).then(entertainments => {
      return entertainments.filter(ent => {
        if (!ent.map.lat || !ent.map.lng) return false;
        const distance = this.calculateDistance(
          entertainment.map.lat, 
          entertainment.map.lng, 
          ent.map.lat, 
          ent.map.lng
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
};`;

const findNearbyEntertainmentsNew = `// Tìm địa điểm giải trí gần đây (loại trừ chính nó) - OPTIMIZED with MongoDB $near
entertainmentSchema.statics.findNearbyEntertainments = async function(entertainmentId, radius = 5, limit = 10) {
  const startTime = Date.now();
  
  try {
    const entertainment = await this.findById(entertainmentId).lean();
    if (!entertainment) {
      console.log(\`[GEO] Entertainment \${entertainmentId} not found\`);
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
      console.log(\`[GEO] No valid coordinates for entertainment \${entertainmentId}\`);
      return [];
    }
    
    // Use MongoDB $near for optimal performance with 2dsphere index
    const entertainments = await this.find({
      isActive: true,
      _id: { $ne: entertainmentId }, // Exclude self
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
    entertainments.forEach(ent => {
      if (ent.map.coordinates && ent.map.coordinates.length >= 2) {
        const [entLng, entLat] = ent.map.coordinates;
        ent.distance = this.calculateDistance(lat, lng, entLat, entLng);
      } else if (ent.map.lat && ent.map.lng) {
        // Fallback for legacy lat/lng format
        ent.distance = this.calculateDistance(lat, lng, ent.map.lat, ent.map.lng);
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

// Apply replacements
content = content.replace(findNearbyAccommodationsOld, findNearbyAccommodationsNew);
content = content.replace(findNearbyAttractionsOld, findNearbyAttractionsNew);
content = content.replace(findNearbyEntertainmentsOld, findNearbyEntertainmentsNew);

// Write back to file
fs.writeFileSync(entertainmentModelPath, content, 'utf8');

console.log('✅ Updated Entertainment model methods successfully!');
