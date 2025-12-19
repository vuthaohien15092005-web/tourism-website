const CuisinePlace = require('../../model/CuisinePlace');
const Cuisine = require('../../model/Cuisine');

// [GET] /admin/cuisine-places
module.exports.index = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const cuisineId = req.query.cuisine || '';

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      if (['published', 'draft', 'hidden'].includes(status)) query.status = status;
      if (status === 'active') query.isActive = true;
      if (status === 'inactive') query.isActive = false;
      if (status === 'featured') query.featured = true;
    }
    if (cuisineId) {
      query.cuisine = cuisineId;
    }

    const places = await CuisinePlace.find(query)
      .populate('cuisine', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CuisinePlace.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Get cuisines for filter dropdown
    const cuisines = await Cuisine.find({ isActive: true }).select('name slug').sort({ name: 1 });

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({
        success: true,
        data: {
          places,
          pagination: { currentPage: page, totalPages, total, limit },
          filters: { search, status, cuisine: cuisineId },
          cuisines
        }
      });
    }

    res.render('admin/layout', {
      pageTitle: 'Quản lý Địa điểm Ẩm thực',
      page: 'cuisine-places',
      user: req.user,
      places,
      cuisines,
      currentPage: page,
      totalPages,
      search,
      status,
      selectedCuisine: cuisineId,
      req: req,
      body: 'admin/pages/cuisine/places/index'
    });
  } catch (error) {
    console.error('Cuisine places index error:', error);
    res.render('admin/layout', {
      pageTitle: 'Quản lý Địa điểm Ẩm thực',
      page: 'cuisine-places',
      user: req.user,
      places: [],
      cuisines: [],
      currentPage: 1,
      totalPages: 0,
      search: '',
      status: '',
      selectedCuisine: '',
      req: req,
      body: 'admin/pages/cuisine/places/index'
    });
  }
};

// [GET] /admin/cuisine/places/create
module.exports.create = async (req, res) => {
  try {
    const cuisines = await Cuisine.find({ isActive: true }).select('name slug').sort({ name: 1 });
    
    res.render('admin/layout', {
      pageTitle: 'Thêm Địa điểm Ẩm thực',
      page: 'cuisine-places',
      body: 'admin/pages/cuisine/places/create',
      user: req.user,
      cuisines
    });
  } catch (error) {
    console.error('Create cuisine place error:', error);
    req.flash('error', 'Có lỗi xảy ra');
    res.redirect('/admin/cuisine/places');
  }
};

// Validation helper
const validateCuisinePlace = (data) => {
  const errors = [];

  if (!data.name || String(data.name).trim() === '') {
    errors.push('Tên địa điểm là bắt buộc');
  }
  if (!data.cuisine || String(data.cuisine).trim() === '') {
    errors.push('Món ăn là bắt buộc');
  }

  // Validate coordinates if provided
  if (data.location && Array.isArray(data.location.coordinates) && data.location.coordinates.length === 2) {
    const [lng, lat] = data.location.coordinates;
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      errors.push('Tọa độ không hợp lệ');
    }
  }

  return errors;
};

// [POST] /admin/cuisine-places
module.exports.store = async (req, res) => {
  try {
    const data = req.body;

    const validationErrors = validateCuisinePlace(data);
    if (validationErrors.length > 0) {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors: validationErrors });
      }
      req.flash('error', validationErrors.join(', '));
      return res.redirect('/admin/cuisine/places/create');
    }

    // Handle images uploads
    if (req.files && req.files.length > 0) {
      const images = req.files.filter(f => f.fieldname === 'placeImages');
      if (images.length > 0) {
        data.images = images.map((f) => f.secure_url || f.path);
      }
    }

    // Handle reviews with avatar uploads
    if (data.reviews && Array.isArray(data.reviews)) {
      data.reviews.forEach((review, reviewIdx) => {
        if (review) {
          // Find avatar file for this review
          const avatarFile = req.files.find(file => 
            file.fieldname && file.fieldname.includes(`reviews[${reviewIdx}][avatar]`)
          );
          if (avatarFile) {
            review.avatar = avatarFile.secure_url || avatarFile.path;
          }
        }
      });
    }

    // Fix location format for GeoJSON
    if (data.location && data.location.coordinates) {
      data.location.type = 'Point';
    }

    // Normalize arrays
    const arrayFields = ['images'];
    arrayFields.forEach((field) => {
      if (data[field]) {
        if (Array.isArray(data[field])) {
          data[field] = data[field].filter((v) => v && String(v).trim() !== '');
        } else {
          data[field] = [data[field]].filter((v) => v && String(v).trim() !== '');
        }
      }
    });

    // Normalize booleans
    data.isActive = data.isActive === 'on' || data.isActive === true || data.isActive === 'true';
    data.featured = data.featured === 'on' || data.featured === true || data.featured === 'true';

    const place = new CuisinePlace(data);
    await place.save();

    // Add place to cuisine
    await Cuisine.findByIdAndUpdate(data.cuisine, { $addToSet: { places: place._id } });

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(201).json({ success: true, message: 'Thêm địa điểm thành công', data: place });
    }
    req.flash('success', 'Thêm địa điểm thành công');
    res.redirect('/admin/cuisine/places');
  } catch (error) {
    console.error('Store cuisine place error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((e) => e.message);
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors: validationErrors });
      }
      req.flash('error', validationErrors.join(', '));
    } else {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi thêm địa điểm', error: error.message });
      }
      req.flash('error', 'Có lỗi xảy ra khi thêm địa điểm: ' + error.message);
    }
    if (!(req.headers.accept && req.headers.accept.includes('application/json'))) {
      return res.redirect('/admin/cuisine/places/create');
    }
  }
};

