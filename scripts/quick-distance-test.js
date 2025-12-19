const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Attraction = require('../model/Attraction');

// Tọa độ Văn Miếu chính xác
const vanMieuCoords = {
  lat: 21.02826,
  lng: 105.83565
};

// Haversine function
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
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
  return R * c;
}

async function quickTest() {
  try {
    console.log('🚀 Bắt đầu test khoảng cách...');
    
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/tourism-hanoi');
    console.log('✅ Kết nối MongoDB thành công');
    
    // Lấy Văn Miếu
    const vanMieu = await Attraction.findOne({ 
      name: { $regex: /Văn Miếu|Quốc Tử Giám/i } 
    }).lean();
    
    if (!vanMieu) {
      console.log('❌ Không tìm thấy Văn Miếu');
      return;
    }
    
    console.log(`\n📋 Văn Miếu: ${vanMieu.name}`);
    console.log(`📍 Tọa độ DB: [${vanMieu.map?.coordinates?.[0]}, ${vanMieu.map?.coordinates?.[1]}]`);
    console.log(`📍 Tọa độ chuẩn: [${vanMieuCoords.lng}, ${vanMieuCoords.lat}]`);
    
    // Tính khoảng cách từ tọa độ chuẩn đến tọa độ DB
    if (vanMieu.map?.coordinates && vanMieu.map.coordinates.length >= 2) {
      const [dbLng, dbLat] = vanMieu.map.coordinates;
      const distanceFromStandard = calculateDistance(
        vanMieuCoords.lat, vanMieuCoords.lng,
        dbLat, dbLng
      );
      console.log(`📏 Khoảng cách từ chuẩn: ${distanceFromStandard.toFixed(3)} km`);
    }
    
    // Lấy nearby attractions
    console.log('\n🎯 Nearby Attractions:');
    const nearbyAttractions = await Attraction.findNearbyAttractions(
      vanMieu._id, 5, 8
    );
    
    nearbyAttractions.forEach((attraction, index) => {
      console.log(`${index + 1}. ${attraction.name}`);
      console.log(`   📏 API distance: ${attraction.distance?.toFixed(3)} km`);
      console.log(`   📍 Tọa độ: [${attraction.map?.coordinates?.[0]}, ${attraction.map?.coordinates?.[1]}]`);
      
      // Tính lại khoảng cách để so sánh
      if (attraction.map?.coordinates && attraction.map.coordinates.length >= 2) {
        const [lng, lat] = attraction.map.coordinates;
        const recalculated = calculateDistance(
          vanMieuCoords.lat, vanMieuCoords.lng,
          lat, lng
        );
        
        const apiDistance = attraction.distance || 0;
        const difference = Math.abs(apiDistance - recalculated);
        const errorPercent = apiDistance > 0 ? (difference / apiDistance * 100) : 0;
        
        console.log(`   🧮 Recalculated: ${recalculated.toFixed(3)} km`);
        console.log(`   📊 Difference: ${difference.toFixed(3)} km (${errorPercent.toFixed(1)}%)`);
        console.log(`   ${errorPercent < 5 ? '✅' : errorPercent < 10 ? '⚠️' : '❌'} ${errorPercent < 5 ? 'Chính xác' : errorPercent < 10 ? 'Chấp nhận được' : 'Cần kiểm tra'}`);
      }
      console.log('');
    });
    
    // Lấy tất cả attractions có tọa độ
    console.log('\n📊 Tất cả Attractions có tọa độ:');
    const allAttractions = await Attraction.find({ 
      isActive: true, 
      status: 'published',
      'map.coordinates': { $exists: true, $ne: null }
    }).limit(15).lean();
    
    console.log(`Tìm thấy ${allAttractions.length} attractions:`);
    allAttractions.forEach((attraction, index) => {
      if (attraction.map?.coordinates && attraction.map.coordinates.length >= 2) {
        const [lng, lat] = attraction.map.coordinates;
        const distance = calculateDistance(
          vanMieuCoords.lat, vanMieuCoords.lng,
          lat, lng
        );
        
        console.log(`${index + 1}. ${attraction.name}`);
        console.log(`   📍 [${lng.toFixed(6)}, ${lat.toFixed(6)}]`);
        console.log(`   📏 ${distance.toFixed(3)} km từ Văn Miếu`);
        console.log('');
      }
    });
    
    console.log('✅ Test hoàn thành!');
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Đã ngắt kết nối MongoDB');
  }
}

quickTest();


