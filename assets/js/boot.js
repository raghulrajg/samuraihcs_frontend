/*
 * Runs before first paint. It marks the document as JavaScript-enabled so that
 * scroll-reveal styles apply. If main.js never starts (blocked or failed to load),
 * the class is removed again so that no content stays hidden.
 */
(function (doc) {
  var root = doc.documentElement;
  root.classList.add('js');
  window.setTimeout(function () {
    if (!root.classList.contains('js-ready')) root.classList.remove('js');
  }, 4000);
})(document);
