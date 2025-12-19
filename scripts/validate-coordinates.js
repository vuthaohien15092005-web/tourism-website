#!/usr/bin/env node

/**
 * Validate and Fix Coordinates
 * 
 * This script validates coordinates against known landmarks
 * and suggests corrections for inaccurate coordinates
 */

const mongoose = require('mongoose');
const Attraction = require('../model/Attraction');
const Entertainment = require('../model/Entertainment');
const Accommodation = require('../model/Accommodation');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/tourism-website')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// Known accurate coordinates for validation
const knownLandmarks = {
  'Văn Miếu': { lat: 21.027778, lng: 105.834167 },
  'Quốc Tử Giám': { lat: 21.027778, lng: 105.834167 },
  'Hồ Gươm': { lat: 21.028333, lng: 105.854167 },
  'Chùa Một Cột': { lat: 21.032778, lng: 105.832222 },
  'Lăng Chủ tịch Hồ Chí Minh': { lat: 21.036389, lng: 105.832222 },
  'Phố cổ Hà Nội': { lat: 21.033333, lng: 105.850000 },
  'Nhà hát Lớn': { lat: 21.025000, lng: 105.841667 },
  'Bảo tàng Lịch sử': { lat: 21.025000, lng: 105.833333 }
};

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const lat1Rad = lat1 * Math.PI / 180;
  const lng1Rad = lng1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const lng2Rad = lng2 * Math.PI / 180;
  const dLat = lat2Rad - lat1Rad;
  const dLng = lng2Rad - lng1Rad;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function findClosestLandmark(lat, lng) {
  let closest = null;
  let minDistance = Infinity;
  
  Object.entries(knownLandmarks).forEach(([name, coords]) => {
    const distance = calculateDistance(lat, lng, coords.lat, coords.lng);
    if (distance < minDistance) {
      minDistance = distance;
      closest = { name, coords, distance };
    }
  });
  
  return closest;
}

async function validateCoordinates() {
  console.log('\n🔍 Validating Coordinates...\n');
  
  try {
    const models = [
      { name: 'Attractions', model: Attraction, field: 'map.coordinates' },
      { name: 'Entertainments', model: Entertainment, field: 'map.coordinates' },
      { name: 'Accommodations', model: Accommodation, field: 'map.coordinates' }
    ];
    
    let totalChecked = 0;
    let inaccurateCount = 0;
    let suggestions = [];
    
    for (const { name, model, field } of models) {
      console.log(`📍 Checking ${name}:`);
      console.log('='.repeat(30));
      
      const records = await model.find({ [field]: { $exists: true, $ne: [0, 0] } }).limit(10);
      console.log(`Found ${records.length} records with coordinates`);
      
      records.forEach((record, index) => {
        if (record.map && record.map.coordinates && record.map.coordinates.length >= 2) {
          const [lng, lat] = record.map.coordinates;
          const closest = findClosestLandmark(lat, lng);
          
          totalChecked++;
          
          console.log(`\n${index + 1}. ${record.name}`);
          console.log(`   Current: lat=${lat}, lng=${lng}`);
          console.log(`   Closest landmark: ${closest.name} (${closest.distance.toFixed(3)} km away)`);
          
          // Check if coordinates seem accurate
          if (closest.distance > 0.5) { // More than 500m from any known landmark
            console.log(`   ⚠️  POTENTIALLY INACCURATE (${closest.distance.toFixed(3)} km from nearest landmark)`);
            inaccurateCount++;
            
            suggestions.push({
              type: name,
              name: record.name,
              current: { lat, lng },
              suggested: closest.coords,
              landmark: closest.name,
              distance: closest.distance
            });
          } else {
            console.log(`   ✅ Coordinates appear accurate`);
          }
        }
      });
      
      console.log('');
    }
    
    console.log('📊 VALIDATION SUMMARY:');
    console.log('======================');
    console.log(`Total records checked: ${totalChecked}`);
    console.log(`Potentially inaccurate: ${inaccurateCount}`);
    console.log(`Accuracy rate: ${((totalChecked - inaccurateCount) / totalChecked * 100).toFixed(1)}%`);
    
    if (suggestions.length > 0) {
      console.log('\n🔧 SUGGESTED CORRECTIONS:');
      console.log('=========================');
      suggestions.forEach((suggestion, index) => {
        console.log(`\n${index + 1}. ${suggestion.type}: ${suggestion.name}`);
        console.log(`   Current:  lat=${suggestion.current.lat}, lng=${suggestion.current.lng}`);
        console.log(`   Suggested: lat=${suggestion.suggested.lat}, lng=${suggestion.suggested.lng}`);
        console.log(`   Based on: ${suggestion.landmark} (${suggestion.distance.toFixed(3)} km away)`);
      });
      
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('===================');
      console.log('1. Verify coordinates against Google Maps');
      console.log('2. Use 6+ decimal places for better accuracy');
      console.log('3. Double-check landmark coordinates');
      console.log('4. Consider using GPS coordinates from actual visits');
    }
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run validation
validateCoordinates();
