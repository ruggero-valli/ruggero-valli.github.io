/* gallery.js
   Lightweight lightbox with a zoom-from-thumbnail open animation.

   Open:  the lightbox inner panel starts at the thumbnail's centre and
          scale, then transitions to the viewport centre at full size.
   Close: the panel scales down slightly while the backdrop fades out.

   Focus trapping and keyboard handling meet WCAG 2.1 §2.1.2.
*/

(function () {
  'use strict';

  var grid        = document.getElementById('gallery-grid');
  var lightbox    = document.getElementById('lightbox');
  var closeBtn    = document.getElementById('lightbox-close');
  var lightboxImg = document.getElementById('lightbox-img');
  var captionEl   = document.getElementById('lightbox-caption');
  var inner       = lightbox && lightbox.querySelector('.lightbox__inner');

  if (!grid || !lightbox || !inner) return;

  /* The HTML uses the `hidden` attribute for progressive-enhancement fallback.
     Remove it here so CSS (opacity + visibility) owns the closed state. */
  lightbox.removeAttribute('hidden');

  var lastFocused   = null;
  var clearSrcTimer = null;


  /* ── Open ───────────────────────────────────────────────── */
  grid.addEventListener('click', function (e) {
    var item = e.target.closest('.gallery-item');
    if (!item) return;

    lastFocused = item;
    clearTimeout(clearSrcTimer);

    var imgEl   = item.querySelector('img');
    var src     = item.dataset.src     || (imgEl ? imgEl.src  : '');
    var alt     = item.dataset.alt     || (imgEl ? imgEl.alt  : '');
    var caption = item.dataset.caption || '';

    lightboxImg.src       = src;
    lightboxImg.alt       = alt;
    captionEl.textContent = caption;

    /* -- Compute starting transform from the thumbnail's position -- */
    var rect  = item.getBoundingClientRect();
    var vpCX  = window.innerWidth  / 2;
    var vpCY  = window.innerHeight / 2;
    /* Translation from viewport centre to thumbnail centre */
    var dx    = (rect.left + rect.width  / 2) - vpCX;
    var dy    = (rect.top  + rect.height / 2) - vpCY;
    /* Scale: thumbnail size relative to likely lightbox panel size */
    var scale = Math.max(
      Math.min(rect.width  / (window.innerWidth  * 0.85),
               rect.height / (window.innerHeight * 0.80)),
      0.04
    );

    /* Apply starting pose with no transition so it is invisible to the user */
    inner.style.transition = 'none';
    inner.style.transform  =
      'translate(' + dx + 'px, ' + dy + 'px) scale(' + scale + ')';

    /* Force a reflow so the browser registers the starting state before
       we remove the inline transition and let the CSS one take over */
    void inner.getBoundingClientRect();

    inner.style.transition = '';   /* restore CSS transition */
    inner.style.transform  = '';   /* animate to transform:none (centre, full size) */

    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    closeBtn.focus();
  });


  /* ── Close ───────────────────────────────────────────────── */
  function closeLightbox() {
    /* Scale the inner panel down while the backdrop fades */
    inner.style.transition = 'transform 0.22s cubic-bezier(0.4, 0, 1, 1)';
    inner.style.transform  = 'scale(0.88)';

    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';

    /* Return focus immediately for WCAG */
    if (lastFocused) lastFocused.focus();

    /* After the CSS fade finishes, reset inner and clear the image src */
    clearSrcTimer = setTimeout(function () {
      lightboxImg.src        = '';
      inner.style.transition = '';
      inner.style.transform  = '';
    }, 300);
  }

  closeBtn.addEventListener('click', closeLightbox);

  /* Click on the dark backdrop (outside inner panel) */
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  /* Escape key */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
      closeLightbox();
    }
  });


  /* ── Focus trap (WCAG 2.1 §2.1.2) ──────────────────────── */
  lightbox.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !lightbox.classList.contains('is-open')) return;

    var focusable = Array.from(lightbox.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(function (el) { return !el.disabled; });

    if (!focusable.length) return;

    var first = focusable[0];
    var last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  });

})();
