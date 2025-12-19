const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Accommodation = require('../model/Accommodation');
const Attraction = require('../model/Attraction');
const Entertainment = require('../model/Entertainment');
const CuisinePlace = require('../model/CuisinePlace');

// Test coordinates (Hanoi landmarks)
const testCoordinates = {
  // Văn Miếu - Quốc Tử Giám (Hanoi)
  vanMieu: {
    lat: 21.0278,
    lng: 105.8342,
    name: "Văn Miếu - Quốc Tử Giám"
  },
  // Hồ Gươm (Hanoi)
  hoGuom: {
    lat: 21.0285,
    lng: 105.8542,
    name: "Hồ Gươm"
  },
  // Lăng Chủ tịch Hồ Chí Minh (Hanoi)
  langBac: {
    lat: 21.0368,
    lng: 105.8325,
    name: "Lăng Chủ tịch Hồ Chí Minh"
  }
};

// Google Maps distance for reference (in km)
const googleMapsDistances = {
  "vanMieu-hoGuom": 1.8, // Văn Miếu to Hồ Gươm
  "vanMieu-langBac": 0.9, // Văn Miếu to Lăng Bác
  "hoGuom-langBac": 2.1   // Hồ Gươm to Lăng Bác
};

// Haversine formula for comparison
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  
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
  const distance = R * c;
  
  return distance;
}

async function testDistanceAccuracy() {
  try {
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/tourism-hanoi');
    console.log('✅ Connected to MongoDB');
    
    console.log('\n🔍 Testing Distance Calculation Accuracy');
    console.log('=' .repeat(60));
    
    // Test 1: Văn Miếu to Hồ Gươm
    console.log('\n📍 Test 1: Văn Miếu → Hồ Gươm');
    const distance1 = Accommodation.calculateDistance(
      testCoordinates.vanMieu.lat, testCoordinates.vanMieu.lng,
      testCoordinates.hoGuom.lat, testCoordinates.hoGuom.lng
    );
    const haversine1 = haversineDistance(
      testCoordinates.vanMieu.lat, testCoordinates.vanMieu.lng,
      testCoordinates.hoGuom.lat, testCoordinates.hoGuom.lng
    );
    const google1 = googleMapsDistances["vanMieu-hoGuom"];
    
    console.log(`   Model calculateDistance: ${distance1.toFixed(3)} km`);
    console.log(`   Haversine reference:     ${haversine1.toFixed(3)} km`);
    console.log(`   Google Maps:             ${google1} km`);
    console.log(`   Error vs Google:         ${Math.abs(distance1 - google1).toFixed(3)} km`);
    console.log(`   Error vs Haversine:      ${Math.abs(distance1 - haversine1).toFixed(6)} km`);
    
    // Test 2: Văn Miếu to Lăng Bác
    console.log('\n📍 Test 2: Văn Miếu → Lăng Bác');
    const distance2 = Accommodation.calculateDistance(
      testCoordinates.vanMieu.lat, testCoordinates.vanMieu.lng,
      testCoordinates.langBac.lat, testCoordinates.langBac.lng
    );
    const haversine2 = haversineDistance(
      testCoordinates.vanMieu.lat, testCoordinates.vanMieu.lng,
      testCoordinates.langBac.lat, testCoordinates.langBac.lng
    );
    const google2 = googleMapsDistances["vanMieu-langBac"];
    
    console.log(`   Model calculateDistance: ${distance2.toFixed(3)} km`);
    console.log(`   Haversine reference:     ${haversine2.toFixed(3)} km`);
    console.log(`   Google Maps:             ${google2} km`);
    console.log(`   Error vs Google:         ${Math.abs(distance2 - google2).toFixed(3)} km`);
    console.log(`   Error vs Haversine:      ${Math.abs(distance2 - haversine2).toFixed(6)} km`);
    
    // Test 3: Hồ Gươm to Lăng Bác
    console.log('\n📍 Test 3: Hồ Gươm → Lăng Bác');
    const distance3 = Accommodation.calculateDistance(
      testCoordinates.hoGuom.lat, testCoordinates.hoGuom.lng,
      testCoordinates.langBac.lat, testCoordinates.langBac.lng
    );
    const haversine3 = haversineDistance(
      testCoordinates.hoGuom.lat, testCoordinates.hoGuom.lng,
      testCoordinates.langBac.lat, testCoordinates.langBac.lng
    );
    const google3 = googleMapsDistances["hoGuom-langBac"];
    
    console.log(`   Model calculateDistance: ${distance3.toFixed(3)} km`);
    console.log(`   Haversine reference:     ${haversine3.toFixed(3)} km`);
    console.log(`   Google Maps:             ${google3} km`);
    console.log(`   Error vs Google:         ${Math.abs(distance3 - google3).toFixed(3)} km`);
    console.log(`   Error vs Haversine:      ${Math.abs(distance3 - haversine2).toFixed(6)} km`);
    
    // Test all models for consistency
    console.log('\n🔄 Testing Model Consistency');
    console.log('=' .repeat(60));
    
    const models = [
      { name: 'Accommodation', model: Accommodation },
      { name: 'Attraction', model: Attraction },
      { name: 'Entertainment', model: Entertainment },
      { name: 'CuisinePlace', model: CuisinePlace }
    ];
    
    for (const { name, model } of models) {
      const distance = model.calculateDistance(
        testCoordinates.vanMieu.lat, testCoordinates.vanMieu.lng,
        testCoordinates.hoGuom.lat, testCoordinates.hoGuom.lng
      );
      console.log(`${name.padEnd(15)}: ${distance.toFixed(6)} km`);
    }
    
    // Test coordinate order
    console.log('\n🧭 Testing Coordinate Order');
    console.log('=' .repeat(60));
    
    console.log('Testing [lng, lat] vs [lat, lng] order:');
    
    // Correct order: (lat1, lng1, lat2, lng2)
    const correctOrder = Accommodation.calculateDistance(
      testCoordinates.vanMieu.lat, testCoordinates.vanMieu.lng,
      testCoordinates.hoGuom.lat, testCoordinates.hoGuom.lng
    );
    
    // Wrong order: (lng1, lat1, lng2, lat2) - should give different result
    const wrongOrder = Accommodation.calculateDistance(
      testCoordinates.vanMieu.lng, testCoordinates.vanMieu.lat,
      testCoordinates.hoGuom.lng, testCoordinates.hoGuom.lat
    );
    
    console.log(`Correct order (lat,lng,lat,lng): ${correctOrder.toFixed(6)} km`);
    console.log(`Wrong order   (lng,lat,lng,lat): ${wrongOrder.toFixed(6)} km`);
    console.log(`Difference: ${Math.abs(correctOrder - wrongOrder).toFixed(6)} km`);
    
    if (Math.abs(correctOrder - wrongOrder) > 0.001) {
      console.log('✅ Coordinate order matters - this is correct!');
    } else {
      console.log('❌ Coordinate order doesn\'t matter - this might be wrong!');
    }
    
    console.log('\n✅ Distance accuracy test completed!');
    
  } catch (error) {
    console.error('❌ Error testing distance accuracy:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testDistanceAccuracy();
