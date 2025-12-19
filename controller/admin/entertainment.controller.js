const Entertainment = require('../../model/Entertainment');
const { uploadMultiple } = require('../../middleware/upload');

// Get all entertainments for admin
module.exports.index = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const filter = {};
        if (req.query.zone) filter.zone = req.query.zone;
        if (req.query.type) filter.type = req.query.type;
        if (req.query.isActive !== undefined && req.query.isActive !== '') {
            filter.isActive = req.query.isActive === 'true';
        }
        
        const entertainments = await Entertainment.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
            
        const total = await Entertainment.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);
        
        console.log('Total documents:', total);
        console.log('Total pages:', totalPages);
        console.log('Entertainments found:', entertainments.length);
        console.log('=====================================');
        
        // Define fixed zones and types for filter dropdowns
        const zones = [
            'Khu văn hoá – nghệ thuật',
            'Địa điểm ngoài trời – công viên', 
            'Trung tâm thương mại – Khu vui chơi trong nhà',
            'Khu vui chơi giải trí quy mô lớn'
        ];
        const types = [
            'Nhà hát - Biểu diễn nghệ thuật',
            'Rạp chiếu phim',
            'Karaoke - Quán bar',
            'Công viên giải trí',
            'Trung tâm thương mại',
            'Khu vui chơi trẻ em',
            'Sân vận động - Thể thao',
            'Bảo tàng - Triển lãm',
            'Khu ẩm thực - Giải trí',
            'Công viên nước',
            'Khu du lịch sinh thái',
            'Khu vui chơi tổng hợp'
        ];
        
        res.render('admin/layout', {
            pageTitle: 'Quản lý Giải trí',
            page: 'entertainments',
            body: 'admin/pages/entertainments/index',
            user: req.user,
            entertainments,
            currentPage: page,
            totalPages,
            req: req,
            filters: {
                zones,
                types,
                currentZone: req.query.zone,
                currentType: req.query.type,
                currentActive: req.query.isActive
            }
        });
    } catch (error) {
        console.error('Error fetching entertainments:', error);
        req.flash('error', 'Có lỗi xảy ra khi tải danh sách giải trí');
        res.redirect('/admin/dashboard');
    }
};

// Show create form
module.exports.create = async (req, res) => {
    try {
        const zones = [
            'Khu văn hoá – nghệ thuật',
            'Địa điểm ngoài trời – công viên', 
            'Trung tâm thương mại – Khu vui chơi trong nhà',
            'Khu vui chơi giải trí quy mô lớn'
        ];
        const types = [
            'Nhà hát - Biểu diễn nghệ thuật',
            'Rạp chiếu phim',
            'Karaoke - Quán bar',
            'Công viên giải trí',
            'Trung tâm thương mại',
            'Khu vui chơi trẻ em',
            'Sân vận động - Thể thao',
            'Bảo tàng - Triển lãm',
            'Khu ẩm thực - Giải trí',
            'Công viên nước',
            'Khu du lịch sinh thái',
            'Khu vui chơi tổng hợp'
        ];
        
        res.render('admin/layout', {
            pageTitle: 'Thêm mới Giải trí',
            page: 'entertainments',
            body: 'admin/pages/entertainments/create',
            zones,
            types,
            entertainment: null,
            errors: null
        });
    } catch (error) {
        console.error('Error loading create form:', error);
        req.flash('error', 'Có lỗi xảy ra khi tải form');
        res.redirect('/admin/entertainments');
    }
};

