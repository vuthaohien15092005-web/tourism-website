#!/usr/bin/env node

/**
 * Test Distance Accuracy
 * 
 * This script tests the accuracy of distance calculations by comparing
 * with known distances and Google Maps coordinates.
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

// Test coordinates (Hanoi landmarks)
const testCoordinates = {
  // Văn Miếu - Quốc Tử Giám
  vanMieu: {
    name: 'Văn Miếu - Quốc Tử Giám',
    lat: 21.0278,
    lng: 105.8342,
    coordinates: [105.8342, 21.0278] // [lng, lat] GeoJSON format
  },
  // Hồ Gươm
  hoGuom: {
    name: 'Hồ Gươm',
    lat: 21.0285,
    lng: 105.8542,
    coordinates: [105.8542, 21.0285]
  },
  // Chùa Một Cột
  chuaMotCot: {
    name: 'Chùa Một Cột',
    lat: 21.0328,
    lng: 105.8322,
    coordinates: [105.8322, 21.0328]
  }
};

// Known distances (from Google Maps)
const knownDistances = {
  'vanMieu-hoGuom': 1.8, // km
  'vanMieu-chuaMotCot': 0.6, // km
  'hoGuom-chuaMotCot': 1.4 // km
};

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

async function testDistanceAccuracy() {
  console.log('\n🧪 Testing Distance Calculation Accuracy...\n');
  
  try {
    // Test 1: Calculate distances between known landmarks
    console.log('📍 Test 1: Known Landmark Distances');
    console.log('=====================================');
    
    const vanMieu = testCoordinates.vanMieu;
    const hoGuom = testCoordinates.hoGuom;
    const chuaMotCot = testCoordinates.chuaMotCot;
    
    // Văn Miếu to Hồ Gươm
    const dist1 = calculateDistance(vanMieu.lat, vanMieu.lng, hoGuom.lat, hoGuom.lng);
    const expected1 = knownDistances['vanMieu-hoGuom'];
    const error1 = Math.abs(dist1 - expected1);
    const errorPercent1 = (error1 / expected1) * 100;
    
    console.log(`Văn Miếu → Hồ Gươm:`);
    console.log(`  Calculated: ${dist1.toFixed(3)} km`);
    console.log(`  Expected:   ${expected1} km`);
    console.log(`  Error:      ${error1.toFixed(3)} km (${errorPercent1.toFixed(1)}%)`);
    console.log(`  Status:     ${errorPercent1 < 5 ? '✅ GOOD' : '❌ BAD'}`);
    console.log('');
    
    // Văn Miếu to Chùa Một Cột
    const dist2 = calculateDistance(vanMieu.lat, vanMieu.lng, chuaMotCot.lat, chuaMotCot.lng);
    const expected2 = knownDistances['vanMieu-chuaMotCot'];
    const error2 = Math.abs(dist2 - expected2);
    const errorPercent2 = (error2 / expected2) * 100;
    
    console.log(`Văn Miếu → Chùa Một Cột:`);
    console.log(`  Calculated: ${dist2.toFixed(3)} km`);
    console.log(`  Expected:   ${expected2} km`);
    console.log(`  Error:      ${error2.toFixed(3)} km (${errorPercent2.toFixed(1)}%)`);
    console.log(`  Status:     ${errorPercent2 < 5 ? '✅ GOOD' : '❌ BAD'}`);
    console.log('');
    
    // Hồ Gươm to Chùa Một Cột
    const dist3 = calculateDistance(hoGuom.lat, hoGuom.lng, chuaMotCot.lat, chuaMotCot.lng);
    const expected3 = knownDistances['hoGuom-chuaMotCot'];
    const error3 = Math.abs(dist3 - expected3);
    const errorPercent3 = (error3 / expected3) * 100;
    
    console.log(`Hồ Gươm → Chùa Một Cột:`);
    console.log(`  Calculated: ${dist3.toFixed(3)} km`);
    console.log(`  Expected:   ${expected3} km`);
    console.log(`  Error:      ${error3.toFixed(3)} km (${errorPercent3.toFixed(1)}%)`);
    console.log(`  Status:     ${errorPercent3 < 5 ? '✅ GOOD' : '❌ BAD'}`);
    console.log('');
    
    // Test 2: Check database records
    console.log('🗄️ Test 2: Database Records');
    console.log('===========================');
    
    // Check attractions
    const attractions = await Attraction.find({ 'map.coordinates': { $exists: true } }).limit(3);
    console.log(`Found ${attractions.length} attractions with coordinates`);
    
    attractions.forEach((attraction, index) => {
      if (attraction.map.coordinates && attraction.map.coordinates.length >= 2) {
        const [lng, lat] = attraction.map.coordinates;
        console.log(`${index + 1}. ${attraction.name}`);
        console.log(`   Coordinates: [${lng}, ${lat}] (lng, lat)`);
        console.log(`   Format: ${Array.isArray(attraction.map.coordinates) ? 'GeoJSON' : 'Legacy'}`);
      }
    });
    console.log('');
    
    // Check entertainments
    const entertainments = await Entertainment.find({ 'map.coordinates': { $exists: true } }).limit(3);
    console.log(`Found ${entertainments.length} entertainments with coordinates`);
    
    entertainments.forEach((entertainment, index) => {
      if (entertainment.map.coordinates && entertainment.map.coordinates.length >= 2) {
        const [lng, lat] = entertainment.map.coordinates;
        console.log(`${index + 1}. ${entertainment.name}`);
        console.log(`   Coordinates: [${lng}, ${lat}] (lng, lat)`);
        console.log(`   Format: ${Array.isArray(entertainment.map.coordinates) ? 'GeoJSON' : 'Legacy'}`);
      }
    });
    console.log('');
    
    // Test 3: Test nearby places API
    console.log('🌐 Test 3: Nearby Places API');
    console.log('============================');
    
    if (attractions.length > 0) {
      const testAttraction = attractions[0];
      console.log(`Testing with: ${testAttraction.name}`);
      
      try {
        // Test nearby entertainments
        const nearbyEntertainments = await Entertainment.findNearbyEntertainments(
          testAttraction._id, 
          5, // 5km radius
          3  // limit 3
        );
        
        console.log(`Found ${nearbyEntertainments.length} nearby entertainments`);
        nearbyEntertainments.forEach((ent, index) => {
          console.log(`  ${index + 1}. ${ent.name} - ${ent.distance?.toFixed(3)} km`);
        });
      } catch (error) {
        console.error('Error testing nearby places:', error.message);
      }
    }
    
    // Overall assessment
    const avgError = (errorPercent1 + errorPercent2 + errorPercent3) / 3;
    console.log('\n📊 OVERALL ASSESSMENT:');
    console.log('======================');
    console.log(`Average error: ${avgError.toFixed(1)}%`);
    console.log(`Status: ${avgError < 5 ? '✅ Distance calculation is ACCURATE' : '❌ Distance calculation has ISSUES'}`);
    
    if (avgError >= 5) {
      console.log('\n🔍 POSSIBLE ISSUES:');
      console.log('- Coordinate format inconsistency (lat/lng vs lng/lat)');
      console.log('- Database records using legacy format instead of GeoJSON');
      console.log('- Incorrect coordinate extraction from GeoJSON');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testDistanceAccuracy();
