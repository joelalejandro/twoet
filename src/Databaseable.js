import mongoose from 'mongoose';
import EventEmitter from 'events';

import { Mixin } from 'mixwith';

const Databaseable = Mixin((superclass) => class extends superclass {

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

});

export default Databaseable;
