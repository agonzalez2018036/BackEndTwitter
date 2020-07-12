var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tweetSchema = Schema({
    text:String,
    dateTweet:Date,
    user: [{type: Schema.Types.ObjectId, ref: 'user'}]
});

module.exports = mongoose.model('tweet', tweetSchema);