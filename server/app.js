import Twoet from '../src/Twoet';
import fs from 'fs';
import express from 'express';
import minimist from 'minimist';
import exec from 'promised-exec';
import jsonMarkup from 'json-markup';
import Config from 'config';
import exphbs from 'express-handlebars';

const app = express();
const args = minimist(process.argv.slice(2));

app.engine('handlebars', exphbs.create().engine);
app.set('view engine', 'handlebars');

const tw = new Twoet();

const homeModel = function(twoem, popular) {
  return {
    twoem: twoem,
    popular: popular,
    wording: {
      slogan: 'poemas colaborativos<br>de autores desconocidos',
      newPoem: 'otro poema',
      share: 'compartir: ',
      writtenBy: 'escrito por',
      found: 'encontrado',
      times: twoem.view_count === 1 ? 'vez' : 'veces',
      whatIsThis: '<b>twoemme</b> es el resultado de un experimento inspirado por '
                + 'la obra de Kenneth Goldsmith, <i>Uncreative Writing</i>.'
                + ' Utilizando el concepto de <i>détournement</i> propuesto '
                + 'por los situacionistas en la década de 1950, en el contexto '
                + 'digital, se seleccionan textos completos e íntegros desde '
                + 'un flujo de <i>tweets</i> recientes, actualizado periódicamente. '
                + '<br><br>'
                + 'twoemme es open source, y estás invitado a descubrir cómo funciona '
                + 'consultando el repositorio en '
                + '<a href="https://github.com/joelalejandro/twoet">GitHub</a>.',
      readAsImage: 'leer como imagen',
      readAsText: 'leer como texto'
    },
    config: {
      twitter: {
        card_username: Config.get('twitter.card_username'),
        widget: {
          enabled: Config.get('twitter.widget.enabled')
        }
      },
      facebook: {
        app_id: Config.get('facebook.app_id')
      },
      analytics: {
        enabled: args.hasOwnProperty('analytics') ? args.analytics : true,
        tracking_id: Config.get('analytics.tracking_id')
      }
    }
  };
}

app.get('/(:id)?', function (req, res) {
  if (req.params.id) {
    tw.read(req.params.id).then((twoem) => {
      if (!twoem) {
        res.redirect('/');
      } else {
        tw.getFeaturedList(Config.twoet.featured_count).then((popular) => {
          res.render('home', homeModel(twoem, popular));
        });
      }
    });
  } else {
    tw.compose();
    tw.once('composed', (twoem) => {
      res.redirect(`/${twoem.id_str}`);
      if (Config.twitter.announce) {
        tw._announce(twoem);
      }
    });
  }
});

app.get('/(:id)/image', function (req, res) {
  tw.read(req.params.id).then((twoem) => {
    console.log('Ready to image');
    res.header('Content-Type', 'image/png');
    if (!twoem.png) {
      console.log('Ready to generate image');
      tw.generateImage(twoem.id_str).then((png) => {
        console.log('Ready to send image');
        res.send(png);
      });
    } else {
      res.send(twoem.png);
    }
  });
});

if (args.setup) {
  exec('npm run build:language').then(() => {
    exec('npm run build:detournement').then(() => {
      app.listen(8000);
      console.log('Server ready');
    });
  })
} else {
  app.listen(8000);
  console.log('Server ready');
}
