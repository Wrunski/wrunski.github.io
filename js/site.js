/* site.js: o idioma, o menu do celular e a entrada suave das seções.

   Fica no <head>, sem defer, depois do <title>: escolhe o idioma antes
   de a página aparecer, para quem lê em inglês não ver o português
   piscar. A escolha mora na chave "lang" do localStorage, a mesma do
   site antigo e da /testes/, e vale para o site todo. Sem escolha
   salva, o idioma segue o do navegador: português para pt, espanhol
   para es e inglês para o resto.

   Cada página traz o título nos três idiomas em <html data-title-pt>,
   data-title-en e data-title-es. Atributos que mudam com o idioma vão
   em data-alt-<idioma> (o alt de uma imagem) e data-label-<idioma> (o
   aria-label). */
(function () {
  'use strict';

  var root = document.documentElement;
  var LANGS = ['pt', 'en', 'es'];
  var HTML_LANG = { pt: 'pt-BR', en: 'en', es: 'es' };

  function each(selector, fn) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), fn);
  }

  function savedLang() {
    try {
      var value = localStorage.getItem('lang');
      return LANGS.indexOf(value) !== -1 ? value : null;
    } catch (e) {
      return null;
    }
  }

  function browserLang() {
    var nav = (navigator.language || '').toLowerCase();
    if (/^pt/.test(nav)) return 'pt';
    if (/^es/.test(nav)) return 'es';
    return 'en';
  }

  var lang = savedLang() || browserLang();

  function apply() {
    root.setAttribute('data-lang-on', lang);
    root.lang = HTML_LANG[lang];
    var title = root.getAttribute('data-title-' + lang);
    if (title) document.title = title;
    each('.lang button', function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-set') === lang));
    });
    each('[data-alt-' + lang + ']', function (el) {
      el.setAttribute('alt', el.getAttribute('data-alt-' + lang));
    });
    each('[data-label-' + lang + ']', function (el) {
      el.setAttribute('aria-label', el.getAttribute('data-label-' + lang));
    });
  }

  function setupLang() {
    each('.lang button', function (button) {
      button.addEventListener('click', function () {
        lang = button.getAttribute('data-set');
        try { localStorage.setItem('lang', lang); } catch (e) {}
        apply();
      });
    });
  }

  // No celular, os links da barra ficam num painel que o botão abre.
  function setupMenu() {
    var nav = document.querySelector('.nav');
    var button = document.querySelector('.nav-toggle');
    if (!nav || !button) return;

    function setOpen(open) {
      nav.classList.toggle('open', open);
      button.setAttribute('aria-expanded', String(open));
    }

    button.addEventListener('click', function () {
      setOpen(!nav.classList.contains('open'));
    });
    each('.nav-links a', function (link) {
      link.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('open')) {
        setOpen(false);
        button.focus();
      }
    });

    var wide = window.matchMedia('(min-width: 768px)');
    function closeWhenWide() { if (wide.matches) setOpen(false); }
    if (wide.addEventListener) wide.addEventListener('change', closeWhenWide);
    else if (wide.addListener) wide.addListener(closeWhenWide);
  }

  // Cada .reveal entra quando chega perto da tela. Com "menos movimento"
  // pedido no sistema, ou sem IntersectionObserver, tudo já aparece.
  function setupReveal() {
    var items = document.querySelectorAll('.reveal');
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add('in'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(items, function (el) { observer.observe(el); });
  }

  // A classe "js" liga o menu e a entrada suave no CSS. Se algo falhar,
  // ela sai, e a página fica inteira à vista, sem animação.
  root.classList.add('js');
  apply();

  function setup() {
    try {
      apply();
      setupLang();
      setupMenu();
      setupReveal();
    } catch (e) {
      root.classList.remove('js');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
