const Entertainment = require('../../model/Entertainment');
const Event = require('../../model/Event');

module.exports.entertainment = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 6; // 6 items per page
        const skip = (page - 1) * limit;
        
        // Get filter parameters
        const zone = req.query.zone;
        const search = req.query.search;

        // Build query object
        let query = { isActive: true };
        
        // Add zone filter if specified
        if (zone && zone !== 'all') {
            query.zone = zone;
        }
        
        // Add search filter if specified
        if (search && search.trim()) {
            query.$or = [
                { name: { $regex: search.trim(), $options: 'i' } },
                { activities: { $regex: search.trim(), $options: 'i' } },
                { type: { $regex: search.trim(), $options: 'i' } }
            ];
        }

        // Get total count for pagination (with filters applied)
        const totalDocs = await Entertainment.countDocuments(query);
        const totalPages = Math.ceil(totalDocs / limit);

        // Get entertainments with pagination and filters
        const allEntertainments = await Entertainment.find(query)
        .sort({ featured: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

        // Build query string for pagination
        const queryParams = new URLSearchParams();
        Object.keys(req.query).forEach(key => {
            if (key !== 'page' && req.query[key]) {
                queryParams.append(key, req.query[key]);
            }
        });
        const queryString = queryParams.toString() ? `&${queryParams.toString()}` : '';

        // Pagination data
        const pagination = {
            currentPage: page,
            totalPages: totalPages,
            hasPrev: page > 1,
            hasNext: page < totalPages,
            totalItems: totalDocs
        };

        // Define fixed zones for filtering
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

        const hero = {
            title: "Giải trí & Sự kiện",
            subtitle: "Khám phá những trải nghiệm giải trí đa dạng tại Hà Nội",
            backgroundImage: "/client/img/header-bg.jfif"
        };

        // Get featured events from database
        const events = await Event.find({ 
            isActive: true, 
            featured: true,
            startDate: { $gte: new Date() }
        }).sort({ startDate: 1 }).limit(6).lean();

        // If not enough events, get any upcoming events
        if (events.length < 6) {
            const moreEvents = await Event.find({ 
                isActive: true,
                startDate: { $gte: new Date() }
            }).sort({ startDate: 1 }).limit(6 - events.length).lean();
            events.push(...moreEvents);
        }

        const categories = [
            {
                icon: "fa-music",
                title: "Âm nhạc & Biểu diễn",
                description: "Opera, giao hưởng, ca nhạc và các buổi biểu diễn nghệ thuật"
            },
            {
                icon: "fa-film",
                title: "Điện ảnh & Phim ảnh",
                description: "Rạp chiếu phim, phim nghệ thuật và các sự kiện điện ảnh"
            },
            {
                icon: "fa-paint-brush",
                title: "Nghệ thuật & Triển lãm",
                description: "Triển lãm, bảo tàng và các không gian nghệ thuật"
            },
            {
                icon: "fa-microphone",
                title: "Karaoke & Ca hát",
                description: "Karaoke, quán bar và các không gian ca nhạc"
            }
        ];

        res.render("client/pages/entertainment/entertainment.ejs", {
            pageTitle: "Giải trí",
            hero: hero,
            entertainments: allEntertainments,
            allEntertainments: allEntertainments, // For filtering
            events: events,
            categories: categories,
            zones: zones,
            pagination,
            queryString,
            currentZone: zone || 'all',
            currentSearch: search || ''
        });
    } catch (error) {
        console.error('Error loading entertainment page:', error);
        res.status(500).render('errors/500', {
            pageTitle: 'Lỗi Server',
            error: error.message
        });
    }
}

