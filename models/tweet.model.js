var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tweetSchema = Schema({
    text:String,
    dateTweet:String,
    commentTweet:String,
    likes: [],
    replies:[],
    retweets:[],
    user: [{type: Schema.Types.ObjectId, ref: 'user'}],
    retweet: [{type: Schema.Types.ObjectId, ref: 'tweet'}]
});

module.exports = mongoose.model('tweet', tweetSchema);