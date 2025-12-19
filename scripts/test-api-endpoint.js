const http = require('http');

// Test API endpoint directly
async function testAPIEndpoint() {
  const testCases = [
    {
      name: 'Test accommodation to accommodation',
      url: 'http://localhost:3000/api/nearby-places/accommodation/68eef5f3b625c4a6d989cf96/accommodation?radius=5&limit=6'
    },
    {
      name: 'Test accommodation to attraction', 
      url: 'http://localhost:3000/api/nearby-places/accommodation/68eef5f3b625c4a6d989cf96/attraction?radius=5&limit=6'
    },
    {
      name: 'Test accommodation to entertainment',
      url: 'http://localhost:3000/api/nearby-places/accommodation/68eef5f3b625c4a6d989cf96/entertainment?radius=5&limit=6'
    },
    {
      name: 'Test accommodation to cuisine',
      url: 'http://localhost:3000/api/nearby-places/accommodation/68eef5f3b625c4a6d989cf96/cuisine?radius=5&limit=6'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 ${testCase.name}`);
    console.log(`   URL: ${testCase.url}`);
    
    try {
      const response = await makeRequest(testCase.url);
      const data = JSON.parse(response);
      
      console.log(`   Status: Success`);
      console.log(`   Found ${data.length} places`);
      
      if (data.length > 0) {
        console.log(`   Sample place: ${data[0].name}`);
        console.log(`   Distance: ${data[0].distance ? data[0].distance.toFixed(3) + ' km' : 'N/A'}`);
        console.log(`   Has distance field: ${data[0].hasOwnProperty('distance')}`);
        console.log(`   Distance type: ${typeof data[0].distance}`);
        console.log(`   Distance value: ${data[0].distance}`);
      }
      
    } catch (error) {
      console.log(`   Status: Error - ${error.message}`);
    }
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Run the test
testAPIEndpoint().catch(console.error);
