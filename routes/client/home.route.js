const express = require('express')
const route = express.Router()

const homeController = require("../../controller/client/home.controller") 

route.get('/', homeController.index)
module.exports = route; 