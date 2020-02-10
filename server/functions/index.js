const functions = require('firebase-functions');

exports.bigben = functions.https.onRequest((req, res) => {
    // London is UTC + 1hr;
    const hours = (new Date().getHours() % 12) + 1;
    res.status(200).send(`<!doctype html>
    <head>
      <title>Time</title>
    </head>
    <body>
      ${'BONG '.repeat(hours)}
    </body>
  </html>`);
});
