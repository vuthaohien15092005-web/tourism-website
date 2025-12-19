const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cấu hình storage cho Cloudinary - Reviews
const storageReviews = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tourism-website/reviews', // Thư mục lưu trữ reviews
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
      { fetch_format: 'auto' }
    ],
    resource_type: 'image'
  }
});

// Cấu hình storage cho Cloudinary - Admin uploads
const storageAdmin = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tourism-website/admin', // Thư mục lưu trữ admin uploads
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
      { fetch_format: 'auto' }
    ],
    resource_type: 'image'
  }
});

// Cấu hình storage cho Cloudinary - User avatars
const storageAvatar = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tourism-website/avatars', // Thư mục lưu trữ avatars
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 300, height: 300, crop: 'fill', gravity: 'face', quality: 'auto' },
      { fetch_format: 'auto' }
    ],
    resource_type: 'image',
    public_id: (req, file) => {
      // Tạo unique public_id cho avatar
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      return `avatar_${timestamp}_${random}`;
    }
  }
});

// Cấu hình multer với Cloudinary storage - Reviews
const uploadReviews = multer({
  storage: storageReviews,
  fileFilter: (req, file, cb) => {
    // Chỉ cho phép upload ảnh
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ được upload file ảnh!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // Giới hạn 10MB
    files: 5 // Tối đa 5 file
  }
});

// Cấu hình multer với Cloudinary storage - Admin
const uploadAdmin = multer({
  storage: storageAdmin,
  fileFilter: (req, file, cb) => {
    // Chỉ cho phép upload ảnh
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ được upload file ảnh!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // Giới hạn 10MB
    files: 10 // Tối đa 10 file cho admin
  }
});

// Cấu hình multer với Cloudinary storage - Avatar
const uploadAvatar = multer({
  storage: storageAvatar,
  fileFilter: (req, file, cb) => {
    console.log('🔍 Avatar file filter:', file.originalname, file.mimetype);
    // Chỉ cho phép upload ảnh
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      console.log('❌ Invalid file type:', file.mimetype);
      cb(new Error('Chỉ được upload file ảnh!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn 5MB cho avatar
    files: 1 // Chỉ 1 file cho avatar
  }
});

// Middleware để upload nhiều ảnh - Reviews
const uploadMultiple = uploadReviews.array('images', 5);

// Middleware để upload một ảnh - Reviews  
const uploadSingle = uploadReviews.single('image');

// Middleware để upload với field names động - Admin
const uploadDynamic = uploadAdmin.any();

// Middleware để upload avatar - User
const uploadAvatarSingle = uploadAvatar.single('avatar');

// Debug middleware để log thông tin upload
const debugUpload = (req, res, next) => {
  console.log('🔍 Upload Debug Info:');
  console.log('  Content-Type:', req.headers['content-type']);
  console.log('  Method:', req.method);
  console.log('  URL:', req.originalUrl);
  console.log('  Body keys:', Object.keys(req.body));
  console.log('  Files before upload:', req.files);
  
  next();
};

// Hàm xóa ảnh từ Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Hàm xóa nhiều ảnh từ Cloudinary
const deleteMultipleImages = async (publicIds) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    console.error('Error deleting multiple images from Cloudinary:', error);
    throw error;
  }
};

// Hàm lấy URL ảnh từ Cloudinary
const getImageUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, options);
};

module.exports = {
  cloudinary,
  uploadMultiple,
  uploadSingle,
  uploadDynamic,
  uploadReviews,
  uploadAdmin,
  uploadAvatar,
  uploadAvatarSingle,
  deleteImage,
  deleteMultipleImages,
  getImageUrl,
  debugUpload
};
