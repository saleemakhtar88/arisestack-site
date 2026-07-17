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

  // --- contact form (FormSubmit AJAX → emails info@arisestack.com + auto-copy to sender) ---
  var form = document.getElementById('contactForm');
  if (form) {
    var statusEl = document.getElementById('cfStatus');
    var btn = form.querySelector('.cform-submit');
    var ENDPOINT = 'https://formsubmit.co/ajax/info@arisestack.com';

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (form._honey && form._honey.value) return; // bot trap
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var data = {
        name: name,
        email: email,
        phone: form.phone.value.trim(),
        company: form.company.value.trim(),
        subject: form.subject.value,
        message: form.message.value.trim(),
        _subject: 'AriseStack enquiry: ' + form.subject.value + ' — ' + name,
        _template: 'table',
        _replyto: email,
        _autoresponse: 'Hi ' + name + ',\n\nThank you for contacting AriseStack — we have received your message and a copy of it is included below for your records. Our team will get back to you shortly.\n\n"' + form.message.value.trim() + '"\n\n— AriseStack\nWe rise by making you rise.\ninfo@arisestack.com · arisestack.com'
      };

      btn.disabled = true;
      var original = btn.textContent;
      btn.textContent = 'Sending…';
      statusEl.className = 'cform-status';
      statusEl.textContent = '';

      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (res) {
          var ok = res && (res.success === true || res.success === 'true');
          var msg = (res && res.message) ? String(res.message).toLowerCase() : '';
          var pending = msg.indexOf('activat') > -1 || msg.indexOf('confirm') > -1;
          if (ok) {
            form.reset();
            statusEl.className = 'cform-status ok';
            statusEl.textContent = '✓ Thank you — your message has been sent. A copy is on its way to your email.';
          } else if (pending) {
            statusEl.className = 'cform-status ok';
            statusEl.textContent = '✓ Received! We\'re activating our contact system — please resend in a moment and it\'ll come straight through.';
          } else {
            throw new Error('send failed');
          }
        })
        .catch(function () {
          statusEl.className = 'cform-status err';
          statusEl.innerHTML = 'Sorry, something went wrong. Please email us directly at <a href="mailto:info@arisestack.com" style="color:var(--gold)">info@arisestack.com</a>.';
        })
        .then(function () { btn.disabled = false; btn.textContent = original; });
    });
  }

  // --- color theme picker ---
  var themeBtn = document.getElementById('themeBtn');
  var themeMenu = document.getElementById('themeMenu');
  if (themeBtn && themeMenu) {
    var applyTheme = function (t) {
      if (t) document.documentElement.setAttribute('data-theme', t);
      else document.documentElement.removeAttribute('data-theme');
      try { t ? localStorage.setItem('as_theme', t) : localStorage.removeItem('as_theme'); } catch (e) {}
      var cur = t || '';
      themeMenu.querySelectorAll('.theme-opt').forEach(function (o) {
        o.classList.toggle('active', o.getAttribute('data-theme') === cur);
      });
    };
    applyTheme((function(){ try { return localStorage.getItem('as_theme') || ''; } catch (e) { return ''; } })());
    themeBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      var open = themeMenu.classList.toggle('open');
      themeBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    themeMenu.querySelectorAll('.theme-opt').forEach(function (o) {
      o.addEventListener('click', function () {
        applyTheme(o.getAttribute('data-theme'));
        themeMenu.classList.remove('open');
        themeBtn.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('click', function () {
      themeMenu.classList.remove('open');
      themeBtn.setAttribute('aria-expanded', 'false');
    });
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
