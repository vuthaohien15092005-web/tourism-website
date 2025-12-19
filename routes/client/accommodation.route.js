const express = require('express')
const route = express.Router()

const accommodationController = require("../../controller/client/accommodation.controller")
const { optionalAuth } = require("../../middleware/auth")

route.get('/', optionalAuth, accommodationController.accommodation)
route.get('/:slug', optionalAuth, accommodationController.accommodationDetail)
module.exports = route; 