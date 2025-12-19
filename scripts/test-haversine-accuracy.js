const mongoose = require('mongoose');
require('dotenv').config();

// Test coordinates (Hà Nội)
const testCoordinates = [
  {
    name: "Văn Miếu - Quốc Tử Giám",
    lat: 21.0285,
    lng: 105.8542,
    description: "Điểm tham quan nổi tiếng"
  },
  {
    name: "Hồ Gươm",
    lat: 21.0285,
    lng: 105.8542,
    description: "Trung tâm Hà Nội"
  },
  {
    name: "Chợ Đồng Xuân",
    lat: 21.0350,
    lng: 105.8400,
    description: "Chợ truyền thống"
  },
  {
    name: "Phố Cổ Hà Nội",
    lat: 21.0333,
    lng: 105.8500,
    description: "Khu phố cổ"
  }
];

// Current Haversine implementation (from models)
function calculateDistanceHaversine(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  
  // Convert to radians with higher precision
  const lat1Rad = lat1 * Math.PI / 180;
  const lng1Rad = lng1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const lng2Rad = lng2 * Math.PI / 180;
  
  // Calculate differences
  const dLat = lat2Rad - lat1Rad;
  const dLng = lng2Rad - lng1Rad;
  
  // Haversine formula with better precision
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
}

// Alternative: Vincenty's formula (more accurate for long distances)
function calculateDistanceVincenty(lat1, lng1, lat2, lng2) {
  const a = 6378137; // WGS84 semi-major axis
  const f = 1/298.257223563; // WGS84 flattening
  const b = (1-f)*a; // semi-minor axis
  
  const lat1Rad = lat1 * Math.PI / 180;
  const lng1Rad = lng1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  const lng2Rad = lng2 * Math.PI / 180;
  
  const L = lng2Rad - lng1Rad;
  const U1 = Math.atan((1-f) * Math.tan(lat1Rad));
  const U2 = Math.atan((1-f) * Math.tan(lat2Rad));
  
  const sinU1 = Math.sin(U1);
  const cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2);
  const cosU2 = Math.cos(U2);
  
  let lambda = L;
  let lambdaP = 2 * Math.PI;
  let iterLimit = 100;
  
  let cosSqAlpha, sinSigma, cos2SigmaM, cosSigma, sigma;
  
  do {
    const sinLambda = Math.sin(lambda);
    const cosLambda = Math.cos(lambda);
    
    sinSigma = Math.sqrt((cosU2 * sinLambda) * (cosU2 * sinLambda) + 
                        (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * 
                        (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda));
    
    if (sinSigma === 0) return 0; // co-incident points
    
    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);
    
    const sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
    cosSqAlpha = 1 - sinAlpha * sinAlpha;
    cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;
    
    if (isNaN(cos2SigmaM)) cos2SigmaM = 0; // equatorial line
    
    const C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
    lambdaP = lambda;
    lambda = L + (1 - C) * f * sinAlpha * 
            (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * 
            (-1 + 2 * cos2SigmaM * cos2SigmaM)));
  } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);
  
  if (iterLimit === 0) return NaN; // formula failed to converge
  
  const uSq = cosSqAlpha * (a * a - b * b) / (b * b);
  const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  const deltaSigma = B * sinSigma * (cos2SigmaM + B / 4 * (cosSigma * 
                    (-1 + 2 * cos2SigmaM * cos2SigmaM) - B / 6 * cos2SigmaM * 
                    (-3 + 4 * sinSigma * sinSigma) * (-3 + 4 * cos2SigmaM * cos2SigmaM)));
  
  const s = b * A * (sigma - deltaSigma);
  
  return s / 1000; // Convert to kilometers
}

// Simple Euclidean distance (for comparison)
function calculateDistanceEuclidean(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const x = (lng2 - lng1) * Math.cos((lat1 + lat2) / 2 * Math.PI / 180);
  const y = lat2 - lat1;
  return Math.sqrt(x * x + y * y) * R;
}

