/**
 * twoet
 *
 * Copyright © 2016 Joel A. Villarreal Bertoldi. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

// Inject Array.shuffle
// thanks to Bruno Leonardo Michels (http://stackoverflow.com/a/34377908/250301)
Array.prototype.shuffle = function() {
  let m = this.length, i;
  while (m) {
    i = (Math.random() * m--) >>> 0;
    [this[m], this[i]] = [this[i], this[m]]
  }
  return this;
}

import Twit from 'twit';
import Config from 'config';
import EventEmitter from 'events';
import fs from 'fs';

const T = new Twit(Config.get('twitter'));

class Twoet extends EventEmitter {

  constructor(settings = {}) {
    super();
    this.tweets = [];

    this.settings = Object.assign(settings, Config.get('twoet'));
  }

  detourne(tweetCount = 10) {
    return new Promise((resolve, reject) => {
      if (this.settings.faux_detournement.enabled) {
        try {
          this.tweets = JSON.parse(fs.readFileSync('config/faux_detournement_data.json')).shuffle();
          resolve(this.tweets);
        } catch (e) {
          reject(e);
        }
      } else {
        const stream = T.stream('statuses/sample', this.settings.detournement_context);
        stream.on('tweet', (tweet) => {
          this.tweets.push(tweet);
          this.emit('detournedStep', tweet);
          if (this.tweets.length === tweetCount) {
            stream.stop();
            resolve(this.tweets);
          }
        });
        stream.on('error', reject);
      }
    });
  }

  sanitize(tweet) {
    let text = tweet.text.replace(/\n/g, '').replace(/RT /g, '');

    tweet.entities.user_mentions.forEach((user) => {
      text = text.replace(new RegExp(`@${user.screen_name}(:)?`, 'g'), '');
    });

    tweet.entities.hashtags.forEach((hashtag) => {
      text = text.replace(new RegExp(`#(${hashtag.text})`, 'g'), '$1');
    });

    text = text.replace(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi, '');

    text = text.trim();

    return text;
  }

  getRhymes(word, tweets = this.tweets) {
    const rhymingContext = this.settings.rhyming_plugins[this.settings.detournement_context.language];
    let rhymingPackage = require(rhymingContext.package);

    if (rhymingContext.requires_new) {
      rhymingPackage = new rhymingPackage();
    }

    const sanitizedWord = word.replace(/[^a-záéíóúñü]+/gi, '');

    try {
      const rhymingRawOutput = rhymingPackage[rhymingContext.input].call(null, sanitizedWord);
      let rhymingOutput = {};

      if (rhymingContext.output.type === 'object' && typeof rhymingRawOutput === 'object') {
        Object.keys(rhymingContext.output.mapping).forEach((destination) => {
          rhymingOutput[destination] = rhymingRawOutput[rhymingContext.output.mapping[destination]];
        });
      }

      if (rhymingOutput.rhyme === '') {
        console.log('Rhyme not found');
        return [];
      } else {
        console.log('Rhyme found', rhymingOutput);
        let filtered = tweets.filter(tweet => {
          return new RegExp(`${rhymingOutput.rhyme}(\.)?$`, 'i').test(this.sanitize(tweet));
        });
        console.log(`Rhyming tweets: ${filtered.length}`);
        return filtered;
      }
    } catch (e) {
      console.log('Invalid word: ' + sanitizedWord);
      return [];
    }
  }

  compose(tweets = this.tweets, verses = this.settings.poem_rules.verse_count) {
    let blockA = [], blockB = [], poem = [];
    let i = 0;
    let processed = 0;
    let authors = [];
    let titleBlocks = [];

    while (processed < verses) {
      const tweet = tweets[i];

      if (!tweet) {
        tweets.shuffle();
        blockA = [];
        blockB = [];
        i = 0;
        processed = 0;
        continue;
      }

      let text = this.sanitize(tweet);

      let lastWord = text.split(' ').pop();
      let rhyme = this.getRhymes(lastWord, tweets.filter(t => { return t.id_str !== tweet.id_str }));

      if (rhyme.length > 0) {
        blockA.push(text);
        let tweetB = rhyme.shuffle()[Math.floor(Math.random() * rhyme.length)];
        blockB.push(this.sanitize(tweetB));

        authors.push({ name: tweet.user.name, alias: tweet.user.screen_name });
        authors.push({ name: tweetB.user.name, alias: tweetB.user.screen_name });

        titleBlocks.push(tweet.id_str.substr(-4));
        titleBlocks.push(tweetB.id_str.substr(-4));

        processed += 2;
      }

      i += 1;
    }

    for (i = 0; i < blockA.length; i++) {
      poem.push(blockA[i]);
    }

    for (i = 0; i < blockB.length; i++) {
      poem.push(blockB[i]);
    }

    const title = `Twoem ${titleBlocks.join(' ')}`;

    return {
      title: title,
      authors: authors,
      verses: poem
    };
  }
}

export default Twoet;
