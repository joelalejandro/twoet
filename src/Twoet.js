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
import mongoose from 'mongoose';
import { User, Media, Tweet, Twoem } from '../tools/schema';
import jsonMarkup from 'json-markup';

const T = new Twit(Config.get('twitter'));

class Twoet extends EventEmitter {

  constructor(settings = {}) {
    super();
    this.tweets = [];

    this.settings = Object.assign(settings, Config.get('twoet'));
  }

  _log(level = 'errors') {
    const errors = () => {
      this.on('detournementFailed', (err) => { console.log('Failed to detourne a tweet: ', err.stack); });
      this.on('rhymingTweetSearchFailed', (err) => { console.log('Failed while searching rhyming tweets: ', err.stack) });
      this.on('invalidWord', (word) => { console.log('Unrhymable word: ', word) });
    };

    const warnings = () => {
      this.on('noRhyme', (word) => { console.log('No rhymes for ', word) });
    };

    const info = () => {
      this.on('beginComposing', () => { console.log('Begin composing new twoem') });
      this.on('nextVerse', () => { console.log('Next verse started', this.composingState) });
      this.on('writeVerse', () => { console.log('Writing a verse') });
      this.on('tweetDetourned', (tweet) => { console.log('Using tweet: ', tweet) });
      this.on('invokeRhymer', (word) => { console.log('Attempting to rhyme ', word) });
      this.on('invokeSyllabler', (word) => { console.log('Attempting to count syllables for ', word) });
      this.on('wordPluginReady', (plugin) => { console.log('Word plugin ready: ', plugin )});
      this.on('wordPluginCalled', (output) => { console.log('Word plugin called: ', output )});
      this.on('wordPluginParsed', (output) => { console.log('Word plugin parsed: ', output )});
      this.on('rhymingTweetSearchCompleted', (tweets) => { console.log('Found ', tweets.length, ' matching tweets') });
      this.on('asonantTweetSearchCompleted', (tweets) => { console.log('Fallback to asonant tweets (found ' + tweets.length + ' matches)') });
      this.on('poemReady', () => { console.log('Poem ready: ', this.composingState) });
      this.on('composed', (twoem) => { console.log('Twoem: ', twoem) });
    };

    if (level === 'errors') {
      errors();
    } else if (level === 'warnings') {
      errors();
      warnings();
    } else if (level === 'info') {
      errors();
      warnings();
      info();
    }
  }

  _openDatabase() {
    if (mongoose.Promise !== global.Promise) {
      mongoose.Promise = global.Promise;
    }

    if (!this.connection) {
      this.connection = mongoose.connect(Config.get('database'));
      this.emit('databaseConnected');
    }

    this.emit('databaseOpened');

    return this.connection;
  }

  _createTweetModel(rawTweet, twoetMetadata) {
    const user = new User({
      id_str: rawTweet.user.id_str,
      name: rawTweet.user.name,
      screen_name: rawTweet.user.screen_name,
      location: rawTweet.user.location,
      description: rawTweet.user.description,
      profile_image_url: rawTweet.user.profile_image_url
    });

    const media = rawTweet.entities.media ? rawTweet.entities.media.map((image) => {
      return new Media({
        id_str: image.id_str,
        media_url: image.media_url,
        display_url: image.display_url,
        extended_url: image.extended_url,
        width: image.sizes.large.w,
        height: image.sizes.large.h
      });
    }) : [];

    const hashtags = rawTweet.entities.hashtags ? rawTweet.entities.hashtags.map((hashtag) => {
      return hashtag.text;
    }) : [];

    const user_mentions = rawTweet.entities.user_mentions ? rawTweet.entities.user_mentions.map((user_mention) => {
      return new User({
        id_str: user_mention.id_str,
        name: user_mention.name,
        screen_name: user_mention.screen_name
      });
    }) : [];

    const tweet = new Tweet(Object.assign({
      created_at: rawTweet.created_at,
      id_str: rawTweet.id_str,
      text: rawTweet.text,
      user,
      hashtags,
      user_mentions,
      media,
      filter_level: rawTweet.filter_level,
      lang: rawTweet.lang
    }, twoetMetadata));

    return tweet;
  }

