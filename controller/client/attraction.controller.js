// === DANH SÁCH ĐIỂM THAM QUAN ===
// View-model normalizer to keep templates stable regardless of DB schema
function mapAttractionToView(attractionDoc) {
    if (!attractionDoc) return null;

    const doc = typeof attractionDoc.toObject === 'function' ? attractionDoc.toObject() : attractionDoc;

    // Normalize images to [{ url, alt }]
    const normalizedImages = Array.isArray(doc.images)
        ? doc.images.map((img) => {
            if (typeof img === 'string') {
                return { url: img, alt: doc.name };
            }
            if (img && typeof img === 'object') {
                return { url: img.url || img.path || '', alt: img.alt || doc.name };
            }
            return { url: '', alt: doc.name };
        })
        : [];

    // Normalize rating
    const reviews = Array.isArray(doc.reviews) ? doc.reviews : [];
    const ratingCount = reviews.length;
    const ratingAverage = ratingCount > 0
        ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / ratingCount)
        : 0;

    // Short description fallback
    const shortDescription = doc.shortDescription || doc.intro || (doc.description ? String(doc.description).slice(0, 120) : '');

    // Category passthrough
    const category = doc.category;

    return {
        _id: doc._id,
        name: doc.name,
        title: doc.title || doc.name,
        slug: doc.slug || String(doc._id),
        shortDescription,
        description: doc.description || '',
        intro: doc.intro || '',
        address: doc.address || '',
        category,
        featured: !!doc.featured,
        images: normalizedImages,
        rating: { average: ratingAverage, count: ratingCount },
        // Map coordinates for detail page compatibility
        heroImage: doc.heroImage || (normalizedImages[0] ? normalizedImages[0].url : ''),
        lat: doc.map && typeof doc.map.lat === 'number' ? doc.map.lat : doc.lat,
        lng: doc.map && typeof doc.map.lng === 'number' ? doc.map.lng : doc.lng,
        openingHours: doc.openingHours,
        opening_hours: doc.opening_hours,
        openHours: doc.openHours,
        tickets: doc.tickets,
        ticketPrices: doc.ticketPrices,
        ticketInfoText: typeof doc.ticket_info === 'string' ? doc.ticket_info : '',
        highlights: Array.isArray(doc.highlights) ? doc.highlights : [],
        experiences: Array.isArray(doc.experiences) ? doc.experiences : undefined,
        amenities: Array.isArray(doc.amenities) ? doc.amenities : [],
        notes: Array.isArray(doc.visitor_notes) ? doc.visitor_notes : (Array.isArray(doc.notes) ? doc.notes : []),
        tags: Array.isArray(doc.tags) ? doc.tags : [],
        route: Array.isArray(doc.route) ? doc.route : [],
        // Review widget script
        reviewWidgetScript: doc.reviewWidgetScript || '',
        hasReviewWidget: !!(doc.reviewWidgetScript && doc.reviewWidgetScript.trim()),
        reviews,
        reviewButtonUrl: doc.map && doc.map.link ? doc.map.link : ''
    };
}
module.exports.attractions = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 12;
        const skip = (page - 1) * limit;
        const category = req.query.category || '';
        const search = req.query.search || '';
        const sort = req.query.sort || 'featured';

        let query = { isActive: true };
        
        // Lọc theo danh mục (chỉ filter khi category không phải 'all' hoặc empty)
        if (category && category !== 'all') {
            query.category = category;
        }

        // Tìm kiếm
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { nameEn: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        // Sắp xếp
        let sortOption = {};
        switch (sort) {
            case 'rating':
                sortOption = { 'rating.average': -1 };
                break;
            case 'name':
                sortOption = { name: 1 };
                break;
            case 'newest':
                sortOption = { createdAt: -1 };
                break;
            case 'featured':
                sortOption = { featured: -1, createdAt: -1 };
                break;
            default:
                // Sort mặc định: mix featured và mới nhất để có đa dạng
                sortOption = { featured: -1, createdAt: -1 };
        }

        const total = await Attraction.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        // Lấy danh mục cho filter
        const categories = await Attraction.distinct('category', { isActive: true });

        let attractionDocs;

        // Nếu không filter theo category cụ thể, interleave để có đa dạng
        if (!category || category === 'all') {
            // Tính số lượng mỗi category cần lấy cho trang hiện tại
            // Tỉ lệ: 19 nhan-van : 7 tu-nhien ~ 73% : 27%
            const nhanVanRatio = 0.73;
            const tuNhienRatio = 0.27;
            
            const nhanVanLimit = Math.ceil(limit * nhanVanRatio);
            const tuNhienLimit = Math.ceil(limit * tuNhienRatio);
            
            // Lấy attractions từ mỗi category với pagination riêng
            const [nhanVanDocs, tuNhienDocs] = await Promise.all([
                Attraction.find({ ...query, category: 'nhan-van' })
                    .sort(sortOption)
                    .skip(Math.floor(skip * nhanVanRatio))
                    .limit(nhanVanLimit)
                    .lean(),
                Attraction.find({ ...query, category: 'tu-nhien' })
                    .sort(sortOption)
                    .skip(Math.floor(skip * tuNhienRatio))
                    .limit(tuNhienLimit)
                    .lean()
            ]);

            // Interleave (xen kẽ) 2 arrays để có đa dạng
            attractionDocs = [];
            let nvIndex = 0, tnIndex = 0;
            
            while (attractionDocs.length < limit && (nvIndex < nhanVanDocs.length || tnIndex < tuNhienDocs.length)) {
                // Thêm 2-3 nhân văn
                for (let i = 0; i < 2 && nvIndex < nhanVanDocs.length && attractionDocs.length < limit; i++) {
                    attractionDocs.push(nhanVanDocs[nvIndex++]);
                }
                // Thêm 1 tự nhiên
                if (tnIndex < tuNhienDocs.length && attractionDocs.length < limit) {
                    attractionDocs.push(tuNhienDocs[tnIndex++]);
                }
            }
        } else {
            // Nếu đã filter category, lấy bình thường
            attractionDocs = await Attraction.find(query)
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .lean();
        }

        const attractions = attractionDocs.map(mapAttractionToView);

        // Lấy TẤT CẢ attractions để phục vụ search (không giới hạn pagination)
        const allAttractionsForSearch = await Attraction.find({ isActive: true })
            .select('name category slug')
            .sort({ name: 1 })
            .lean();

        res.render("client/pages/attraction/attraction.ejs", {
            pageTitle: "Điểm tham quan",
            attractions,
            categories,
            allAttractionsForSearch: JSON.stringify(allAttractionsForSearch), // Pass as JSON string
            pagination: {
                currentPage: page,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            filters: {
                category,
                search,
                sort
            }
        });

    } catch (error) {
        console.error('Attractions list error:', error);
        res.render("client/pages/attraction/attraction.ejs", {
            pageTitle: "Điểm tham quan",
            attractions: [],
            categories: [],
            allAttractionsForSearch: JSON.stringify([]), // Empty array for error case
            pagination: {
                currentPage: 1,
                totalPages: 0,
                hasNext: false,
                hasPrev: false
            },
            filters: {
                category: '',
                search: '',
                sort: 'featured'
            }
        });
    }
}

