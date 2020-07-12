'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = Schema({
    name:String,
    username: String,
    password:String,
    email:String,
    followers: [],
    following:[]
});

module.exports = mongoose.model('user', userSchema);