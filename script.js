/* ============================================================
   KORÁLKY & ŠPERKY — Shared JavaScript
   ============================================================ */

'use strict';

/* ── Konfigurace (výchozí, přepisuje se z settings.json) ── */
const CONFIG = {
  CART_KEY:                'koralky_cart',
  CURRENCY:                'Kč',
  FREE_SHIPPING_THRESHOLD: 1200,
  SHIPPING: [
    { id: 'zasilkovna', name: 'Zásilkovna',           price: 79  },
    { id: 'dpd',        name: 'DPD kurýr',            price: 109 },
    { id: 'osobni',     name: 'Osobní odběr – Praha', price: 0   },
  ],
  shop: {
    name:      'Korálky & Šperky',
    ico:       '000 00 000',
    vatPayer:  false,
    email:     'info@koralkyasperky.cz',
    phone:     '+420 123 456 789',
    address:   '',
    formspree: 'mnjwzlpl',
    bankAccount: '',
    instagram: '',
    facebook:  '',
  },
  hero: {
    title:    'Šperky s duší',
    subtitle: 'i příběhem',
    desc:     'Každý náramek, náhrdelník a náušnice vznikají ručně z přírodních kamenů — s láskou a pozorností k detailu.',
  },
};
window.CONFIG = CONFIG;

/* ── Načtení settings.json ─────────────────────────────── */
async function loadSettings() {
  try {
    const res = await fetch('settings.json?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return;
    const s = await res.json();
    if (s.shop)     Object.assign(CONFIG.shop, s.shop);
    if (s.hero)     Object.assign(CONFIG.hero, s.hero);
    if (s.shipping) CONFIG.SHIPPING = s.shipping;
    if (s.shop?.freeShippingThreshold) CONFIG.FREE_SHIPPING_THRESHOLD = s.shop.freeShippingThreshold;
    applySettingsToPage();
  } catch {}
}

/* Aplikuje nastavení na aktuální stránku */
function applySettingsToPage() {
  /* IČO v patičce */
  document.querySelectorAll('[data-setting="ico"]').forEach(el => {
    el.textContent = CONFIG.shop.ico || '';
  });
  /* Plátce DPH */
  document.querySelectorAll('[data-setting="vat"]').forEach(el => {
    el.textContent = CONFIG.shop.vatPayer ? 'Jsme plátci DPH.' : 'Nejsme plátci DPH.';
  });
  /* Email */
  document.querySelectorAll('[data-setting="email"]').forEach(el => {
    el.textContent = CONFIG.shop.email || '';
    if (el.tagName === 'A') el.href = 'mailto:' + CONFIG.shop.email;
  });
  /* Telefon */
  document.querySelectorAll('[data-setting="phone"]').forEach(el => {
    el.textContent = CONFIG.shop.phone || '';
    if (el.tagName === 'A') el.href = 'tel:' + CONFIG.shop.phone.replace(/\s/g, '');
  });
  /* Hero nadpis */
  const h1 = document.querySelector('[data-setting="hero-title"]');
  if (h1 && CONFIG.hero.title) h1.innerHTML = CONFIG.hero.title + (CONFIG.hero.subtitle ? `<br><em>${CONFIG.hero.subtitle}</em>` : '');
  const heroDesc = document.querySelector('[data-setting="hero-desc"]');
  if (heroDesc && CONFIG.hero.desc) heroDesc.textContent = CONFIG.hero.desc;
}

/* ── Produkty ────────────────────────────────────────────── */
async function loadProducts() {
  try {
    const res = await fetch('products.json?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('Nelze načíst produkty');
    return await res.json();
  } catch (err) {
    console.error('loadProducts:', err);
    return [];
  }
}

async function getProduct(id) {
  const products = await loadProducts();
  return products.find(p => p.id === Number(id)) || null;
}

/* ── Košík ───────────────────────────────────────────────── */
const Cart = {
  get() {
    try { return JSON.parse(localStorage.getItem(CONFIG.CART_KEY)) || []; }
    catch { return []; }
  },
  save(items) {
    localStorage.setItem(CONFIG.CART_KEY, JSON.stringify(items));
    Cart.updateBadge();
  },
  add(product, qty = 1) {
    const items = Cart.get();
    const existing = items.find(i => i.id === product.id);
    if (existing) { existing.qty += qty; }
    else {
      items.push({ id: product.id, name: product.name, price: product.price,
                   image: product.images?.[0] || product.image || '', qty });
    }
    Cart.save(items);
    showToast(`„${product.name}" přidán do košíku`, 'success');
  },
  remove(id) { Cart.save(Cart.get().filter(i => i.id !== id)); },
  setQty(id, qty) {
    if (qty <= 0) { Cart.remove(id); return; }
    const items = Cart.get();
    const item = items.find(i => i.id === id);
    if (item) { item.qty = qty; Cart.save(items); }
  },
  clear() { localStorage.removeItem(CONFIG.CART_KEY); Cart.updateBadge(); },
  count() { return Cart.get().reduce((s, i) => s + i.qty, 0); },
  subtotal() { return Cart.get().reduce((s, i) => s + i.price * i.qty, 0); },
  updateBadge() {
    const count = Cart.count();
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
      el.classList.toggle('visible', count > 0);
    });
  },
};
window.Cart = Cart;