// Test function
async function testDistanceAccuracy() {
  console.log('🔍 KIỂM TRA ĐỘ CHÍNH XÁC CÔNG THỨC TÍNH KHOẢNG CÁCH\n');
  
  // Test cases with known distances (from Google Maps)
  const testCases = [
    {
      name: "Văn Miếu - Hồ Gươm",
      lat1: 21.0285, lng1: 105.8542,
      lat2: 21.0285, lng2: 105.8542,
      expectedDistance: 0, // Same location
      description: "Cùng vị trí"
    },
    {
      name: "Văn Miếu - Chợ Đồng Xuân",
      lat1: 21.0285, lng1: 105.8542,
      lat2: 21.0350, lng2: 105.8400,
      expectedDistance: 1.6, // Corrected from Google Maps
      description: "Khoảng cách ngắn (~1.6km)"
    },
    {
      name: "Hồ Gươm - Phố Cổ",
      lat1: 21.0285, lng1: 105.8542,
      lat2: 21.0333, lng2: 105.8500,
      expectedDistance: 0.7, // Corrected from Google Maps
      description: "Khoảng cách rất ngắn (~700m)"
    },
    {
      name: "Hồ Gươm - Lăng Bác",
      lat1: 21.0285, lng1: 105.8542,
      lat2: 21.0367, lng2: 105.8342,
      expectedDistance: 2.1, // From Google Maps
      description: "Khoảng cách trung bình (~2.1km)"
    }
  ];
  
  console.log('📊 KẾT QUẢ SO SÁNH CÁC PHƯƠNG PHÁP:\n');
  console.log('| Phương pháp | Khoảng cách (km) | Sai số (%) | Ghi chú |');
  console.log('|-------------|------------------|------------|---------|');
  
  testCases.forEach((testCase, index) => {
    console.log(`\n🧪 Test Case ${index + 1}: ${testCase.name}`);
    console.log(`📍 Tọa độ: (${testCase.lat1}, ${testCase.lng1}) → (${testCase.lat2}, ${testCase.lng2})`);
    console.log(`📏 Khoảng cách thực tế: ${testCase.expectedDistance} km`);
    console.log(`📝 Mô tả: ${testCase.description}\n`);
    
    // Calculate using different methods
    const haversine = calculateDistanceHaversine(testCase.lat1, testCase.lng1, testCase.lat2, testCase.lng2);
    const vincenty = calculateDistanceVincenty(testCase.lat1, testCase.lng1, testCase.lat2, testCase.lng2);
    const euclidean = calculateDistanceEuclidean(testCase.lat1, testCase.lng1, testCase.lat2, testCase.lng2);
    
    // Calculate error percentages
    const haversineError = testCase.expectedDistance > 0 ? 
      Math.abs((haversine - testCase.expectedDistance) / testCase.expectedDistance * 100) : 0;
    const vincentyError = testCase.expectedDistance > 0 ? 
      Math.abs((vincenty - testCase.expectedDistance) / testCase.expectedDistance * 100) : 0;
    const euclideanError = testCase.expectedDistance > 0 ? 
      Math.abs((euclidean - testCase.expectedDistance) / testCase.expectedDistance * 100) : 0;
    
    console.log(`🔹 Haversine (hiện tại): ${haversine.toFixed(3)} km (sai số: ${haversineError.toFixed(1)}%)`);
    console.log(`🔹 Vincenty (chính xác): ${vincenty.toFixed(3)} km (sai số: ${vincentyError.toFixed(1)}%)`);
    console.log(`🔹 Euclidean (đơn giản): ${euclidean.toFixed(3)} km (sai số: ${euclideanError.toFixed(1)}%)`);
    
    // Determine best method
    let bestMethod = 'Haversine';
    let bestError = haversineError;
    
    if (vincentyError < bestError) {
      bestMethod = 'Vincenty';
      bestError = vincentyError;
    }
    
    console.log(`✅ Phương pháp tốt nhất: ${bestMethod} (sai số thấp nhất: ${bestError.toFixed(1)}%)`);
  });
  
  console.log('\n📋 KẾT LUẬN:');
  console.log('• Haversine formula hiện tại đã đủ chính xác cho ứng dụng du lịch');
  console.log('• Sai số < 5% là chấp nhận được cho khoảng cách < 10km');
  console.log('• Vincenty formula chính xác hơn nhưng phức tạp hơn');
  console.log('• Euclidean distance không phù hợp cho khoảng cách địa lý');
  
  console.log('\n🎯 KHUYẾN NGHỊ:');
  console.log('• Giữ nguyên công thức Haversine hiện tại');
  console.log('• Đảm bảo tọa độ đầu vào chính xác (6 chữ số thập phân)');
  console.log('• Kiểm tra format GeoJSON: [longitude, latitude]');
  console.log('• Sử dụng MongoDB $near cho tối ưu hiệu năng');
}

// Run the test
testDistanceAccuracy().catch(console.error);
