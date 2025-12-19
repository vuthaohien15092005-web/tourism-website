const express = require('express')
const route = express.Router()

const controller = require("../../controller/client/auth.controller")
const validate = require("../../validates/auth.validate")
const authMiddleware = require("../../middleware/auth")
const { uploadAvatarSingle } = require("../../middleware/cloudinary")

route.get('/register', controller.register)

route.post('/register', validate.registerPost, controller.registerPost)

route.get('/login', controller.login)

route.post('/login', validate.loginPost, controller.loginPost)

route.get('/logout', controller.logout)

route.get('/password/forgot', controller.forgotPassword)

route.post('/password/forgot', validate.forgotPasswordPost, controller.forgotPasswordPost)

route.get('/password/otp', controller.otpPassword)

route.post('/password/otp', controller.otpPasswordPost)

route.get('/password/reset', controller.resetPassword)

route.post('/password/reset', validate.resetPasswordPost, controller.resetPasswordPost)

route.get('/info', authMiddleware.requireAuth, controller.info)

// Cập nhật thông tin cơ bản: avatar + fullName (email, phone chỉ đọc)
route.post('/info', 
  authMiddleware.requireAuth, 
  (req, res, next) => {
    console.log('🔍 Before upload middleware:');
    console.log('  Content-Type:', req.headers['content-type']);
    console.log('  Method:', req.method);
    console.log('  Files before:', req.files);
    next();
  },
  uploadAvatarSingle, 
  (req, res, next) => {
    console.log('🔍 After upload middleware:');
    console.log('  req.file:', req.file);
    console.log('  req.body:', req.body);
    next();
  },
  controller.infoPost,
  // Error handling cho multer
  (err, req, res, next) => {
    if (err) {
      console.error('❌ Upload error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        req.flash('error', 'File quá lớn! Kích thước tối đa 5MB');
      } else if (err.message.includes('Chỉ được upload file ảnh')) {
        req.flash('error', 'Chỉ được upload file ảnh!');
      } else {
        req.flash('error', 'Lỗi upload file: ' + err.message);
      }
      return res.redirect('/auth/info');
    }
    next();
  }
)

module.exports = route;