/* ── Formátování ─────────────────────────────────────────── */
function formatPrice(amount) {
  return `${amount.toLocaleString('cs-CZ')} ${CONFIG.CURRENCY}`;
}
window.formatPrice = formatPrice;

function formatDate(date = new Date()) {
  return date.toLocaleDateString('cs-CZ', { day: '2-digit', month: 'long', year: 'numeric' });
}
window.formatDate = formatDate;

/* ── Toast notifikace ────────────────────────────────────── */
function showToast(message, type = 'success', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✓' : '✕'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}
window.showToast = showToast;

/* ── URL parametry ───────────────────────────────────────── */
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}
window.getParam = getParam;

/* ── Product cards ───────────────────────────────────────── */
function initProductCards() {
  document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.addToCart);
      const product = await getProduct(id);
      if (product) Cart.add(product);
    });
  });
}

/* ── Vyhledávání produktů ────────────────────────────────── */
function initSearch(allProducts, onResult) {
  const input = document.getElementById('search-input');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { onResult(allProducts); return; }
    const filtered = allProducts.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.material?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
    onResult(filtered);
  });
  /* Klávesa Escape vymaže hledání */
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { input.value = ''; onResult(allProducts); }
  });
}
window.initSearch = initSearch;

/* ── Cookie lišta (GDPR) ─────────────────────────────────── */
function initCookieBar() {
  const COOKIE_KEY = 'koralky_cookies_accepted';
  if (localStorage.getItem(COOKIE_KEY)) return; /* Již přijato */

  const bar = document.createElement('div');
  bar.id = 'cookie-bar';
  bar.innerHTML = `
    <div class="cookie-inner">
      <p>🍪 Tento web používá pouze nezbytné cookies pro funkci košíku. Žádné sledovací skripty.</p>
      <div class="cookie-btns">
        <a href="privacy.html" class="cookie-link">Více info</a>
        <button class="cookie-btn" id="cookie-accept">Rozumím</button>
      </div>
    </div>`;

  /* Styly inline aby nebyly závislé na style.css */
  bar.style.cssText = `
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
    background: #2c2418; color: #f0e8d8;
    padding: 14px 24px; box-shadow: 0 -2px 16px rgba(0,0,0,.2);
    font-family: 'DM Sans', sans-serif; font-size: .85rem;
    animation: cookieSlide .3s ease;
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes cookieSlide { from { transform: translateY(100%); } to { transform: none; } }
    #cookie-bar .cookie-inner { max-width: 1100px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
    #cookie-bar p { margin: 0; color: rgba(240,232,216,.8); line-height: 1.5; }
    #cookie-bar .cookie-btns { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
    #cookie-bar .cookie-btn { padding: 8px 20px; background: #b8945a; color: #fff; border: none; border-radius: 5px; font-size: .82rem; font-weight: 500; cursor: pointer; white-space: nowrap; }
    #cookie-bar .cookie-btn:hover { background: #d4a96a; }
    #cookie-bar .cookie-link { color: rgba(240,232,216,.55); font-size: .78rem; text-decoration: underline; white-space: nowrap; }
    #cookie-bar .cookie-link:hover { color: #f0e8d8; }
  `;
  document.head.appendChild(style);
  document.body.appendChild(bar);

  document.getElementById('cookie-accept').addEventListener('click', () => {
    localStorage.setItem(COOKIE_KEY, '1');
    bar.style.animation = 'none';
    bar.style.transition = 'transform .3s ease, opacity .3s ease';
    bar.style.transform = 'translateY(100%)';
    bar.style.opacity = '0';
    setTimeout(() => bar.remove(), 320);
  });
}

