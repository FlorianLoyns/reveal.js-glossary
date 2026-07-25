/*!
 * reveal.js-glossary 1.1.0
 * Inline term definitions for reveal.js — hover or tap a term to show a short explanation.
 * Tooltips stay on-screen near slide edges; Esc closes them without hijacking reveal.
 * @author  Florian Loyns
 * @license MIT
 * Companion to touchcontrols. Docs & options: see README.
 */

'use strict';

  function injectCSS(o){
    if (document.getElementById('glossary-css')) return;
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
          t.setAttribute('aria-expanded', 'false');
          var tip = d.createElement('span');
          tip.className = 'term-tip';
          tip.innerHTML = t.getAttribute('data-def');
          t.insertBefore(tip, t.firstChild);
        });
      }
      build();
      if (deck.on) deck.on('slidechanged', build);

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

export default Plugin;
