const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Accommodation = require('../model/Accommodation');
const Attraction = require('../model/Attraction');
const Entertainment = require('../model/Entertainment');
const CuisinePlace = require('../model/CuisinePlace');

async function testNearbyAPI() {
  try {
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/tourism-hanoi');
    console.log('✅ Connected to MongoDB');
    
    console.log('\n🔍 Testing Nearby Places API');
    console.log('=' .repeat(60));
    
    // Test 1: Find a sample accommodation
    const sampleAccommodation = await Accommodation.findOne({ 
      isActive: true, 
      status: 'public',
      'map.coordinates': { $exists: true, $ne: [0, 0] }
    }).lean();
    
    if (!sampleAccommodation) {
      console.log('❌ No sample accommodation found');
      return;
    }
    
    console.log(`📍 Sample accommodation: ${sampleAccommodation.name}`);
    console.log(`   Coordinates: [${sampleAccommodation.map.coordinates[0]}, ${sampleAccommodation.map.coordinates[1]}]`);
    
    // Test 2: Find nearby accommodations
    console.log('\n🏨 Testing findNearbyAccommodations...');
    const nearbyAccommodations = await Accommodation.findNearbyAccommodations(
      sampleAccommodation._id, 
      5, // 5km radius
      6  // limit 6
    );
    
    console.log(`   Found ${nearbyAccommodations.length} nearby accommodations`);
    
    nearbyAccommodations.forEach((acc, index) => {
      console.log(`   ${index + 1}. ${acc.name}`);
      console.log(`      Distance: ${acc.distance ? acc.distance.toFixed(3) + ' km' : 'N/A'}`);
      console.log(`      Coordinates: [${acc.map.coordinates[0]}, ${acc.map.coordinates[1]}]`);
    });
    
    // Test 3: Find nearby attractions
    console.log('\n🎯 Testing findNearbyAttractions...');
    const nearbyAttractions = await Accommodation.findNearbyAttractions(
      sampleAccommodation._id, 
      5, 
      6
    );
    
    console.log(`   Found ${nearbyAttractions.length} nearby attractions`);
    
    nearbyAttractions.forEach((attr, index) => {
      console.log(`   ${index + 1}. ${attr.name}`);
      console.log(`      Distance: ${attr.distance ? attr.distance.toFixed(3) + ' km' : 'N/A'}`);
      console.log(`      Coordinates: [${attr.map.coordinates[0]}, ${attr.map.coordinates[1]}]`);
    });
    
    // Test 4: Find nearby entertainments
    console.log('\n🎪 Testing findNearbyEntertainments...');
    const nearbyEntertainments = await Accommodation.findNearbyEntertainments(
      sampleAccommodation._id, 
      5, 
      6
    );
    
    console.log(`   Found ${nearbyEntertainments.length} nearby entertainments`);
    
    nearbyEntertainments.forEach((ent, index) => {
      console.log(`   ${index + 1}. ${ent.name}`);
      console.log(`      Distance: ${ent.distance ? ent.distance.toFixed(3) + ' km' : 'N/A'}`);
      console.log(`      Coordinates: [${ent.map.coordinates[0]}, ${ent.map.coordinates[1]}]`);
    });
    
    // Test 5: Find nearby cuisine places
    console.log('\n🍽️ Testing findNearbyCuisinePlaces...');
    const nearbyCuisinePlaces = await Accommodation.findNearbyCuisinePlaces(
      sampleAccommodation._id, 
      5, 
      6
    );
    
    console.log(`   Found ${nearbyCuisinePlaces.length} nearby cuisine places`);
    
    nearbyCuisinePlaces.forEach((place, index) => {
      console.log(`   ${index + 1}. ${place.name}`);
      console.log(`      Distance: ${place.distance ? place.distance.toFixed(3) + ' km' : 'N/A'}`);
      console.log(`      Coordinates: [${place.location.coordinates[0]}, ${place.location.coordinates[1]}]`);
    });
    
    // Test 6: Check if any distance is null/undefined
    console.log('\n🔍 Checking for null/undefined distances...');
    const allPlaces = [
      ...nearbyAccommodations,
      ...nearbyAttractions, 
      ...nearbyEntertainments,
      ...nearbyCuisinePlaces
    ];
    
    const nullDistances = allPlaces.filter(place => 
      place.distance === null || 
      place.distance === undefined || 
      isNaN(place.distance)
    );
    
    if (nullDistances.length > 0) {
      console.log(`❌ Found ${nullDistances.length} places with null/undefined distances:`);
      nullDistances.forEach(place => {
        console.log(`   - ${place.name}: distance = ${place.distance}`);
      });
    } else {
      console.log('✅ All places have valid distances');
    }
    
    console.log('\n✅ Nearby API test completed!');
    
  } catch (error) {
    console.error('❌ Error testing nearby API:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testNearbyAPI();
