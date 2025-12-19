module.exports.index = (req, res) => {
  res.render("client/pages/blog/blog", {
    pageTitle: "Blog - Hà Nội Vibes",
    page: "blog",
  });
};

module.exports.articleOne = (req, res) => {
  res.render("client/pages/blog/blog1-seo", {
    pageTitle: "Top 10 địa điểm du lịch Hà Nội đẹp và hấp dẫn",
    page: "blog",
    meta: {
      description:
        "Top 10 địa điểm du lịch Hà Nội hấp dẫn nhất cho chuyến đi trọn vẹn.",
      keywords:
        "địa điểm du lịch Hà Nội, top 10, Hồ Hoàn Kiếm, Văn Miếu, phố cổ",
      image: "/client/img/hotay.jpg",
      author: "Admin",
      date: "15/01/2024",
      dateISO: "2024-01-15",
      siteUrl: (req && req.protocol && req.get) ? `${req.protocol}://${req.get('host')}` : ''
    },
  });
};

module.exports.articleTwo = (req, res) => {
  res.render("client/pages/blog/blog2-seo", {
    pageTitle: "Top 10 quán cafe view đẹp ở Hà Nội",
    page: "blog",
    meta: {
      description:
        "Check-in 10 quán cafe Hà Nội view siêu đẹp, chill hết nấc.",
      keywords:
        "quán cafe Hà Nội, cafe view đẹp, rooftop Hà Nội, Xofa, Lofita",
      image: "/client/img/banner-home.jpg",
      author: "Admin",
      date: "15/02/2024",
      dateISO: "2024-02-15",
      siteUrl: (req && req.protocol && req.get) ? `${req.protocol}://${req.get('host')}` : ''
    },
  });
};

module.exports.articleThree = (req, res) => {
  res.render("client/pages/blog/blog3-seo", {
    pageTitle: "Top 10 địa điểm sống ảo hot ở Hà Nội",
    page: "blog",
    meta: {
      description:
        "Khám phá 10 địa điểm sống ảo hot nhất Hà Nội dành cho giới trẻ.",
      keywords:
        "địa điểm sống ảo Hà Nội, check-in Hà Nội, cầu Long Biên, hồ Tây",
      image: "/client/img/banner-attraction.jpg",
      author: "Admin",
      date: "01/03/2024",
      dateISO: "2024-03-01",
      siteUrl: (req && req.protocol && req.get) ? `${req.protocol}://${req.get('host')}` : ''
    },
  });
};

module.exports.articleFour = (req, res) => {
  res.render("client/pages/blog/blog4-seo", {
    pageTitle: "Khám phá ẩm thực sáng của Thủ đô - Hương sáng Hà Nội",
    page: "blog",
    meta: {
      description:
        "Khám phá ẩm thực sáng Hà Nội với 9 địa điểm ăn sáng nổi tiếng từ phở, bún chả đến cà phê trứng.",
      keywords:
        "ẩm thực sáng Hà Nội, địa điểm ăn sáng Hà Nội, phở Hà Nội, bún chả, cà phê trứng, Phở Thìn, Bún Chả Hương Liên",
      image: "/client/img/pho-ha-noi-banner.jpg",
      author: "Admin",
      date: "20/12/2024",
      dateISO: "2024-12-20",
      siteUrl: (req && req.protocol && req.get) ? `${req.protocol}://${req.get('host')}` : ''
    },
  });
};

module.exports.articleFive = (req, res) => {
  res.render("client/pages/blog/blog5-seo", {
    pageTitle: "Khám phá phố cổ Hà Nội – Linh hồn nghìn năm văn hiến",
    page: "blog",
    meta: {
      description:
        "Khám phá phố cổ Hà Nội với lịch sử nghìn năm, kiến trúc cổ kính và những trải nghiệm văn hóa đặc sắc.",
      keywords:
        "phố cổ Hà Nội, 36 phố phường, Hàng Mã, Hàng Bạc, Ô Quan Chưởng, Nhà thờ Lớn, chợ Đồng Xuân, Hà Nội Vibes",
      image: "/client/img/pho-co.jpg",
      author: "Admin",
      date: "21/12/2024",
      dateISO: "2024-12-21",
      siteUrl: (req && req.protocol && req.get) ? `${req.protocol}://${req.get('host')}` : ''
    },
  });
};

module.exports.articleSix = (req, res) => {
  res.render("client/pages/blog/blog6-seo", {
    pageTitle: "Hanoi Nightlife: Best Things to Do After Dark",
    page: "blog",
    meta: {
      description:
        "Khám phá cuộc sống về đêm Hà Nội với những hoạt động thú vị từ bia hơi, rooftop bar đến chợ đêm và nhạc jazz.",
      keywords:
        "Hanoi nightlife, cuộc sống về đêm Hà Nội, bia hơi Tạ Hiện, rooftop bar Hà Nội, chợ đêm Hà Nội, nhạc jazz Hà Nội, Hà Nội Vibes",
      image: "/client/img/banner-home.jpg",
      author: "Admin",
      date: "22/12/2024",
      dateISO: "2024-12-22",
      siteUrl: (req && req.protocol && req.get) ? `${req.protocol}://${req.get('host')}` : ''
    },
  });
};

