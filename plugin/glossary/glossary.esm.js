/*!
 * reveal.js-glossary 1.0.0
 * Inline term definitions for reveal.js — hover or tap a term to show a short explanation.
 * @author  Florian Loyns
 * @license MIT
 * Companion to touchcontrols. Docs & options: see README.
 */


  'use strict';

  function injectCSS(o){
    if (document.getElementById('glossary-css')) return;
    var css =
      ".reveal .term{position:relative;cursor:help;color:inherit;text-decoration:underline solid " + o.line + ";text-decoration-thickness:1.5px;text-underline-offset:3px;text-decoration-skip-ink:auto}"
    + ".reveal .term-tip{visibility:hidden;opacity:0;position:absolute;bottom:calc(100% + 11px);left:50%;transform:translateX(-50%);"
      + "background:" + o.tipBg + ";color:" + o.tipColor + ";border:1px solid " + o.tipBorder + ";font-size:17px;font-weight:400;line-height:1.5;text-align:left;letter-spacing:normal;text-transform:none;"
      + "padding:12px 15px;border-radius:12px;width:max-content;max-width:360px;white-space:normal;"
      + "box-shadow:0 14px 32px -12px rgba(0,0,0,.3);z-index:100;pointer-events:none;transition:opacity .18s ease,visibility .18s ease}"
    + ".reveal .term-tip::before{content:'';position:absolute;top:100%;left:50%;transform:translateX(-50%);border-style:solid;border-width:9px 9px 0 9px;border-color:" + o.tipBorder + " transparent transparent transparent}"
    + ".reveal .term-tip::after{content:'';position:absolute;top:100%;left:50%;transform:translateX(-50%);border-style:solid;border-width:8px 8px 0 8px;border-color:" + o.tipBg + " transparent transparent transparent}"
    + ".reveal .term.tip-below .term-tip{bottom:auto;top:calc(100% + 11px)}"
    + ".reveal .term.tip-below .term-tip::before{top:auto;bottom:100%;border-width:0 9px 9px 9px;border-color:transparent transparent " + o.tipBorder + " transparent}"
    + ".reveal .term.tip-below .term-tip::after{top:auto;bottom:100%;border-width:0 8px 8px 8px;border-color:transparent transparent " + o.tipBg + " transparent}"
    + ".reveal .term:hover .term-tip,.reveal .term:focus .term-tip,.reveal .term.active .term-tip{visibility:visible;opacity:1;pointer-events:auto}"
    + "@media print{.reveal .term-tip{display:none}}";
    var s = document.createElement('style');
    s.id = 'glossary-css'; s.textContent = css;
    document.head.appendChild(s);
  }

  var Plugin = {
    id: 'glossary',
    init: function (deck) {
      var d = document;
      var c = deck.getConfig().glossary || {};
      var o = { line: c.line || 'currentColor', tipBg: c.tipBg || '#FFFFFF', tipColor: c.tipColor || '#0B1818', tipBorder: c.tipBorder || '#E7EBEF' };
      injectCSS(o);

      // aus data-def je Begriff ein Tooltip-Element bauen (HTML in der Definition erlaubt)
      function build(){
        d.querySelectorAll('.term[data-def]').forEach(function (t) {
          if (t.getAttribute('data-glossed')) return;
          t.setAttribute('data-glossed', '1');
          t.setAttribute('tabindex', '0');
          t.setAttribute('role', 'button');
          var tip = d.createElement('span');
          tip.className = 'term-tip';
          tip.innerHTML = t.getAttribute('data-def');
          t.insertBefore(tip, t.firstChild);
        });
      }
      build();
      if (deck.on) deck.on('slidechanged', build);

      // Tooltip nach oben oder (bei Begriffen im oberen Folienbereich) nach unten klappen
      function place(t){
        var r = t.getBoundingClientRect();
        t.classList.toggle('tip-below', r.top < window.innerHeight * 0.4);
      }
      d.addEventListener('pointerover', function (e) {
        var t = e.target && e.target.closest ? e.target.closest('.term') : null;
        if (t) place(t);
      }, true);
      d.addEventListener('focusin', function (e) {
        var t = e.target && e.target.closest ? e.target.closest('.term') : null;
        if (t) place(t);
      }, true);

      // Tap: Begriff öffnet/schließt sein Tooltip, andere schließen; daneben tippen schließt alle
      d.addEventListener('click', function (e) {
        var t = e.target && e.target.closest ? e.target.closest('.term') : null;
        d.querySelectorAll('.term.active').forEach(function (el) { if (el !== t) el.classList.remove('active'); });
        if (t) { place(t); t.classList.toggle('active'); e.stopPropagation(); e.preventDefault(); }
      });

      // Esc schließt alle
      d.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') d.querySelectorAll('.term.active').forEach(function (el) { el.classList.remove('active'); });
      });
    }
  };

  
export default Plugin;
