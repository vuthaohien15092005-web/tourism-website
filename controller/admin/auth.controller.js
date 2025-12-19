const User = require('../../model/User');

// [GET] /admin/login - redirect to unified login
module.exports.showLogin = (req, res) => {
  if (req.session.userId) {
    return res.redirect('/admin/dashboard');
  }
  // Redirect to unified login page
  res.redirect('/auth/login');
};

// [POST] /admin/login - redirect to unified login
module.exports.login = (req, res) => {
  // Redirect to unified login page
  res.redirect('/auth/login');
};

// [GET] /admin/logout
module.exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
};

// [GET] /admin/dashboard
module.exports.showDashboard = async (req, res) => {
  try {
    const Attraction = require('../../model/Attraction');
    const Accommodation = require('../../model/Accommodation');
    const Food = require('../../model/Food');
    const Entertainment = require('../../model/Entertainment');
    const Tour = require('../../model/Tour');
    const News = require('../../model/News');
    const Review = require('../../model/Review');
    const Cuisine = require('../../model/Cuisine');
    const CuisinePlace = require('../../model/CuisinePlace');
    const Contact = require('../../model/Contact');
    const User = require('../../model/User');

    const stats = {
      attractions: await Attraction.countDocuments(),
      accommodations: await Accommodation.countDocuments(),
      foods: await Food.countDocuments(),
      entertainments: await Entertainment.countDocuments(),
      tours: await Tour.countDocuments(),
      news: await News.countDocuments(),
      reviews: await Review.countDocuments(),
      cuisines: await Cuisine.countDocuments(),
      cuisinePlaces: await CuisinePlace.countDocuments(),
      contacts: await Contact.countDocuments(),
      users: await User.countDocuments()
    };

    const recentReviews = await Review.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('targetId');

    res.render('admin/layout', {
      pageTitle: 'Dashboard',
      user: req.user,
      stats,
      recentReviews,
      page: 'dashboard'
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('admin/layout', {
      pageTitle: 'Dashboard',
      user: req.user,
      stats: {},
      recentReviews: [],
      page: 'dashboard'
    });
  }
};
