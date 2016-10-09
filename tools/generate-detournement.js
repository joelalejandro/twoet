import Twit from 'twit';
import Config from 'config';
import Pace from 'pace';
import fs from 'fs';

const T = new Twit(Config.get('twitter'));
const tweets = [];
const tweetMax = Config.get('twoet.faux_detournement.sample_size');
const detournementContext = Config.get('twoet.detournement_context');
const progress = new Pace(tweetMax);
let tweetCount = 0;

console.log(`Will fetch ${tweetMax} tweets with context: ${JSON.stringify(detournementContext)}`);

const stream = T.stream('statuses/sample', detournementContext);

stream.on('tweet', (tweet) => {
  progress.op();
  tweets.push(tweet);
  if (tweets.length === tweetMax) {
    stream.stop();
    fs.writeFileSync('config/faux_detournement_data.json', JSON.stringify(tweets));
    process.exit();
  }
});
