const express = require('express')
const route = express.Router()

const transportationController = require("../../controller/client/transportation.controller") 

route.get('/', transportationController.transportation)
module.exports = route; 