/* ============================================================
   Hamza's Scoopery — plain JavaScript (no frameworks)
   ============================================================ */
(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var header = $('#siteHeader');
  var toTop = $('#toTop');
  var nav = $('#mainNav');
  var navLinks = $$('.nav-link');

  /* nav links ke href se target sections (original jaisa) */
  var navSections = navLinks
    .map(function (link) {
      var href = link.getAttribute('href');
      return href && href.charAt(0) === '#' ? document.querySelector(href) : null;
    })
    .filter(Boolean);

  /* ---------- navbar shadow + active section on scroll ---------- */
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;

    if (header) header.classList.toggle('scrolled', y > 20);
    if (toTop) toTop.classList.toggle('show', y > 500);

    if (!navSections.length) return;

    var scrollPosition = y + (header ? header.offsetHeight : 127) + 24;
    var currentSection = navSections[0];

    navSections.forEach(function (section) {
      if (section.offsetTop <= scrollPosition) currentSection = section;
    });

    /* page bottom par hamesha last section active */
    if (window.innerHeight + y >= document.documentElement.scrollHeight - 2) {
      currentSection = navSections[navSections.length - 1];
    }

    navLinks.forEach(function (link) {
      link.classList.toggle(
        'active',
        currentSection && link.getAttribute('href') === '#' + currentSection.id
      );
    });
  }

  /* ---------- smooth scroll (original scroll-margin-top = nav-height + .75rem) ---------- */
  function navOffset() {
    var v = getComputedStyle(document.documentElement).getPropertyValue('--nav-h');
    var n = parseFloat(v);
    return isFinite(n) ? n : 112;
  }

  function goTo(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var top = el.getBoundingClientRect().top + window.scrollY - navOffset();
    try {
      window.scrollTo({ top: top, behavior: 'smooth' });
    } catch (err) {
      window.scrollTo(0, top);
    }
  }

  /* ---------- click handling (nav, buttons, placeholders) ---------- */
  document.addEventListener('click', function (e) {
    var navEl = e.target.closest ? e.target.closest('[data-nav]') : null;
    if (navEl) {
      e.preventDefault();
      goTo(navEl.getAttribute('data-nav'));
      if (nav) nav.classList.remove('open');
      return;
    }

    /* placeholder links (#) shouldn't jump to top */
    var link = e.target.closest ? e.target.closest('a[href="#"]') : null;
    if (link) e.preventDefault();
  });

  /* ---------- back to top (original: smooth scrollTo 0) ---------- */
  if (toTop) {
    toTop.addEventListener('click', function () {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (err) {
        window.scrollTo(0, 0);
      }
    });
  }

  /* ---------- mobile menu ---------- */
  var burger = $('#burgerBtn');
  if (burger && nav) {
    burger.addEventListener('click', function () { nav.classList.toggle('open'); });
  }

  /* ---------- flavors infinite carousel (original logic) ---------- */
  var flavorsTrack = $('.flavors-track');
  var flavorPrev = $('.flavor-nav-prev');
  var flavorNext = $('.flavor-nav-next');

  if (flavorsTrack && flavorPrev && flavorNext) {
    var originals = $$('.flavor-card:not(.flavor-card--clone)', flavorsTrack);
    var setWidth = 0;
    var isResetting = false;

    for (var i = originals.length - 1; i >= 0; i--) {
      var cloneStart = originals[i].cloneNode(true);
      cloneStart.classList.add('flavor-card--clone');
      cloneStart.setAttribute('aria-hidden', 'true');
      flavorsTrack.insertBefore(cloneStart, flavorsTrack.firstChild);
    }

    originals.forEach(function (card) {
      var clone = card.cloneNode(true);
      clone.classList.add('flavor-card--clone');
      clone.setAttribute('aria-hidden', 'true');
      flavorsTrack.appendChild(clone);
    });

    function measureSetWidth() {
      setWidth = flavorsTrack.scrollWidth / 3;
    }

    function getScrollStep() {
      var card = $('.flavor-card:not(.flavor-card--clone)', flavorsTrack);
      if (!card) return 180;
      var gap = parseFloat(window.getComputedStyle(flavorsTrack).gap) || 16;
      return card.offsetWidth + gap;
    }

    function resetLoopPosition() {
      if (isResetting || !setWidth) return;
      if (flavorsTrack.scrollLeft >= setWidth * 2 - 4) {
        isResetting = true;
        flavorsTrack.style.scrollBehavior = 'auto';
        flavorsTrack.scrollLeft -= setWidth;
        flavorsTrack.style.scrollBehavior = '';
        isResetting = false;
      } else if (flavorsTrack.scrollLeft <= 4) {
        isResetting = true;
        flavorsTrack.style.scrollBehavior = 'auto';
        flavorsTrack.scrollLeft += setWidth;
        flavorsTrack.style.scrollBehavior = '';
        isResetting = false;
      }
    }

    function initCarouselPosition() {
      measureSetWidth();
      flavorsTrack.style.scrollBehavior = 'auto';
      flavorsTrack.scrollLeft = setWidth;
      flavorsTrack.style.scrollBehavior = '';
    }

    flavorPrev.addEventListener('click', function () {
      flavorsTrack.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
    });

    flavorNext.addEventListener('click', function () {
      flavorsTrack.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
    });

    flavorsTrack.addEventListener('scroll', function () {
      if (isResetting) return;
      window.clearTimeout(flavorsTrack._loopTimer);
      flavorsTrack._loopTimer = window.setTimeout(resetLoopPosition, 80);
    }, { passive: true });

    if ('onscrollend' in window) {
      flavorsTrack.addEventListener('scrollend', resetLoopPosition);
    }

    function refreshCarouselPosition() {
      var prevWidth = setWidth;
      var ratio = prevWidth ? flavorsTrack.scrollLeft / prevWidth : 1;
      measureSetWidth();
      if (!setWidth) return;
      flavorsTrack.style.scrollBehavior = 'auto';
      flavorsTrack.scrollLeft = setWidth * (Number.isFinite(ratio) ? ratio : 1);
      flavorsTrack.style.scrollBehavior = '';
    }

    function scheduleCarouselRefresh() {
      window.clearTimeout(flavorsTrack._resizeTimer);
      flavorsTrack._resizeTimer = window.setTimeout(refreshCarouselPosition, 120);
    }

    initCarouselPosition();

    window.addEventListener('resize', scheduleCarouselRefresh);

    $$('img', flavorsTrack).forEach(function (img) {
      if (img.complete) return;
      img.addEventListener('load', scheduleCarouselRefresh, { once: true });
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(scheduleCarouselRefresh).catch(function () {});
    }
  }

  /* ---------- reviews slider (original logic) ---------- */
  var reviewsTrack = $('.reviews-track');
  var reviewPrev = $('.review-nav-prev');
  var reviewNext = $('.review-nav-next');

  if (reviewsTrack && reviewPrev && reviewNext) {
    function getReviewStep() {
      var card = $('.review-card', reviewsTrack);
      if (!card) return 320;
      var gap = parseFloat(window.getComputedStyle(reviewsTrack).gap) || 16;
      return card.offsetWidth + gap;
    }

    reviewPrev.addEventListener('click', function () {
      reviewsTrack.scrollBy({ left: -getReviewStep(), behavior: 'smooth' });
    });

    reviewNext.addEventListener('click', function () {
      reviewsTrack.scrollBy({ left: getReviewStep(), behavior: 'smooth' });
    });
  }

  /* ---------- newsletter form ---------- */
  var form = $('#newsForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = $('#newsEmail');
      var btn = $('#newsBtn');
      var note = $('#newsNote');
      if (!email || !email.value.trim()) return;
      btn.textContent = 'Subscribed!';
      note.hidden = false;
      email.value = '';
      setTimeout(function () {
        btn.textContent = 'Subscribe';
        note.hidden = true;
      }, 4000);
    });
  }

  /* ---------- events ---------- */
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('load', onScroll);
  onScroll();
  setTimeout(onScroll, 800);
})();
