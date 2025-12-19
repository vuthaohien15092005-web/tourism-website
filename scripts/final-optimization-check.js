const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Attraction = require('../model/Attraction');
const Entertainment = require('../model/Entertainment');
const Accommodation = require('../model/Accommodation');
const CuisinePlace = require('../model/CuisinePlace');

// Final optimization check
async function finalOptimizationCheck() {
  console.log('🚀 KIỂM TRA TỐI ƯU CUỐI CÙNG - HỆ THỐNG TÍNH KHOẢNG CÁCH\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/tourism-hanoi');
    console.log('✅ Đã kết nối MongoDB\n');
    
    // Check 1: Verify all models have correct Haversine formula
    console.log('🔍 KIỂM TRA 1: CÔNG THỨC HAVERSINE TRONG TẤT CẢ MODELS');
    console.log('=' .repeat(60));
    
    const models = [
      { name: 'Attraction', model: Attraction },
      { name: 'Entertainment', model: Entertainment },
      { name: 'Accommodation', model: Accommodation },
      { name: 'CuisinePlace', model: CuisinePlace }
    ];
    
    let allModelsCorrect = true;
    
    for (const { name, model } of models) {
      console.log(`\n📋 Kiểm tra ${name}:`);
      
      // Check if calculateDistance method exists
      if (typeof model.calculateDistance === 'function') {
        console.log(`   ✅ Có method calculateDistance`);
        
        // Test with known coordinates
        const testDistance = model.calculateDistance(21.0285, 105.8542, 21.0333, 105.8500);
        const expectedDistance = 0.689; // Known distance
        const error = Math.abs((testDistance - expectedDistance) / expectedDistance * 100);
        
        console.log(`   🧮 Test distance: ${testDistance.toFixed(3)} km`);
        console.log(`   📏 Expected: ${expectedDistance} km`);
        console.log(`   📊 Error: ${error.toFixed(1)}%`);
        
        if (error < 5) {
          console.log(`   ✅ Chính xác (sai số < 5%)`);
        } else {
          console.log(`   ❌ Cần kiểm tra (sai số > 5%)`);
          allModelsCorrect = false;
        }
      } else {
        console.log(`   ❌ Không có method calculateDistance`);
        allModelsCorrect = false;
      }
    }
    
    // Check 2: Verify GeoJSON format consistency
    console.log('\n🔍 KIỂM TRA 2: FORMAT GEOJSON NHẤT QUÁN');
    console.log('=' .repeat(60));
    
    let geoJsonConsistent = true;
    
    for (const { name, model } of models) {
      console.log(`\n📋 Kiểm tra ${name}:`);
      
      const sample = await model.findOne().lean();
      if (sample && sample.map) {
        if (sample.map.coordinates && Array.isArray(sample.map.coordinates)) {
          const [lng, lat] = sample.map.coordinates;
          if (lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
            console.log(`   ✅ GeoJSON format đúng: [${lng}, ${lat}]`);
          } else {
            console.log(`   ❌ GeoJSON format sai: [${lng}, ${lat}]`);
            geoJsonConsistent = false;
          }
        } else if (sample.map.lat && sample.map.lng) {
          console.log(`   ⚠️  Đang dùng legacy format: lat=${sample.map.lat}, lng=${sample.map.lng}`);
          console.log(`   🔄 Cần chuyển sang GeoJSON format`);
          geoJsonConsistent = false;
        } else {
          console.log(`   ❌ Không có thông tin tọa độ`);
          geoJsonConsistent = false;
        }
      } else {
        console.log(`   ❌ Không có thông tin map`);
        geoJsonConsistent = false;
      }
    }
    
    // Check 3: Test nearby places functionality
    console.log('\n🔍 KIỂM TRA 3: CHỨC NĂNG NEARBY PLACES');
    console.log('=' .repeat(60));
    
    let nearbyPlacesWorking = true;
    
    // Test with Attraction
    const testAttraction = await Attraction.findOne().lean();
    if (testAttraction) {
      console.log(`\n📍 Test với attraction: ${testAttraction.name}`);
      
      try {
        const nearbyAttractions = await Attraction.findNearbyAttractions(testAttraction._id, 5, 5);
        console.log(`   ✅ Tìm thấy ${nearbyAttractions.length} attractions gần đây`);
        
        // Check if distances are calculated
        const hasDistances = nearbyAttractions.every(attraction => 
          attraction.distance !== undefined && attraction.distance !== null
        );
        
        if (hasDistances) {
          console.log(`   ✅ Tất cả kết quả đều có khoảng cách`);
        } else {
          console.log(`   ❌ Một số kết quả thiếu khoảng cách`);
          nearbyPlacesWorking = false;
        }
        
        // Check distance accuracy
        const distances = nearbyAttractions.map(a => a.distance).filter(d => d !== undefined);
        if (distances.length > 0) {
          const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
          console.log(`   📊 Khoảng cách trung bình: ${avgDistance.toFixed(3)} km`);
        }
        
      } catch (error) {
        console.log(`   ❌ Lỗi khi tìm nearby attractions: ${error.message}`);
        nearbyPlacesWorking = false;
      }
    } else {
      console.log(`   ❌ Không có attraction nào để test`);
      nearbyPlacesWorking = false;
    }
    
    // Check 4: Performance test
    console.log('\n🔍 KIỂM TRA 4: HIỆU NĂNG');
    console.log('=' .repeat(60));
    
    const performanceResults = [];
    
    for (const { name, model } of models) {
      const startTime = Date.now();
      
      try {
        const sample = await model.findOne().lean();
        if (sample && sample._id) {
          let nearbyPlaces = [];
          
          if (name === 'Attraction') {
            nearbyPlaces = await model.findNearbyAttractions(sample._id, 5, 10);
          } else if (name === 'Entertainment') {
            nearbyPlaces = await model.findNearbyEntertainments(sample._id, 5, 10);
          } else if (name === 'Accommodation') {
            nearbyPlaces = await model.findNearbyAccommodations(sample._id, 5, 10);
          } else if (name === 'CuisinePlace') {
            nearbyPlaces = await model.findNearbyCuisinePlaces(sample._id, 5, 10);
          }
          
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          performanceResults.push({
            name,
            duration,
            results: nearbyPlaces.length,
            status: duration < 1000 ? '✅ Tốt' : duration < 2000 ? '⚠️ Chấp nhận được' : '❌ Chậm'
          });
        }
      } catch (error) {
        performanceResults.push({
          name,
          duration: 0,
          results: 0,
          status: `❌ Lỗi: ${error.message}`
        });
      }
    }
    
    console.log('\n📊 KẾT QUẢ HIỆU NĂNG:');
    performanceResults.forEach(result => {
      console.log(`   ${result.name}: ${result.duration}ms (${result.results} kết quả) - ${result.status}`);
    });
    
    // Final summary
    console.log('\n🎯 TỔNG KẾT CUỐI CÙNG');
    console.log('=' .repeat(60));
    
    const allChecksPassed = allModelsCorrect && geoJsonConsistent && nearbyPlacesWorking;
    
    console.log(`\n📋 KẾT QUẢ KIỂM TRA:`);
    console.log(`   ${allModelsCorrect ? '✅' : '❌'} Công thức Haversine: ${allModelsCorrect ? 'Chính xác' : 'Cần sửa'}`);
    console.log(`   ${geoJsonConsistent ? '✅' : '❌'} Format GeoJSON: ${geoJsonConsistent ? 'Nhất quán' : 'Cần chuẩn hóa'}`);
    console.log(`   ${nearbyPlacesWorking ? '✅' : '❌'} Nearby Places: ${nearbyPlacesWorking ? 'Hoạt động tốt' : 'Cần kiểm tra'}`);
    
    const goodPerformance = performanceResults.every(r => r.duration < 1000);
    console.log(`   ${goodPerformance ? '✅' : '⚠️'} Hiệu năng: ${goodPerformance ? 'Tốt' : 'Cần tối ưu'}`);
    
    if (allChecksPassed) {
      console.log('\n🎉 HỆ THỐNG ĐÃ ĐƯỢC TỐI ƯU HOÀN TOÀN!');
      console.log('   • Khoảng cách tính toán chính xác');
      console.log('   • Format dữ liệu nhất quán');
      console.log('   • API hoạt động ổn định');
      console.log('   • Hiệu năng tối ưu');
      console.log('\n✨ Không cần thay đổi gì thêm!');
    } else {
      console.log('\n⚠️ CẦN KIỂM TRA THÊM:');
      if (!allModelsCorrect) console.log('   • Sửa công thức Haversine trong các model');
      if (!geoJsonConsistent) console.log('   • Chuẩn hóa format GeoJSON');
      if (!nearbyPlacesWorking) console.log('   • Kiểm tra chức năng nearby places');
    }
    
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Đã ngắt kết nối MongoDB');
  }
}

// Run the final check
finalOptimizationCheck().catch(console.error);
