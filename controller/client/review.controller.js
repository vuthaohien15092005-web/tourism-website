const Review = require('../../model/Review');
const Attraction = require('../../model/Attraction');
const Accommodation = require('../../model/Accommodation');
const Food = require('../../model/Food');
const Entertainment = require('../../model/Entertainment');
const path = require('path');
const fs = require('fs');
const { deleteImage, deleteMultipleImages } = require('../../middleware/cloudinary');

// =================================================================
// LẤY DANH SÁCH REVIEWS CHO MỘT TARGET (attraction, accommodation, v.v.)
// =================================================================
module.exports.getReviews = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate targetType
    const validTypes = ['attraction', 'accommodation', 'food', 'entertainment', 'tour', 'cuisine-place'];
    if (!validTypes.includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Loại đánh giá không hợp lệ'
      });
    }

    // Query reviews
    const query = {
      targetType,
      targetId,
      isActive: true
    };

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(query)
    ]);

    // Tính toán thống kê
    const allReviews = await Review.find({ targetType, targetId, isActive: true }).lean();
    const totalReviews = allReviews.length;
    const averageRating = totalReviews > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    // Phân bố rating
    const ratingDistribution = {
      5: allReviews.filter(r => r.rating === 5).length,
      4: allReviews.filter(r => r.rating === 4).length,
      3: allReviews.filter(r => r.rating === 3).length,
      2: allReviews.filter(r => r.rating === 2).length,
      1: allReviews.filter(r => r.rating === 1).length,
    };

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalReviews: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        stats: {
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews,
          ratingDistribution
        }
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải đánh giá'
    });
  }
};

// =================================================================
// TẠO REVIEW MỚI
// =================================================================
module.exports.createReview = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    
    // Debug logging
    console.log('=== CREATE REVIEW DEBUG ===');
    console.log('Body:', req.body);
    console.log('Files:', req.files);
    console.log('Content-Type:', req.headers['content-type']);
    
    // Safely get data from req.body
    const rating = req.body?.rating;
    const title = req.body?.title || '';
    const content = req.body?.content;

    // Validate
    if (!rating || !content) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin',
        debug: {
          hasRating: !!rating,
          hasContent: !!content,
          body: req.body
        }
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Đánh giá phải từ 1 đến 5 sao'
      });
    }

    // Kiểm tra user đã đăng nhập chưa
    if (!res.locals.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập để đánh giá'
      });
    }

    const user = res.locals.user;

    // Kiểm tra target có tồn tại không
    const validTypes = ['attraction', 'accommodation', 'food', 'entertainment', 'tour', 'cuisine-place'];
    if (!validTypes.includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'Loại đánh giá không hợp lệ'
      });
    }

    let targetExists = false;
    switch (targetType) {
      case 'attraction':
        targetExists = await Attraction.exists({ _id: targetId, isActive: true });
        break;
      case 'accommodation':
        targetExists = await Accommodation.exists({ _id: targetId, isActive: true });
        break;
      case 'food':
        targetExists = await Food.exists({ _id: targetId, isActive: true });
        break;
      case 'entertainment':
        targetExists = await Entertainment.exists({ _id: targetId, isActive: true });
        break;
      case 'cuisine-place':
        // For cuisine-place, we need to check if it exists in Cuisine.places
        const Cuisine = require('../../model/Cuisine');
        targetExists = await Cuisine.exists({ 
          'places._id': targetId, 
          isActive: true 
        });
        break;
    }

    if (!targetExists) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đối tượng cần đánh giá'
      });
    }

    // Kiểm tra user đã review chưa
    const existingReview = await Review.findOne({
      targetType,
      targetId,
      'user.email': user.email
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đánh giá rồi. Mỗi người chỉ được đánh giá một lần.'
      });
    }

    // Xử lý upload ảnh lên Cloudinary (nếu có)
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => file.path); // Cloudinary trả về URL trong file.path
    }

    // Tạo review
    const review = new Review({
      user: {
        name: user.fullName || user.email.split('@')[0],
        email: user.email,
        avatar: user.avatar || ''
      },
      targetType,
      targetId,
      rating: parseInt(rating),
      title: title || '',
      content,
      images,
      verified: false, // Admin sẽ xác minh sau
      isActive: true
    });

    await review.save();

    res.json({
      success: true,
      message: 'Đánh giá của bạn đã được gửi thành công!',
      data: review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo đánh giá'
    });
  }
};

// =================================================================
// CẬP NHẬT HELPFUL COUNT (like review)
// =================================================================
module.exports.markHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    review.helpful = (review.helpful || 0) + 1;
    await review.save();

    res.json({
      success: true,
      data: {
        helpful: review.helpful
      }
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật'
    });
  }
};

// =================================================================
// XÓA REVIEW (CHỈ CHO USER TỰ XÓA REVIEW CỦA MÌNH)
// =================================================================
module.exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!res.locals.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập'
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    // Kiểm tra quyền sở hữu
    if (review.user.email !== res.locals.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa đánh giá này'
      });
    }

    // Xóa ảnh từ Cloudinary (nếu có)
    if (review.images && review.images.length > 0) {
      try {
        // Lấy public_id từ URL Cloudinary
        const publicIds = review.images.map(imageUrl => {
          const urlParts = imageUrl.split('/');
          const filename = urlParts[urlParts.length - 1];
          const publicId = filename.split('.')[0]; // Bỏ extension
          return `tourism-website/reviews/${publicId}`;
        });
        
        await deleteMultipleImages(publicIds);
      } catch (error) {
        console.error('Error deleting images from Cloudinary:', error);
        // Không throw error để không ảnh hưởng đến việc xóa review
      }
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({
      success: true,
      message: 'Đã xóa đánh giá'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa đánh giá'
    });
  }
};

// =================================================================
// CẬP NHẬT REVIEW (CHỈ CHO USER EDIT REVIEW CỦA MÌNH)
// =================================================================
module.exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, content } = req.body;

    if (!res.locals.user) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập'
      });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }

    // Kiểm tra quyền sở hữu
    if (review.user.email !== res.locals.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sửa đánh giá này'
      });
    }

    // Cập nhật
    if (rating) review.rating = parseInt(rating);
    if (title !== undefined) review.title = title;
    if (content) review.content = content;

    // Xử lý ảnh mới lên Cloudinary (nếu có)
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path); // Cloudinary trả về URL trong file.path
      review.images = [...(review.images || []), ...newImages];
    }

    await review.save();

    res.json({
      success: true,
      message: 'Cập nhật đánh giá thành công',
      data: review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật đánh giá'
    });
  }
};

