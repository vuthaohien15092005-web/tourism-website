const express = require('express');
const { requireAuth, requireAdmin, requireEditor } = require('../../middleware/auth');

// Import controllers
const authController = require('../../controller/admin/auth.controller');
const attractionController = require('../../controller/admin/attraction.controller');
const accommodationController = require('../../controller/admin/accommodation.controller');
const cuisineController = require('../../controller/admin/cuisine.controller');
const cuisinePlaceController = require('../../controller/admin/cuisine.place.controller');
const entertainmentController = require('../../controller/admin/entertainment.controller');
const contactController = require('../../controller/admin/contact.controller');
const userController = require('../../controller/admin/user.controller');

const router = express.Router();

// Global middleware for all admin routes
router.use((req, res, next) => {
  // Set global variables for all admin routes
  res.locals.admin = true;
  res.locals.currentPath = req.path;
  res.locals.currentMethod = req.method;
  
  // Flash messages middleware
  res.locals.flash = {
    success: req.flash('success'),
    error: req.flash('error'),
    warning: req.flash('warning'),
    info: req.flash('info')
  };
  
  // Log all admin requests
  console.log(`[ADMIN] ${req.method} ${req.path} - ${new Date().toISOString()}`);
  
  next();
});

// Auth routes
router.get('/login', authController.showLogin);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Dashboard
router.get('/dashboard', requireAdmin, authController.showDashboard);

// Import Cloudinary upload middleware
const { uploadMultiple, uploadDynamic, debugUpload } = require('../../middleware/cloudinary');

// Attractions routes (aligned with ProductManagement pattern)
router.get('/attractions', requireAdmin, attractionController.index);
router.get('/attractions/create', requireAdmin, requireEditor, attractionController.create);
router.post('/attractions', requireAdmin, requireEditor, debugUpload, uploadDynamic, attractionController.store);
router.get('/attractions/:id', requireAdmin, attractionController.show);
router.get('/attractions/edit/:id', requireAdmin, requireEditor, attractionController.edit);
router.patch('/attractions/edit/:id', requireAdmin, requireEditor, uploadDynamic, attractionController.editPatch);
// Accept both DELETE (via method-override) and direct POST for compatibility
router.delete('/attractions/delete/:id', requireAdmin, requireEditor, attractionController.destroy);
router.post('/attractions/delete/:id', requireAdmin, requireEditor, attractionController.destroy);

// Accommodations routes (aligned with ProductManagement pattern)
router.get('/accommodations', requireAdmin, accommodationController.index);
router.get('/accommodations/create', requireAdmin, requireEditor, accommodationController.create);
router.post('/accommodations', requireAdmin, requireEditor, uploadDynamic, accommodationController.store);
router.get('/accommodations/:id', requireAdmin, accommodationController.show);
router.get('/accommodations/edit/:id', requireAdmin, requireEditor, accommodationController.edit);
router.patch('/accommodations/edit/:id', requireAdmin, requireEditor, uploadDynamic, accommodationController.editPatch);
// Accept both DELETE (via method-override) and direct POST for compatibility
router.delete('/accommodations/delete/:id', requireAdmin, requireEditor, accommodationController.destroy);
router.post('/accommodations/delete/:id', requireAdmin, requireEditor, accommodationController.destroy);

// Cuisines routes
router.get('/cuisines', requireAdmin, cuisineController.index);
router.get('/cuisines/create', requireAdmin, requireEditor, cuisineController.create);
router.post('/cuisines', requireAdmin, requireEditor, uploadDynamic, cuisineController.store);
router.get('/cuisines/:id', requireAdmin, cuisineController.show);
router.get('/cuisines/edit/:id', requireAdmin, requireEditor, cuisineController.edit);
router.patch('/cuisines/edit/:id', requireAdmin, requireEditor, uploadDynamic, cuisineController.editPatch);
router.delete('/cuisines/delete/:id', requireAdmin, requireEditor, cuisineController.destroy);
router.post('/cuisines/delete/:id', requireAdmin, requireEditor, cuisineController.destroy);

// Cuisine Places routes
router.get('/cuisine/places', requireAdmin, cuisinePlaceController.index);
router.get('/cuisine/places/create', requireAdmin, requireEditor, cuisinePlaceController.create);
router.post('/cuisine/places', requireAdmin, requireEditor, uploadDynamic, cuisinePlaceController.store);
router.get('/cuisine/places/:id', requireAdmin, cuisinePlaceController.show);
router.get('/cuisine/places/edit/:id', requireAdmin, requireEditor, cuisinePlaceController.edit);
router.patch('/cuisine/places/edit/:id', requireAdmin, requireEditor, uploadDynamic, cuisinePlaceController.editPatch);
router.put('/cuisine/places/:id', requireAdmin, requireEditor, uploadDynamic, cuisinePlaceController.update);
router.delete('/cuisine/places/delete/:id', requireAdmin, requireEditor, cuisinePlaceController.destroy);
router.post('/cuisine/places/delete/:id', requireAdmin, requireEditor, cuisinePlaceController.destroy);

// Entertainment routes
router.get('/entertainments', requireAdmin, entertainmentController.index);
router.get('/entertainments/create', requireAdmin, requireEditor, entertainmentController.create);
router.post('/entertainments', requireAdmin, requireEditor, uploadDynamic, entertainmentController.store);
router.get('/entertainments/edit/:id', requireAdmin, requireEditor, entertainmentController.edit);
router.get('/entertainments/:id', requireAdmin, entertainmentController.show);
router.put('/entertainments/:id', requireAdmin, requireEditor, uploadDynamic, entertainmentController.update);
router.patch('/entertainments/:id', requireAdmin, requireEditor, uploadDynamic, entertainmentController.update);
router.post('/entertainments/:id', requireAdmin, requireEditor, uploadDynamic, entertainmentController.update);
router.post('/entertainments/:id/toggle-active', requireAdmin, requireEditor, entertainmentController.toggleActive);
router.post('/entertainments/:id/toggle-featured', requireAdmin, requireEditor, entertainmentController.toggleFeatured);
// Accept both DELETE (via method-override) and direct POST for compatibility
router.delete('/entertainments/delete/:id', requireAdmin, requireEditor, entertainmentController.destroy);
router.post('/entertainments/delete/:id', requireAdmin, requireEditor, entertainmentController.destroy);

// Contact routes (read and delete only)
router.get('/contacts', requireAdmin, contactController.index);
router.post('/contacts/reply/:id', requireAdmin, contactController.reply);
router.get('/contacts/:id', requireAdmin, contactController.show);
router.delete('/contacts/:id', requireAdmin, contactController.delete);
router.post('/contacts/delete/:id', requireAdmin, contactController.delete);
router.patch('/contacts/:id/mark-read', requireAdmin, contactController.markAsRead);
router.patch('/contacts/:id/mark-replied', requireAdmin, contactController.markAsReplied);

// User routes (read and delete only)
router.get('/users', requireAdmin, userController.index);
router.get('/users/:id', requireAdmin, userController.show);
router.delete('/users/:id', requireAdmin, userController.delete);
router.patch('/users/:id/toggle-status', requireAdmin, userController.toggleStatus);

// TODO: Add more routes for other modules
// Foods, Tours, News, Reviews

module.exports = router;
