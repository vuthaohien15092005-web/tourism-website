const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const CuisinePlace = require('../model/CuisinePlace');

async function fixInvalidCoordinates() {
  try {
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/tourism-hanoi');
    console.log('✅ Connected to MongoDB');
    
    console.log('\n🔧 Fixing Invalid Coordinates');
    console.log('=' .repeat(60));
    
    // Find places with invalid coordinates
    const invalidPlaces = await CuisinePlace.find({
      isActive: true,
      $or: [
        { 'location.coordinates.0': { $lt: 100 } }, // Longitude too small for Vietnam
        { 'location.coordinates.0': { $gt: 110 } }, // Longitude too large for Vietnam
        { 'location.coordinates.1': { $lt: 15 } },  // Latitude too small for Vietnam
        { 'location.coordinates.1': { $gt: 25 } }   // Latitude too large for Vietnam
      ]
    });
    
    console.log(`Found ${invalidPlaces.length} places with invalid coordinates:`);
    
    invalidPlaces.forEach((place, index) => {
      console.log(`   ${index + 1}. ${place.name}`);
      console.log(`      Current: [${place.location.coordinates[0]}, ${place.location.coordinates[1]}]`);
    });
    
    // Fix coordinates for each invalid place
    for (const place of invalidPlaces) {
      // Set to a default Hanoi location (Văn Miếu area)
      const newCoordinates = [105.8357, 21.0283]; // Văn Miếu coordinates
      
      console.log(`\n🔧 Fixing ${place.name}:`);
      console.log(`   From: [${place.location.coordinates[0]}, ${place.location.coordinates[1]}]`);
      console.log(`   To:   [${newCoordinates[0]}, ${newCoordinates[1]}]`);
      
      await CuisinePlace.updateOne(
        { _id: place._id },
        { 
          $set: { 
            'location.coordinates': newCoordinates 
          } 
        }
      );
      
      console.log(`   ✅ Updated successfully`);
    }
    
    // Verify the fix
    console.log('\n🔍 Verifying fixes...');
    const remainingInvalid = await CuisinePlace.countDocuments({
      isActive: true,
      $or: [
        { 'location.coordinates.0': { $lt: 100 } },
        { 'location.coordinates.0': { $gt: 110 } },
        { 'location.coordinates.1': { $lt: 15 } },
        { 'location.coordinates.1': { $gt: 25 } }
      ]
    });
    
    console.log(`Remaining invalid coordinates: ${remainingInvalid}`);
    
    if (remainingInvalid === 0) {
      console.log('✅ All invalid coordinates have been fixed!');
    } else {
      console.log('❌ Some coordinates are still invalid');
    }
    
    console.log('\n✅ Coordinate fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing coordinates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixInvalidCoordinates();
