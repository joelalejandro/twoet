# [twoet](https://github.com/joelalejandro/twoet)

[![NPM version](http://img.shields.io/npm/v/twoet.svg?style=flat-square)](https://www.npmjs.com/package/twoet)
[![NPM downloads](http://img.shields.io/npm/dm/twoet.svg?style=flat-square)](https://www.npmjs.com/package/twoet)
[![Build Status](http://img.shields.io/travis/joelalejandro/twoet/master.svg?style=flat-square)](https://travis-ci.org/joelalejandro/twoet)
[![Coverage Status](https://img.shields.io/coveralls/joelalejandro/twoet.svg?style=flat-square)](https://coveralls.io/joelalejandro/twoet)
[![Dependency Status](http://img.shields.io/david/joelalejandro/twoet.svg?style=flat-square)](https://david-dm.org/joelalejandro/twoet)

> A tweet-fed poem generator.

### About this project

`twoet` was born as an experiment on [détournement](https://en.wikipedia.org/wiki/D%C3%A9tournement), based
on the ideas presented by Kenneth Goldsmith on his book, "Uncreative writing". The program works by pulling
a considerable sample of random tweets using Twitter's [Stream API `statuses/sample` method](https://dev.twitter.com/streaming/reference/get/statuses/sample)
from a Node client called [`twit`](https://github.com/ttezel/twit),
and then matching tweets in pairs with an `ABAB` rhyming scheme through [`rimador`](https://github.com/JavierRizzoA/rimador).

### How to install

```sh
$ npm install twoet
```

### Using `twoet`

Although the software should be able te fetch live tweets, it works better by pooling tweets and storing
them off-line in a JSON file.

In order to set-up the environment, you must:

- Run `npm run build:language` to install rhyming plugins (further versions will support other languages rather than Spanish)
- Run `npm run build:detournement` to get a sample of tweets.
- Run `npm run test` to see how poems are generated through the `compose()` method.

### A sample Poem object

```javascript
{ title: 'Twoem 5681 0869 7920 4896',
  authors: 
   [ /* ... */ ],
  verses: 
   [ 'Mi vieja dijo "doy gracias a dios que ninguno de mis hijos fuma marihuana".',
     'y ninguno conmigo pedazo de gato',
     'Sonríe Hoy, Por que Quizás no Haya Un Mañana.',
     'Alguien que me desaburra un rato?' ] }
```

### License

MIT © 2016 Joel A. Villarreal Bertoldi
