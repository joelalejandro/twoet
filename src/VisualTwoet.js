import EventEmitter from 'events';
import Config from 'config';
import Databaseable from './Databaseable';
import { mix } from 'mixwith';
import QuandlPaperShreadGenerator from './QuandlPaperShreadGenerator';

class VisualTwoet extends mix(EventEmitter).with(Databaseable) {

  constructor(settings = {}) {
    super();
    this.settings = Object.assign(Config.get('visual_twoet'), {});
    this.generators = {
      QuandlPaperShreadGenerator
    };
  }

  generateImage(twoem) {
    this.emit('generateImageStarted');
    const Generator = this.generators[this.settings.paper_shreads.generator];
    this._generator = new Generator(this.settings.paper_shreads.sources[this.settings.paper_shreads.generator]);
    this.emit('generateImageInitialized');
    return this._generator.compose(twoem);
  }

}

export default VisualTwoet;
