/**
 * cookie-banner.js — GDPR cookie consent pro Korálky & Šperky
 * Přidej <script src="cookie-banner.js"></script> před </body> na každé stránce.
 * Admin panel (admin.html) je záměrně vynechán.
 */

(function () {
  'use strict';

  const CONSENT_KEY    = 'cookie_consent';
  const CONSENT_VER    = '1';          // Zvyš při podstatné změně cookies
  const CONSENT_EXPIRY = 365;          // dní

  /* ── Přečti uložený souhlas ── */
  function getConsent() {
    try {
      const raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }

  /* ── Ulož souhlas ── */
  function saveConsent(accepted) {
    const data = {
      ver:       CONSENT_VER,
      accepted,
      timestamp: Date.now(),
    };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(data)); } catch {}
  }

  /* ── Zkontroluj platnost ── */
  function isConsentValid() {
    const c = getConsent();
    if (!c) return false;
    if (c.ver !== CONSENT_VER) return false;             // nová verze = znovu zobrazit
    const age = (Date.now() - (c.timestamp || 0)) / 864e5; // dní
    return age < CONSENT_EXPIRY;
  }

  /* ── CSS banneru ── */
  const CSS = `
    #ck-banner {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 9999;
      padding: 1rem;
      display: flex;
      justify-content: center;
      animation: ckSlideUp .35s ease;
      pointer-events: none;
    }
    @keyframes ckSlideUp {
      from { transform: translateY(100%); opacity: 0; }
      to   { transform: none; opacity: 1; }
    }
    #ck-banner.ck-hide {
      animation: ckSlideDown .3s ease forwards;
    }
    @keyframes ckSlideDown {
      to { transform: translateY(110%); opacity: 0; }
    }
    #ck-box {
      background: #2c2418;
      color: #e8dcc8;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      max-width: 780px;
      width: 100%;
      box-shadow: 0 8px 32px rgba(0,0,0,.35);
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
      pointer-events: all;
    }
    #ck-text {
      flex: 1;
      min-width: 220px;
    }
    #ck-text strong {
      display: block;
      font-size: .88rem;
      font-weight: 600;
      color: #fff;
      margin-bottom: .3rem;
    }
    #ck-text p {
      font-size: .78rem;
      line-height: 1.6;
      color: rgba(232,220,200,.75);
      margin: 0;
    }
    #ck-text a {
      color: #d4a96a;
      text-decoration: underline;
    }
    #ck-actions {
      display: flex;
      gap: .625rem;
      flex-shrink: 0;
      flex-wrap: wrap;
    }
    .ck-btn {
      padding: .55rem 1.1rem;
      border-radius: 6px;
      font-size: .78rem;
      font-weight: 500;
      cursor: pointer;
      border: none;
      font-family: inherit;
      white-space: nowrap;
      transition: opacity .2s;
    }
    .ck-btn:hover { opacity: .85; }
    .ck-btn--accept {
      background: #b8945a;
      color: #fff;
    }
    .ck-btn--reject {
      background: transparent;
      color: rgba(232,220,200,.7);
      border: 1px solid rgba(232,220,200,.25);
    }
    .ck-btn--reject:hover { color: #fff; border-color: rgba(232,220,200,.5); opacity: 1; }

    @media (max-width: 540px) {
      #ck-box { padding: 1rem; gap: 1rem; }
      #ck-actions { width: 100%; }
      .ck-btn { flex: 1; text-align: center; }
    }
  `;

  /* ── HTML banneru ── */
  function buildBanner() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const banner = document.createElement('div');
    banner.id = 'ck-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Souhlas s cookies');
    banner.innerHTML = `
      <div id="ck-box">
        <div id="ck-text">
          <strong>🍪 Tento web používá cookies</strong>
          <p>
            Používáme pouze <strong>nezbytné cookies</strong> pro funkci košíku a objednávek —
            žádné sledovací ani reklamní. Více informací v
            <a href="cookies.html">zásadách cookies</a>.
          </p>
        </div>
        <div id="ck-actions">
          <button class="ck-btn ck-btn--reject" id="ck-reject">Jen nezbytné</button>
          <button class="ck-btn ck-btn--accept" id="ck-accept">Rozumím, souhlasím</button>
        </div>
      </div>`;
    document.body.appendChild(banner);

    /* Tlačítka */
    document.getElementById('ck-accept').addEventListener('click', function () {
      saveConsent(true);
      dismiss();
    });
    document.getElementById('ck-reject').addEventListener('click', function () {
      saveConsent(false);
      dismiss();
    });
  }

  /* ── Skryj banner ── */
  function dismiss() {
    const banner = document.getElementById('ck-banner');
    if (!banner) return;
    banner.classList.add('ck-hide');
    banner.addEventListener('animationend', function () {
      banner.remove();
    }, { once: true });
  }

  /* ── Inicializace ── */
  function init() {
    // Nezobrazovat na admin panelu
    if (window.location.pathname.includes('admin.html')) return;
    // Nezobrazovat pokud je platný souhlas
    if (isConsentValid()) return;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', buildBanner);
    } else {
      buildBanner();
    }
  }

  init();

  /* ── Globální API pro cookies.html ── */
  window.CookieConsent = {
    get: getConsent,
    reset: function () {
      localStorage.removeItem(CONSENT_KEY);
    },
    accepted: function () {
      const c = getConsent();
      return c ? c.accepted : null;
    }
  };

})();
