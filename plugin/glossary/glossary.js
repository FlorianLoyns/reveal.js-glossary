/*!
 * reveal.js-glossary 1.2.0
 * Inline term definitions for reveal.js — hover or tap a term to show a short explanation.
 * Printing appends alphabetical glossary pages, so terms stay explained on paper.
 * @author  Florian Loyns
 * @license MIT
 * Companion to touchcontrols. Docs & options: see README.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.RevealGlossary = factory());
}(this, (function () {
  'use strict';

  function esc(s){
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c];
    });
  }

  function injectCSS(o){
    if (document.getElementById('glossary-css')) return;
    var gap = Math.round(o.printFontSize * 0.75);
    var css =
      ".reveal .term{position:relative;cursor:help;color:inherit;text-decoration:underline solid " + o.line + ";text-decoration-thickness:1.5px;text-underline-offset:3px;text-decoration-skip-ink:auto}"
    + ".reveal .term-tip{visibility:hidden;opacity:0;position:absolute;bottom:calc(100% + 11px);left:50%;transform:translateX(calc(-50% + var(--tip-dx,0px)));"
      + "background:" + o.tipBg + ";color:" + o.tipColor + ";border:1px solid " + o.tipBorder + ";font-size:17px;font-weight:400;line-height:1.5;text-align:left;letter-spacing:normal;text-transform:none;"
      + "padding:12px 15px;border-radius:12px;width:max-content;max-width:360px;white-space:normal;"
      + "box-shadow:0 14px 32px -12px rgba(0,0,0,.3);z-index:100;pointer-events:none;transition:opacity .18s ease,visibility .18s ease}"
    /* Pfeil kompensiert die seitliche Verschiebung (--tip-dx) und bleibt über dem Begriff */
    + ".reveal .term-tip::before{content:'';position:absolute;top:100%;left:calc(50% - var(--tip-dx,0px));transform:translateX(-50%);border-style:solid;border-width:9px 9px 0 9px;border-color:" + o.tipBorder + " transparent transparent transparent}"
    + ".reveal .term-tip::after{content:'';position:absolute;top:100%;left:calc(50% - var(--tip-dx,0px));transform:translateX(-50%);border-style:solid;border-width:8px 8px 0 8px;border-color:" + o.tipBg + " transparent transparent transparent}"
    + ".reveal .term.tip-below .term-tip{bottom:auto;top:calc(100% + 11px)}"
    + ".reveal .term.tip-below .term-tip::before{top:auto;bottom:100%;border-width:0 9px 9px 9px;border-color:transparent transparent " + o.tipBorder + " transparent}"
    + ".reveal .term.tip-below .term-tip::after{top:auto;bottom:100%;border-width:0 8px 8px 8px;border-color:transparent transparent " + o.tipBg + " transparent}"
    + ".reveal .term:hover .term-tip,.reveal .term:focus .term-tip,.reveal .term.active .term-tip{visibility:visible;opacity:1;pointer-events:auto}"
    + "@media print{.reveal .term-tip{display:none}}"
    /* Glossarseiten im Ausdruck. Kein .reveal davor: die Blöcke werden zum Messen
       kurz ausserhalb der Folie eingehängt und müssen dort gleich aussehen. */
    + ".glossary-print{text-align:left}"
    + ".glossary-print .gp-inner{padding:" + o.printPadding + "px;box-sizing:border-box;height:100%}"
    + ".glossary-print .gp-title{font-size:" + Math.round(o.printFontSize * 1.8) + "px;font-weight:800;line-height:1.2;margin:0 0 " + (gap * 2) + "px;text-transform:none;letter-spacing:.01em}"
    + ".glossary-print .gp-cols{display:flex;align-items:flex-start;gap:" + o.printGap + "px}"
    + ".glossary-print .gp-col{flex:1 1 0;min-width:0}"
    + ".glossary-print .gp-item{font-size:" + o.printFontSize + "px;line-height:1.45;margin:0 0 " + gap + "px;text-align:left}"
    + ".glossary-print .gp-item:last-child{margin-bottom:0}"
    + ".glossary-print .gp-t{font-weight:700}"
    + ".glossary-print .gp-d{font-weight:400;opacity:.9}";
    var s = document.createElement('style');
    s.id = 'glossary-css'; s.textContent = css;
    document.head.appendChild(s);
  }

  /* ---------------- Glossarseiten für den Ausdruck ----------------
     Im Druck gibt es kein Daraufzeigen: Das Tooltip fällt weg und der
     Begriff bliebe unerklärt unterstrichen stehen. Deshalb hängt das
     Plugin in ?print-pdf hinten so viele Seiten an, wie die Begriffe
     brauchen – alphabetisch, zweispaltig, jeder Eintrag mit seiner
     Erklärung. Die Höhen werden vorher wirklich gemessen, damit kein
     Eintrag über den Seitenrand rutscht.                            */

  function wortVon(t){
    var k = t.cloneNode(true), tip = k.querySelector('.term-tip');
    if (tip) k.removeChild(tip);
    return (k.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function sammeln(wurzel){
    var gesehen = Object.create(null), liste = [];
    Array.prototype.forEach.call(wurzel.querySelectorAll('.term[data-def]'), function (t) {
      var w = wortVon(t), def = (t.getAttribute('data-def') || '').trim();
      if (!w || !def) return;
      var k = w.toLowerCase();
      if (gesehen[k]) return;
      gesehen[k] = 1;
      liste.push({ wort: w, def: def });
    });
    return liste;
  }

  function eintragHTML(e){
    return '<p class="gp-item"><span class="gp-t">' + esc(e.wort) + '</span> <span class="gp-d">– ' + e.def + '</span></p>';
  }

  function druckseiten(deck, o){
    if (!o.printList || !/print-pdf/gi.test(window.location.search)) return 0;
    var wurzel = document.querySelector('.reveal'), slides = wurzel && wurzel.querySelector('.slides');
    if (!slides) return 0;

    var eintraege = sammeln(slides);
    if (!eintraege.length) return 0;
    var sprache = document.documentElement.getAttribute('lang') || undefined;
    eintraege.sort(function (a, b) { return a.wort.localeCompare(b.wort, sprache); });

    var cfg = deck.getConfig() || {};
    var W = typeof cfg.width === 'number' ? cfg.width : 960;
    var H = typeof cfg.height === 'number' ? cfg.height : 700;
    var spalte = Math.floor((W - 2 * o.printPadding - o.printGap) / 2);

    var mess = document.createElement('div');
    mess.className = 'glossary-print';
    mess.style.cssText = 'position:absolute;left:-99999px;top:0;visibility:hidden;width:' + spalte + 'px';
    wurzel.appendChild(mess);
    var lueckeUnten = Math.round(o.printFontSize * 0.75);
    eintraege.forEach(function (e) {
      mess.innerHTML = eintragHTML(e);
      e.h = mess.firstChild.offsetHeight + lueckeUnten;
    });
    mess.innerHTML = '<h2 class="gp-title">' + esc(o.printTitle) + '</h2>';
    var kopf = mess.firstChild.offsetHeight + Math.round(o.printFontSize * 1.5);
    wurzel.removeChild(mess);

    var platz = H - 2 * o.printPadding - kopf;

    // Spalten der Reihe nach fuellen, solange die Grenze haelt
    function packen(grenze){
      var sp = [[]], h = 0;
      for (var j = 0; j < eintraege.length; j++) {
        var e = eintraege[j];
        if (h + e.h > grenze && sp[sp.length - 1].length) { sp.push([]); h = 0; }
        sp[sp.length - 1].push(e);
        h += e.h;
      }
      return sp;
    }

    // So viele Seiten wie noetig - dann die Grenze so weit senken, wie es ohne
    // zusaetzliche Spalte geht. Das verteilt den Text gleichmaessig, statt die
    // ersten Spalten vollzupacken und die letzte fast leer zu lassen.
    var noetig = Math.ceil(packen(platz).length / 2) * 2;
    var summe = 0, groesster = 0;
    eintraege.forEach(function (e) { summe += e.h; groesster = Math.max(groesster, e.h); });
    var lo = Math.max(groesster, Math.ceil(summe / noetig)), hi = platz;
    while (lo < hi) {
      var mitte = Math.floor((lo + hi) / 2);
      if (packen(mitte).length <= noetig) hi = mitte; else lo = mitte + 1;
    }
    var spalten = packen(lo);

    var seiten = [];
    for (var i = 0; i < spalten.length; i += 2) seiten.push(spalten.slice(i, i + 2));

    seiten.forEach(function (sp, n) {
      var sec = document.createElement('section');
      sec.className = 'glossary-print gp-page' + (o.printClass ? ' ' + o.printClass : '');
      sec.setAttribute('data-glossary-print', String(n + 1));
      sec.style.height = H + 'px';   // volle Seitenhoehe: sonst zentriert reveal den Block bei center:true
      sec.innerHTML = '<div class="gp-inner">'
        + '<h2 class="gp-title">' + esc(o.printTitle + (n ? o.printContinued : '')) + '</h2>'
        + '<div class="gp-cols">' + sp.map(function (c) {
            return '<div class="gp-col">' + c.map(eintragHTML).join('') + '</div>';
          }).join('') + '</div></div>';
      slides.appendChild(sec);
    });
    return seiten.length;
  }

  var Plugin = {
    id: 'glossary',
    init: function (deck) {
      var d = document;
      var c = deck.getConfig().glossary || {};
      var o = {
        line: c.line || 'currentColor',
        tipBg: c.tipBg || '#FFFFFF',
        tipColor: c.tipColor || '#0B1818',
        tipBorder: c.tipBorder || '#E7EBEF',
        printList: c.printList !== false,
        printTitle: c.printTitle || 'Glossary',
        printContinued: c.printContinued != null ? c.printContinued : ' (continued)',
        printFontSize: c.printFontSize || 19,
        printPadding: c.printPadding || 60,
        printGap: c.printGap || 46,
        printClass: c.printClass || ''
      };
      injectCSS(o);

      // aus data-def je Begriff ein Tooltip-Element bauen (HTML in der Definition erlaubt)
      function build(){
        d.querySelectorAll('.term[data-def]').forEach(function (t) {
          if (t.getAttribute('data-glossed')) return;
          t.setAttribute('data-glossed', '1');
          t.setAttribute('tabindex', '0');
          t.setAttribute('role', 'button');
          t.setAttribute('aria-expanded', 'false');
          var tip = d.createElement('span');
          tip.className = 'term-tip';
          tip.innerHTML = t.getAttribute('data-def');
          t.insertBefore(tip, t.firstChild);
        });
      }
      build();
      if (deck.on) deck.on('slidechanged', build);

      // Glossarseiten für den Ausdruck anhängen (nur in ?print-pdf)
      druckseiten(deck, o);

      // Tooltip nach oben oder (bei Begriffen im oberen Folienbereich) nach unten klappen;
      // seitlich so verschieben, dass er im Bild bleibt (der Pfeil bleibt über dem Begriff)
      function place(t){
        var r = t.getBoundingClientRect();
        t.classList.toggle('tip-below', r.top < window.innerHeight * 0.4);
        var tip = t.querySelector('.term-tip');
        if (!tip) return;
        tip.style.setProperty('--tip-dx', '0px');
        var tr = tip.getBoundingClientRect();          // visibility:hidden hat trotzdem Layout
        var pad = 12, dx = 0;
        if (tr.left < pad) dx = pad - tr.left;
        else if (tr.right > window.innerWidth - pad) dx = (window.innerWidth - pad) - tr.right;
        if (dx){
          var scale = (deck.getScale && deck.getScale()) || 1;   // reveal skaliert die Folie
          var maxDx = Math.max(0, tr.width / 2 - 24 * scale);    // Pfeil bleibt im Tooltip
          dx = Math.max(-maxDx, Math.min(maxDx, dx));
          tip.style.setProperty('--tip-dx', (dx / scale) + 'px');
        }
      }
      d.addEventListener('pointerover', function (e) {
        var t = e.target && e.target.closest ? e.target.closest('.term') : null;
        if (t) place(t);
      }, true);
      d.addEventListener('focusin', function (e) {
        var t = e.target && e.target.closest ? e.target.closest('.term') : null;
        if (t) place(t);
      }, true);

      function closeAll(except){
        d.querySelectorAll('.term.active').forEach(function (el) {
          if (el !== except){ el.classList.remove('active'); el.setAttribute('aria-expanded', 'false'); }
        });
      }

      // Tap: Begriff öffnet/schließt sein Tooltip, andere schließen; daneben tippen schließt alle.
      // Capture-Phase, damit auch Taps auf Elemente wirken, die die Propagation stoppen (z. B. Quiz-Buttons).
      d.addEventListener('click', function (e) {
        var t = e.target && e.target.closest ? e.target.closest('.term') : null;
        closeAll(t);
        if (t) {
          place(t);
          var on = t.classList.toggle('active');
          t.setAttribute('aria-expanded', on ? 'true' : 'false');
          e.stopPropagation(); e.preventDefault();
        }
      }, true);

      // Esc schließt offene Tooltips – aber nur dann; sonst bleibt Esc bei reveal (Übersicht)
      d.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        if (!d.querySelector('.term.active')) return;
        closeAll(null);
        e.stopPropagation();
      }, true);
    }
  };

  return Plugin;
})));
