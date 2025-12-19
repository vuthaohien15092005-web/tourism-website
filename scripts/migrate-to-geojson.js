#!/usr/bin/env node

/**
 * Migration script to convert existing lat/lng coordinates to GeoJSON Point format
 * This script ensures all models use consistent GeoJSON Point format for optimal geo queries
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Accommodation = require('../model/Accommodation');
const Attraction = require('../model/Attraction');
const Entertainment = require('../model/Entertainment');
const CuisinePlace = require('../model/CuisinePlace');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/tourism-website');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function migrateAccommodations() {
  console.log('\n🔄 Migrating Accommodations...');
  
  const accommodations = await Accommodation.find({
    $or: [
      { 'map.coordinates': { $exists: false } },
      { 'map.coordinates': [0, 0] },
      { 'map.coordinates': null }
    ]
  });
  
  let migrated = 0;
  
  for (const acc of accommodations) {
    // Try to get coordinates from legacy fields or set default
    let coordinates = [0, 0];
    
    if (acc.map && acc.map.coordinates && acc.map.coordinates.length === 2 && 
        acc.map.coordinates[0] !== 0 && acc.map.coordinates[1] !== 0) {
      coordinates = acc.map.coordinates;
    } else if (acc.map && acc.map.lat && acc.map.lng) {
      coordinates = [acc.map.lng, acc.map.lat]; // Convert to [lng, lat] format
    }
    
    // Clean up the map object to only have GeoJSON format
    await Accommodation.updateOne(
      { _id: acc._id },
      { 
        $set: { 
          'map.type': 'Point',
          'map.coordinates': coordinates
        },
        $unset: {
          'map.lat': '',
          'map.lng': ''
        }
      }
    );
    
    migrated++;
  }
  
  console.log(`✅ Migrated ${migrated} accommodations`);
}

async function migrateAttractions() {
  console.log('\n🔄 Migrating Attractions...');
  
  const attractions = await Attraction.find({
    $or: [
      { 'map.coordinates': { $exists: false } },
      { 'map.coordinates': [0, 0] },
      { 'map.coordinates': null }
    ]
  });
  
  let migrated = 0;
  
  for (const attr of attractions) {
    let coordinates = [0, 0];
    
    if (attr.map && attr.map.coordinates && attr.map.coordinates.length === 2 && 
        attr.map.coordinates[0] !== 0 && attr.map.coordinates[1] !== 0) {
      coordinates = attr.map.coordinates;
    } else if (attr.map && attr.map.lat && attr.map.lng) {
      coordinates = [attr.map.lng, attr.map.lat]; // Convert to [lng, lat] format
    }
    
    // Clean up the map object to only have GeoJSON format
    await Attraction.updateOne(
      { _id: attr._id },
      { 
        $set: { 
          'map.type': 'Point',
          'map.coordinates': coordinates
        },
        $unset: {
          'map.lat': '',
          'map.lng': ''
        }
      }
    );
    
    migrated++;
  }
  
  console.log(`✅ Migrated ${migrated} attractions`);
}

async function migrateEntertainments() {
  console.log('\n🔄 Migrating Entertainments...');
  
  const entertainments = await Entertainment.find({
    $or: [
      { 'map.coordinates': { $exists: false } },
      { 'map.coordinates': [0, 0] },
      { 'map.coordinates': null }
    ]
  });
  
  let migrated = 0;
  
  for (const ent of entertainments) {
    let coordinates = [0, 0];
    
    if (ent.map && ent.map.coordinates && ent.map.coordinates.length === 2 && 
        ent.map.coordinates[0] !== 0 && ent.map.coordinates[1] !== 0) {
      coordinates = ent.map.coordinates;
    } else if (ent.map && ent.map.lat && ent.map.lng) {
      coordinates = [ent.map.lng, ent.map.lat]; // Convert to [lng, lat] format
    }
    
    // Clean up the map object to only have GeoJSON format
    await Entertainment.updateOne(
      { _id: ent._id },
      { 
        $set: { 
          'map.type': 'Point',
          'map.coordinates': coordinates
        },
        $unset: {
          'map.lat': '',
          'map.lng': ''
        }
      }
    );
    
    migrated++;
  }
  
  console.log(`✅ Migrated ${migrated} entertainments`);
}

async function createIndexes() {
  console.log('\n🔄 Creating 2dsphere indexes...');
  
  try {
    // Create 2dsphere indexes for all models
    await Accommodation.collection.createIndex({ map: '2dsphere' }, { sparse: true });
    console.log('✅ Created 2dsphere index for Accommodations');
    
    await Attraction.collection.createIndex({ map: '2dsphere' }, { sparse: true });
    console.log('✅ Created 2dsphere index for Attractions');
    
    await Entertainment.collection.createIndex({ map: '2dsphere' }, { sparse: true });
    console.log('✅ Created 2dsphere index for Entertainments');
    
    // CuisinePlace already has the index, but let's ensure it exists
    await CuisinePlace.collection.createIndex({ location: '2dsphere' }, { sparse: true });
    console.log('✅ Ensured 2dsphere index for CuisinePlaces');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  }
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  const accCount = await Accommodation.countDocuments({ 'map.type': 'Point' });
  const attrCount = await Attraction.countDocuments({ 'map.type': 'Point' });
  const entCount = await Entertainment.countDocuments({ 'map.type': 'Point' });
  const cuisineCount = await CuisinePlace.countDocuments({ 'location.type': 'Point' });
  
  console.log(`📊 Migration results:`);
  console.log(`   - Accommodations with GeoJSON: ${accCount}`);
  console.log(`   - Attractions with GeoJSON: ${attrCount}`);
  console.log(`   - Entertainments with GeoJSON: ${entCount}`);
  console.log(`   - CuisinePlaces with GeoJSON: ${cuisineCount}`);
}

async function main() {
  console.log('🚀 Starting GeoJSON migration...');
  
  await connectDB();
  
  try {
    await migrateAccommodations();
    await migrateAttractions();
    await migrateEntertainments();
    await createIndexes();
    await verifyMigration();
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test nearby places functionality');
    console.log('   2. Monitor query performance in logs');
    console.log('   3. Update any remaining legacy coordinate references');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { migrateAccommodations, migrateAttractions, migrateEntertainments, createIndexes };
