const express = require('express')
const route = express.Router()

const cuisineController = require("../../controller/client/cuisine.controller")
const { optionalAuth } = require("../../middleware/auth")

route.get('/', optionalAuth, cuisineController.cuisine)
route.get('/:cuisineSlug/:restaurantSlug', optionalAuth, cuisineController.restaurantDetail)
route.get('/:slug', optionalAuth, cuisineController.cuisineDetail)
module.exports = route; 