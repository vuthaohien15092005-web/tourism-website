const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Accommodation = require('../model/Accommodation');
const Attraction = require('../model/Attraction');
const Entertainment = require('../model/Entertainment');
const CuisinePlace = require('../model/CuisinePlace');

async function getSampleIds() {
  try {
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/tourism-hanoi');
    console.log('✅ Connected to MongoDB');
    
    console.log('\n🔍 Getting sample IDs for testing');
    console.log('=' .repeat(60));
    
    // Get sample accommodation
    const sampleAccommodation = await Accommodation.findOne({ 
      isActive: true, 
      status: 'public',
      'map.coordinates': { $exists: true, $ne: [0, 0] }
    }).lean();
    
    if (sampleAccommodation) {
      console.log(`📍 Sample Accommodation:`);
      console.log(`   ID: ${sampleAccommodation._id}`);
      console.log(`   Name: ${sampleAccommodation.name}`);
      console.log(`   Coordinates: [${sampleAccommodation.map.coordinates[0]}, ${sampleAccommodation.map.coordinates[1]}]`);
    }
    
    // Get sample attraction
    const sampleAttraction = await Attraction.findOne({ 
      isActive: true,
      'map.coordinates': { $exists: true, $ne: [0, 0] }
    }).lean();
    
    if (sampleAttraction) {
      console.log(`\n🎯 Sample Attraction:`);
      console.log(`   ID: ${sampleAttraction._id}`);
      console.log(`   Name: ${sampleAttraction.name}`);
      console.log(`   Coordinates: [${sampleAttraction.map.coordinates[0]}, ${sampleAttraction.map.coordinates[1]}]`);
    }
    
    // Get sample entertainment
    const sampleEntertainment = await Entertainment.findOne({ 
      isActive: true,
      'map.coordinates': { $exists: true, $ne: [0, 0] }
    }).lean();
    
    if (sampleEntertainment) {
      console.log(`\n🎪 Sample Entertainment:`);
      console.log(`   ID: ${sampleEntertainment._id}`);
      console.log(`   Name: ${sampleEntertainment.name}`);
      console.log(`   Coordinates: [${sampleEntertainment.map.coordinates[0]}, ${sampleEntertainment.map.coordinates[1]}]`);
    }
    
    // Get sample cuisine place
    const sampleCuisinePlace = await CuisinePlace.findOne({ 
      isActive: true,
      'location.coordinates': { $exists: true, $ne: [0, 0] }
    }).lean();
    
    if (sampleCuisinePlace) {
      console.log(`\n🍽️ Sample Cuisine Place:`);
      console.log(`   ID: ${sampleCuisinePlace._id}`);
      console.log(`   Name: ${sampleCuisinePlace.name}`);
      console.log(`   Coordinates: [${sampleCuisinePlace.location.coordinates[0]}, ${sampleCuisinePlace.location.coordinates[1]}]`);
    }
    
    console.log('\n✅ Sample IDs retrieved!');
    
  } catch (error) {
    console.error('❌ Error getting sample IDs:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the function
getSampleIds();
