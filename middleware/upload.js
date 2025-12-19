const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cấu hình storage cho multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join('public', 'uploads');
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    } catch (err) {
      cb(err, dir);
    }
  },
  filename: function (req, file, cb) {
    // Tạo tên file unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter để chỉ cho phép upload ảnh
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ được upload file ảnh!'), false);
  }
};

// Cấu hình multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Giới hạn 5MB
  }
});

// Middleware để upload nhiều ảnh
const uploadMultiple = upload.array('images', 10);

// Middleware để upload một ảnh
const uploadSingle = upload.single('image');

// Middleware để upload với field names động (cho places images)
const uploadDynamic = upload.any();

module.exports = {
  uploadMultiple,
  uploadSingle,
  uploadDynamic,
  upload
};
