// ============ AriseStack — interactions ============
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- sticky nav background ---
  var nav = document.getElementById('nav');
  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- mobile menu ---
  var burger = document.getElementById('navBurger');
  var links = document.getElementById('navLinks');
  burger.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    burger.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  links.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      links.classList.remove('open');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

  // --- reveal on scroll ---
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  // --- rising embers ---
  if (!reduce) {
    var box = document.getElementById('embers');
    var n = Math.min(22, Math.floor(window.innerWidth / 60));
    for (var i = 0; i < n; i++) {
      var e = document.createElement('div');
      e.className = 'ember';
      var size = 2 + Math.random() * 4;
      e.style.width = size + 'px';
      e.style.height = size + 'px';
      e.style.left = Math.random() * 100 + 'vw';
      e.style.setProperty('--drift', (Math.random() * 140 - 70) + 'px');
      e.style.setProperty('--o', (0.18 + Math.random() * 0.4).toFixed(2));
      e.style.animationDuration = (10 + Math.random() * 16) + 's';
      e.style.animationDelay = (-Math.random() * 24) + 's';
      box.appendChild(e);
    }
  }
})();
