(function(){
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- WhatsApp links ---------- */
  var WA_NUMBER = '5521977947070';
  var WA_MESSAGES = {
    lima: 'Olá! Gostaria de pedir uma Torta de Limão da Cítrica & Doce. 🍋',
    maracuja: 'Olá! Gostaria de pedir uma Torta de Maracujá da Cítrica & Doce. 💛',
    geral: 'Olá! Vim pelo site da Cítrica & Doce e gostaria de conhecer as opções disponíveis para encomenda.'
  };

  document.querySelectorAll('[data-wa-msg]').forEach(function(link){
    var key = link.getAttribute('data-wa-msg');
    var msg = WA_MESSAGES[key] || WA_MESSAGES.geral;
    link.setAttribute('href', 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg));
  });

  /* ---------- Header scroll state ---------- */
  var header = document.getElementById('site-header');
  function onHeaderScroll(){
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onHeaderScroll, { passive: true });
  onHeaderScroll();

  /* ---------- Mobile nav ---------- */
  var toggle = document.getElementById('nav-toggle');
  var mobileNav = document.getElementById('mobile-nav');
  function closeMobileNav(){
    if (!toggle || !mobileNav) return;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir menu');
    mobileNav.classList.remove('is-open');
    document.body.style.overflow = '';
  }
  if (toggle && mobileNav) {
    toggle.addEventListener('click', function(){
      var open = toggle.getAttribute('aria-expanded') === 'true';
      if (open) {
        closeMobileNav();
      } else {
        toggle.setAttribute('aria-expanded', 'true');
        toggle.setAttribute('aria-label', 'Fechar menu');
        mobileNav.classList.add('is-open');
        document.body.style.overflow = 'hidden';
      }
    });
    mobileNav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', closeMobileNav);
    });
  }

  /* ---------- Scroll cue ---------- */
  var cue = document.getElementById('scroll-cue');
  if (cue) {
    cue.addEventListener('click', function(){
      var next = document.querySelector('.marquee');
      if (next) next.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Generic reveal-on-scroll (testimonials, cta options, product copy) ---------- */
  function observeReveal(selector, className, opts){
    var els = document.querySelectorAll(selector);
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach(function(el){ el.classList.add(className); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) {
          entry.target.classList.add(className);
          io.unobserve(entry.target);
        }
      });
    }, opts || { threshold: 0.3 });
    els.forEach(function(el){ io.observe(el); });
  }

  observeReveal('[data-testimonial]', 'is-visible', { threshold: 0.3 });
  observeReveal('[data-reveal]', 'is-visible', { threshold: 0.4 });
  observeReveal('.product', 'is-visible', { threshold: 0.25 });

  /* ---------- Lemon decorative slide-in ---------- */
  var limaoDecor = document.getElementById('limao-decor');
  if (limaoDecor && 'IntersectionObserver' in window) {
    var limaoSection = document.querySelector('.product-limao');
    if (limaoSection) {
      var lio = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (entry.isIntersecting) {
            limaoDecor.classList.add('is-in');
            lio.unobserve(entry.target);
          }
        });
      }, { threshold: 0.2 });
      lio.observe(limaoSection);
    }
  } else if (limaoDecor) {
    limaoDecor.classList.add('is-in');
  }

  /* ---------- Maracujá scroll-linked opening animation ---------- */
  var marSection = document.getElementById('maracuja-anim-section');
  var marAnim = document.getElementById('mar-anim');
  if (marSection && marAnim && !reduceMotion) {
    var ticking = false;
    function clamp01(n){ return Math.max(0, Math.min(1, n)); }
    function updateMarAnim(){
      var rect = marSection.getBoundingClientRect();
      var vh = window.innerHeight;
      // progress: 0 when section top just enters viewport bottom, 1 when section has scrolled through
      var raw = (vh - rect.top) / (vh + rect.height);
      var p = clamp01(raw);
      var p2 = clamp01((p - 0.35) / 0.65);
      marAnim.style.setProperty('--p', p.toFixed(3));
      marAnim.style.setProperty('--p2', p2.toFixed(3));
      ticking = false;
    }
    window.addEventListener('scroll', function(){
      if (!ticking) {
        window.requestAnimationFrame(updateMarAnim);
        ticking = true;
      }
    }, { passive: true });
    updateMarAnim();
  }

})();
