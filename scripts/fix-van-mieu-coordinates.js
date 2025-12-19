const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Attraction = require('../model/Attraction');

// Tọa độ chính xác của Văn Miếu - Quốc Tử Giám (từ Google Maps)
const correctVanMieuCoords = {
  name: "Văn Miếu – Quốc Tử Giám",
  lat: 21.0285,
  lng: 105.8542,
  coordinates: [105.8542, 21.0285] // GeoJSON format [lng, lat]
};

// Test function
async function fixVanMieuCoordinates() {
  console.log('🔧 SỬA TỌA ĐỘ VĂN MIẾU - QUỐC TỬ GIÁM\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/tourism-hanoi');
    console.log('✅ Đã kết nối MongoDB\n');
    
    // Tìm Văn Miếu trong database
    console.log('🔍 Tìm Văn Miếu trong database...');
    const vanMieu = await Attraction.findOne({ 
      name: { $regex: /Văn Miếu|Quốc Tử Giám/i } 
    });
    
    if (!vanMieu) {
      console.log('❌ Không tìm thấy Văn Miếu trong database');
      return;
    }
    
    console.log(`📋 Tìm thấy: ${vanMieu.name}`);
    console.log(`📍 Tọa độ cũ: [${vanMieu.map?.coordinates?.[0] || 'N/A'}, ${vanMieu.map?.coordinates?.[1] || 'N/A'}]`);
    
    // Cập nhật tọa độ
    console.log('\n🔧 Cập nhật tọa độ...');
    vanMieu.map = {
      lat: correctVanMieuCoords.lat,
      lng: correctVanMieuCoords.lng,
      coordinates: correctVanMieuCoords.coordinates
    };
    
    await vanMieu.save();
    console.log(`✅ Đã cập nhật tọa độ: [${correctVanMieuCoords.lng}, ${correctVanMieuCoords.lat}]`);
    
    // Kiểm tra lại
    console.log('\n🔍 Kiểm tra lại...');
    const updatedVanMieu = await Attraction.findById(vanMieu._id).lean();
    console.log(`📍 Tọa độ mới: [${updatedVanMieu.map?.coordinates?.[0]}, ${updatedVanMieu.map?.coordinates?.[1]}]`);
    
    // Test nearby places với tọa độ mới
    console.log('\n🧪 Test nearby places với tọa độ mới...');
    const nearbyAttractions = await Attraction.findNearbyAttractions(
      vanMieu._id, 5, 5
    );
    
    console.log(`🎯 Tìm thấy ${nearbyAttractions.length} attractions gần đây:`);
    nearbyAttractions.forEach((attraction, index) => {
      console.log(`   ${index + 1}. ${attraction.name} - ${attraction.distance?.toFixed(3)} km`);
    });
    
    console.log('\n✅ Hoàn thành! Tọa độ Văn Miếu đã được cập nhật chính xác.');
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Đã ngắt kết nối MongoDB');
  }
}

// Run the fix
fixVanMieuCoordinates().catch(console.error);
