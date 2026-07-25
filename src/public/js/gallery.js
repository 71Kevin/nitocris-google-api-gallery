(function () {
  'use strict';

  // --- Image error handling via event delegation (avoids inline onerror) ---
  document.addEventListener(
    'error',
    function (e) {
      if (e.target.tagName === 'IMG') {
        var anchor = e.target.closest('.gallery a');
        if (anchor) anchor.style.display = 'none';
      }
    },
    true
  );

  // --- Custom Lightbox ---
  var gallery = document.getElementById('gallery');
  if (!gallery) return;

  var items = [];
  var current = 0;

  // Build overlay DOM
  var overlay = document.createElement('div');
  overlay.id = 'lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Image viewer');
  overlay.innerHTML =
    '<div id="lb-backdrop"></div>' +
    '<button id="lb-prev" aria-label="Previous image">&#8249;</button>' +
    '<div id="lb-content">' +
      '<img id="lb-img" alt="" />' +
      '<p id="lb-caption"></p>' +
    '</div>' +
    '<button id="lb-next" aria-label="Next image">&#8250;</button>' +
    '<button id="lb-close" aria-label="Close viewer">&#10005;</button>';
  document.body.appendChild(overlay);

  var lbImg = document.getElementById('lb-img');
  var lbCaption = document.getElementById('lb-caption');

  function show(index) {
    current = ((index % items.length) + items.length) % items.length;
    lbImg.src = '';
    lbImg.src = items[current].full;
    lbImg.alt = items[current].alt;
    lbCaption.textContent = items[current].caption;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    lbImg.src = '';
  }

  document.getElementById('lb-close').addEventListener('click', close);
  document.getElementById('lb-backdrop').addEventListener('click', close);
  document.getElementById('lb-prev').addEventListener('click', function () { show(current - 1); });
  document.getElementById('lb-next').addEventListener('click', function () { show(current + 1); });

  document.addEventListener('keydown', function (e) {
    if (!overlay.classList.contains('active')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });

  gallery.addEventListener('click', function (e) {
    var anchor = e.target.closest('a[data-lightbox]');
    if (!anchor) return;
    e.preventDefault();

    items = Array.from(gallery.querySelectorAll('a[data-lightbox]'))
      .filter(function (a) { return a.style.display !== 'none'; })
      .map(function (a) {
        var img = a.querySelector('img');
        return {
          full: a.href,
          alt: img ? img.alt : '',
          caption: a.dataset.title || '',
        };
      });

    var idx = items.findIndex(function (item) { return item.full === anchor.href; });
    show(idx >= 0 ? idx : 0);
  });
})();
