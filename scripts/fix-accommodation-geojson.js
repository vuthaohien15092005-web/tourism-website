#!/usr/bin/env node

/**
 * Fix Accommodation GeoJSON Format
 * 
 * This script fixes existing accommodation records that have coordinates
 * but are missing the required 'type: "Point"' field for proper GeoJSON format.
 */

const mongoose = require('mongoose');
const Accommodation = require('../model/Accommodation');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/tourism-website')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

async function fixAccommodationGeoJSON() {
  console.log('\n🔧 Fixing Accommodation GeoJSON Format...\n');
  
  try {
    // Find accommodations with coordinates but missing type field
    const accommodations = await Accommodation.find({
      'map.coordinates': { $exists: true, $ne: [0, 0] },
      'map.type': { $exists: false }
    });

    console.log(`Found ${accommodations.length} accommodations with missing GeoJSON type field`);

    if (accommodations.length === 0) {
      console.log('✅ No accommodations need fixing!');
      return;
    }

    let fixedCount = 0;
    let errorCount = 0;

    for (const accommodation of accommodations) {
      try {
        // Add the missing type field
        await Accommodation.updateOne(
          { _id: accommodation._id },
          { 
            $set: { 
              'map.type': 'Point' 
            } 
          }
        );
        
        console.log(`✅ Fixed: ${accommodation.name} (${accommodation._id})`);
        fixedCount++;
      } catch (error) {
        console.error(`❌ Error fixing ${accommodation.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total processed: ${accommodations.length}`);
    console.log(`Successfully fixed: ${fixedCount} ✅`);
    console.log(`Errors: ${errorCount} ❌`);

    if (fixedCount > 0) {
      console.log('\n🎉 Accommodation GeoJSON format has been fixed!');
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
}

// Run the fix
fixAccommodationGeoJSON();