  _sanitize(tweet) {
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

  _invokeWordPlugin(type, word) {
    const sanitizedWord = word.replace(/[^a-záéíóúñü]+/gi, '');
    const context = this.settings[`${type}_plugins`][this.settings.detournement_context.language];
    let plugin = require(context.package);

    if (context.requires_new) {
      plugin = new plugin();
    }

    this.emit('wordPluginReady', plugin);

    const rawOutput = context.input !== 'call'
      ? plugin[context.input].call(null, sanitizedWord)
      : plugin.call(null, sanitizedWord);

    this.emit('wordPluginCalled', rawOutput);

    let output = {};

    if (context.output.type === 'object' && typeof rawOutput === 'object') {
      Object.keys(context.output.mapping).forEach((destination) => {
        const rawOutputResult = rawOutput[context.output.mapping[destination]];
        if (typeof rawOutputResult === 'function') {
          output[destination] = rawOutputResult();
        } else {
          output[destination] = rawOutputResult;
        }
      });
    }

    this.emit('wordPluginParsed', output);

    return output;
  }

  invokeRhymer(word) {
    this.emit('invokeRhymer', word);
    return this._invokeWordPlugin('rhyming', word);
  }

  invokeSyllabler(word) {
    this.emit('invokeSyllabler', word);
    return this._invokeWordPlugin('syllable', word);
  }

  _wildcardize(expression, limit) {
    return expression.split(' ').map((char, index) => {
      return (index / 2) % 2 === 0 ? (char + '.' + ((limit > 1) ? '{1,' + limit + '}' : '')) : char;
    });
  }

  _getRhymes(word) {
    return new Promise((resolve, reject) => {
      try {
        const rhymingOutput = this.invokeRhymer(word);
        if (!rhymingOutput || rhymingOutput.rhyme === '') {
          this.emit('noRhyme', word);
          reject('no rhyme');
        } else {
          this.emit('rhyme', rhymingOutput);
          Tweet.find({
            sanitized_text: new RegExp(`${rhymingOutput.rhyme}(\.)?$`, 'i'),
            id_str: {
              $nin: this.composingState.candidateTweet.id_str
            }
          }).then((tweets) => {
            this.emit('rhymingTweetSearchCompleted', tweets);
            if (tweets.length < 2) {
              const limit = rhymingOutput.rhyme.indexOf(rhymingOutput.asonance.substr(-1)) - rhymingOutput.rhyme.indexOf(rhymingOutput.asonance[0]) - 1;
              const wildcardAsonance = this._wildcardize(rhymingOutput.asonance, limit);
              Tweet.find({
                sanitized_text: new RegExp(`${wildcardAsonance}(\.)?$`, 'i'),
                id_str: {
                  $nin: this.composingState.candidateTweet.id_str
                }
              }).then((asonanceTweets) => {
                this.emit('asonantTweetSearchCompleted', asonanceTweets);
                resolve(asonanceTweets);
              });
            } else {
              resolve(tweets);
            }
          }).catch((err) => {
            this.emit('rhymingTweetSearchFailed', err);
          });
        }
      } catch (e) {
        this.emit('invalidWord', sanitizedWord);
        reject('invalid word');
      }
    });
  }

  _writeVerse(processed, verses) {
    this.emit('writeVerse');
    Tweet.detourne().then((tweet) => {
      this.emit('tweetDetourned', tweet);
      this.composingState.candidateTweet = tweet;

      let text = tweet.sanitized_text;

      let lastWord = tweet.last_word;
      this._getRhymes(lastWord).then((rhymes) => {
        let tweetB = rhymes.filter((rhymed) => {
          return Math.abs(tweet.syllables - rhymed.syllables) === 2;
        }).shuffle()[Math.floor(Math.random() * rhymes.length)];

        if (!tweetB) {
          this.emit('nextVerse');
          return;
        }

        this.composingState.blockA.push(text);
        this.composingState.blockB.push(tweetB.sanitized_text);

        this.composingState.authors.push(new User({
          name: tweet.user.name,
          screen_name: tweet.user.screen_name,
          contribution_url: tweet.url
        }));
        this.composingState.authors.push(new User({
          name: tweetB.user.name,
          screen_name: tweetB.user.screen_name,
          contribution_url: tweetB.url
        }));

        this.composingState.titleBlocks.push(tweet.id_str.substr(-4));
        this.composingState.titleBlocks.push(tweetB.id_str.substr(-4));

        this.composingState.usedTweets.push(tweet.id_str);
        this.composingState.usedTweets.push(tweetB.id_str);

        this.composingState.processed += 2;

        if (this.composingState.processed < this.composingState.verses) {
          this.emit('nextVerse');
        } else {
          this.emit('poemReady');
        }
      }).catch((err) => {
        this.emit('nextVerse');
      });
    }).catch((err) => {
      this.emit('detournementFailed', err);
    });
  }

  _arrangeVerses() {
    let i;

    for (i = 0; i < this.composingState.blockA.length; i++) {
      this.composingState.poem.push(this.composingState.blockA[i]);
    }

    for (i = 0; i < this.composingState.blockB.length; i++) {
      this.composingState.poem.push(this.composingState.blockB[i]);
    }

    const title = `Twoem ${this.composingState.titleBlocks.join(' ')}`;

    const twoem = new Twoem({
      id_str: this.composingState.titleBlocks.join(''),
      title: title,
      used_tweets: this.composingState.usedTweets,
      authors: this.composingState.authors,
      verses: this.composingState.poem,
      url: `http://twoemme.com/${this.composingState.titleBlocks.join('')}`,
      meta_description: `Un poema colaborativo escrito por ${this.composingState.authors.map(author => { return '@' + author.screen_name; })}`,
      created_at: new Date(),
      view_count: 1,
      html: jsonMarkup(this.composingState.poem)
    });

    twoem.save((err) => {
      if (err) {
        console.log(err);
      }
      this._announce(twoem);
      this.emit('composed', twoem);
    });

    this.isComposing = false;
    this._resetComposingState();
  }

  _announce(twoem) {
    T.post('statuses/update', {
      status: twoem.authors.map(author => { return `@${author.screen_name}`; }).join(' ')
            + ' han escrito un #twoemme juntos! - ' + twoem.url
    });
  }

  _resetComposingState() {
    this.composingState = {
      candidateTweet: null,
      blockA: [],
      blockB: [],
      poem: [],
      processed: 0,
      verses: this.settings.poem_rules.verse_count,
      authors: [],
      titleBlocks: [],
      usedTweets: []
    };

    this.removeAllListeners('nextVerse');
    this.removeAllListeners('poemReady');
  }

  compose() {
    this.emit('beginComposing');

    this.isComposing = true;
    this._resetComposingState();

    this._openDatabase();

    this.on('nextVerse', this._writeVerse);
    this.on('poemReady', this._arrangeVerses);

    this.emit('nextVerse');
  }

  read(twoemID) {
    this._openDatabase();
    return new Promise((resolve, reject) => {
      Twoem.findOneAndUpdate({ id_str: twoemID }, { $inc: { view_count: 1 }}).then(resolve);
    });
  }
}

export default Twoet;
