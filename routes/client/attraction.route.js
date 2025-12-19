const express = require('express')
const route = express.Router()

const attractionController = require("../../controller/client/attraction.controller")
const { optionalAuth } = require("../../middleware/auth")

route.get('/', optionalAuth, attractionController.attractions)
route.get('/:slug', optionalAuth, attractionController.attractionDetail)
module.exports = route; 