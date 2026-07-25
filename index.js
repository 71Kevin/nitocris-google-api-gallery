require('dotenv').config();
const express = require('express');
const path = require('path');
const { URL } = require('url');
const axios = require('axios');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { getNitocrisImages } = require('./src/lib/images');

const app = express();
const PORT = process.env.PORT || 3000;

// Allowlist of image hosts that the proxy is allowed to fetch from
const ALLOWED_IMAGE_HOSTS = new Set([
  'cdn.donmai.us',
  'safebooru.org',
  'img1.safebooru.org',
  'img2.safebooru.org',
  'img3.safebooru.org',
  'xbooru.com',
  'img.xbooru.com',
  'img1.gelbooru.com',
  'img2.gelbooru.com',
  'img3.gelbooru.com',
  'img4.gelbooru.com',
]);

// Maps each CDN host to the correct Referer its hotlink protection expects
const REFERER_MAP = {
  'cdn.donmai.us': 'https://danbooru.donmai.us/',
  'safebooru.org': 'https://safebooru.org/',
  'img1.safebooru.org': 'https://safebooru.org/',
  'img2.safebooru.org': 'https://safebooru.org/',
  'img3.safebooru.org': 'https://safebooru.org/',
  'xbooru.com': 'https://xbooru.com/',
  'img.xbooru.com': 'https://xbooru.com/',
  'img1.gelbooru.com': 'https://gelbooru.com/',
  'img2.gelbooru.com': 'https://gelbooru.com/',
  'img3.gelbooru.com': 'https://gelbooru.com/',
  'img4.gelbooru.com': 'https://gelbooru.com/',
};

const toProxyUrl = (url) => `/proxy?url=${encodeURIComponent(url)}`;

// Security: sets proper HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:', 'http:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
        fontSrc: ["'self'", 'fonts.gstatic.com'],
        connectSrc: ["'self'"],
      },
    },
  })
);

// HTTP request logging
app.use(morgan('dev'));

// Response compression (gzip)
app.use(compression());

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));
app.use(express.static(path.join(__dirname, 'src/public')));

// Image proxy — fetches external images server-side with the correct Referer,
// bypassing hotlink protection on CDNs like cdn.donmai.us
app.get('/proxy', async (req, res) => {
  const { url } = req.query;

  if (!url) return res.status(400).end();

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).end();
  }

  if (!['https:', 'http:'].includes(parsed.protocol)) return res.status(400).end();
  if (!ALLOWED_IMAGE_HOSTS.has(parsed.hostname)) return res.status(403).end();

  try {
    const upstream = await axios.get(url, {
      responseType: 'stream',
      headers: {
        Referer: REFERER_MAP[parsed.hostname] || `https://${parsed.hostname}/`,
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 15_000,
    });

    const contentType = upstream.headers['content-type'] || '';
    if (!contentType.startsWith('image/')) {
      upstream.data.destroy();
      return res.status(403).end();
    }

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=3600');
    upstream.data.pipe(res);
  } catch (err) {
    console.error(`[Proxy] ${err.response?.status ?? err.code} — ${url}`);
    res.status(502).end();
  }
});

// Main route
app.get('/', async (req, res) => {
  try {
    const images = await getNitocrisImages();
    // Route thumbnails through the local proxy to avoid CDN hotlink protection
    const proxiedImages = images.map((img) => ({
      thumb: toProxyUrl(img.thumb),
      full: toProxyUrl(img.full),
    }));
    res.render('index', { images: proxiedImages, count: proxiedImages.length });
  } catch (error) {
    console.error('[Error]', error.message);
    res.status(500).render('error', { message: error.message });
  }
});

// 404 — not found handler
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}`);
});
