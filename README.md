# [twoet](https://github.com/joelalejandro/twoet)

> A tweet-fed poem generator. [Live demo here, at Twoemme.](http://twoemme.com/)

### About this project

`twoet` was born as an experiment on [détournement](https://en.wikipedia.org/wiki/D%C3%A9tournement), based
on the ideas presented by Kenneth Goldsmith on his book, "Uncreative writing". The program works by pulling
a considerable sample of random tweets using Twitter's [Stream API `statuses/sample` method](https://dev.twitter.com/streaming/reference/get/statuses/sample)
from a Node client called [`twit`](https://github.com/ttezel/twit),
and then matching tweets in pairs with an `ABAB` rhyming scheme through [`rimador`](https://github.com/JavierRizzoA/rimador).

Read more about this experiment [here](https://medium.com/@joel.a.villarreal/a-crossroad-of-art-and-software-composing-poetry-with-tweets-50787bd58fc1#.w7m00gvsu).

### How to install

```sh
$ git clone https://github.com/joelalejandro/twoet
$ cd twoet
$ npm install
```

### Using `twoet`

Although the software should be able te fetch live tweets, it works better by pooling tweets and storing
them off-line in a JSON file.

In order to set-up the environment, you must:

- Run `npm run build:language` to install rhyming plugins (further versions will support other languages rather than Spanish)
- Run `npm run build:detournement` to get a sample of tweets.
- Run `npm run test` to see how poems are generated through the `compose()` method.

### A sample Twoem

> `Twoem`: a Tweet-derived poem.

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

### Sample output from Twoem server

http://imgur.com/b8P94di

### License

MIT © 2016 Joel A. Villarreal Bertoldi

### Join the community

[Like](https://www.facebook.com/the.twoet/) the project's Facebook page! :)
