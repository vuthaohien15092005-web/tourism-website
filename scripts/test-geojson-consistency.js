#!/usr/bin/env node

/**
 * Test GeoJSON Consistency Across All Models
 * 
 * This script tests that all models (Attraction, Entertainment, Accommodation, CuisinePlace)
 * are using consistent GeoJSON format for location data.
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

async function testGeoJSONConsistency() {
  console.log('\n🔍 Testing GeoJSON Consistency Across All Models...\n');
  
  const results = {
    attractions: { total: 0, geojson: 0, legacy: 0, invalid: 0 },
    entertainments: { total: 0, geojson: 0, legacy: 0, invalid: 0 },
    accommodations: { total: 0, geojson: 0, legacy: 0, invalid: 0 },
    cuisinePlaces: { total: 0, geojson: 0, legacy: 0, invalid: 0 }
  };

  try {
    // Test Attractions
    console.log('📍 Testing Attractions...');
    const attractions = await Attraction.find({}).limit(10);
    results.attractions.total = attractions.length;
    
    attractions.forEach(attraction => {
      if (attraction.map) {
        if (attraction.map.type === 'Point' && Array.isArray(attraction.map.coordinates)) {
          results.attractions.geojson++;
        } else if (attraction.map.lat && attraction.map.lng) {
          results.attractions.legacy++;
        } else {
          results.attractions.invalid++;
        }
      }
    });

    // Test Entertainments
    console.log('🎭 Testing Entertainments...');
    const entertainments = await Entertainment.find({}).limit(10);
    results.entertainments.total = entertainments.length;
    
    entertainments.forEach(entertainment => {
      if (entertainment.map) {
        if (entertainment.map.type === 'Point' && Array.isArray(entertainment.map.coordinates)) {
          results.entertainments.geojson++;
        } else if (entertainment.map.lat && entertainment.map.lng) {
          results.entertainments.legacy++;
        } else {
          results.entertainments.invalid++;
        }
      }
    });

    // Test Accommodations
    console.log('🏨 Testing Accommodations...');
    const accommodations = await Accommodation.find({}).limit(10);
    results.accommodations.total = accommodations.length;
    
    accommodations.forEach(accommodation => {
      if (accommodation.map) {
        if (accommodation.map.type === 'Point' && Array.isArray(accommodation.map.coordinates)) {
          results.accommodations.geojson++;
        } else if (accommodation.map.lat && accommodation.map.lng) {
          results.accommodations.legacy++;
        } else {
          results.accommodations.invalid++;
        }
      }
    });

    // Test CuisinePlaces
    console.log('🍜 Testing CuisinePlaces...');
    const cuisinePlaces = await CuisinePlace.find({}).limit(10);
    results.cuisinePlaces.total = cuisinePlaces.length;
    
    cuisinePlaces.forEach(place => {
      if (place.location) {
        if (place.location.type === 'Point' && Array.isArray(place.location.coordinates)) {
          results.cuisinePlaces.geojson++;
        } else {
          results.cuisinePlaces.invalid++;
        }
      }
    });

    // Print Results
    console.log('\n📊 RESULTS SUMMARY:');
    console.log('==================');
    
    Object.entries(results).forEach(([model, stats]) => {
      console.log(`\n${model.toUpperCase()}:`);
      console.log(`  Total records: ${stats.total}`);
      console.log(`  GeoJSON format: ${stats.geojson} ✅`);
      console.log(`  Legacy format: ${stats.legacy} ⚠️`);
      console.log(`  Invalid format: ${stats.invalid} ❌`);
      
      const geojsonPercent = stats.total > 0 ? Math.round((stats.geojson / stats.total) * 100) : 0;
      console.log(`  GeoJSON coverage: ${geojsonPercent}%`);
    });

    // Overall Assessment
    const totalRecords = Object.values(results).reduce((sum, stats) => sum + stats.total, 0);
    const totalGeoJSON = Object.values(results).reduce((sum, stats) => sum + stats.geojson, 0);
    const totalLegacy = Object.values(results).reduce((sum, stats) => sum + stats.legacy, 0);
    const totalInvalid = Object.values(results).reduce((sum, stats) => sum + stats.invalid, 0);

    console.log('\n🎯 OVERALL ASSESSMENT:');
    console.log('=====================');
    console.log(`Total records tested: ${totalRecords}`);
    console.log(`GeoJSON format: ${totalGeoJSON} (${Math.round((totalGeoJSON / totalRecords) * 100)}%)`);
    console.log(`Legacy format: ${totalLegacy} (${Math.round((totalLegacy / totalRecords) * 100)}%)`);
    console.log(`Invalid format: ${totalInvalid} (${Math.round((totalInvalid / totalRecords) * 100)}%)`);

    if (totalLegacy > 0) {
      console.log('\n⚠️  WARNING: Some records still use legacy format. Consider running migration scripts.');
    }

    if (totalInvalid > 0) {
      console.log('\n❌ ERROR: Some records have invalid format. These need to be fixed.');
    }

    if (totalLegacy === 0 && totalInvalid === 0) {
      console.log('\n🎉 SUCCESS: All records use proper GeoJSON format!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
}

// Run the test
testGeoJSONConsistency();
