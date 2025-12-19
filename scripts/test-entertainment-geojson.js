#!/usr/bin/env node

/**
 * Test Entertainment GeoJSON Format
 * 
 * This script tests entertainment GeoJSON format and fixes any issues.
 */

const mongoose = require('mongoose');
const Entertainment = require('../model/Entertainment');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/tourism-website')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

async function testEntertainmentGeoJSON() {
  console.log('\n🎭 Testing Entertainment GeoJSON Format...\n');
  
  try {
    // Find entertainments with map data
    const entertainments = await Entertainment.find({
      'map': { $exists: true }
    }).limit(5);

    console.log(`Found ${entertainments.length} entertainments with map data`);

    if (entertainments.length === 0) {
      console.log('ℹ️ No entertainments with map data found');
      return;
    }

    let validCount = 0;
    let invalidCount = 0;

    entertainments.forEach((entertainment, index) => {
      console.log(`\n${index + 1}. ${entertainment.name}`);
      console.log(`   Map data:`, JSON.stringify(entertainment.map, null, 2));
      
      // Check GeoJSON format
      if (entertainment.map && 
          entertainment.map.type === 'Point' && 
          Array.isArray(entertainment.map.coordinates) && 
          entertainment.map.coordinates.length === 2) {
        console.log('   ✅ Valid GeoJSON format');
        validCount++;
      } else {
        console.log('   ❌ Invalid GeoJSON format');
        invalidCount++;
      }
    });

    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total checked: ${entertainments.length}`);
    console.log(`Valid GeoJSON: ${validCount} ✅`);
    console.log(`Invalid GeoJSON: ${invalidCount} ❌`);

    if (invalidCount > 0) {
      console.log('\n🔧 Fixing invalid GeoJSON records...');
      
      for (const entertainment of entertainments) {
        if (!(entertainment.map && 
              entertainment.map.type === 'Point' && 
              Array.isArray(entertainment.map.coordinates) && 
              entertainment.map.coordinates.length === 2)) {
          
          try {
            // Fix the GeoJSON format
            const fixedMap = {
              type: 'Point',
              coordinates: entertainment.map.coordinates || [0, 0],
              embedUrl: entertainment.map.embedUrl || ''
            };
            
            await Entertainment.updateOne(
              { _id: entertainment._id },
              { $set: { map: fixedMap } }
            );
            
            console.log(`✅ Fixed: ${entertainment.name}`);
          } catch (error) {
            console.error(`❌ Error fixing ${entertainment.name}:`, error.message);
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
testEntertainmentGeoJSON();
