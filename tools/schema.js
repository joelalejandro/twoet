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
  view_count: Number,
  png: Buffer
});

const QuandlPaperShreadSchema = new Schema({
  quote_id: String,
  refreshed_at: Date,
  highs: [Number],
  lows: [Number]
});

TweetSchema.statics.detourne = function() {
  return new Promise((resolve, reject) => {
    this.count().then((count) => {
      var rand = Math.floor(Math.random() * count);
      this.findOne().skip(rand).then((data) => {
        resolve(data);
      }).catch(reject);
    }).catch(reject);
  });
};

const User = mongoose.model('User', UserSchema);
const Media = mongoose.model('Media', MediaSchema);
const Tweet = mongoose.model('Tweet', TweetSchema);
const Twoem = mongoose.model('Twoem', TwoemSchema);
const QuandlPaperShread = mongoose.model('QuandlPaperShread', QuandlPaperShreadSchema);

export { User, Media, Tweet, Twoem, QuandlPaperShread };
