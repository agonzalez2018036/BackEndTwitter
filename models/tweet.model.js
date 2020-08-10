var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tweetSchema = Schema({
    text:String,
    dateTweet:String,
    commentTweet:String,
    sourceInformation:String, 
    likes: [],
    replies:[],
    retweets:[],
    user: [{type: Schema.Types.ObjectId, ref: 'user'}]
});

module.exports = mongoose.model('tweet', tweetSchema);