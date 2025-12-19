const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Attraction = require('../model/Attraction');
const Accommodation = require('../model/Accommodation');
const Cuisine = require('../model/Cuisine');
const CuisinePlace = require('../model/CuisinePlace');
const Entertainment = require('../model/Entertainment');
const User = require('../model/User');
const Review = require('../model/Review');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL);

// Mapping từ local path sang Cloudinary folder
const folderMapping = {
  'uploads': 'tourism-website/admin',
  'client/img': 'tourism-website/static',
  'cached-images': 'tourism-website/cached'
};

// Upload file lên Cloudinary
async function uploadToCloudinary(filePath, folder) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${filePath}`);
      return null;
    }

    console.log(`📤 Uploading: ${filePath} → ${folder}`);
    
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto'
    });
    
    console.log(`✅ Uploaded: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Error uploading ${filePath}:`, error.message);
    return null;
  }
}

// Cập nhật URL trong database
async function updateDatabaseUrl(collection, filter, updateField, oldUrl, newUrl) {
  try {
    const result = await collection.updateMany(
      { [updateField]: oldUrl },
      { $set: { [updateField]: newUrl } }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`✅ Updated ${result.modifiedCount} documents in ${collection.modelName}`);
    }
    return result.modifiedCount;
  } catch (error) {
    console.error(`❌ Error updating ${collection.modelName}:`, error.message);
    return 0;
  }
}

// Cập nhật array URLs
async function updateArrayUrls(collection, filter, updateField, oldUrl, newUrl) {
  try {
    const result = await collection.updateMany(
      { [updateField]: { $in: [oldUrl] } },
      { $set: { [`${updateField}.$`]: newUrl } }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`✅ Updated ${result.modifiedCount} array documents in ${collection.modelName}`);
    }
    return result.modifiedCount;
  } catch (error) {
    console.error(`❌ Error updating array in ${collection.modelName}:`, error.message);
    return 0;
  }
}

// Migrate Attractions
async function migrateAttractions() {
  console.log('\n🏛️ Migrating Attractions...');
  
  const attractions = await Attraction.find({});
  let updated = 0;
  
  for (const attraction of attractions) {
    let hasChanges = false;
    const updates = {};
    
    // Migrate main images
    if (attraction.images && Array.isArray(attraction.images)) {
      const newImages = [];
      for (const imageUrl of attraction.images) {
        if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/client/img/') || imageUrl.startsWith('/cached-images/')) {
          const localPath = path.join(__dirname, '..', 'public', imageUrl);
          const cloudinaryUrl = await uploadToCloudinary(localPath, 'tourism-website/admin');
          if (cloudinaryUrl) {
            newImages.push(cloudinaryUrl);
            hasChanges = true;
          } else {
            newImages.push(imageUrl); // Keep original if upload fails
          }
        } else {
          newImages.push(imageUrl); // Keep Cloudinary URLs
        }
      }
      updates.images = newImages;
    }
    
    // Migrate reviews avatars
    if (attraction.reviews && Array.isArray(attraction.reviews)) {
      const newReviews = attraction.reviews.map(review => {
        if (review.avatar && (review.avatar.startsWith('/uploads/') || review.avatar.startsWith('/client/img/'))) {
          const localPath = path.join(__dirname, '..', 'public', review.avatar);
          return uploadToCloudinary(localPath, 'tourism-website/admin').then(cloudinaryUrl => ({
            ...review,
            avatar: cloudinaryUrl || review.avatar
          }));
        }
        return Promise.resolve(review);
      });
      
      const resolvedReviews = await Promise.all(newReviews);
      updates.reviews = resolvedReviews;
      hasChanges = true;
    }
    
    if (hasChanges) {
      await Attraction.findByIdAndUpdate(attraction._id, updates);
      updated++;
      console.log(`✅ Updated attraction: ${attraction.name}`);
    }
  }
  
  console.log(`✅ Migrated ${updated} attractions`);
}

// Migrate Accommodations
async function migrateAccommodations() {
  console.log('\n🏨 Migrating Accommodations...');
  
  const accommodations = await Accommodation.find({});
  let updated = 0;
  
  for (const accommodation of accommodations) {
    let hasChanges = false;
    const updates = {};
    
    // Migrate main images
    if (accommodation.images && Array.isArray(accommodation.images)) {
      const newImages = [];
      for (const imageUrl of accommodation.images) {
        if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/client/img/') || imageUrl.startsWith('/cached-images/')) {
          const localPath = path.join(__dirname, '..', 'public', imageUrl);
          const cloudinaryUrl = await uploadToCloudinary(localPath, 'tourism-website/admin');
          if (cloudinaryUrl) {
            newImages.push(cloudinaryUrl);
            hasChanges = true;
          } else {
            newImages.push(imageUrl);
          }
        } else {
          newImages.push(imageUrl);
        }
      }
      updates.images = newImages;
    }
    
    // Migrate reviews avatars
    if (accommodation.reviews && Array.isArray(accommodation.reviews)) {
      const newReviews = accommodation.reviews.map(review => {
        if (review.avatar && (review.avatar.startsWith('/uploads/') || review.avatar.startsWith('/client/img/'))) {
          const localPath = path.join(__dirname, '..', 'public', review.avatar);
          return uploadToCloudinary(localPath, 'tourism-website/admin').then(cloudinaryUrl => ({
            ...review,
            avatar: cloudinaryUrl || review.avatar
          }));
        }
        return Promise.resolve(review);
      });
      
      const resolvedReviews = await Promise.all(newReviews);
      updates.reviews = resolvedReviews;
      hasChanges = true;
    }
    
    if (hasChanges) {
      await Accommodation.findByIdAndUpdate(accommodation._id, updates);
      updated++;
      console.log(`✅ Updated accommodation: ${accommodation.name}`);
    }
  }
  
  console.log(`✅ Migrated ${updated} accommodations`);
}

// Migrate Cuisines
async function migrateCuisines() {
  console.log('\n🍜 Migrating Cuisines...');
  
  const cuisines = await Cuisine.find({});
  let updated = 0;
  
  for (const cuisine of cuisines) {
    let hasChanges = false;
    const updates = {};
    
    // Migrate main images
    if (cuisine.mainImages && Array.isArray(cuisine.mainImages)) {
      const newImages = [];
      for (const imageUrl of cuisine.mainImages) {
        if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/client/img/') || imageUrl.startsWith('/cached-images/')) {
          const localPath = path.join(__dirname, '..', 'public', imageUrl);
          const cloudinaryUrl = await uploadToCloudinary(localPath, 'tourism-website/admin');
          if (cloudinaryUrl) {
            newImages.push(cloudinaryUrl);
            hasChanges = true;
          } else {
            newImages.push(imageUrl);
          }
        } else {
          newImages.push(imageUrl);
        }
      }
      updates.mainImages = newImages;
    }
    
    if (hasChanges) {
      await Cuisine.findByIdAndUpdate(cuisine._id, updates);
      updated++;
      console.log(`✅ Updated cuisine: ${cuisine.name}`);
    }
  }
  
  console.log(`✅ Migrated ${updated} cuisines`);
}

// Migrate Cuisine Places
async function migrateCuisinePlaces() {
  console.log('\n🍽️ Migrating Cuisine Places...');
  
  const places = await CuisinePlace.find({});
  let updated = 0;
  
  for (const place of places) {
    let hasChanges = false;
    const updates = {};
    
    // Migrate main images
    if (place.images && Array.isArray(place.images)) {
      const newImages = [];
      for (const imageUrl of place.images) {
        if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/client/img/') || imageUrl.startsWith('/cached-images/')) {
          const localPath = path.join(__dirname, '..', 'public', imageUrl);
          const cloudinaryUrl = await uploadToCloudinary(localPath, 'tourism-website/admin');
          if (cloudinaryUrl) {
            newImages.push(cloudinaryUrl);
            hasChanges = true;
          } else {
            newImages.push(imageUrl);
          }
        } else {
          newImages.push(imageUrl);
        }
      }
      updates.images = newImages;
    }
    
    // Migrate reviews avatars
    if (place.reviews && Array.isArray(place.reviews)) {
      const newReviews = place.reviews.map(review => {
        if (review.avatar && (review.avatar.startsWith('/uploads/') || review.avatar.startsWith('/client/img/'))) {
          const localPath = path.join(__dirname, '..', 'public', review.avatar);
          return uploadToCloudinary(localPath, 'tourism-website/admin').then(cloudinaryUrl => ({
            ...review,
            avatar: cloudinaryUrl || review.avatar
          }));
        }
        return Promise.resolve(review);
      });
      
      const resolvedReviews = await Promise.all(newReviews);
      updates.reviews = resolvedReviews;
      hasChanges = true;
    }
    
    if (hasChanges) {
      await CuisinePlace.findByIdAndUpdate(place._id, updates);
      updated++;
      console.log(`✅ Updated cuisine place: ${place.name}`);
    }
  }
  
  console.log(`✅ Migrated ${updated} cuisine places`);
}

// Migrate Entertainments
async function migrateEntertainments() {
  console.log('\n🎭 Migrating Entertainments...');
  
  const entertainments = await Entertainment.find({});
  let updated = 0;
  
  for (const entertainment of entertainments) {
    let hasChanges = false;
    const updates = {};
    
    // Migrate main images
    if (entertainment.images && Array.isArray(entertainment.images)) {
      const newImages = [];
      for (const imageUrl of entertainment.images) {
        if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/client/img/') || imageUrl.startsWith('/cached-images/')) {
          const localPath = path.join(__dirname, '..', 'public', imageUrl);
          const cloudinaryUrl = await uploadToCloudinary(localPath, 'tourism-website/admin');
          if (cloudinaryUrl) {
            newImages.push(cloudinaryUrl);
            hasChanges = true;
          } else {
            newImages.push(imageUrl);
          }
        } else {
          newImages.push(imageUrl);
        }
      }
      updates.images = newImages;
    }
    
    // Migrate reviews avatars
    if (entertainment.reviews && Array.isArray(entertainment.reviews)) {
      const newReviews = entertainment.reviews.map(review => {
        if (review.avatar && (review.avatar.startsWith('/uploads/') || review.avatar.startsWith('/client/img/'))) {
          const localPath = path.join(__dirname, '..', 'public', review.avatar);
          return uploadToCloudinary(localPath, 'tourism-website/admin').then(cloudinaryUrl => ({
            ...review,
            avatar: cloudinaryUrl || review.avatar
          }));
        }
        return Promise.resolve(review);
      });
      
      const resolvedReviews = await Promise.all(newReviews);
      updates.reviews = resolvedReviews;
      hasChanges = true;
    }
    
    if (hasChanges) {
      await Entertainment.findByIdAndUpdate(entertainment._id, updates);
      updated++;
      console.log(`✅ Updated entertainment: ${entertainment.name}`);
    }
  }
  
  console.log(`✅ Migrated ${updated} entertainments`);
}

// Migrate Users
async function migrateUsers() {
  console.log('\n👤 Migrating Users...');
  
  const users = await User.find({ avatar: { $regex: '^/uploads/' } });
  let updated = 0;
  
  for (const user of users) {
    if (user.avatar && user.avatar.startsWith('/uploads/')) {
      const localPath = path.join(__dirname, '..', 'public', user.avatar);
      const cloudinaryUrl = await uploadToCloudinary(localPath, 'tourism-website/users');
      
      if (cloudinaryUrl) {
        await User.findByIdAndUpdate(user._id, { avatar: cloudinaryUrl });
        updated++;
        console.log(`✅ Updated user: ${user.email}`);
      }
    }
  }
  
  console.log(`✅ Migrated ${updated} users`);
}

// Main migration function
async function migrateAll() {
  try {
    console.log('🚀 Starting migration to Cloudinary...');
    console.log('📋 This will upload all local images to Cloudinary and update database URLs');
    
    // Test Cloudinary connection
    const ping = await cloudinary.api.ping();
    console.log('✅ Cloudinary connection successful');
    
    // Run migrations
    await migrateAttractions();
    await migrateAccommodations();
    await migrateCuisines();
    await migrateCuisinePlaces();
    await migrateEntertainments();
    await migrateUsers();
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('💡 You can now safely delete the public/uploads directory');
    console.log('💡 All images are now served from Cloudinary CDN');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

if (require.main === module) {
  migrateAll().catch(console.error);
}

module.exports = { migrateAll };
