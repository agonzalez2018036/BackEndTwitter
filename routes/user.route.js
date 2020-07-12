'use strict'

var express = require('express');
var userController = require('../controllers/user.controller');
var mdAuth = require('../middlewares/authenticated');

var api = express.Router();
api.post('/commands', mdAuth.ensureAuth, userController.commands);

module.exports = api;