const Accommodation = require('../../model/Accommodation');

module.exports.accommodation = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 12;
        const skip = (page - 1) * limit;
        const { type, area, price, search, sort } = req.query;
        
        // Build filter object
        let filter = { 
            status: 'public', 
            isActive: true 
        };
        
        // Type filter not implemented for accommodations
        
        if (area && area !== 'all') {
            filter.district = area;
        }
        
        if (price && price !== 'all') {
            switch (price) {
                case 'lt1m':
                    filter.priceFrom = { $lt: 1000000 };
                    break;
                case '1to2m':
                    filter.priceFrom = { $gte: 1000000, $lte: 2000000 };
                    break;
                case '2to3m':
                    filter.priceFrom = { $gte: 2000000, $lte: 3000000 };
                    break;
                case 'gt3m':
                    filter.priceFrom = { $gt: 3000000 };
                    break;
            }
        }
        
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { amenities: { $in: [new RegExp(search, 'i')] } }
            ];
        }
        
        // Sort options
        let sortOption = {};
        switch (sort) {
            case 'price-low':
                sortOption = { priceFrom: 1 };
                break;
            case 'price-high':
                sortOption = { priceFrom: -1 };
                break;
            case 'rating':
                sortOption = { avgRating: -1 };
                break;
            case 'name':
                sortOption = { name: 1 };
                break;
            case 'newest':
                sortOption = { createdAt: -1 };
                break;
            default:
                sortOption = { featured: -1, avgRating: -1, createdAt: -1 };
        }
        
        const [accommodations, total] = await Promise.all([
            Accommodation.find(filter)
                .select('name slug star address district priceFrom description images amenities avgRating reviewCount')
                .sort(sortOption)
                .skip(skip)
                .limit(limit),
            Accommodation.countDocuments(filter)
        ]);
        
        const totalPages = Math.ceil(total / limit);
        
        res.render("client/pages/accommodation/accommodation.ejs", {
            pageTitle: "Lưu trú",
            accommodations,
            pagination: {
                currentPage: page,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            filters: {
                type,
                area,
                price,
                search,
                sort
            }
        });
    } catch (error) {
        console.error('Error fetching accommodations:', error);
        res.render("client/pages/accommodation/accommodation.ejs", {
            pageTitle: "Lưu trú",
            accommodations: [],
            pagination: {
                currentPage: 1,
                totalPages: 0,
                hasNext: false,
                hasPrev: false
            },
            filters: {
                type: '',
                area: '',
                price: '',
                search: '',
                sort: 'featured'
            }
        });
    }
}

module.exports.accommodationDetail = async (req, res) => {
    try {
        const slug = String(req.params.slug || '').toLowerCase();
        const isValid = /^[a-z0-9-]+$/.test(slug);
        
        if (!isValid) {
            return res.status(404).render("client/pages/accommodation/detail.accommodation.ejs", {
                pageTitle: "Chi tiết lưu trú",
                acc: null
            });
        }
        
        // Find accommodation by slug
        const acc = await Accommodation.findOne({ 
            slug: slug, 
            status: 'public', 
            isActive: true 
        });
        
        if (!acc) {
            return res.status(404).render("client/pages/accommodation/detail.accommodation.ejs", {
                pageTitle: "Không tìm thấy lưu trú",
                acc: null
            });
        }
        
        // Get related accommodations (different accommodation)
        const relatedAccommodations = await Accommodation.find({
            _id: { $ne: acc._id },
            status: 'public',
            isActive: true
        })
        .select('name slug address district priceFrom images amenities avgRating reviewCount')
        .sort({ avgRating: -1 })
        .limit(4);
        
        // Compute rating from embedded reviews
        const reviews = Array.isArray(acc.reviews) ? acc.reviews : [];
        const reviewCount = reviews.length;
        const rating = reviewCount > 0 ? (reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviewCount) : 0;

        res.render("client/pages/accommodation/detail.accommodation.ejs", {
            pageTitle: acc.name + " | Lưu trú Hà Nội",
            acc,
            relatedAccommodations,
            reviews,
            rating,
            reviewCount,
            reviewButtonUrl: acc.map && acc.map.mapEmbed ? acc.map.mapEmbed : ''
        });
    } catch (error) {
        console.error('Error fetching accommodation detail:', error);
        res.status(500).render("client/pages/accommodation/detail.accommodation.ejs", {
            pageTitle: "Lỗi hệ thống",
            acc: null
        });
    }
}