import Twoet from '../src/Twoet';
import Pace from 'pace';
import Config from 'config';

const twoet = new Twoet();
twoet._openDatabase();

const twoemLimit = Config.get('twoet.auto_compose.count');
let twoemCount = 0;
let composing = false;

const progress = new Pace(twoemLimit);

console.log('Starting composer process');

const runCompose = () => {
  twoet.compose();
  twoet.once('composed', () => {
    progress.op();
    twoemCount += 1;
    if (twoemCount >= twoemLimit) {
      console.log('Composing complete');
      process.exit();
    } else {
      runCompose();
    }
  });
};

runCompose();
