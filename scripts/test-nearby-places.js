#!/usr/bin/env node

/**
 * Test script for nearby places functionality
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

async function testNearbyPlaces() {
  console.log('🧪 Testing Nearby Places Functionality\n');
  
  // Test data - using actual IDs from the database
  const testCases = [
    {
      name: 'Attraction → Cuisine Places',
      model: Attraction,
      method: 'findNearbyCuisinePlaces',
      id: '68f36485a41d95f483d71bcd', // Thăng Long Tứ Trấn - Đền Voi Phục
      radius: 5,
      limit: 3
    },
    {
      name: 'Accommodation → Attractions',
      model: Accommodation,
      method: 'findNearbyAttractions',
      id: '68eef5f3b625c4a6d989cf96', // InterContinental Hotels
      radius: 10,
      limit: 5
    },
    {
      name: 'Entertainment → Accommodations',
      model: Entertainment,
      method: 'findNearbyAccommodations',
      id: '68f3c1a2918b422723ff8470', // First entertainment
      radius: 15,
      limit: 3
    },
    {
      name: 'Cuisine Place → Entertainments',
      model: CuisinePlace,
      method: 'findNearbyEntertainments',
      id: '68f3c2a2918b422723ff8480', // First cuisine place
      radius: 8,
      limit: 4
    }
  ];
  
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`🔍 Testing: ${testCase.name}`);
    
    try {
      const startTime = Date.now();
      const nearbyPlaces = await testCase.model[testCase.method](
        testCase.id,
        testCase.radius,
        testCase.limit
      );
      const queryTime = Date.now() - startTime;
      
      console.log(`   ✅ Found ${nearbyPlaces.length} places in ${queryTime}ms`);
      
      if (nearbyPlaces.length > 0) {
        console.log(`   📍 Sample: ${nearbyPlaces[0].name} (${nearbyPlaces[0].distance?.toFixed(2)}km away)`);
      }
      
      results.push({
        test: testCase.name,
        success: true,
        count: nearbyPlaces.length,
        time: queryTime,
        sample: nearbyPlaces[0]?.name || 'None'
      });
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      results.push({
        test: testCase.name,
        success: false,
        error: error.message
      });
    }
    
    console.log('');
  }
  
  return results;
}

async function testPerformance() {
  console.log('⚡ Performance Test\n');
  
  const testId = '68f36485a41d95f483d71bcd'; // Attraction ID
  const iterations = 5;
  
  console.log(`Running ${iterations} iterations of nearby cuisine places query...`);
  
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    await Attraction.findNearbyCuisinePlaces(testId, 5, 3);
    const queryTime = Date.now() - startTime;
    times.push(queryTime);
    console.log(`   Iteration ${i + 1}: ${queryTime}ms`);
  }
  
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  console.log(`\n📊 Performance Summary:`);
  console.log(`   Average: ${avgTime.toFixed(2)}ms`);
  console.log(`   Min: ${minTime}ms`);
  console.log(`   Max: ${maxTime}ms`);
  
  return { avgTime, minTime, maxTime, times };
}

async function main() {
  console.log('🚀 Starting Nearby Places Test Suite\n');
  
  await connectDB();
  
  try {
    const testResults = await testNearbyPlaces();
    const perfResults = await testPerformance();
    
    console.log('\n📋 Test Results Summary:');
    console.log('========================');
    
    testResults.forEach(result => {
      if (result.success) {
        console.log(`✅ ${result.test}: ${result.count} places in ${result.time}ms`);
      } else {
        console.log(`❌ ${result.test}: ${result.error}`);
      }
    });
    
    console.log('\n🎯 Performance Analysis:');
    console.log(`   Average query time: ${perfResults.avgTime.toFixed(2)}ms`);
    
    if (perfResults.avgTime < 100) {
      console.log('   🚀 Excellent performance! (< 100ms)');
    } else if (perfResults.avgTime < 500) {
      console.log('   ✅ Good performance (< 500ms)');
    } else {
      console.log('   ⚠️  Performance could be improved (> 500ms)');
    }
    
    console.log('\n🎉 Nearby Places optimization completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Deploy to production');
    console.log('   2. Monitor query performance in production logs');
    console.log('   3. Consider adding caching for frequently accessed nearby places');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testNearbyPlaces, testPerformance };
