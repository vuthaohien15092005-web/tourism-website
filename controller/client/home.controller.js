const Attraction = require('../../model/Attraction');

module.exports.index = async (req, res) => {
    try {
        // Lấy các điểm tham quan nổi bật (tối đa 3)
        const featuredAttractions = await Attraction.getFeatured(3);
        
        res.render("client/pages/home/home.ejs", {
            pageTitle: "Home",
            featuredAttractions: featuredAttractions
        })
    } catch (error) {
        console.error('Error fetching featured attractions:', error);
        // Nếu có lỗi, vẫn render trang với mảng rỗng
        res.render("client/pages/home/home.ejs", {
            pageTitle: "Home",
            featuredAttractions: []
        })
    }
}