// [GET] /admin/cuisine-places/:id
module.exports.show = async (req, res) => {
  try {
    const place = await CuisinePlace.findById(req.params.id).populate('cuisine', 'name slug');
    if (!place) {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy địa điểm' });
      }
      req.flash('error', 'Không tìm thấy địa điểm');
      return res.redirect('/admin/cuisine/places');
    }

    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ success: true, data: place });
    }

    res.render('admin/layout', {
      pageTitle: `Chi tiết: ${place.name}`,
      page: 'cuisine-places',
      body: 'admin/pages/cuisine/places/show',
      user: req.user,
      place
    });
  } catch (error) {
    console.error('Show cuisine place error:', error);
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
    req.flash('error', 'Có lỗi xảy ra');
    res.redirect('/admin/cuisine/places');
  }
};

// [GET] /admin/cuisine-places/edit/:id
module.exports.edit = async (req, res) => {
  try {
    const id = req.params.id;
    const place = await CuisinePlace.findById(id).populate('cuisine', 'name slug');
    if (!place) {
      req.flash('error', 'Không tìm thấy địa điểm');
      return res.redirect('/admin/cuisine/places');
    }

    const cuisines = await Cuisine.find({ isActive: true }).select('name slug').sort({ name: 1 });

    res.render('admin/layout', {
      pageTitle: `Chỉnh sửa: ${place.name}`,
      page: 'cuisine-places',
      body: 'admin/pages/cuisine/places/edit',
      user: req.user,
      place,
      cuisines
    });
  } catch (error) {
    console.error('Edit cuisine place error:', error);
    req.flash('error', 'Có lỗi xảy ra');
    res.redirect('/admin/cuisine/places');
  }
};

// [PATCH] /admin/cuisine-places/edit/:id
module.exports.editPatch = async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    const place = await CuisinePlace.findById(id);
    if (!place) {
      req.flash('error', 'Không tìm thấy địa điểm');
      return res.redirect(req.get('Referrer') || '/admin/cuisine/places');
    }

    // Handle image removals
    if (data.removeImages) {
      const removeArray = Array.isArray(data.removeImages) ? data.removeImages : [data.removeImages];
      const removeIndexes = removeArray.map((i) => parseInt(i));
      place.images = (place.images || []).filter((_, idx) => !removeIndexes.includes(idx));
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const placeImages = req.files.filter(f => f.fieldname === 'placeImages');
      if (placeImages.length > 0) {
        const newImages = placeImages.map((file) => file.secure_url || file.path);
        place.images = [ ...(place.images || []), ...newImages ];
      }
    }

    // Handle reviews with avatar uploads and removals
    if (data.reviews && Array.isArray(data.reviews)) {
      data.reviews.forEach((review, reviewIdx) => {
        if (review) {
          // Handle avatar removal
          if (review.removeAvatar) {
            review.avatar = null;
          }
          
          // Handle avatar upload
          const avatarFile = req.files.find(file => 
            file.fieldname && file.fieldname.includes(`reviews[${reviewIdx}][avatar]`)
          );
          if (avatarFile) {
            review.avatar = avatarFile.secure_url || avatarFile.path;
          }
        }
      });
    }

    // Fix location format for GeoJSON
    if (data.location && data.location.coordinates) {
      data.location.type = 'Point';
    }

    // Normalize booleans
    data.isActive = data.isActive === 'on' || data.isActive === true || data.isActive === 'true';
    data.featured = data.featured === 'on' || data.featured === true || data.featured === 'true';

    if (data._method) delete data._method;

    const setPayload = {};
    Object.keys(data).forEach((key) => {
      if (key !== 'removeImages' && data[key] !== undefined) setPayload[key] = data[key];
    });
    setPayload.images = place.images;

    await CuisinePlace.updateOne({ _id: id }, { $set: setPayload }, { runValidators: true });
    req.flash('success', 'Đã cập nhật thành công địa điểm!');
  } catch (error) {
    console.error('Edit cuisine place PATCH error:', error);
    req.flash('error', 'Cập nhật thất bại!');
  }
  return res.redirect(req.get('Referrer') || '/admin/cuisine-places');
};