/* ── Header + Footer inject ──────────────────────────────── */
function renderHeader() {
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  const nav = [
    { href: 'index.html',   label: 'Kolekce' },
    { href: 'cart.html',    label: 'Košík'   },
    { href: '#kontakt',     label: 'Kontakt' },
  ];
  const navLinks = nav.map(n =>
    `<a href="${n.href}" class="${n.href === currentPage ? 'active' : ''}">${n.label}</a>`
  ).join('');

  return `
    <header class="site-header">
      <div class="container header-inner">
        <a href="index.html" class="logo">Korálky <span>&amp; Šperky</span></a>
        <nav class="main-nav">${navLinks}</nav>
        <div class="header-actions">
          <a href="cart.html" class="icon-btn" aria-label="Košík">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            <span class="cart-count"></span>
          </a>
          <button class="hamburger" id="hamburger" aria-label="Menu" onclick="toggleMobileNav()">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </header>
    <nav class="mobile-nav" id="mobile-nav">
      ${navLinks}
      <div class="divider-line"></div>
      <a href="terms.html">Obchodní podmínky</a>
      <a href="privacy.html">Ochrana osobních údajů</a>
    </nav>`;
}

function renderFooter() {
  return `
    <footer class="site-footer" id="kontakt">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a href="index.html" class="logo">Korálky <span>&amp; Šperky</span></a>
            <p>Ručně vyráběné šperky s příběhem. Každý kousek vzniká s láskou a péčí z přírodních materiálů.</p>
            <p style="margin-top:.75rem;font-size:.78rem;color:rgba(138,126,108,.7)">
              IČO: <span data-setting="ico">000 00 000</span>
              &nbsp;|&nbsp; <span data-setting="vat">Nejsme plátci DPH.</span>
            </p>
          </div>
          <div class="footer-col">
            <h4>Navigace</h4>
            <a href="index.html">Kolekce</a>
            <a href="cart.html">Košík</a>
          </div>
          <div class="footer-col">
            <h4>Kontakt</h4>
            <a href="mailto:info@koralkyasperky.cz" data-setting="email">info@koralkyasperky.cz</a>
            <a href="tel:+420123456789" data-setting="phone">+420 123 456 789</a>
          </div>
          <div class="footer-col">
            <h4>Právní info</h4>
            <a href="terms.html">Obchodní podmínky</a>
            <a href="privacy.html">Ochrana osobních údajů</a>
            <a href="terms.html#reklamace">Reklamační řád</a>
          </div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} Korálky &amp; Šperky</span>
          <span>Vyrobeno s ♥ v České republice</span>
        </div>
      </div>
    </footer>`;
}

/* ── Mobile nav ──────────────────────────────────────────── */
function toggleMobileNav() {
  const nav = document.getElementById('mobile-nav');
  const btn = document.getElementById('hamburger');
  if (!nav || !btn) return;
  const isOpen = nav.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

document.addEventListener('click', e => {
  const nav = document.getElementById('mobile-nav');
  const btn = document.getElementById('hamburger');
  if (!nav || !nav.classList.contains('open')) return;
  if (e.target.closest('.mobile-nav a')) {
    nav.classList.remove('open');
    btn?.classList.remove('open');
    document.body.style.overflow = '';
  }
});

/* ── Init ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  /* Inject header/footer */
  const headerEl = document.getElementById('site-header');
  if (headerEl) headerEl.outerHTML = renderHeader();
  const footerEl = document.getElementById('site-footer');
  if (footerEl) footerEl.outerHTML = renderFooter();

  /* Košík badge */
  Cart.updateBadge();

  /* Načti settings a aplikuj na stránku */
  await loadSettings();

  /* Product cards */
  initProductCards();

  /* Cookie lišta */
  initCookieBar();
});

/* Exporty */
window.loadProducts    = loadProducts;
window.getProduct      = getProduct;
window.toggleMobileNav = toggleMobileNav;
window.loadSettings    = loadSettings;
