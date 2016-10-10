import Twoet from '../src/Twoet';
import fs from 'fs';
import express from 'express';
import minimist from 'minimist';
import exec from 'promised-exec';
import jsonMarkup from 'json-markup';
import Config from 'config';

const app = express();
const args = minimist(process.argv.slice(2));

const readTwoem = (poem, res) => {
  res.write('<style>body{font-family:monospace;font-size:2em;text-align:center}input{font-family:monospace;font-size:1em}.json-markup{line-height:1.2em;font-size:1em;font-family:monospace;white-space:pre-line}.json-markup-key{font-weight:700}.json-markup-bool{color:#b22222}.json-markup-string{color:green}.json-markup-null{color:gray}.json-markup-number{color:#00f}</style>');
  res.write('<meta charset="UTF-8">');
  res.write('<h1>twoemme</h1><h2>poemas colaborativos de autores desconocidos</h2>');
  res.write('<h3>' + poem.title + '</h3>');
  res.write('<div style="background:#eee;padding:20px;">' + jsonMarkup(poem.verses) + '</div>');
  res.write('<p>escrito por ' + poem.authors.map((author) => {
    return `<a href="https://twitter.com/${author.id}">@${author.alias}</a>`;
  }).join(', ') + '</p>');
  res.write('<p>compartir: <input size="40" type="text" value="http://twoemme.com/' + poem.id + '"></p>')
};

const sendAnalytics = (res) => {
  try {
    const analytics = Config.get('analytics');
    res.write(`<script>
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
      m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

      ga('create', '${analytics.tracking_id}', 'auto');
      ga('send', 'pageview');

    </script>`);
  } catch (e) {

  }
};

app.get('/', function (req, res) {
  const tw = new Twoet();
  tw.detourne().then(() => {
    const poem = tw.compose();
    fs.writeFileSync(`server/generated/${poem.id}.twoem`, JSON.stringify(poem));
    readTwoem(poem, res);
    sendAnalytics(res);
    res.send();
  });
});

app.get('/:id', function (req, res) {
  try {
    const poem = JSON.parse(fs.readFileSync(`server/generated/${req.params.id}.twoem`));
    readTwoem(poem, res);
    sendAnalytics(res);
    res.send();
  } catch (e) {

  }
});

if (args.setup) {
  exec('npm run build:language').then(() => {
    exec('npm run build:detournement').then(() => {
      app.listen(8000);
    });
  })
} else {
  app.listen(8000);
}
