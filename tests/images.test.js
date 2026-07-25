'use strict';

jest.mock('axios');

describe('getNitocrisImages', () => {
  let getNitocrisImages;
  let axios;

  // Sample API post shapes matching each source's real response format
  const safebooruPost = (id = 1) => ({
    file_url: `https://safebooru.org/images/1/img${id}.jpg`,
    sample_url: `https://safebooru.org/samples/1/sample_img${id}.jpg`,
  });

  const xbooruPost = (id = 1) => ({
    file_url: `https://xbooru.com/images/1/img${id}.jpg`,
    preview_url: `https://xbooru.com/thumbnails/1/thumbnail_img${id}.jpg`,
    sample_url: `https://xbooru.com/samples/1/sample_img${id}.jpg`,
  });

  /**
   * Sets up axios.get to return controlled responses per source URL.
   * Pass null for a source to make it reject instead.
   */
  const mockSources = ({
    safebooru = [safebooruPost(1)],
    xbooru = [xbooruPost(2)],
    google = null,
  } = {}) => {
    axios.get.mockImplementation((url) => {
      if (url.includes('safebooru.org')) {
        return safebooru
          ? Promise.resolve({ data: safebooru })
          : Promise.reject(new Error('Safebooru failed'));
      }
      if (url.includes('xbooru.com')) {
        return xbooru
          ? Promise.resolve({ data: xbooru })
          : Promise.reject(new Error('Xbooru failed'));
      }
      // Google Images (last source)
      return google
        ? Promise.resolve({ data: google })
        : Promise.reject(new Error('Google blocked'));
    });
  };

  beforeEach(() => {
    // Reset module registry so the in-memory cache is cleared between tests
    jest.resetModules();
    jest.clearAllMocks();
    axios = require('axios');
    ({ getNitocrisImages } = require('../src/lib/images'));
  });

  // ── Happy path ───────────────────────────────────────────────────────────────

  test('returns combined images from all working sources', async () => {
    mockSources();
    const images = await getNitocrisImages();

    expect(images.length).toBe(2); // 1 from Safebooru + 1 from Xbooru
    images.forEach((img) => {
      expect(img).toHaveProperty('thumb');
      expect(img).toHaveProperty('full');
      expect(typeof img.thumb).toBe('string');
      expect(typeof img.full).toBe('string');
    });
  });

  test('uses sample_url as thumb for Safebooru posts', async () => {
    mockSources({ xbooru: [] });
    const images = await getNitocrisImages();

    expect(images[0].thumb).toContain('safebooru.org/samples');
    expect(images[0].full).toContain('safebooru.org/images');
  });

  test('uses preview_url as thumb for Xbooru posts', async () => {
    mockSources({ safebooru: [] });
    const images = await getNitocrisImages();

    expect(images[0].thumb).toContain('xbooru.com/thumbnails');
    expect(images[0].full).toContain('xbooru.com/samples');
  });

  // ── Cache ────────────────────────────────────────────────────────────────────

  test('caches results and does not make new requests on subsequent calls', async () => {
    mockSources();
    await getNitocrisImages();
    const callsAfterFirst = axios.get.mock.calls.length;

    await getNitocrisImages();

    // No additional requests should have been made
    expect(axios.get.mock.calls.length).toBe(callsAfterFirst);
  });

  // ── Deduplication ────────────────────────────────────────────────────────────

  test('deduplicates images that share the same full URL across sources', async () => {
    const sharedUrl = 'https://safebooru.org/images/1/shared.jpg';
    mockSources({
      safebooru: [{ file_url: sharedUrl, sample_url: sharedUrl }],
      xbooru: [{ file_url: sharedUrl, preview_url: sharedUrl, sample_url: sharedUrl }],
    });

    const images = await getNitocrisImages();

    const fullUrls = images.map((img) => img.full);
    expect(fullUrls.filter((u) => u === sharedUrl).length).toBe(1);
  });

  // ── Resilience ───────────────────────────────────────────────────────────────

  test('returns images from remaining sources when one source fails', async () => {
    mockSources({ xbooru: null }); // Xbooru fails
    const images = await getNitocrisImages();

    expect(images.length).toBeGreaterThan(0);
    images.forEach((img) => expect(img.full).toContain('safebooru.org'));
  });

  test('throws a descriptive error when all sources fail', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));

    await expect(getNitocrisImages()).rejects.toThrow('All image sources failed');
  });

  // ── Filtering ────────────────────────────────────────────────────────────────

  test('filters out GIF files from Safebooru', async () => {
    mockSources({
      safebooru: [
        { file_url: 'https://safebooru.org/images/1/anim.gif', sample_url: null },
        { file_url: 'https://safebooru.org/images/1/still.jpg', sample_url: null },
      ],
      xbooru: [],
    });

    const images = await getNitocrisImages();

    expect(images.length).toBe(1);
    expect(images[0].full).not.toMatch(/\.gif$/i);
  });

  test('filters out Xbooru posts without a valid image extension', async () => {
    mockSources({
      safebooru: [],
      xbooru: [
        { file_url: 'https://xbooru.com/images/1/video.mp4', preview_url: null, sample_url: null },
        { file_url: 'https://xbooru.com/images/1/img.png', preview_url: null, sample_url: null },
      ],
    });

    const images = await getNitocrisImages();

    expect(images.length).toBe(1);
    expect(images[0].full).toContain('.png');
  });
});