module.exports.articleSeven = (req, res) => {
  res.render("client/pages/blog/blog7-seo", {
    pageTitle: "Khám phá Hà Nội ngày Tết: Hương vị truyền thống và nét đẹp văn hóa xưa",
    page: "blog",
    meta: {
      description:
        "Khám phá Hà Nội ngày Tết với hương vị truyền thống, phong tục cổ truyền và những trải nghiệm văn hóa đặc sắc của Thủ đô.",
      keywords:
        "Hà Nội ngày Tết, du xuân Hà Nội, phong tục Tết Việt Nam, chợ hoa Hà Nội, ẩm thực Tết, lễ hội Tết, Hà Nội Vibes",
      image: "/client/img/banner-attraction.jpg",
      author: "Admin",
      date: "23/12/2024",
      dateISO: "2024-12-23",
      siteUrl: (req && req.protocol && req.get) ? `${req.protocol}://${req.get('host')}` : ''
    },
  });
};

module.exports.articleEight = (req, res) => {
  res.render("client/pages/blog/blog8-seo", {
    pageTitle: "Chợ đêm phố cổ Hà Nội: Nơi lưu giữ nét văn hóa Thủ đô",
    page: "blog",
    meta: {
      description:
        "Khám phá Chợ đêm phố cổ Hà Nội - thiên đường mua sắm và ẩm thực, nơi lưu giữ hồn văn hóa Thủ đô.",
      keywords:
        "chợ đêm phố cổ Hà Nội, mua sắm phố cổ, ẩm thực đường phố Hà Nội, du lịch đêm Hà Nội, văn hóa Hà Nội, Hồ Gươm, phố cổ, Hà Nội Vibes",
      image: "/client/img/banner-attraction.jpg",
      author: "Admin",
      date: "23/12/2024",
      dateISO: "2024-12-23",
      siteUrl: (req && req.protocol && req.get) ? `${req.protocol}://${req.get('host')}` : ''
    },
  });
};

module.exports.articleNine = (req, res) => {
  res.render("client/pages/blog/blog9-seo", {
    pageTitle: "Hà Nội đi lại bằng gì? Từ xe bus, taxi đến xe điện phố cổ",
    page: "blog",
    meta: {
      description:
        "Khám phá các phương tiện di chuyển phổ biến ở Hà Nội như xe bus, taxi, xe công nghệ và xe điện phố cổ. Hà Nội Vibes mách bạn cách đi lại dễ dàng, tiết kiệm và thú vị nhất.",
      keywords:
        "Hà Nội đi lại, phương tiện Hà Nội, xe bus Hà Nội, taxi Hà Nội, xe công nghệ, xe điện phố cổ, Grab Hà Nội, du lịch Hà Nội, Hà Nội Vibes",
      image: "/client/img/banner-attraction.jpg",
      author: "Admin",
      date: "23/12/2024",
      dateISO: "2024-12-23",
      siteUrl: (req && req.protocol && req.get) ? `${req.protocol}://${req.get('host')}` : ''
    },
  });
};

module.exports.articleTen = (req, res) => {
  res.render("client/pages/blog/blog10-seo", {
    pageTitle: "Hồ Hoàn Kiếm – Biểu tượng trái tim Thủ đô",
    page: "blog",
    meta: {
      description:
        "Khám phá Hồ Hoàn Kiếm – biểu tượng văn hóa, lịch sử và du lịch của Hà Nội. Cùng Hà Nội Vibes dạo quanh hồ, ngắm Tháp Rùa, cầu Thê Húc và cảm nhận vẻ đẹp thơ mộng giữa lòng Thủ đô.",
      keywords:
        "Hồ Hoàn Kiếm, Tháp Rùa, cầu Thê Húc, đền Ngọc Sơn, phố đi bộ Hồ Gươm, du lịch Hà Nội, biểu tượng Hà Nội, Hà Nội Vibes",
      image: "/client/img/banner-attraction.jpg",
      author: "Admin",
      date: "23/12/2024",
      dateISO: "2024-12-23",
      siteUrl: (req && req.protocol && req.get) ? `${req.protocol}://${req.get('host')}` : ''
    },
  });
};

module.exports.articleEleven = (req, res) => {
  res.render("client/pages/blog/blog11-seo", {
    pageTitle: "Khám phá di sản Hoàng Thành Thăng Long – Trái tim lịch sử của Hà Nội",
    page: "blog",
    meta: {
      description:
        "Khám phá Hoàng Thành Thăng Long - Di sản Văn hóa Thế giới UNESCO, trái tim lịch sử của Hà Nội với hơn 1.300 năm lịch sử. Cùng Hà Nội Vibes khám phá kiến trúc độc đáo và giá trị văn hóa đặc sắc.",
      keywords:
        "Hoàng Thành Thăng Long, Di sản UNESCO, Điện Kính Thiên, Đoan Môn, khảo cổ học 18 Hoàng Diệu, du lịch Hà Nội, lịch sử Việt Nam, Hà Nội Vibes",
      image: "/client/img/banner-attraction.jpg",
      author: "Admin",
      date: "23/12/2024",
      dateISO: "2024-12-23",
      siteUrl: (req && req.protocol && req.get) ? `${req.protocol}://${req.get('host')}` : ''
    },
  });
};