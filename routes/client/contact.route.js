const express = require('express');
const router = express.Router();
const contactController = require('../../controller/client/contact.controller');

// Contact form submission
router.post('/', contactController.submit);

module.exports = router;
