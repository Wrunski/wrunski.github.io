/* site.js — compartilhado por todas as páginas de wrunski.github.io.
   Carregar no <head>, sem defer, logo depois do <title>: a primeira parte
   escolhe o idioma antes de a página pintar, para não piscar em português
   e trocar depois.

   1. Idioma: a escolha salva (localStorage, chave "lang") ganha do idioma
      do navegador; sem escolha, espanhol vira "es", português vira "pt" e
      o resto vira "en". O resultado vai em <html data-lang>, e o CSS mostra
      só os blocos [data-lang] do idioma ativo. Os botões [data-set] trocam
      e salvam; <html data-title-xx> dá o título de cada idioma;
      data-alt-xx e data-label-xx trocam o alt das imagens e os aria-label.
   2. O menu do celular (.nav-toggle abre e fecha .nav-links).
   3. A entrada suave ao rolar (.reveal ganha .is-in ao entrar na tela),
      com IntersectionObserver e sem nada se mexer em "reduzir movimento".
   4. O laço da gravação (video.laco): em "reduzir movimento", só o pôster;
      o botão .laco-btn pausa e retoma. */
(function () {
  'use strict';

  var LANGS = ['pt', 'en', 'es'];
  var HTML_LANG = { pt: 'pt-BR', en: 'en', es: 'es' };
  var root = document.documentElement;

  root.classList.add('js');

  function each(selector, fn) {
    var list = document.querySelectorAll(selector);
    for (var i = 0; i < list.length; i++) fn(list[i]);
  }

  function savedLang() {
    try {
      var v = localStorage.getItem('lang');
      return LANGS.indexOf(v) >= 0 ? v : null;
    } catch (e) { return null; }
  }

  function browserLang() {
    var n = (navigator.language || '').toLowerCase();
    if (/^es/.test(n)) return 'es';
    if (/^pt/.test(n)) return 'pt';
    return 'en';
  }

  function applyLang(lang, store) {
    root.setAttribute('data-lang', lang);
    root.lang = HTML_LANG[lang];
    var title = root.getAttribute('data-title-' + lang);
    if (title) document.title = title;
    each('[data-alt-' + lang + ']', function (el) {
      el.setAttribute('alt', el.getAttribute('data-alt-' + lang));
    });
    each('[data-label-' + lang + ']', function (el) {
      el.setAttribute('aria-label', el.getAttribute('data-label-' + lang));
    });
    each('[data-set]', function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-set') === lang));
    });
    if (store) {
      try { localStorage.setItem('lang', lang); } catch (e) { /* sem armazenamento, segue sem salvar */ }
    }
  }

  // Antes de a página pintar: só o atributo, o lang e o título.
  var current = savedLang() || browserLang();
  applyLang(current, false);

  function initLang() {
    // O que está escrito em português no HTML vira o texto "pt" dos
    // atributos trocáveis, para a volta ao português funcionar.
    each('[data-alt-en], [data-alt-es]', function (el) {
      if (!el.hasAttribute('data-alt-pt')) el.setAttribute('data-alt-pt', el.getAttribute('alt') || '');
    });
    each('[data-label-en], [data-label-es]', function (el) {
      if (!el.hasAttribute('data-label-pt')) el.setAttribute('data-label-pt', el.getAttribute('aria-label') || '');
    });
    applyLang(current, false);
    each('[data-set]', function (b) {
      b.addEventListener('click', function () {
        var lang = b.getAttribute('data-set');
        if (LANGS.indexOf(lang) < 0) return;
        current = lang;
        applyLang(lang, true);
      });
    });
  }

  function initMenu() {
    var nav = document.querySelector('.nav');
    var btn = document.querySelector('.nav-toggle');
    if (!nav || !btn) return;
    function setOpen(open) {
      nav.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    }
    btn.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    each('.nav-links a', function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    var wide = window.matchMedia('(min-width: 834px)');
    if (wide.addEventListener) wide.addEventListener('change', function (e) { if (e.matches) setOpen(false); });
  }

  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      each('.reveal', function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    for (var i = 0; i < els.length; i++) io.observe(els[i]);
  }

  /* O laço da gravação: com prefers-reduced-motion, o vídeo não toca e
     volta ao pôster (load() desfaz o que o autoplay já tiver começado).
     Senão, o botão [aria-controls] pausa e retoma (WCAG 2.2.2). */
  function initLaco() {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    each('video.laco', function (video) {
      function parar() {
        video.removeAttribute('autoplay');
        video.preload = 'none';
        video.pause();
        video.load();
      }
      if (reduce.matches) parar();
      if (reduce.addEventListener) reduce.addEventListener('change', function (e) { if (e.matches) parar(); });
    });
    each('.laco-btn', function (btn) {
      var video = document.getElementById(btn.getAttribute('aria-controls'));
      if (!video) return;
      btn.addEventListener('click', function () {
        var pausar = btn.getAttribute('aria-pressed') !== 'true';
        btn.setAttribute('aria-pressed', pausar ? 'true' : 'false');
        if (pausar) video.pause();
        else video.play().catch(function () {});
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initLang();
    initMenu();
    initReveal();
    initLaco();
  });
})();
