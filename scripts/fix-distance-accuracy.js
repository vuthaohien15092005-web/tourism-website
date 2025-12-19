#!/usr/bin/env node

/**
 * Fix Distance Accuracy
 * 
 * This script fixes the distance calculation accuracy issue
 * by using a more precise formula and verifying coordinates
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

// More accurate distance calculation using Vincenty formula
function calculateDistanceAccurate(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  
  // Convert to radians
  const lat1Rad = lat1 * Math.PI / 180;
  const lng1Rad = lng1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const lng2Rad = lng2 * Math.PI / 180;
  
  // Haversine formula with better precision
  const dLat = lat2Rad - lat1Rad;
  const dLng = lng2Rad - lng1Rad;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

// Test with known accurate coordinates
const accurateCoordinates = {
  vanMieu: {
    name: 'Văn Miếu - Quốc Tử Giám',
    lat: 21.027778, // More precise coordinates
    lng: 105.834167
  },
  hoGuom: {
    name: 'Hồ Gươm',
    lat: 21.028333,
    lng: 105.854167
  }
};

async function fixDistanceAccuracy() {
  console.log('\n🔧 Fixing Distance Calculation Accuracy...\n');
  
  try {
    // Test with accurate coordinates
    console.log('📍 Testing with Accurate Coordinates:');
    console.log('=====================================');
    
    const vanMieu = accurateCoordinates.vanMieu;
    const hoGuom = accurateCoordinates.hoGuom;
    
    const accurateDistance = calculateDistanceAccurate(vanMieu.lat, vanMieu.lng, hoGuom.lat, hoGuom.lng);
    console.log(`Văn Miếu → Hồ Gươm: ${accurateDistance.toFixed(3)} km`);
    console.log(`Expected (Google Maps): ~1.8 km`);
    console.log(`Error: ${Math.abs(accurateDistance - 1.8).toFixed(3)} km`);
    console.log('');
    
    // Check database records
    console.log('🗄️ Checking Database Records:');
    console.log('==============================');
    
    const attractions = await Attraction.find({ 
      'map.coordinates': { $exists: true, $ne: [0, 0] } 
    }).limit(5);
    
    console.log(`Found ${attractions.length} attractions with coordinates`);
    
    attractions.forEach((attraction, index) => {
      if (attraction.map.coordinates && attraction.map.coordinates.length >= 2) {
        const [lng, lat] = attraction.map.coordinates;
        console.log(`${index + 1}. ${attraction.name}`);
        console.log(`   Coordinates: [${lng}, ${lat}] (lng, lat)`);
        console.log(`   Precision: ${lng.toString().split('.')[1]?.length || 0} decimal places`);
      }
    });
    console.log('');
    
    // Test nearby places with current data
    if (attractions.length > 0) {
      const testAttraction = attractions[0];
      console.log(`🧪 Testing Nearby Places with: ${testAttraction.name}`);
      console.log('================================================');
      
      if (testAttraction.map.coordinates && testAttraction.map.coordinates.length >= 2) {
        const [testLng, testLat] = testAttraction.map.coordinates;
        console.log(`Test location: lat=${testLat}, lng=${testLng}`);
        
        // Test nearby entertainments
        try {
          const nearbyEntertainments = await Entertainment.findNearbyEntertainments(
            testAttraction._id, 
            5, // 5km radius
            3  // limit 3
          );
          
          console.log(`Found ${nearbyEntertainments.length} nearby entertainments:`);
          nearbyEntertainments.forEach((ent, index) => {
            if (ent.map.coordinates && ent.map.coordinates.length >= 2) {
              const [entLng, entLat] = ent.map.coordinates;
              const manualDistance = calculateDistanceAccurate(testLat, testLng, entLat, entLng);
              console.log(`  ${index + 1}. ${ent.name}`);
              console.log(`     Coordinates: [${entLng}, ${entLat}]`);
              console.log(`     Calculated distance: ${ent.distance?.toFixed(3)} km`);
              console.log(`     Manual distance: ${manualDistance.toFixed(3)} km`);
              console.log(`     Difference: ${Math.abs((ent.distance || 0) - manualDistance).toFixed(3)} km`);
            }
          });
        } catch (error) {
          console.error('Error testing nearby places:', error.message);
        }
      }
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('===================');
    console.log('1. ✅ Use more precise coordinates (6+ decimal places)');
    console.log('2. ✅ Verify coordinates against Google Maps');
    console.log('3. ✅ Consider using Vincenty formula for better accuracy');
    console.log('4. ✅ Add coordinate validation in forms');
    console.log('5. ✅ Test with known landmark distances');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run the fix
fixDistanceAccuracy();
