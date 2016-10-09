import { Transform } from 'stream';

class Twoem extends Transform {
  constructor(options) {
    super(Object.assign(options, { objectMode: true, decodeStrings: false }));
    this.settings = options;
    this.setEncoding('utf-8');
  }

  cutPhrase(tweet) {

  }

  _transform(chunks, encoding, callback) {
    let verses = chunks;
    let twoem = null;

    this.push(poem);
    callback();
  }
}
