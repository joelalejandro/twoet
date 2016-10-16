import Twit from 'twit';
import Config from 'config';
import Pace from 'pace';
import fs from 'fs';
import Twoet from '../src/Twoet';

const T = new Twit(Config.get('twitter'));
const tweets = [];
const tweetMax = Config.get('twoet.faux_detournement.sample_size');
const detournementContext = Config.get('twoet.detournement_context');
const rules = Config.get('twoet.poem_rules');
const progress = new Pace(tweetMax);
let tweetCount = 0;

console.log(`Will fetch ${tweetMax} tweets with context: ${JSON.stringify(detournementContext)}`);

const twoet = new Twoet();
twoet._openDatabase();

const stream = T.stream('statuses/sample', { language: detournementContext.language });

stream.on('tweet', (rawTweet) => {
  const text = twoet._sanitize(rawTweet);
  const syllableCount = text.split(' ').map((word) => {
    return twoet.invokeSyllabler(word)['syllables'].length;
  });
  const count = syllableCount.reduce((countA, countB) => countA + countB);
  if (rules.syllable_count.indexOf(count) >= 0) {
    progress.op();
    const tweet = twoet._createTweetModel(rawTweet, {
      sanitized_text: text,
      syllables: count,
      date_detourned: new Date(),
      last_word: text.replace(/[^a-záéíóúñü ]/gi, '').trim().split(' ').pop(),
      url: `https://twitter.com/${rawTweet.user.screen_name}/status/${rawTweet.id_str}`
    });
    tweet.save((err) => {
      if (err) {
        throw new Error(err);
      }
      tweetCount += 1;
      if (tweetCount >= tweetMax) {
        stream.stop();
        process.exit();
      }
    });
  } else {
    console.log('Skipping tweet: ', text);
  }
});
