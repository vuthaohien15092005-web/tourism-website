const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Test Cloudinary configuration
async function testCloudinary() {
  console.log('🔍 Testing Cloudinary configuration...');
  
  // Check environment variables
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  
  console.log('📋 Environment variables:');
  console.log(`  CLOUDINARY_CLOUD_NAME: ${cloudName ? '✅ Set' : '❌ Missing'}`);
  console.log(`  CLOUDINARY_API_KEY: ${apiKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`  CLOUDINARY_API_SECRET: ${apiSecret ? '✅ Set' : '❌ Missing'}`);
  
  if (!cloudName || !apiKey || !apiSecret) {
    console.log('\n❌ Missing Cloudinary environment variables!');
    console.log('💡 Please set the following in your .env file:');
    console.log('   CLOUDINARY_CLOUD_NAME=your-cloud-name');
    console.log('   CLOUDINARY_API_KEY=your-api-key');
    console.log('   CLOUDINARY_API_SECRET=your-api-secret');
    return;
  }
  
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });
  
  try {
    // Test API connection
    console.log('\n🔗 Testing Cloudinary API connection...');
    const result = await cloudinary.api.ping();
    console.log('✅ Cloudinary API connection successful!');
    console.log('📊 API Status:', result);
    
    // Test upload with a simple image
    console.log('\n📤 Testing image upload...');
    const uploadResult = await cloudinary.uploader.upload(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      {
        folder: 'tourism-website/test',
        resource_type: 'image'
      }
    );
    
    console.log('✅ Test upload successful!');
    console.log('🔗 Upload URL:', uploadResult.secure_url);
    console.log('🆔 Public ID:', uploadResult.public_id);
    
    // Clean up test image
    console.log('\n🗑️ Cleaning up test image...');
    await cloudinary.uploader.destroy(uploadResult.public_id);
    console.log('✅ Test image deleted successfully!');
    
  } catch (error) {
    console.error('❌ Cloudinary test failed:', error.message);
    console.error('💡 Please check your Cloudinary credentials and internet connection.');
  }
}

if (require.main === module) {
  testCloudinary().catch(console.error);
}

module.exports = { testCloudinary };
