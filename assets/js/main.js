/*!
 * Samurai HealthCare Private Limited: site interactions
 * Dependency-free and progressive: every feature degrades gracefully without JavaScript.
 */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var desktopNav = window.matchMedia('(min-width: 1024px)');

  root.classList.add('js-ready');

  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };

  function icon(name) {
    return '<svg class="icon" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ------------------------------------------------------------------
   * Footer year
   * ------------------------------------------------------------------ */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ------------------------------------------------------------------
   * Scroll-driven UI: sticky header state, progress bar, back-to-top
   * ------------------------------------------------------------------ */
  var header = $('[data-header]');
  var progressBar = $('.scroll-progress__bar');
  var toTop = $('[data-to-top]');
  var toTopProgress = $('[data-to-top-progress]');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var max = Math.max(1, root.scrollHeight - window.innerHeight);
    var ratio = Math.min(1, Math.max(0, y / max));

    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (progressBar) progressBar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
    if (toTop) toTop.classList.toggle('is-visible', y > window.innerHeight * 0.8);
    if (toTopProgress) toTopProgress.style.strokeDashoffset = String(100 - ratio * 100);
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
      var brand = $('.site-header .brand');
      if (brand) brand.focus({ preventScroll: true });
    });
  }

  /* ------------------------------------------------------------------
   * Mobile navigation (off-canvas panel with focus trap)
   * ------------------------------------------------------------------ */
  var nav = $('[data-nav]');
  var toggle = $('[data-nav-toggle]');
  var toggleLabel = $('[data-nav-toggle-label]');
  var backdrop = $('[data-nav-backdrop]');
  var backdropTimer = null;

  function isNavOpen() { return toggle && toggle.getAttribute('aria-expanded') === 'true'; }

  function openNav() {
    if (!nav || !toggle) return;
    toggle.setAttribute('aria-expanded', 'true');
    if (toggleLabel) toggleLabel.textContent = 'Close menu';
    nav.classList.add('is-open');
    doc.body.classList.add('is-locked');
    if (backdrop) {
      window.clearTimeout(backdropTimer);
      backdrop.hidden = false;
      window.requestAnimationFrame(function () { backdrop.classList.add('is-visible'); });
    }
    var first = $('.nav__link', nav);
    if (first) window.setTimeout(function () { first.focus({ preventScroll: true }); }, 60);
  }

  function closeNav(returnFocus) {
    if (!nav || !toggle || !isNavOpen()) return;
    toggle.setAttribute('aria-expanded', 'false');
    if (toggleLabel) toggleLabel.textContent = 'Open menu';
    nav.classList.remove('is-open');
    doc.body.classList.remove('is-locked');
    if (backdrop) {
      backdrop.classList.remove('is-visible');
      backdropTimer = window.setTimeout(function () { backdrop.hidden = true; }, 420);
    }
    if (returnFocus) toggle.focus();
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      if (isNavOpen()) closeNav(false); else openNav();
    });

    if (backdrop) backdrop.addEventListener('click', function () { closeNav(true); });

    $$('a', nav).forEach(function (link) {
      link.addEventListener('click', function () { closeNav(false); });
    });

    doc.addEventListener('keydown', function (e) {
      if (!isNavOpen()) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeNav(true);
        return;
      }
      if (e.key === 'Tab') {
        var focusables = [toggle].concat($$('a[href], button:not([disabled])', nav));
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (e.shiftKey && doc.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && doc.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    var onBreakpoint = function (mq) { if (mq.matches) closeNav(false); };
    if (desktopNav.addEventListener) desktopNav.addEventListener('change', onBreakpoint);
    else if (desktopNav.addListener) desktopNav.addListener(onBreakpoint);
  }

  /* ------------------------------------------------------------------
   * Scrollspy: highlight the nav link of the section in view
   * ------------------------------------------------------------------ */
  var navLinks = $$('.nav__link[data-nav-link]');
  if ('IntersectionObserver' in window && navLinks.length) {
    var linkFor = {};
    navLinks.forEach(function (link) {
      var id = (link.getAttribute('href') || '').slice(1);
      if (id) linkFor[id] = link;
    });

    var setActive = function (id) {
      navLinks.forEach(function (link) {
        var active = link === linkFor[id];
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    Object.keys(linkFor).forEach(function (id) {
      var section = doc.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  /* ------------------------------------------------------------------
   * Scroll reveal with automatic stagger among siblings
   * ------------------------------------------------------------------ */
  var revealEls = $$('[data-reveal]');

  function finishReveal(el) {
    el.removeAttribute('data-reveal');
    el.style.removeProperty('--reveal-delay');
  }

  if (!('IntersectionObserver' in window) || reduceMotion.matches) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); finishReveal(el); });
  } else {
    revealEls.forEach(function (el) {
      var parent = el.parentElement;
      if (!parent) return;
      var siblings = $$(':scope > [data-reveal]', parent);
      var index = siblings.indexOf(el);
      if (index > 0) el.style.setProperty('--reveal-delay', Math.min(index * 90, 450) + 'ms');
    });

    var revealer = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        observer.unobserve(el);
        el.classList.add('is-visible');
        var delay = parseInt(el.style.getPropertyValue('--reveal-delay'), 10) || 0;
        window.setTimeout(function () { finishReveal(el); }, 760 + delay);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    revealEls.forEach(function (el) { revealer.observe(el); });
  }

  /* ------------------------------------------------------------------
   * Animated counters
   * ------------------------------------------------------------------ */
  var counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduceMotion.matches) {
    var fmt = new Intl.NumberFormat('en-IN');
    var easeOutExpo = function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); };

    var runCounter = function (el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var duration = 1800;
      var start = null;
      var step = function (now) {
        if (start === null) start = now;
        var t = Math.min(1, (now - start) / duration);
        el.textContent = fmt.format(Math.round(target * easeOutExpo(t)));
        if (t < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    };

    var counterObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        runCounter(entry.target);
      });
    }, { threshold: 0.6 });

    counters.forEach(function (el) {
      var rect = el.getBoundingClientRect();
      var inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) el.textContent = '0';
      counterObserver.observe(el);
    });
  }

  /* ------------------------------------------------------------------
   * Contact form helpers shared with the product dialog
   * ------------------------------------------------------------------ */
  var form = $('[data-contact-form]');
  var interestSelect = $('#f-interest');

  function setInterest(value) {
    if (!interestSelect || !value) return;
    var match = $$('option', interestSelect).some(function (opt) { return opt.value === value; });
    if (match) interestSelect.value = value;
  }

  function goToContact() {
    var contact = doc.getElementById('contact');
    if (!contact) return;
    contact.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    if (window.history && window.history.replaceState) window.history.replaceState(null, '', '#contact');
    var firstField = $('#f-first');
    if (firstField) window.setTimeout(function () { firstField.focus({ preventScroll: true }); }, reduceMotion.matches ? 0 : 650);
  }

  $$('[data-enquire]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      setInterest(link.getAttribute('data-enquire'));
      goToContact();
    });
  });

  /* ------------------------------------------------------------------
   * Product details dialog
   * ------------------------------------------------------------------ */
  var dialog = $('[data-product-dialog]');
  var lastOpener = null;

  if (dialog) {
    var dMedia = $('[data-modal-media]', dialog);
    var dBrand = $('[data-modal-brand]', dialog);
    var dTitle = $('[data-modal-title]', dialog);
    var dDetails = $('[data-modal-details]', dialog);
    var dEnquire = $('[data-modal-enquire]', dialog);
    var dBrochure = $('[data-modal-brochure]', dialog);
    var supportsDialog = typeof dialog.showModal === 'function';

    var closeDialog = function () {
      if (!dialog.open || dialog.classList.contains('is-closing')) return;
      var finish = function () {
        dialog.classList.remove('is-closing');
        if (supportsDialog) dialog.close(); else dialog.removeAttribute('open');
        doc.body.classList.remove('is-locked');
        if (lastOpener) lastOpener.focus({ preventScroll: true });
      };
      if (reduceMotion.matches) { finish(); return; }
      dialog.classList.add('is-closing');
      window.setTimeout(finish, 240);
    };

    var openDialog = function (card, opener) {
      lastOpener = opener;
      var title = $('.product-card__title', card);
      var brand = $('.product-card__brand', card);
      var tpl = $('template[data-product-details]', card);
      var picture = $('.product-card__media picture', card);
      var iconMedia = $('.product-card__media--icon', card);

      dTitle.textContent = title ? title.textContent.trim() : '';
      dBrand.textContent = brand ? brand.textContent.trim() : '';
      dDetails.innerHTML = '';
      if (tpl && tpl.content) dDetails.appendChild(tpl.content.cloneNode(true));

      dMedia.innerHTML = '';
      if (picture) {
        var pic = picture.cloneNode(true);
        $$('source', pic).forEach(function (s) { s.setAttribute('sizes', '(min-width: 800px) 440px, 90vw'); });
        var img = $('img', pic);
        if (img) { img.removeAttribute('loading'); }
        dMedia.appendChild(pic);
      } else if (iconMedia) {
        dMedia.innerHTML = iconMedia.innerHTML;
      }

      var interest = card.getAttribute('data-interest') || '';
      dEnquire.setAttribute('data-interest', interest);

      var brochure = card.getAttribute('data-brochure');
      if (brochure) {
        dBrochure.href = brochure;
        dBrochure.hidden = false;
      } else {
        dBrochure.hidden = true;
        dBrochure.removeAttribute('href');
      }

      if (supportsDialog) dialog.showModal(); else dialog.setAttribute('open', '');
      doc.body.classList.add('is-locked');
      var closeBtn = $('[data-modal-close]', dialog);
      if (closeBtn) closeBtn.focus();
    };

    $$('[data-product-open]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('[data-product]');
        if (card) openDialog(card, btn);
      });
    });

    $$('[data-modal-close]', dialog).forEach(function (btn) {
      btn.addEventListener('click', closeDialog);
    });

    // Close when clicking the backdrop (the dialog element itself, outside the content).
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) closeDialog();
    });

    // Animate closing on Escape instead of closing instantly.
    dialog.addEventListener('cancel', function (e) {
      e.preventDefault();
      closeDialog();
    });

    dEnquire.addEventListener('click', function (e) {
      e.preventDefault();
      setInterest(dEnquire.getAttribute('data-interest'));
      lastOpener = null;
      closeDialog();
      window.setTimeout(goToContact, reduceMotion.matches ? 0 : 260);
    });
  }

  /* ------------------------------------------------------------------
   * Contact form: validation and delivery
   * ------------------------------------------------------------------ */
  if (form) {
    var statusBox = $('[data-form-status]', form);
    var submitBtn = $('.form__submit', form);
    var submitLabel = $('.form__submit-label', form);
    var fields = $$('input:not([type="hidden"]):not([name="website"]), textarea, select', form);

    var labelText = function (field) {
      var label = form.querySelector('label[for="' + field.id + '"]');
      return label ? label.childNodes[0].textContent.trim().toLowerCase() : 'this field';
    };

    var messageFor = function (field) {
      var v = field.validity;
      if (v.valid) return '';
      if (v.valueMissing) {
        if (field.type === 'email') return 'Please enter your email address.';
        if (field.tagName === 'TEXTAREA') return 'Please tell us how we can help.';
        return 'Please enter your ' + labelText(field) + '.';
      }
      if (v.typeMismatch && field.type === 'email') return 'Please enter a valid email address, for example name@hospital.com.';
      if (v.patternMismatch && field.type === 'tel') return 'Please enter a valid phone number (digits, spaces, +, - and brackets only).';
      if (v.tooShort) return 'Please write at least ' + field.getAttribute('minlength') + ' characters.';
      if (v.tooLong) return 'Please shorten this to ' + field.getAttribute('maxlength') + ' characters or fewer.';
      return 'Please check this field.';
    };

    var showError = function (field) {
      var box = form.querySelector('[data-error-for="' + field.id + '"]');
      var msg = messageFor(field);
      field.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (!box) return !msg;
      box.innerHTML = msg ? icon('circle-alert') + '<span>' + escapeHtml(msg) + '</span>' : '';
      return !msg;
    };

    fields.forEach(function (field) {
      // Trim surrounding whitespace so "   " doesn't pass as a valid entry.
      field.addEventListener('blur', function () {
        if (field.tagName !== 'SELECT' && field.value !== field.value.trim()) field.value = field.value.trim();
        if (field.value || field.getAttribute('aria-invalid') === 'true') showError(field);
      });
      field.addEventListener('input', function () {
        if (field.getAttribute('aria-invalid') === 'true') showError(field);
      });
    });

    var setStatus = function (type, html) {
      if (!statusBox) return;
      statusBox.className = 'form__status' + (type ? ' is-' + type : '');
      var iconName = type === 'success' ? 'circle-check-big' : type === 'error' ? 'circle-alert' : 'mail';
      statusBox.innerHTML = html ? icon(iconName) + '<div>' + html + '</div>' : '';
    };

    var setBusy = function (busy) {
      if (!submitBtn) return;
      submitBtn.setAttribute('aria-busy', busy ? 'true' : 'false');
      submitBtn.disabled = busy;
      if (submitLabel) submitLabel.textContent = busy ? 'Sending…' : 'Send Message';
    };

    var collect = function () {
      var data = {};
      fields.forEach(function (f) { data[f.name] = f.value.trim(); });
      return data;
    };

    var recipient = form.getAttribute('data-recipient') || 'contact@samuraihcs.com';
    var fallbackHtml = 'You can also email us at <a href="mailto:' + recipient + '">' + recipient + '</a> or call <a href="tel:+914423665878">+91 44 2366 5878</a>.';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setStatus('', '');

      fields.forEach(function (f) { if (f.tagName !== 'SELECT') f.value = f.value.trim(); });
      var firstInvalid = null;
      fields.forEach(function (f) {
        var ok = showError(f);
        if (!ok && !firstInvalid) firstInvalid = f;
      });
      if (firstInvalid) {
        firstInvalid.focus();
        setStatus('error', 'Please correct the highlighted fields and try again.');
        return;
      }

      // Spam trap: silently accept bot submissions without sending anything.
      var trap = form.querySelector('[name="website"]');
      if (trap && trap.value) {
        form.reset();
        setStatus('success', '<strong>Thank you!</strong> Your message has been received.');
        return;
      }

      var data = collect();
      var name = [data.first_name, data.last_name].filter(Boolean).join(' ');
      var endpoint = (form.getAttribute('data-endpoint') || '').trim();

      if (endpoint) {
        setBusy(true);
        var payload = new FormData();
        Object.keys(data).forEach(function (k) { payload.append(k, data[k]); });
        payload.append('_subject', 'Website enquiry: ' + data.interest + ' (' + name + ')');

        fetch(endpoint, { method: 'POST', body: payload, headers: { Accept: 'application/json' } })
          .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            form.reset();
            fields.forEach(function (f) { f.removeAttribute('aria-invalid'); });
            setStatus('success', '<strong>Thank you, ' + escapeHtml(data.first_name) + '!</strong> Your message has been sent. Our team will get back to you shortly.');
          })
          .catch(function () {
            setStatus('error', '<strong>Sorry, we couldn’t send your message.</strong> ' + fallbackHtml);
          })
          .then(function () { setBusy(false); });
        return;
      }

      // No endpoint configured: hand the message to the visitor's email app.
      var lines = [
        'Name: ' + name,
        'Email: ' + data.email,
        data.phone ? 'Phone: ' + data.phone : '',
        data.organisation ? 'Organisation: ' + data.organisation : '',
        'Interested in: ' + data.interest,
        '',
        data.message
      ].filter(function (line, i) { return line !== '' || i === 5; });

      var href = 'mailto:' + recipient +
        '?subject=' + encodeURIComponent('Website enquiry: ' + data.interest + ' (' + name + ')') +
        '&body=' + encodeURIComponent(lines.join('\n'));

      window.location.href = href;
      setStatus('info', '<strong>Almost done.</strong> Your email app should open with your message ready to send. If it doesn’t, ' + fallbackHtml.charAt(0).toLowerCase() + fallbackHtml.slice(1));
    });
  }

  /* ------------------------------------------------------------------
   * Map: load Google Maps only after the visitor asks for it
   * ------------------------------------------------------------------ */
  $$('[data-map]').forEach(function (map) {
    var btn = $('[data-map-load]', map);
    if (!btn) return;
    btn.addEventListener('click', function () {
      var iframe = doc.createElement('iframe');
      iframe.src = btn.getAttribute('data-map-src');
      iframe.title = 'Map showing the Samurai HealthCare Private Limited office in Ramapuram, Chennai';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.setAttribute('allowfullscreen', '');
      iframe.addEventListener('load', function () { map.classList.add('is-loaded'); });
      map.appendChild(iframe);
      btn.disabled = true;
      btn.textContent = 'Loading map…';
    });
  });
})();
