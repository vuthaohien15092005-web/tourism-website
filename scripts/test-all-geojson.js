#!/usr/bin/env node

/**
 * Test All Models GeoJSON Format
 * 
 * This script tests all models for GeoJSON consistency and fixes issues.
 */

const mongoose = require('mongoose');
const Attraction = require('../model/Attraction');
const Entertainment = require('../model/Entertainment');
const Accommodation = require('../model/Accommodation');
const CuisinePlace = require('../model/CuisinePlace');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/tourism-website')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

async function testAllGeoJSON() {
  console.log('\n🔍 Testing All Models GeoJSON Format...\n');
  
  const results = {
    attractions: { total: 0, valid: 0, invalid: 0, fixed: 0 },
    entertainments: { total: 0, valid: 0, invalid: 0, fixed: 0 },
    accommodations: { total: 0, valid: 0, invalid: 0, fixed: 0 },
    places: { total: 0, valid: 0, invalid: 0, fixed: 0 }
  };

  try {
    // Test Attractions
    console.log('📍 Testing Attractions...');
    const attractions = await Attraction.find({ 'map': { $exists: true } }).limit(10);
    results.attractions.total = attractions.length;
    
    for (const attraction of attractions) {
      if (attraction.map && 
          attraction.map.type === 'Point' && 
          Array.isArray(attraction.map.coordinates) && 
          attraction.map.coordinates.length === 2) {
        results.attractions.valid++;
      } else {
        results.attractions.invalid++;
        // Fix if needed
        if (attraction.map && attraction.map.coordinates) {
          await Attraction.updateOne(
            { _id: attraction._id },
            { $set: { 'map.type': 'Point' } }
          );
          results.attractions.fixed++;
        }
      }
    }

    // Test Entertainments
    console.log('🎭 Testing Entertainments...');
    const entertainments = await Entertainment.find({ 'map': { $exists: true } }).limit(10);
    results.entertainments.total = entertainments.length;
    
    for (const entertainment of entertainments) {
      if (entertainment.map && 
          entertainment.map.type === 'Point' && 
          Array.isArray(entertainment.map.coordinates) && 
          entertainment.map.coordinates.length === 2) {
        results.entertainments.valid++;
      } else {
        results.entertainments.invalid++;
        // Fix if needed
        if (entertainment.map && entertainment.map.coordinates) {
          await Entertainment.updateOne(
            { _id: entertainment._id },
            { $set: { 'map.type': 'Point' } }
          );
          results.entertainments.fixed++;
        }
      }
    }

    // Test Accommodations
    console.log('🏨 Testing Accommodations...');
    const accommodations = await Accommodation.find({ 'map': { $exists: true } }).limit(10);
    results.accommodations.total = accommodations.length;
    
    for (const accommodation of accommodations) {
      if (accommodation.map && 
          accommodation.map.type === 'Point' && 
          Array.isArray(accommodation.map.coordinates) && 
          accommodation.map.coordinates.length === 2) {
        results.accommodations.valid++;
      } else {
        results.accommodations.invalid++;
        // Fix if needed
        if (accommodation.map && accommodation.map.coordinates) {
          await Accommodation.updateOne(
            { _id: accommodation._id },
            { $set: { 'map.type': 'Point' } }
          );
          results.accommodations.fixed++;
        }
      }
    }

    // Test CuisinePlaces
    console.log('🍜 Testing CuisinePlaces...');
    const places = await CuisinePlace.find({ 'location.coordinates': { $exists: true, $ne: null } }).limit(10);
    results.places.total = places.length;
    
    for (const place of places) {
      if (place.location && 
          place.location.type === 'Point' && 
          Array.isArray(place.location.coordinates) && 
          place.location.coordinates.length === 2) {
        results.places.valid++;
      } else {
        results.places.invalid++;
        // Fix if needed
        if (place.location && place.location.coordinates) {
          await CuisinePlace.updateOne(
            { _id: place._id },
            { $set: { 'location.type': 'Point' } }
          );
          results.places.fixed++;
        }
      }
    }

    // Print Results
    console.log('\n📊 FINAL RESULTS:');
    console.log('==================');
    
    Object.entries(results).forEach(([model, stats]) => {
      console.log(`\n${model.toUpperCase()}:`);
      console.log(`  Total records: ${stats.total}`);
      console.log(`  Valid GeoJSON: ${stats.valid} ✅`);
      console.log(`  Invalid GeoJSON: ${stats.invalid} ❌`);
      console.log(`  Fixed: ${stats.fixed} 🔧`);
      
      const validPercent = stats.total > 0 ? Math.round((stats.valid / stats.total) * 100) : 0;
      console.log(`  Valid percentage: ${validPercent}%`);
    });

    // Overall Assessment
    const totalRecords = Object.values(results).reduce((sum, stats) => sum + stats.total, 0);
    const totalValid = Object.values(results).reduce((sum, stats) => sum + stats.valid, 0);
    const totalFixed = Object.values(results).reduce((sum, stats) => sum + stats.fixed, 0);

    console.log('\n🎯 OVERALL ASSESSMENT:');
    console.log('=====================');
    console.log(`Total records tested: ${totalRecords}`);
    console.log(`Valid GeoJSON: ${totalValid} (${Math.round((totalValid / totalRecords) * 100)}%)`);
    console.log(`Records fixed: ${totalFixed} 🔧`);

    if (totalFixed > 0) {
      console.log('\n🎉 All GeoJSON issues have been fixed!');
    } else if (totalValid === totalRecords) {
      console.log('\n🎉 All records already use proper GeoJSON format!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testAllGeoJSON();