// Demo data đã được thay thế bằng database thực tế

// Import model mới
const Attraction = require('../../model/Attraction');

module.exports.attractionDetail = async (req, res) => {
    try {
        const slugOrId = String(req.params.slug || '').toLowerCase();
        const isSlugLike = /^[a-z0-9-]+$/.test(slugOrId);
        const isObjectId = /^[a-f0-9]{24}$/.test(slugOrId);
        
        if (!isSlugLike) {
            return res.status(404).render("client/pages/attraction/detail.attraction.ejs", {
                attraction: {
                    title: "Slug không hợp lệ",
                    shortDescription: "Vui lòng quay lại danh sách.",
                    address: "",
                    images: []
                },
                relatedAttractions: []
            });
        }

        // Tìm attraction theo slug; nếu không có, thử tìm theo _id (fallback)
        let attractionDoc = await Attraction.findOne({ 
            slug: slugOrId, 
            isActive: true 
        }).lean();

        if (!attractionDoc && isObjectId) {
            attractionDoc = await Attraction.findOne({
                _id: slugOrId,
                isActive: true
            }).lean();
        }

        if (!attractionDoc) {
            return res.status(404).render("client/pages/attraction/detail.attraction.ejs", {
                attraction: {
                    title: "Không tìm thấy điểm tham quan",
                    shortDescription: "Vui lòng quay lại danh sách.",
                    address: "",
                    images: []
                },
                relatedAttractions: []
            });
        }

        // Lấy các điểm tham quan liên quan (cùng danh mục)
        const relatedDocs = await Attraction.find({
            category: attractionDoc.category,
            _id: { $ne: attractionDoc._id },
            isActive: true
        })
        .limit(4)
        .sort({ featured: -1, createdAt: -1 })
        .lean();

        const attraction = mapAttractionToView(attractionDoc);
        const relatedAttractions = relatedDocs.map(mapAttractionToView);

        // Cập nhật view count (nếu cần)
        // attraction.viewCount = (attraction.viewCount || 0) + 1;
        // await attraction.save();

        res.render("client/pages/attraction/detail.attraction.ejs", {
            attraction,
            relatedAttractions
        });

    } catch (error) {
        console.error('Attraction detail error:', error);
        res.status(500).render("client/pages/attraction/detail.attraction.ejs", {
            attraction: {
                title: "Lỗi hệ thống",
                shortDescription: "Có lỗi xảy ra, vui lòng thử lại sau.",
                address: "",
                images: []
            },
            relatedAttractions: []
        });
    }
}

