import { mix } from 'mixwith';
import { QuandlPaperShread } from '../tools/schema';
import request from 'request';
import mongoose from 'mongoose';
import Databaseable from './Databaseable';
import EventEmitter from 'events';
import Canvas from 'canvas';
import fs from 'fs';
import shuffle from './Shuffle';

class QuandlPaperShreadGenerator extends mix(EventEmitter).with(Databaseable) {

  constructor(settings = {}) {
    super();
    this.settings = settings;
  }

  _getUrl() {
    return this.settings.api_url.replace(/\$\{quote_id\}/g, this.settings.quote_id)
      .replace(/\$\{api_key\}/g, this.settings.api_key);
  }

  _createQuanldPaperShreadModel(data) {
    return new QuandlPaperShread({
      quote_id: data.dataset.dataset_code,
      refreshed_at: data.dataset.refreshed_at,
      highs: data.dataset.data.map(q => q[2]),
      lows: data.dataset.data.map(q => q[3])
    });
  }

  _getQuandlData() {
    return new Promise((resolve, reject) => {
      QuandlPaperShread.findOne({ quote_id: this.settings.quote_id }).then((data) => {
        if (data !== null) {
          resolve(data);
        } else {
          request[this.settings.http_method](this._getUrl(), (error, response, body) => {
            if (error) {
              reject(error);
            } else {
              const json = JSON.parse(body);
              const model = this._createQuanldPaperShreadModel(json);
              model.save().then(resolve).catch(err => { console.log(err.stack) });
            }
          });
        }
      });
    });
  }

  _generateCanvas() {
    const canvas = new Canvas(600, 600);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgb(255, 255, 255, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
  }

  _generatePaperShread(verse, verseIndex, quandlData, canvas, fontFamilies, colours) {
    try {
      const ctx = canvas.getContext('2d');
      const highs = shuffle(quandlData.highs);
      const lows = shuffle(quandlData.lows);
      let offsetY = 100 * verseIndex;
      const amplitudeFactor = 9;
      const fontFamily = fontFamilies[verseIndex];
      const colour = colours[verseIndex];
      let fontSize = 16;
      let i;
      const bold = Math.random() > 0.5 ? 'bold' : '';

      const normalize = (value, context) => {
        const m = value - Math.min.apply(null, context);
        const n = Math.max.apply(null, context) - Math.min.apply(null, context);
        return m / n;
      };

      if (verseIndex > 0) {
        offsetY += 25 * (verseIndex + 1);
      } else {
        offsetY += 25;
      }

      ctx.fillStyle = `rgb(${colour}, ${colour}, ${colour}, 1)`;
      ctx.fillRect(0, offsetY, canvas.width, -offsetY + Math.max.apply(null, lows) * amplitudeFactor);

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
      for (i = 1; i <= 600; i++) {
        ctx.lineTo((i - 1) * 3, offsetY + normalize(highs[i], highs) * amplitudeFactor);
      }
      ctx.stroke();

      ctx.font = `${bold} ${fontSize}px ${fontFamily}`;

      while (ctx.measureText(verse).width < 550) {
        fontSize += 1;
        ctx.font = `${bold} ${fontSize}px ${fontFamily}`;
      }

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
      for (i = 1; i <= 600; i++) {
        ctx.lineTo((i - 1) * 3, offsetY + 100 + normalize(lows[i], lows) * amplitudeFactor);
      }
      ctx.stroke();

      ctx.fillStyle = 'rgb(0, 0, 0, 1)';
      ctx.fillText(verse, 10 + (Math.random() * 25), offsetY + 50);

    } catch (e) {
      console.log(e.stack);
    }
  }

  _stamp(canvas, twoem) {
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgb(0, 0, 0, 1)';
    ctx.fillRect(0, 530, canvas.width, 70);
    ctx.fillRect(0, 0, canvas.width, 25);

    ctx.fillStyle = 'rgb(255, 255, 255, 1)';

    ctx.font = '16px Helvetica';
    ctx.fillText(twoem.url, 15, 17);

    ctx.font = 'bold 16px Helvetica';
    ctx.fillText('twoemme', 500, 17);

    ctx.font = 'bold 24px Courier New';
    ctx.fillText(twoem.title, 30, 560);

    ctx.font = '16px Helvetica';
    ctx.fillText(twoem.authors.map(author => { return `@${author.screen_name}`; }).join(', '), 30, 580);
  }

  compose(twoem) {
    return new Promise((resolve, reject) => {
      this._getQuandlData().then(quandlData => {
        const fontFamilies = shuffle(['Helvetica', 'Times', 'Courier New', 'Roboto']);
        const colours = shuffle([192, 168, 220, 145]);
        const canvas = this._generateCanvas();
        twoem.verses.forEach((verse, index) => {
          console.log('generating paper shread for ', verse);
          this._generatePaperShread(verse, index, quandlData, canvas, fontFamilies, colours);
        });
        this._stamp(canvas, twoem);
        twoem.png = canvas.toBuffer();
        twoem.save().then(resolve);
      });
    });
  }

}

export default QuandlPaperShreadGenerator;