// Store new entertainment
module.exports.store = async (req, res) => {
    try {
        // Basic validation (support bracket notation map[lat]/map[lng]/map[embedUrl])
        const { zone, name, type, address, openHours, ticket } = req.body;
        const mapData = req.body.map || {};
        const lat = mapData.lat;
        const lng = mapData.lng;
        const embedUrl = mapData.embedUrl || '';
        if (!zone || !name || !type || !address || !openHours || !ticket || !lat || !lng) {
            const zones = [
                'Khu văn hóa - nghệ thuật',
                'Công viên ngoài trời', 
                'Trung tâm thương mại - vui chơi trong nhà',
                'Khu vui chơi tổng hợp',
                'Khu thể thao - giải trí',
                'Khu ẩm thực - giải trí',
                'Khu du lịch sinh thái',
                'Khu vui chơi trẻ em'
            ];
            const types = [
                'Nhà hát - Biểu diễn nghệ thuật',
                'Rạp chiếu phim',
                'Karaoke - Quán bar',
                'Công viên giải trí',
                'Trung tâm thương mại',
                'Khu vui chơi trẻ em',
                'Sân vận động - Thể thao',
                'Bảo tàng - Triển lãm',
                'Khu ẩm thực - Giải trí',
                'Công viên nước',
                'Khu du lịch sinh thái',
                'Khu vui chơi tổng hợp'
            ];
            
            return res.render('admin/layout', {
                pageTitle: 'Thêm mới Giải trí',
                page: 'entertainments',
                body: 'admin/pages/entertainments/create',
                zones,
                types,
                entertainment: { ...req.body, reviewWidgetScript: req.body.reviewWidgetScript },
                errors: [{ msg: 'Vui lòng điền đầy đủ các trường bắt buộc' }]
            });
        }

        const {
            history, architecture,
            experience, notes,
            activities, targetAudience
        } = req.body;

        // Process arrays
        const experienceArray = experience ? experience.split('\n').filter(item => item.trim()) : [];
        const notesArray = notes ? notes.split('\n').filter(item => item.trim()) : [];
        const activitiesArray = activities ? activities.split('\n').filter(item => item.trim()) : [];
        const targetAudienceArray = targetAudience ? targetAudience.split('\n').filter(item => item.trim()) : [];
        
        // Process uploaded images
        const imagesArray = req.files && req.files.length > 0 
            ? req.files.filter(f => f.fieldname === 'images').map(file => file.secure_url || file.path)
            : [];
        
        // If no images uploaded, set default placeholder
        if (imagesArray.length === 0) {
            imagesArray.push('/client/img/header-bg.jfif'); // Default placeholder image
        }

        // Process reviews if provided
        let reviewsArray = [];
        if (req.body.reviews) {
            try {
                const raw = Array.isArray(req.body.reviews) ? req.body.reviews : Object.values(req.body.reviews);
                // Map uploaded avatar files into corresponding review items
                if (req.files && req.files.length > 0) {
                    raw.forEach((r, idx) => {
                        const avatarFile = req.files.find(f => f.fieldname === `reviews[${idx}][avatarFile]`);
                        if (avatarFile) {
                            r.avatar = avatarFile.secure_url || avatarFile.path;
                        }
                    });
                }
                reviewsArray = raw
                    .filter(Boolean)
                    .map((r) => ({
                        author: r.author || '',
                        avatar: r.avatar || '',
                        rating: typeof r.rating === 'number' ? r.rating : parseFloat(r.rating) || 0,
                        text: r.text || '',
                        verified: r.verified === 'on' || r.verified === true || r.verified === 'true',
                        date: r.date ? new Date(r.date) : undefined,
                        source: r.source || 'google'
                    }))
                    .filter((r) => r.author || r.text);
            } catch (e) {
                console.error('Error processing reviews:', e);
                req.flash('error', 'reviews gửi từ form không hợp lệ');
                return res.redirect('/admin/entertainments/create');
            }
        }

        const entertainmentData = {
            zone,
            name,
            type,
            address,
            openHours,
            ticket,
            
            history: history || null,
            architecture: architecture || null,
            experience: experienceArray,
            notes: notesArray,
            activities: activitiesArray,
            targetAudience: targetAudienceArray,
            images: imagesArray,
            reviews: reviewsArray,
            map: {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)], // GeoJSON uses [longitude, latitude]
                embedUrl: embedUrl
            }
        };

        const entertainment = new Entertainment(entertainmentData);
        await entertainment.save();

        req.flash('success', 'Thêm mới giải trí thành công');
        res.redirect('/admin/entertainments');
    } catch (error) {
        console.error('Error creating entertainment:', error);
        req.flash('error', 'Có lỗi xảy ra khi thêm mới giải trí');
        res.redirect('/admin/entertainments/create');
    }
};

// Show entertainment details
module.exports.show = async (req, res) => {
    try {
        const entertainment = await Entertainment.findById(req.params.id);
        if (!entertainment) {
            req.flash('error', 'Không tìm thấy giải trí');
            return res.redirect('/admin/entertainments');
        }

        res.render('admin/layout', {
            pageTitle: `Chi tiết - ${entertainment.name}`,
            page: 'entertainments',
            body: 'admin/pages/entertainments/show',
            entertainment
        });
    } catch (error) {
        console.error('Error fetching entertainment:', error);
        req.flash('error', 'Có lỗi xảy ra khi tải chi tiết');
        res.redirect('/admin/entertainments');
    }
};

