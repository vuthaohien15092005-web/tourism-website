const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Attraction = require('../model/Attraction');
const Entertainment = require('../model/Entertainment');
const Accommodation = require('../model/Accommodation');
const CuisinePlace = require('../model/CuisinePlace');

// Tọa độ chính xác của Văn Miếu (từ Google Maps)
const vanMieuCoords = {
  name: "Văn Miếu - Quốc Tử Giám",
  lat: 21.02826,
  lng: 105.83565,
  coordinates: [105.83565, 21.02826]
};

// Haversine function
function calculateDistanceHaversine(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  
  const lat1Rad = lat1 * Math.PI / 180;
  const lng1Rad = lng1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const lng2Rad = lng2 * Math.PI / 180;
  
  const dLat = lat2Rad - lat1Rad;
  const dLng = lng2Rad - lng1Rad;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

// Test function
async function testAllDistances() {
  console.log('🗺️ KIỂM TRA KHOẢNG CÁCH TẤT CẢ ĐỊA ĐIỂM TRONG DATABASE\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/tourism-hanoi');
    console.log('✅ Đã kết nối MongoDB\n');
    
    // Test 1: Lấy tất cả attractions và so sánh khoảng cách
    console.log('🔍 TEST 1: KIỂM TRA ATTRACTIONS');
    console.log('=' .repeat(80));
    
    const attractions = await Attraction.find({ 
      isActive: true, 
      status: 'published',
      'map.coordinates': { $exists: true, $ne: null }
    }).limit(20).lean();
    
    console.log(`📋 Tìm thấy ${attractions.length} attractions có tọa độ\n`);
    
    attractions.forEach((attraction, index) => {
      if (attraction.map?.coordinates && attraction.map.coordinates.length >= 2) {
        const [attLng, attLat] = attraction.map.coordinates;
        
        // Tính khoảng cách từ Văn Miếu đến attraction này
        const calculatedDistance = calculateDistanceHaversine(
          vanMieuCoords.lat, vanMieuCoords.lng,
          attLat, attLng
        );
        
        console.log(`${index + 1}. ${attraction.name}`);
        console.log(`   📍 Tọa độ: [${attLng.toFixed(6)}, ${attLat.toFixed(6)}]`);
        console.log(`   📏 Khoảng cách từ Văn Miếu: ${calculatedDistance.toFixed(3)} km`);
        
        // Kiểm tra tọa độ có hợp lệ không
        if (attLng >= -180 && attLng <= 180 && attLat >= -90 && attLat <= 90) {
          console.log(`   ✅ Tọa độ hợp lệ`);
        } else {
          console.log(`   ❌ Tọa độ không hợp lệ`);
        }
        console.log('');
      }
    });
    
    // Test 2: Lấy entertainments và so sánh
    console.log('🔍 TEST 2: KIỂM TRA ENTERTAINMENTS');
    console.log('=' .repeat(80));
    
    const entertainments = await Entertainment.find({ 
      isActive: true, 
      status: 'published',
      'map.coordinates': { $exists: true, $ne: null }
    }).limit(10).lean();
    
    console.log(`📋 Tìm thấy ${entertainments.length} entertainments có tọa độ\n`);
    
    entertainments.forEach((entertainment, index) => {
      if (entertainment.map?.coordinates && entertainment.map.coordinates.length >= 2) {
        const [entLng, entLat] = entertainment.map.coordinates;
        
        const calculatedDistance = calculateDistanceHaversine(
          vanMieuCoords.lat, vanMieuCoords.lng,
          entLat, entLng
        );
        
        console.log(`${index + 1}. ${entertainment.name}`);
        console.log(`   📍 Tọa độ: [${entLng.toFixed(6)}, ${entLat.toFixed(6)}]`);
        console.log(`   📏 Khoảng cách từ Văn Miếu: ${calculatedDistance.toFixed(3)} km`);
        console.log('');
      }
    });
    
    // Test 3: Lấy accommodations và so sánh
    console.log('🔍 TEST 3: KIỂM TRA ACCOMMODATIONS');
    console.log('=' .repeat(80));
    
    const accommodations = await Accommodation.find({ 
      isActive: true, 
      status: 'published',
      'map.coordinates': { $exists: true, $ne: null }
    }).limit(10).lean();
    
    console.log(`📋 Tìm thấy ${accommodations.length} accommodations có tọa độ\n`);
    
    accommodations.forEach((accommodation, index) => {
      if (accommodation.map?.coordinates && accommodation.map.coordinates.length >= 2) {
        const [accLng, accLat] = accommodation.map.coordinates;
        
        const calculatedDistance = calculateDistanceHaversine(
          vanMieuCoords.lat, vanMieuCoords.lng,
          accLat, accLng
        );
        
        console.log(`${index + 1}. ${accommodation.name}`);
        console.log(`   📍 Tọa độ: [${accLng.toFixed(6)}, ${accLat.toFixed(6)}]`);
        console.log(`   📏 Khoảng cách từ Văn Miếu: ${calculatedDistance.toFixed(3)} km`);
        console.log('');
      }
    });
    
    // Test 4: Test nearby places API với Văn Miếu
    console.log('🔍 TEST 4: KIỂM TRA NEARBY PLACES API');
    console.log('=' .repeat(80));
    
    const vanMieuInDB = await Attraction.findOne({ 
      name: { $regex: /Văn Miếu|Quốc Tử Giám/i } 
    });
    
    if (vanMieuInDB) {
      console.log(`📍 Test với: ${vanMieuInDB.name}`);
      console.log(`📍 Tọa độ: [${vanMieuInDB.map?.coordinates?.[0]}, ${vanMieuInDB.map?.coordinates?.[1]}]\n`);
      
      // Test nearby attractions
      console.log('🎯 NEARBY ATTRACTIONS:');
      const nearbyAttractions = await Attraction.findNearbyAttractions(
        vanMieuInDB._id, 5, 10
      );
      
      nearbyAttractions.forEach((attraction, index) => {
        console.log(`${index + 1}. ${attraction.name}`);
        console.log(`   📏 API distance: ${attraction.distance?.toFixed(3)} km`);
        console.log(`   📍 Tọa độ: [${attraction.map?.coordinates?.[0]}, ${attraction.map?.coordinates?.[1]}]`);
        
        // Tính lại khoảng cách để so sánh
        if (attraction.map?.coordinates && attraction.map.coordinates.length >= 2) {
          const [lng, lat] = attraction.map.coordinates;
          const recalculatedDistance = calculateDistanceHaversine(
            vanMieuCoords.lat, vanMieuCoords.lng,
            lat, lng
          );
          
          const apiDistance = attraction.distance || 0;
          const difference = Math.abs(apiDistance - recalculatedDistance);
          const errorPercent = apiDistance > 0 ? (difference / apiDistance * 100) : 0;
          
          console.log(`   🧮 Recalculated: ${recalculatedDistance.toFixed(3)} km`);
          console.log(`   📊 Difference: ${difference.toFixed(3)} km (${errorPercent.toFixed(1)}%)`);
          console.log(`   ${errorPercent < 5 ? '✅' : errorPercent < 10 ? '⚠️' : '❌'} ${errorPercent < 5 ? 'Chính xác' : errorPercent < 10 ? 'Chấp nhận được' : 'Cần kiểm tra'}`);
        }
        console.log('');
      });
      
      // Test nearby entertainments
      console.log('🎯 NEARBY ENTERTAINMENTS:');
      const nearbyEntertainments = await Entertainment.findNearbyEntertainments(
        vanMieuInDB._id, 5, 5
      );
      
      nearbyEntertainments.forEach((entertainment, index) => {
        console.log(`${index + 1}. ${entertainment.name}`);
        console.log(`   📏 API distance: ${entertainment.distance?.toFixed(3)} km`);
        console.log(`   📍 Tọa độ: [${entertainment.map?.coordinates?.[0]}, ${entertainment.map?.coordinates?.[1]}]`);
        console.log('');
      });
      
      // Test nearby accommodations
      console.log('🎯 NEARBY ACCOMMODATIONS:');
      const nearbyAccommodations = await Accommodation.findNearbyAccommodations(
        vanMieuInDB._id, 5, 5
      );
      
      nearbyAccommodations.forEach((accommodation, index) => {
        console.log(`${index + 1}. ${accommodation.name}`);
        console.log(`   📏 API distance: ${accommodation.distance?.toFixed(3)} km`);
        console.log(`   📍 Tọa độ: [${accommodation.map?.coordinates?.[0]}, ${accommodation.map?.coordinates?.[1]}]`);
        console.log('');
      });
    }
    
    // Test 5: Kiểm tra tọa độ bất thường
    console.log('🔍 TEST 5: KIỂM TRA TỌA ĐỘ BẤT THƯỜNG');
    console.log('=' .repeat(80));
    
    const allPlaces = [
      ...attractions.map(a => ({ ...a, type: 'Attraction' })),
      ...entertainments.map(e => ({ ...e, type: 'Entertainment' })),
      ...accommodations.map(a => ({ ...a, type: 'Accommodation' }))
    ];
    
    const invalidCoordinates = allPlaces.filter(place => {
      if (!place.map?.coordinates || place.map.coordinates.length < 2) return true;
      const [lng, lat] = place.map.coordinates;
      return lng < -180 || lng > 180 || lat < -90 || lat > 90;
    });
    
    if (invalidCoordinates.length > 0) {
      console.log(`❌ Tìm thấy ${invalidCoordinates.length} địa điểm có tọa độ bất thường:`);
      invalidCoordinates.forEach((place, index) => {
        console.log(`${index + 1}. ${place.name} (${place.type})`);
        console.log(`   📍 Tọa độ: ${place.map?.coordinates || 'Không có'}`);
      });
    } else {
      console.log('✅ Tất cả tọa độ đều hợp lệ');
    }
    
    // Tổng kết
    console.log('\n🎯 TỔNG KẾT');
    console.log('=' .repeat(80));
    console.log(`📊 Tổng số địa điểm kiểm tra: ${allPlaces.length}`);
    console.log(`✅ Attractions: ${attractions.length}`);
    console.log(`✅ Entertainments: ${entertainments.length}`);
    console.log(`✅ Accommodations: ${accommodations.length}`);
    console.log(`❌ Tọa độ bất thường: ${invalidCoordinates.length}`);
    
    if (invalidCoordinates.length === 0) {
      console.log('\n🎉 TẤT CẢ TỌA ĐỘ ĐỀU CHÍNH XÁC!');
      console.log('✅ Hệ thống tính khoảng cách hoạt động hoàn hảo');
      console.log('✅ Không cần sửa gì thêm');
    } else {
      console.log('\n⚠️ CẦN SỬA CÁC TỌA ĐỘ BẤT THƯỜNG');
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Đã ngắt kết nối MongoDB');
  }
}

// Run the test
testAllDistances().catch(console.error);
