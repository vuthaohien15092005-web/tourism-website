const express = require('express');
const route = express.Router();
const reviewController = require('../../controller/client/review.controller');
const authMiddleware = require('../../middleware/auth');
const { uploadMultiple } = require('../../middleware/cloudinary');

// =================================================================
// PUBLIC ROUTES - Không cần đăng nhập
// =================================================================

// Lấy danh sách reviews cho một target
route.get('/:targetType/:targetId', reviewController.getReviews);

// =================================================================
// PROTECTED ROUTES - Cần đăng nhập
// =================================================================

// Tạo review mới (có upload ảnh lên Cloudinary)
route.post(
  '/:targetType/:targetId',
  authMiddleware.requireAuth,
  (req, res, next) => {
    console.log('Before Cloudinary upload - Content-Type:', req.headers['content-type']);
    next();
  },
  uploadMultiple, // Upload lên Cloudinary
  (req, res, next) => {
    console.log('After Cloudinary upload - Body:', req.body);
    console.log('After Cloudinary upload - Files:', req.files);
    next();
  },
  reviewController.createReview
);

// Đánh dấu review hữu ích
route.post('/:reviewId/helpful', reviewController.markHelpful);

// Cập nhật review (có upload ảnh lên Cloudinary)
route.put(
  '/:reviewId',
  authMiddleware.requireAuth,
  uploadMultiple, // Upload lên Cloudinary
  reviewController.updateReview
);

// Xóa review
route.delete('/:reviewId', authMiddleware.requireAuth, reviewController.deleteReview);

module.exports = route;