// Show edit form
module.exports.edit = async (req, res) => {
    try {
        const entertainment = await Entertainment.findById(req.params.id);
        if (!entertainment) {
            req.flash('error', 'Không tìm thấy giải trí');
            return res.redirect('/admin/entertainments');
        }

        const zones = [
            'Khu văn hóa - nghệ thuật',
            'Công viên ngoài trời', 
            'Trung tâm thương mại - vui chơi trong nhà',
            'Khu vui chơi tổng hợp',
            'Khu thể thao - giải trí',
            'Khu ẩm thực - giải trí',
            'Khu du lịch sinh thái',
            'Khu vui chơi trẻ em'
        ];
        const types = [
            'Nhà hát - Biểu diễn nghệ thuật',
            'Rạp chiếu phim',
            'Karaoke - Quán bar',
            'Công viên giải trí',
            'Trung tâm thương mại',
            'Khu vui chơi trẻ em',
            'Sân vận động - Thể thao',
            'Bảo tàng - Triển lãm',
            'Khu ẩm thực - Giải trí',
            'Công viên nước',
            'Khu du lịch sinh thái',
            'Khu vui chơi tổng hợp'
        ];

        res.render('admin/layout', {
            pageTitle: `Chỉnh sửa - ${entertainment.name}`,
            page: 'entertainments',
            body: 'admin/pages/entertainments/edit',
            entertainment,
            zones,
            types,
            errors: null
        });
    } catch (error) {
        console.error('Error loading edit form:', error);
        req.flash('error', 'Có lỗi xảy ra khi tải form chỉnh sửa');
        res.redirect('/admin/entertainments');
    }
};

// Update entertainment
module.exports.update = async (req, res) => {
    try {
        console.log('=== ENTERTAINMENT UPDATE DEBUG ===');
        console.log('Body:', req.body);
        console.log('Map data:', req.body.map);
        
        // Basic validation (support bracket notation map[lat]/map[lng]/map[embedUrl])
        const { zone, name, type, address, openHours, ticket } = req.body;
        const mapData = req.body.map || {};
        const lat = mapData.lat;
        const lng = mapData.lng;
        const embedUrl = mapData.embedUrl || '';
        if (!zone || !name || !type || !address || !openHours || !ticket || !lat || !lng) {
            const entertainment = await Entertainment.findById(req.params.id);
            const zones = [
                'Khu văn hóa - nghệ thuật',
                'Công viên ngoài trời', 
                'Trung tâm thương mại - vui chơi trong nhà',
                'Khu vui chơi tổng hợp',
                'Khu thể thao - giải trí',
                'Khu ẩm thực - giải trí',
                'Khu du lịch sinh thái',
                'Khu vui chơi trẻ em'
            ];
            const types = [
                'Nhà hát - Biểu diễn nghệ thuật',
                'Rạp chiếu phim',
                'Karaoke - Quán bar',
                'Công viên giải trí',
                'Trung tâm thương mại',
                'Khu vui chơi trẻ em',
                'Sân vận động - Thể thao',
                'Bảo tàng - Triển lãm',
                'Khu ẩm thực - Giải trí',
                'Công viên nước',
                'Khu du lịch sinh thái',
                'Khu vui chơi tổng hợp'
            ];
            
            return res.render('admin/layout', {
                pageTitle: `Chỉnh sửa - ${entertainment.name}`,
                page: 'entertainments',
                body: 'admin/pages/entertainments/edit',
                entertainment: { ...entertainment.toObject(), ...req.body, reviewWidgetScript: req.body.reviewWidgetScript },
                zones,
                types,
                errors: [{ msg: 'Vui lòng điền đầy đủ các trường bắt buộc' }]
            });
        }

        const {
            history, architecture,
            experience, notes,
            activities, targetAudience,
            isActive, featured, removeImages
        } = req.body;

        // Process arrays
        const experienceArray = experience ? experience.split('\n').filter(item => item.trim()) : [];
        const notesArray = notes ? notes.split('\n').filter(item => item.trim()) : [];
        const activitiesArray = activities ? activities.split('\n').filter(item => item.trim()) : [];
        const targetAudienceArray = targetAudience ? targetAudience.split('\n').filter(item => item.trim()) : [];
        
        // Get existing entertainment to preserve current images
        const existingEntertainment = await Entertainment.findById(req.params.id);
        if (!existingEntertainment) {
            req.flash('error', 'Không tìm thấy giải trí');
            return res.redirect('/admin/entertainments');
        }
        
        let imagesArray = [...existingEntertainment.images];
        
        // If no activities provided, use existing ones or default
        // No activities fallback
        
        // Remove selected images
        if (removeImages) {
            const removeArray = Array.isArray(removeImages) ? removeImages : [removeImages];
            const removeIndexes = removeArray.map(index => parseInt(index));
            imagesArray = imagesArray.filter((_, index) => !removeIndexes.includes(index));
        }
        
        // Add new uploaded images
        if (req.files && req.files.length > 0) {
            // Filter main images (fieldname = 'images')
            const mainImages = req.files.filter(f => f.fieldname === 'images');
            if (mainImages.length > 0) {
                const newImages = mainImages.map(file => file.secure_url || file.path);
                imagesArray = [...imagesArray, ...newImages];
            }
        }
        
        // If no images left, set default placeholder
        if (imagesArray.length === 0) {
            imagesArray.push('/client/img/header-bg.jfif');
        }

        // Process reviews if provided
        let reviewsArray = existingEntertainment.reviews || [];
        if (req.body.reviews) {
            try {
                const raw = Array.isArray(req.body.reviews) ? req.body.reviews : Object.values(req.body.reviews);
                // Map uploaded avatar files into corresponding review items
                if (req.files && req.files.length > 0) {
                    raw.forEach((r, idx) => {
                        const avatarFile = req.files.find(f => f.fieldname === `reviews[${idx}][avatarFile]`);
                        if (avatarFile) {
                            r.avatar = avatarFile.secure_url || avatarFile.path;
                        }
                    });
                }
                reviewsArray = raw
                    .filter(Boolean)
                    .map((r) => ({
                        author: r.author || '',
                        avatar: r.avatar || '',
                        rating: typeof r.rating === 'number' ? r.rating : parseFloat(r.rating) || 0,
                        text: r.text || '',
                        verified: r.verified === 'on' || r.verified === true || r.verified === 'true',
                        date: r.date ? new Date(r.date) : undefined,
                        source: r.source || 'google'
                    }))
                    .filter((r) => r.author || r.text);
            } catch (e) {
                console.error('Error processing reviews:', e);
                req.flash('error', 'reviews gửi từ form không hợp lệ');
                return res.redirect('back');
            }
        }

        const updateData = {
            zone,
            name,
            type,
            address,
            openHours,
            ticket,
            
            history: history || null,
            architecture: architecture || null,
            experience: experienceArray,
            notes: notesArray,
            activities: activitiesArray,
            targetAudience: targetAudienceArray,
            images: imagesArray,
            reviews: reviewsArray,
            map: {
                type: 'Point',
                coordinates: [parseFloat(lng), parseFloat(lat)], // GeoJSON uses [longitude, latitude]
                embedUrl: embedUrl
            },
            isActive: isActive === 'on',
            featured: featured === 'on',
        };

        await Entertainment.findByIdAndUpdate(req.params.id, updateData);

        req.flash('success', 'Cập nhật giải trí thành công');
        res.redirect('/admin/entertainments');
    } catch (error) {
        console.error('Error updating entertainment:', error);
        req.flash('error', 'Có lỗi xảy ra khi cập nhật giải trí');
        res.redirect(`/admin/entertainments/edit/${req.params.id}`);
    }
};

