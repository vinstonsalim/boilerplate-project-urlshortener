require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
var store = require('store');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// URL Shortener Microservice
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/api/shorturl', function(req, res) {
  const { url } = req.body;
  const regex = /^(http|https):\/\/[^ "]+$/;

  if (!regex.test(url)) {
    res.json({ error: 'invalid url' });
    return;
  }

  const hostname = new URL(url).hostname;

  dns.lookup(hostname, function(err) {
    if (err) {
      res.json({ error: 'invalid url' });
    } else {
      // Store URLs in local storage
      const storedUrls = store.get('urls') || [];
      const short_url = storedUrls.length + 1;
      storedUrls.push({ original_url: url, short_url });
      store.set('urls', storedUrls);
      res.json({ original_url: url, short_url: short_url });
    }
  });
});

app.get('/api/shorturl/:short_url', function(req, res) {
  const { short_url } = req.params;
  // if not given
  if (!short_url) {
    res.json({ error: 'No short URL found for the given input' });
    return;
  }

  // Retrieve URLs from local storage
  const storedUrls = store.get('urls') || [];

  // Find the original URL from the short URL
  const foundUrl = storedUrls.find(url => url.short_url == short_url);

  if (foundUrl) {
    res.redirect(foundUrl.original_url);
  } else {
    res.json({ error: 'No short URL found for the given input' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
