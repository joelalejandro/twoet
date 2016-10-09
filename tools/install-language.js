import Config from 'config';
import { exec } from 'child_process';

const language = Config.get('twoet.detournement_context.language');
const plugin = Config.get(`twoet.rhyming_plugins.${language}`);

console.log(`=== Installing language: ${language}`);

console.log(`=== Begin installing NPM package => ${plugin.package}`);

exec(`npm install ${plugin.package}`, (error, stdout, stderr) => {
  if (error !== null) {
    console.log(stderr);
    return;
  } else {
    console.log('=== Finished installing NPM package');
    if (plugin.post_install && plugin.post_install !== '') {
      console.log('=== Running post_install commands');
      exec(plugin.post_install, (error, stdout, stderr) => {
        if (error !== null) {
          console.log('=== post_install commands failed, installation may be incomplete');
        } else {
          console.log('=== Finished running post_install commands');
          console.log('=== Finished language installation');
        }
      });
    } else {
      console.log('=== Finished language installation');
    }
  }
});
