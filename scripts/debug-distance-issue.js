#!/usr/bin/env node

/**
 * Debug Distance Issue
 * 
 * Simple script to debug the distance calculation issue
 */

// Test coordinates (Hanoi landmarks)
const testCoordinates = {
  // Văn Miếu - Quốc Tử Giám
  vanMieu: {
    name: 'Văn Miếu - Quốc Tử Giám',
    lat: 21.0278,
    lng: 105.8342,
    coordinates: [105.8342, 21.0278] // [lng, lat] GeoJSON format
  },
  // Hồ Gươm
  hoGuom: {
    name: 'Hồ Gươm',
    lat: 21.0285,
    lng: 105.8542,
    coordinates: [105.8542, 21.0285]
  }
};

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

console.log('🔍 Debugging Distance Calculation Issue\n');

const vanMieu = testCoordinates.vanMieu;
const hoGuom = testCoordinates.hoGuom;

console.log('📍 Test Coordinates:');
console.log(`Văn Miếu: lat=${vanMieu.lat}, lng=${vanMieu.lng}`);
console.log(`Hồ Gươm:  lat=${hoGuom.lat}, lng=${hoGuom.lng}`);
console.log('');

// Test different coordinate orders
console.log('🧪 Testing Different Coordinate Orders:');
console.log('======================================');

// Test 1: Correct order (lat1, lng1, lat2, lng2)
const dist1 = calculateDistance(vanMieu.lat, vanMieu.lng, hoGuom.lat, hoGuom.lng);
console.log(`1. Correct order: calculateDistance(${vanMieu.lat}, ${vanMieu.lng}, ${hoGuom.lat}, ${hoGuom.lng})`);
console.log(`   Result: ${dist1.toFixed(3)} km`);
console.log('');

// Test 2: Swapped order (lng1, lat1, lng2, lat2)
const dist2 = calculateDistance(vanMieu.lng, vanMieu.lat, hoGuom.lng, hoGuom.lat);
console.log(`2. Swapped order: calculateDistance(${vanMieu.lng}, ${vanMieu.lat}, ${hoGuom.lng}, ${hoGuom.lat})`);
console.log(`   Result: ${dist2.toFixed(3)} km`);
console.log('');

// Test 3: Mixed order (lat1, lng1, lng2, lat2)
const dist3 = calculateDistance(vanMieu.lat, vanMieu.lng, hoGuom.lng, hoGuom.lat);
console.log(`3. Mixed order: calculateDistance(${vanMieu.lat}, ${vanMieu.lng}, ${hoGuom.lng}, ${hoGuom.lat})`);
console.log(`   Result: ${dist3.toFixed(3)} km`);
console.log('');

// Test 4: Another mixed order (lng1, lat1, lat2, lng2)
const dist4 = calculateDistance(vanMieu.lng, vanMieu.lat, hoGuom.lat, hoGuom.lng);
console.log(`4. Another mixed: calculateDistance(${vanMieu.lng}, ${vanMieu.lat}, ${hoGuom.lat}, ${hoGuom.lng})`);
console.log(`   Result: ${dist4.toFixed(3)} km`);
console.log('');

// Expected distance from Google Maps
const expectedDistance = 1.8; // km
console.log('📏 Expected distance (Google Maps):', expectedDistance, 'km');
console.log('');

// Calculate errors
const errors = [
  { name: 'Correct order', error: Math.abs(dist1 - expectedDistance) },
  { name: 'Swapped order', error: Math.abs(dist2 - expectedDistance) },
  { name: 'Mixed order 1', error: Math.abs(dist3 - expectedDistance) },
  { name: 'Mixed order 2', error: Math.abs(dist4 - expectedDistance) }
];

console.log('📊 Error Analysis:');
console.log('==================');
errors.forEach((test, index) => {
  const errorPercent = (test.error / expectedDistance) * 100;
  console.log(`${index + 1}. ${test.name}: ${test.error.toFixed(3)} km (${errorPercent.toFixed(1)}%)`);
});

// Find the most accurate
const mostAccurate = errors.reduce((min, current) => 
  current.error < min.error ? current : min
);

console.log(`\n✅ Most accurate: ${mostAccurate.name} (${mostAccurate.error.toFixed(3)} km error)`);

// Test GeoJSON coordinate extraction
console.log('\n🗺️ GeoJSON Coordinate Extraction Test:');
console.log('======================================');

const geoJsonVanMieu = { type: 'Point', coordinates: [105.8342, 21.0278] };
const geoJsonHoGuom = { type: 'Point', coordinates: [105.8542, 21.0285] };

console.log('GeoJSON Văn Miếu:', JSON.stringify(geoJsonVanMieu));
console.log('GeoJSON Hồ Gươm:', JSON.stringify(geoJsonHoGuom));
console.log('');

// Extract coordinates correctly
const [vanMieuLng, vanMieuLat] = geoJsonVanMieu.coordinates;
const [hoGuomLng, hoGuomLat] = geoJsonHoGuom.coordinates;

console.log('Extracted coordinates:');
console.log(`Văn Miếu: lng=${vanMieuLng}, lat=${vanMieuLat}`);
console.log(`Hồ Gươm:  lng=${hoGuomLng}, lat=${hoGuomLat}`);
console.log('');

// Calculate distance with extracted coordinates
const geoJsonDistance = calculateDistance(vanMieuLat, vanMieuLng, hoGuomLat, hoGuomLng);
console.log(`Distance with GeoJSON extraction: ${geoJsonDistance.toFixed(3)} km`);
console.log(`Error: ${Math.abs(geoJsonDistance - expectedDistance).toFixed(3)} km`);

console.log('\n🎯 CONCLUSION:');
console.log('==============');
if (Math.abs(geoJsonDistance - expectedDistance) < 0.1) {
  console.log('✅ GeoJSON coordinate extraction is CORRECT');
  console.log('✅ Distance calculation formula is ACCURATE');
  console.log('❌ The issue is likely in the database data or model methods');
} else {
  console.log('❌ There is an issue with coordinate extraction or calculation');
}