// [PUT] /admin/cuisine-places/:id
module.exports.update = async (req, res) => {
  try {
    const data = req.body;
    const place = await CuisinePlace.findById(req.params.id);
    if (!place) {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy địa điểm' });
      }
      req.flash('error', 'Không tìm thấy địa điểm');
      return res.redirect('/admin/cuisine/places');
    }

    const wantsJson = !!(req.headers.accept && req.headers.accept.includes('application/json'));
    if (!wantsJson) {
      const validationErrors = validateCuisinePlace(data);
      if (validationErrors.length > 0) {
        req.flash('error', validationErrors.join(', '));
        return res.redirect(`/admin/cuisine/places/edit/${req.params.id}`);
      }
    }

    // Handle remove indexes
    if (data.removeImages) {
      const removeArray = Array.isArray(data.removeImages) ? data.removeImages : [data.removeImages];
      const removeIndexes = removeArray.map((i) => parseInt(i));
      place.images = (place.images || []).filter((_, idx) => !removeIndexes.includes(idx));
    }

    // Handle uploads
    if (req.files && req.files.length > 0) {
      const placeImages = req.files.filter(f => f.fieldname === 'placeImages');
      if (placeImages.length > 0) {
        const newImages = placeImages.map((file) => file.secure_url || file.path);
        place.images = [ ...(place.images || []), ...newImages ];
      }
    }
    if (!data.images) data.images = place.images;

    // Handle reviews with avatar uploads and removals
    if (data.reviews && Array.isArray(data.reviews)) {
      data.reviews.forEach((review, reviewIdx) => {
        if (review) {
          // Handle avatar removal
          if (review.removeAvatar) {
            review.avatar = null;
          }
          
          // Handle avatar upload
          const avatarFile = req.files.find(file => 
            file.fieldname && file.fieldname.includes(`reviews[${reviewIdx}][avatar]`)
          );
          if (avatarFile) {
            review.avatar = avatarFile.secure_url || avatarFile.path;
          }
        }
      });
    }

    // Fix location format for GeoJSON
    if (data.location && data.location.coordinates) {
      data.location.type = 'Point';
    }

    // Normalize booleans
    data.isActive = data.isActive === 'on' || data.isActive === true;
    data.featured = data.featured === 'on' || data.featured === true;

    const setPayload = {};
    Object.keys(data).forEach((k) => { if (data[k] !== undefined) setPayload[k] = data[k]; });

    await CuisinePlace.updateOne({ _id: req.params.id }, { $set: setPayload }, { runValidators: true });
    const updated = await CuisinePlace.findById(req.params.id);

    if (wantsJson) {
      return res.json({ success: true, message: 'Cập nhật địa điểm thành công', data: updated });
    }
    req.flash('success', 'Cập nhật địa điểm thành công');
    return res.redirect(req.get('Referrer') || '/admin/cuisine/places');
  } catch (error) {
    console.error('Update cuisine place error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((e) => e.message);
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors: validationErrors });
      }
      req.flash('error', validationErrors.join(', '));
    } else {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi cập nhật địa điểm', error: error.message });
      }
      req.flash('error', 'Có lỗi xảy ra khi cập nhật địa điểm: ' + error.message);
    }
    if (!(req.headers.accept && req.headers.accept.includes('application/json'))){
      return res.redirect(`/admin/cuisine/places/edit/${req.params.id}`);
    }
  }
};

// [DELETE] /admin/cuisine-places/delete/:id
module.exports.destroy = async (req, res) => {
  try {
    const place = await CuisinePlace.findById(req.params.id);
    if (!place) {
      req.flash('error', 'Không tìm thấy địa điểm');
      return res.redirect('/admin/cuisine/places');
    }

    // Remove from cuisine
    await Cuisine.findByIdAndUpdate(place.cuisine, { $pull: { places: req.params.id } });
    
    // Delete the place
    await CuisinePlace.findByIdAndDelete(req.params.id);
    
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.json({ success: true, message: 'Xóa địa điểm thành công', data: { id: req.params.id } });
    }
    req.flash('success', 'Xóa địa điểm thành công');
    res.redirect('/admin/cuisine/places');
  } catch (error) {
    console.error('Delete cuisine place error:', error);
    if (req.headers.accept && req.headers.accept.includes('application/json')) {
      return res.status(500).json({ success: false, message: 'Có lỗi xảy ra khi xóa địa điểm', error: error.message });
    }
    req.flash('error', 'Có lỗi xảy ra khi xóa địa điểm: ' + error.message);
    res.redirect('/admin/cuisine/places');
  }
};
