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

  it('should compose', () => {
    const tweetCount = 10;
    twoet.on('detournedStep', (tweet) => {
      console.log(tweet.text);
    });
    twoet.detourne(tweetCount).then((tweets) => {
      console.log(twoet.compose(tweets));
      done();
    }).catch((error) => {
      throw new Error(error);
    });
  });
});
