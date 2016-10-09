/**
 * twoet
 *
 * Copyright © 2016 Joel A. Villarreal Bertoldi. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { expect } from 'chai';
import Config from 'config';

import Twoet from '../src/Twoet';
import Twoem from '../src/Twoem';

if (Config.get('twoet.faux_detournement.enabled')) {
  console.warn('Twoet is running tests with faux detournement data.');
};

describe('Twoet', () => {
  const twoet = new Twoet();

  it('should have Twitter access token configured', () => {
    const configuration = Config.get('twitter');
    expect(configuration.consumer_key).to.not.be.undefined.and.not.be.empty;
    expect(configuration.consumer_secret).to.not.be.undefined.and.not.be.empty;
    expect(configuration.access_token).to.not.be.undefined.and.not.be.empty;
    expect(configuration.access_token_secret).to.not.be.undefined.and.not.be.empty;
  });

  it('should explore (fetch a given amount of tweets, live or sampled)', (done) => {
    const tweetCount = 10;
    twoet.on('detournedStep', (tweet) => {
      console.log(tweet.text);
    });
    twoet.detourne(tweetCount).then((tweets) => {
      //expect(twoet.tweets.length).to.equal(tweetCount);
      done();
    }).catch((error) => {
      throw new Error(error);
    });
  }).timeout(0);

  /*
  it('should select random phrases from all tweets');
  it('should sort those phrases by its rhyming');
  it('should produce a poem');
  */

  /*it('should initialize the stream', () => {
    twoet.beginComposing().then((twoem) => {
      expect(twoem).to.be.an.instanceof(Twoem);
      twoem.on('data', (data) => {
        console.log('Stream data: ', data);
      });
    });
  })*/

  it('should compose', () => {
    console.log(twoet.compose());
  });
});