// === API ENDPOINTS ===
// Tìm kiếm API
module.exports.search = async (req, res) => {
    try {
        const { q, category, limit = 10 } = req.query;
        
        const results = await Attraction.search(q, {
            category,
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            data: results,
            total: results.length
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi tìm kiếm'
        });
    }
};

// Lấy điểm nổi bật
module.exports.getFeatured = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        const attractions = await Attraction.getFeatured(limit);
        
        res.json({
            success: true,
            data: attractions
        });
    } catch (error) {
        console.error('Get featured error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy dữ liệu'
        });
    }
};

// Lấy theo danh mục
module.exports.getByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        
        const attractions = await Attraction.getByCategory(category, limit);
        
        res.json({
            success: true,
            data: attractions
        });
    } catch (error) {
        console.error('Get by category error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy dữ liệu'
        });
    }
};

// Lấy gần vị trí
module.exports.getNearby = async (req, res) => {
    try {
        const { lat, lng } = req.query;
        const radius = parseInt(req.query.radius) || 10;
        const limit = parseInt(req.query.limit) || 10;

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin vị trí'
            });
        }

        const attractions = await Attraction.getNearby(
            parseFloat(lat), 
            parseFloat(lng), 
            radius, 
            limit
        );

        res.json({
            success: true,
            data: attractions
        });
    } catch (error) {
        console.error('Get nearby error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy dữ liệu'
        });
    }
};

// Thêm đánh giá
module.exports.addReview = async (req, res) => {
    try {
        const { slug } = req.params;
        const { user, rating, comment, avatar, country } = req.body;

        if (!user || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu không hợp lệ'
            });
        }

        const attraction = await Attraction.findOne({ slug, isActive: true });
        if (!attraction) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy điểm tham quan'
            });
        }

        const reviewData = {
            user,
            rating: parseInt(rating),
            comment,
            avatar: avatar || '/client/img/avatar.png',
            country: country || 'Việt Nam'
        };

        await attraction.addReview(reviewData);

        res.json({
            success: true,
            message: 'Đánh giá đã được thêm',
            data: {
                averageRating: attraction.rating.average,
                totalReviews: attraction.rating.count
            }
        });
    } catch (error) {
        console.error('Add review error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi thêm đánh giá'
        });
    }
};