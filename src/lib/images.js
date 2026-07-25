const axios = require('axios');
const cheerio = require('cheerio');

const CACHE_TTL_MS = parseInt(process.env.CACHE_TTL_MS, 10) || 5 * 60 * 1000; // 5 minutes

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
};

// Simple in-memory cache
let cache = { images: null, cachedAt: 0 };

const isCacheValid = () =>
  cache.images !== null && Date.now() - cache.cachedAt < CACHE_TTL_MS;

const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

// --- Source: Safebooru API (100+ posts, SFW, accessible CDN) ---
const fetchFromSafebooru = async () => {
  const response = await axios.get('https://safebooru.org/index.php', {
    params: {
      page: 'dapi',
      s: 'post',
      q: 'index',
      json: 1,
      tags: 'nitocris_(fate)',
      limit: 100,
    },
    timeout: 10_000,
  });

  return response.data
    .filter((post) => post.file_url && !/\.gif$/i.test(post.file_url))
    .map((post) => ({
      // sample_url is smaller than file_url but still high quality — both confirmed accessible
      thumb: post.sample_url || post.file_url,
      full: post.file_url,
    }));
};

// --- Source: Xbooru API (additional NSFW posts) ---
const fetchFromXbooru = async () => {
  const response = await axios.get('https://xbooru.com/index.php', {
    params: {
      page: 'dapi',
      s: 'post',
      q: 'index',
      json: 1,
      tags: 'nitocris_(fate)',
      limit: 100,
    },
    timeout: 10_000,
  });

  const posts = Array.isArray(response.data) ? response.data : (response.data.post || []);
  const IMAGE_EXT = /\.(jpg|jpeg|png|webp)(\?.*)?$/i;

  return posts
    .filter((post) => post.file_url && IMAGE_EXT.test(post.file_url))
    .map((post) => ({
      thumb: post.preview_url || post.file_url,
      full: post.sample_url || post.file_url,
    }));
};

// --- Source: Danbooru API (CDN is Cloudflare-protected — images will likely fail) ---
const fetchFromDanbooru = async () => {
  const response = await axios.get('https://danbooru.donmai.us/posts.json', {
    params: { tags: 'nitocris_(fate) rating:g', limit: 100 },
    headers: { 'User-Agent': 'NitocrisGallery/1.0' },
    timeout: 10_000,
  });

  const IMAGE_EXT = /\.(jpg|jpeg|png|webp)(\?.*)?$/i;

  return response.data
    .filter((post) => post.preview_file_url && IMAGE_EXT.test(post.preview_file_url))
    .map((post) => ({
      thumb: post.preview_file_url,
      full: post.large_file_url || post.file_url || post.preview_file_url,
    }));
};

// --- Source: Google Images (last resort, unreliable) ---
const fetchFromGoogle = async () => {
  const url =
    process.env.SEARCH_URL ||
    'https://www.google.com/search?q=fate+grand+order+nitocris+danbooru&tbm=isch&tbs=isz:l,ic:color,itp:photo';

  const response = await axios.get(url, {
    headers: BROWSER_HEADERS,
    timeout: 10_000,
  });

  const $ = cheerio.load(response.data);
  const images = [];

  $('img').each((_, el) => {
    const src = $(el).attr('src');
    if (src && !/\.gif$/i.test(src)) images.push({ thumb: src, full: src });
  });

  return images;
};

// --- Aggregator: queries all sources in parallel and combines results ---
const SOURCES = [
  { name: 'Safebooru', fn: fetchFromSafebooru },
  { name: 'Xbooru',    fn: fetchFromXbooru },
  { name: 'Google',    fn: fetchFromGoogle },
  // Danbooru excluded: cdn.donmai.us is protected by Cloudflare Bot Protection
];

const getNitocrisImages = async () => {
  if (isCacheValid()) return cache.images;

  const results = await Promise.allSettled(SOURCES.map((s) => s.fn()));

  const seen = new Set();
  const allImages = [];

  results.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      console.log(`[Images] ${result.value.length} images from ${SOURCES[i].name}`);
      for (const img of result.value) {
        if (!seen.has(img.full)) {
          seen.add(img.full);
          allImages.push(img);
        }
      }
    } else if (result.status === 'rejected') {
      console.warn(`[Images] ${SOURCES[i].name} failed: ${result.reason.message}`);
    }
  });

  if (allImages.length === 0) {
    throw new Error('All image sources failed. Please try again later.');
  }

  const shuffled = shuffle(allImages);
  cache = { images: shuffled, cachedAt: Date.now() };
  console.log(`[Images] Total: ${shuffled.length} unique images`);
  return shuffled;
};

module.exports = { getNitocrisImages };

