console.log('🚀 Bắt đầu test khoảng cách...');

const mongoose = require('mongoose');
require('dotenv').config();

async function simpleTest() {
  try {
    console.log('📡 Đang kết nối MongoDB...');
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/tourism-hanoi');
    console.log('✅ Đã kết nối MongoDB');
    
    const Attraction = require('../model/Attraction');
    
    console.log('🔍 Tìm Văn Miếu...');
    const vanMieu = await Attraction.findOne({ 
      name: { $regex: /Văn Miếu|Quốc Tử Giám/i } 
    }).lean();
    
    if (vanMieu) {
      console.log(`📋 Tìm thấy: ${vanMieu.name}`);
      console.log(`📍 Tọa độ: [${vanMieu.map?.coordinates?.[0]}, ${vanMieu.map?.coordinates?.[1]}]`);
      
      console.log('🎯 Tìm nearby attractions...');
      const nearby = await Attraction.findNearbyAttractions(vanMieu._id, 5, 5);
      
      console.log(`📊 Tìm thấy ${nearby.length} attractions gần đây:`);
      nearby.forEach((att, i) => {
        console.log(`${i+1}. ${att.name} - ${att.distance?.toFixed(3)} km`);
      });
    } else {
      console.log('❌ Không tìm thấy Văn Miếu');
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Đã ngắt kết nối');
  }
}

simpleTest();
