import mongoose from 'mongoose';
mongoose.Promise = global.Promise;

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  id_str: String,
  name: String,
  screen_name: String,
  location: String,
  description: String,
  profile_image_url: String,
  contribution_url: String
}, {
  _id: false
});

const MediaSchema = new Schema({
  id_str: String,
  media_url: String,
  display_url: String,
  expanded_url: String,
  width: Number,
  height: Number
}, {
  _id: false
});

const TweetSchema = new Schema({
  created_at: Date,
  id_str: String,
  text: String,
  sanitized_text: String,
  user: UserSchema,
  hashtags: [String],
  user_mentions: [UserSchema],
  media: [MediaSchema],
  filter_level: String,
  lang: String,
  syllables: Number,
  date_detourned: Date,
  last_word: String,
  url: String
});

const TwoemSchema = new Schema({
  id_str: String,
  title: String,
  used_tweets: [String],
  authors: [UserSchema],
  verses: [String],
  url: String,
  meta_description: String,
  html: String,
  created_at: Date,
  view_count: Number
});

TweetSchema.statics.detourne = function() {
  return new Promise((resolve, reject) => {
    //console.log('[TweetSchema] attempting detourn');
    this.count().then((count) => {
      //console.log('[TweetSchema] counted');
      var rand = Math.floor(Math.random() * count);
      //console.log('[TweetSchema] selected ', rand);
      this.findOne().skip(rand).then((data) => {
        //console.log('[TweetSchema] found data: ', data);
        resolve(data);
      }).catch(reject);
    }).catch(reject);
  });
};

const User = mongoose.model('User', UserSchema);
const Media = mongoose.model('Media', MediaSchema);
const Tweet = mongoose.model('Tweet', TweetSchema);
const Twoem = mongoose.model('Twoem', TwoemSchema);

export { User, Media, Tweet, Twoem };
