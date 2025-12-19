#!/usr/bin/env node

/**
 * Test CuisinePlaces GeoJSON Format
 * 
 * This script tests cuisine places GeoJSON format and fixes any issues.
 */

const mongoose = require('mongoose');
const CuisinePlace = require('../model/CuisinePlace');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/tourism-website')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

async function testPlacesGeoJSON() {
  console.log('\n🍜 Testing CuisinePlaces GeoJSON Format...\n');
  
  try {
    // Find places with location data
    const places = await CuisinePlace.find({
      'location.coordinates': { $exists: true, $ne: null }
    }).limit(5);

    console.log(`Found ${places.length} places with location data`);

    if (places.length === 0) {
      console.log('ℹ️ No places with location data found');
      return;
    }

    let validCount = 0;
    let invalidCount = 0;

    places.forEach((place, index) => {
      console.log(`\n${index + 1}. ${place.name}`);
      console.log(`   Location data:`, JSON.stringify(place.location, null, 2));
      
      // Check GeoJSON format
      if (place.location && 
          place.location.type === 'Point' && 
          Array.isArray(place.location.coordinates) && 
          place.location.coordinates.length === 2) {
        console.log('   ✅ Valid GeoJSON format');
        validCount++;
      } else {
        console.log('   ❌ Invalid GeoJSON format');
        invalidCount++;
      }
    });

    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total checked: ${places.length}`);
    console.log(`Valid GeoJSON: ${validCount} ✅`);
    console.log(`Invalid GeoJSON: ${invalidCount} ❌`);

    if (invalidCount > 0) {
      console.log('\n🔧 Fixing invalid GeoJSON records...');
      
      for (const place of places) {
        if (!(place.location && 
              place.location.type === 'Point' && 
              Array.isArray(place.location.coordinates) && 
              place.location.coordinates.length === 2)) {
          
          try {
            // Fix the GeoJSON format
            const fixedLocation = {
              type: 'Point',
              coordinates: place.location.coordinates || [0, 0]
            };
            
            await CuisinePlace.updateOne(
              { _id: place._id },
              { $set: { location: fixedLocation } }
            );
            
            console.log(`✅ Fixed: ${place.name}`);
          } catch (error) {
            console.error(`❌ Error fixing ${place.name}:`, error.message);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testPlacesGeoJSON();
