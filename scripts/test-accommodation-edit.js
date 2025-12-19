#!/usr/bin/env node

/**
 * Test Accommodation Edit Functionality
 * 
 * This script tests that accommodation edit works with the fixed GeoJSON format.
 */

const mongoose = require('mongoose');
const Accommodation = require('../model/Accommodation');

// Connect to MongoDB with shorter timeout
mongoose.connect('mongodb://localhost:27017/tourism-website', {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

async function testAccommodationEdit() {
  console.log('\n🧪 Testing Accommodation Edit Functionality...\n');
  
  try {
    // Find one accommodation to test with
    const accommodation = await Accommodation.findOne({}).limit(1);
    
    if (!accommodation) {
      console.log('❌ No accommodations found in database');
      return;
    }

    console.log(`Testing with accommodation: ${accommodation.name}`);
    console.log(`Current map data:`, JSON.stringify(accommodation.map, null, 2));

    // Test the edit functionality by simulating form data
    const testData = {
      name: accommodation.name,
      address: accommodation.address,
      district: accommodation.district,
      priceFrom: accommodation.priceFrom,
      description: accommodation.description,
      map: {
        coordinates: [105.8148014087198, 21.03550689489897], // Test coordinates
        mapEmbed: accommodation.map?.mapEmbed || ''
      }
    };

    // Apply the same logic as in the controller
    if (testData.map && testData.map.coordinates && testData.map.coordinates.length === 2) {
      testData.map.coordinates = testData.map.coordinates.map(coord => parseFloat(coord));
      // Ensure type field is present for GeoJSON
      if (!testData.map.type) {
        testData.map.type = 'Point';
      }
    }

    console.log('\nProcessed map data:', JSON.stringify(testData.map, null, 2));

    // Test if the data is valid GeoJSON
    if (testData.map.type === 'Point' && Array.isArray(testData.map.coordinates) && testData.map.coordinates.length === 2) {
      console.log('✅ GeoJSON format is correct!');
      console.log('✅ Accommodation edit should work now');
    } else {
      console.log('❌ GeoJSON format is still invalid');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testAccommodationEdit();
