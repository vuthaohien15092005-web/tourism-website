const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Accommodation = require('../model/Accommodation');
const Attraction = require('../model/Attraction');
const Entertainment = require('../model/Entertainment');
const CuisinePlace = require('../model/CuisinePlace');

async function checkCoordinatesData() {
  try {
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/tourism-hanoi');
    console.log('✅ Connected to MongoDB');
    
    console.log('\n🔍 Checking Coordinates Data Quality');
    console.log('=' .repeat(60));
    
    // Check Accommodations
    console.log('\n🏨 Accommodations:');
    const accommodations = await Accommodation.find({ 
      isActive: true, 
      status: 'public' 
    }).limit(5).lean();
    
    accommodations.forEach((acc, index) => {
      console.log(`   ${index + 1}. ${acc.name}`);
      if (acc.map && acc.map.coordinates) {
        const [lng, lat] = acc.map.coordinates;
        console.log(`      Coordinates: [${lng}, ${lat}]`);
        console.log(`      Valid: ${lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90}`);
        console.log(`      Distance from center: ${Math.sqrt(lng*lng + lat*lat).toFixed(3)}`);
      } else {
        console.log(`      ❌ No coordinates!`);
      }
    });
    
    // Check Attractions
    console.log('\n🎯 Attractions:');
    const attractions = await Attraction.find({ 
      isActive: true 
    }).limit(5).lean();
    
    attractions.forEach((attr, index) => {
      console.log(`   ${index + 1}. ${attr.name}`);
      if (attr.map && attr.map.coordinates) {
        const [lng, lat] = attr.map.coordinates;
        console.log(`      Coordinates: [${lng}, ${lat}]`);
        console.log(`      Valid: ${lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90}`);
        console.log(`      Distance from center: ${Math.sqrt(lng*lng + lat*lat).toFixed(3)}`);
      } else {
        console.log(`      ❌ No coordinates!`);
      }
    });
    
    // Check Entertainments
    console.log('\n🎪 Entertainments:');
    const entertainments = await Entertainment.find({ 
      isActive: true 
    }).limit(5).lean();
    
    entertainments.forEach((ent, index) => {
      console.log(`   ${index + 1}. ${ent.name}`);
      if (ent.map && ent.map.coordinates) {
        const [lng, lat] = ent.map.coordinates;
        console.log(`      Coordinates: [${lng}, ${lat}]`);
        console.log(`      Valid: ${lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90}`);
        console.log(`      Distance from center: ${Math.sqrt(lng*lng + lat*lat).toFixed(3)}`);
      } else {
        console.log(`      ❌ No coordinates!`);
      }
    });
    
    // Check Cuisine Places
    console.log('\n🍽️ Cuisine Places:');
    const cuisinePlaces = await CuisinePlace.find({ 
      isActive: true 
    }).limit(5).lean();
    
    cuisinePlaces.forEach((place, index) => {
      console.log(`   ${index + 1}. ${place.name}`);
      if (place.location && place.location.coordinates) {
        const [lng, lat] = place.location.coordinates;
        console.log(`      Coordinates: [${lng}, ${lat}]`);
        console.log(`      Valid: ${lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90}`);
        console.log(`      Distance from center: ${Math.sqrt(lng*lng + lat*lat).toFixed(3)}`);
      } else {
        console.log(`      ❌ No coordinates!`);
      }
    });
    
    // Check for invalid coordinates
    console.log('\n🚨 Checking for invalid coordinates:');
    
    const invalidAccommodations = await Accommodation.countDocuments({
      isActive: true,
      status: 'public',
      $or: [
        { 'map.coordinates': { $exists: false } },
        { 'map.coordinates': [0, 0] },
        { 'map.coordinates.0': { $lt: -180 } },
        { 'map.coordinates.0': { $gt: 180 } },
        { 'map.coordinates.1': { $lt: -90 } },
        { 'map.coordinates.1': { $gt: 90 } }
      ]
    });
    
    const invalidAttractions = await Attraction.countDocuments({
      isActive: true,
      $or: [
        { 'map.coordinates': { $exists: false } },
        { 'map.coordinates': [0, 0] },
        { 'map.coordinates.0': { $lt: -180 } },
        { 'map.coordinates.0': { $gt: 180 } },
        { 'map.coordinates.1': { $lt: -90 } },
        { 'map.coordinates.1': { $gt: 90 } }
      ]
    });
    
    const invalidEntertainments = await Entertainment.countDocuments({
      isActive: true,
      $or: [
        { 'map.coordinates': { $exists: false } },
        { 'map.coordinates': [0, 0] },
        { 'map.coordinates.0': { $lt: -180 } },
        { 'map.coordinates.0': { $gt: 180 } },
        { 'map.coordinates.1': { $lt: -90 } },
        { 'map.coordinates.1': { $gt: 90 } }
      ]
    });
    
    const invalidCuisinePlaces = await CuisinePlace.countDocuments({
      isActive: true,
      $or: [
        { 'location.coordinates': { $exists: false } },
        { 'location.coordinates': [0, 0] },
        { 'location.coordinates.0': { $lt: -180 } },
        { 'location.coordinates.0': { $gt: 180 } },
        { 'location.coordinates.1': { $lt: -90 } },
        { 'location.coordinates.1': { $gt: 90 } }
      ]
    });
    
    console.log(`   Invalid Accommodations: ${invalidAccommodations}`);
    console.log(`   Invalid Attractions: ${invalidAttractions}`);
    console.log(`   Invalid Entertainments: ${invalidEntertainments}`);
    console.log(`   Invalid Cuisine Places: ${invalidCuisinePlaces}`);
    
    console.log('\n✅ Coordinates data check completed!');
    
  } catch (error) {
    console.error('❌ Error checking coordinates data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the check
checkCoordinatesData();