module.exports.detail = async (req, res) => {
    try {
        const slugOrId = String(req.params.slug || '').toLowerCase();
        const isSlugLike = /^[a-z0-9-]+$/.test(slugOrId);
        const isObjectId = /^[a-f0-9]{24}$/.test(slugOrId);
        
        if (!isSlugLike) {
            return res.status(404).render('errors/404', {
                pageTitle: 'Slug không hợp lệ',
                message: 'Vui lòng quay lại danh sách.'
            });
        }

        // Tìm entertainment theo slug trước
        let entertainmentDoc = await Entertainment.findOne({ 
            slug: slugOrId, 
            isActive: true 
        }).lean();

        // Nếu không tìm thấy bằng slug và là ObjectId, thử tìm bằng ID
        if (!entertainmentDoc && isObjectId) {
            entertainmentDoc = await Entertainment.findOne({
                _id: slugOrId,
                isActive: true
            }).lean();
        }

        if (!entertainmentDoc) {
            return res.status(404).render('errors/404', {
                pageTitle: 'Không tìm thấy',
                message: 'Không tìm thấy địa điểm giải trí này'
            });
        }

        // Normalize for view (align with attractions image structure and widget)
        const normalizedImages = Array.isArray(entertainmentDoc.images)
            ? entertainmentDoc.images.filter(Boolean).map(url => ({ url }))
            : [];
        const entertainment = {
            ...entertainmentDoc,
            images: normalizedImages,
            heroImage: entertainmentDoc.heroImage || (normalizedImages[0] ? normalizedImages[0].url : ''),
            hasReviewWidget: !!(entertainmentDoc.reviewWidgetScript && entertainmentDoc.reviewWidgetScript.trim()),
            reviewWidgetScript: entertainmentDoc.reviewWidgetScript || ''
        };

        // Transform data for the view
        const detail = {
            title: entertainment.name,
            breadcrumb: [
                { label: "Trang chủ", href: "/" },
                { label: "Giải trí", href: "/entertainment" },
                { label: entertainment.zone, href: "/entertainment" }
            ],
            heroImage: entertainment.images && entertainment.images.length > 0 
                ? (entertainment.images[0].url || entertainment.images[0])
                : "/client/img/header-bg.jfif",
            quickInfo: [
                { icon: "📍", label: "Địa chỉ", value: entertainment.address },
                { icon: "🕐", label: "Giờ mở cửa", value: entertainment.openHours },
                { icon: "💰", label: "Giá vé", value: entertainment.ticket },
                { icon: "🎪", label: "Loại hình", value: entertainment.type }
            ],
            intro: {
                title: "Giới thiệu",
                paragraphs: [
                    `${entertainment.name} thuộc khu vực ${entertainment.zone}, là ${entertainment.type.toLowerCase()} nổi bật tại Hà Nội.`,
                    entertainment.activities && entertainment.activities.length > 0 
                        ? `Nơi đây cung cấp các hoạt động: ${entertainment.activities.join(', ')}.`
                        : "Địa điểm này mang đến những trải nghiệm giải trí đa dạng và thú vị."
                ]
            },
            sections: []
        };

        // Add history section if available
        if (entertainment.history) {
            detail.sections.push({
                title: "Lịch sử hình thành",
                paragraphs: [entertainment.history]
            });
        }

        // Add architecture section if available
        if (entertainment.architecture) {
            detail.sections.push({
                title: "Kiến trúc & Thiết kế",
                paragraphs: [entertainment.architecture]
            });
        }

        // Add activities section
        if (entertainment.activities && entertainment.activities.length > 0) {
            detail.sections.push({
                title: "Hoạt động chính",
                paragraphs: ["Các hoạt động nổi bật tại địa điểm:"],
                bullets: entertainment.activities
            });
        }

        // Add experience section
        if (entertainment.experience && entertainment.experience.length > 0) {
            detail.sections.push({
                title: "Trải nghiệm du khách",
                paragraphs: ["Những trải nghiệm đặc biệt bạn không nên bỏ qua:"],
                bullets: entertainment.experience
            });
        }

        // Add audience section
        if (entertainment.audience && entertainment.audience.length > 0) {
            detail.sections.push({
                title: "Đối tượng phù hợp",
                paragraphs: ["Địa điểm này phù hợp với:"],
                bullets: entertainment.audience
            });
        }

        // Add highlight if there are reviews
        if (entertainment.reviews && entertainment.reviews.length > 0) {
            detail.highlight = {
                title: "Đánh giá từ khách hàng",
                content: `Có ${entertainment.reviews.length} đánh giá tích cực.`
            };
        }

        // Gallery (align with attractions: array of {url})
        detail.gallery = entertainment.images && entertainment.images.length > 0 
            ? entertainment.images.map((img, index) => ({
                src: img.url || img,
                alt: `${entertainment.name} - Hình ${index + 1}`
            }))
            : [
                { src: "/client/img/header-bg.jfif", alt: entertainment.name }
            ];

        // Map
        detail.mapEmbed = entertainment.map.embedUrl;
        const reviews = Array.isArray(entertainment.reviews) ? entertainment.reviews : [];
        const reviewCount = reviews.length;
        const rating = reviewCount > 0 ? (reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviewCount) : 0;

        // CTA
        detail.cta = {
            title: "Sẵn sàng khám phá?",
            subtitle: `Trải nghiệm ${entertainment.name}`,
            actions: [
                { label: "Xem thêm", href: "#" }
            ]
        };

        res.render("client/pages/entertainment/detail.entertainment.ejs", {
            pageTitle: detail.title,
            detail: detail,
            entertainment: entertainment,
            reviews,
            rating,
            reviewCount,
            reviewButtonUrl: entertainment.map && entertainment.map.embedUrl ? entertainment.map.embedUrl : ''
        });
    } catch (error) {
        console.error('Error loading entertainment detail:', error);
        res.status(500).render('errors/500', {
            pageTitle: 'Lỗi Server',
            error: error.message
        });
    }
}
