/**
 * twoet
 *
 * Copyright © 2016 Joel A. Villarreal Bertoldi. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Twit from 'twit';
import Config from 'config';
import EventEmitter from 'events';

const T = new Twit(Config.get('twitter'));

class Twoet extends EventEmitter {

  constructor() {
    super();
    this.tweets = [];
  }

  detourne(tweetCount = 10) {
    return new Promise((resolve, reject) => {
      const stream = T.stream('statuses/sample', { language: 'es' });
      stream.on('tweet', (tweet) => {
        this.tweets.push(tweet);
        this.emit('detournedStep', tweet);
        if (this.tweets.length === tweetCount) {
          stream.stop();
          resolve(this.tweets);
        }
      });
      stream.on('error', reject);
    });
  }

  compose(tweets = this.tweets) {

  }
}

export default Twoet;
