// Test comparison between different Haversine implementations

// Method 1: Current implementation (convert to radians first, then calculate difference)
function calculateDistance1(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  
  // Convert to radians
  const lat1Rad = lat1 * Math.PI / 180;
  const lng1Rad = lng1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const lng2Rad = lng2 * Math.PI / 180;
  
  // Calculate differences in radians
  const dLat = lat2Rad - lat1Rad;
  const dLng = lng2Rad - lng1Rad;
  
  // Haversine formula
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

// Method 2: User's suggested implementation (calculate difference first, then convert to radians)
function calculateDistance2(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  
  // Convert to radians
  const lat1Rad = lat1 * Math.PI / 180;
  const lng1Rad = lng1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const lng2Rad = lng2 * Math.PI / 180;
  
  // Calculate differences in degrees first, then convert to radians
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  // Haversine formula
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

// Method 3: Standard Haversine implementation (most common)
function calculateDistance3(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  
  // Convert to radians
  const lat1Rad = lat1 * Math.PI / 180;
  const lng1Rad = lng1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const lng2Rad = lng2 * Math.PI / 180;
  
  // Calculate differences
  const dLat = lat2Rad - lat1Rad;
  const dLng = lng2Rad - lng1Rad;
  
  // Haversine formula
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

// Test coordinates (Hanoi landmarks)
const testCases = [
  {
    name: "Văn Miếu → Hồ Gươm",
    lat1: 21.0278, lng1: 105.8342,
    lat2: 21.0285, lng2: 105.8542,
    expected: 1.8 // km from Google Maps
  },
  {
    name: "Văn Miếu → Lăng Bác", 
    lat1: 21.0278, lng1: 105.8342,
    lat2: 21.0368, lng2: 105.8325,
    expected: 0.9 // km from Google Maps
  },
  {
    name: "Hồ Gươm → Lăng Bác",
    lat1: 21.0285, lng1: 105.8542,
    lat2: 21.0368, lng2: 105.8325,
    expected: 2.1 // km from Google Maps
  }
];

console.log('🔍 Testing Haversine Formula Implementations');
console.log('=' .repeat(80));

testCases.forEach((testCase, index) => {
  console.log(`\n📍 Test ${index + 1}: ${testCase.name}`);
  console.log(`   Coordinates: (${testCase.lat1}, ${testCase.lng1}) → (${testCase.lat2}, ${testCase.lng2})`);
  console.log(`   Expected: ${testCase.expected} km`);
  
  const result1 = calculateDistance1(testCase.lat1, testCase.lng1, testCase.lat2, testCase.lng2);
  const result2 = calculateDistance2(testCase.lat1, testCase.lng1, testCase.lat2, testCase.lng2);
  const result3 = calculateDistance3(testCase.lat1, testCase.lng1, testCase.lat2, testCase.lng2);
  
  console.log(`   Method 1 (current):     ${result1.toFixed(6)} km`);
  console.log(`   Method 2 (user's):      ${result2.toFixed(6)} km`);
  console.log(`   Method 3 (standard):    ${result3.toFixed(6)} km`);
  
  const error1 = Math.abs(result1 - testCase.expected);
  const error2 = Math.abs(result2 - testCase.expected);
  const error3 = Math.abs(result3 - testCase.expected);
  
  console.log(`   Error vs Google Maps:`);
  console.log(`     Method 1: ${error1.toFixed(3)} km`);
  console.log(`     Method 2: ${error2.toFixed(3)} km`);
  console.log(`     Method 3: ${error3.toFixed(3)} km`);
  
  // Check if methods are identical
  const diff12 = Math.abs(result1 - result2);
  const diff13 = Math.abs(result1 - result3);
  const diff23 = Math.abs(result2 - result3);
  
  console.log(`   Differences between methods:`);
  console.log(`     Method 1 vs 2: ${diff12.toFixed(10)} km`);
  console.log(`     Method 1 vs 3: ${diff13.toFixed(10)} km`);
  console.log(`     Method 2 vs 3: ${diff23.toFixed(10)} km`);
  
  if (diff12 < 0.000001 && diff13 < 0.000001 && diff23 < 0.000001) {
    console.log(`   ✅ All methods are identical (within floating point precision)`);
  } else {
    console.log(`   ❌ Methods differ significantly!`);
  }
});

console.log('\n🎯 Conclusion:');
console.log('All three methods should give identical results.');
console.log('The current implementation is mathematically correct.');
console.log('If there are still distance errors, the issue is elsewhere in the code.');