// Delete entertainment
module.exports.destroy = async (req, res) => {
    console.log('=== DELETE ENTERTAINMENT ===');
    console.log('ID from params:', req.params.id);
    console.log('Method:', req.method);
    console.log('Body:', req.body);
    console.log('User:', req.user);
    
    try {
        const entertainment = await Entertainment.findById(req.params.id);
        console.log('Entertainment found:', entertainment ? entertainment.name : 'NOT FOUND');
        
        if (!entertainment) {
            console.log('Entertainment not found, redirecting...');
            req.flash('error', 'Không tìm thấy giải trí');
            return res.redirect('/admin/entertainments');
        }

        await Entertainment.findByIdAndDelete(req.params.id);
        console.log('Entertainment deleted successfully');
        req.flash('success', 'Xóa giải trí thành công');
        res.redirect('/admin/entertainments');
    } catch (error) {
        console.error('Error deleting entertainment:', error);
        req.flash('error', 'Có lỗi xảy ra khi xóa giải trí');
        res.redirect('/admin/entertainments');
    }
};

// Toggle active status
module.exports.toggleActive = async (req, res) => {
    try {
        const entertainment = await Entertainment.findById(req.params.id);
        if (!entertainment) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy giải trí' });
        }

        entertainment.isActive = !entertainment.isActive;
        await entertainment.save();

        res.json({ 
            success: true, 
            isActive: entertainment.isActive,
            message: entertainment.isActive ? 'Đã kích hoạt' : 'Đã vô hiệu hóa'
        });
    } catch (error) {
        console.error('Error toggling active status:', error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
    }
};

// Toggle featured status
module.exports.toggleFeatured = async (req, res) => {
    try {
        const entertainment = await Entertainment.findById(req.params.id);
        if (!entertainment) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy giải trí' });
        }

        entertainment.featured = !entertainment.featured;
        await entertainment.save();

        res.json({ 
            success: true, 
            featured: entertainment.featured,
            message: entertainment.featured ? 'Đã đánh dấu nổi bật' : 'Đã bỏ đánh dấu nổi bật'
        });
    } catch (error) {
        console.error('Error toggling featured status:', error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra' });
    }
};
