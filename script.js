/* ============================================================
   KORÁLKY & ŠPERKY — Shared JavaScript
   Produkty, košík, utility funkce
   ============================================================ */

'use strict';

/* ── Konfigurace ─────────────────────────────────────────── */
const CONFIG = {
  CART_KEY:     'koralky_cart',
  CURRENCY:     'Kč',
  SHIPPING: [
    { id: 'zasilkovna', name: 'Zásilkovna',          price: 79  },
    { id: 'dpd',        name: 'DPD kurýr',           price: 109 },
    { id: 'osobni',     name: 'Osobní odběr – Praha', price: 0   },
  ],
  FREE_SHIPPING_THRESHOLD: 1200,
};
window.CONFIG = CONFIG;

/* ── Produkty ────────────────────────────────────────────── */
async function loadProducts() {
  try {
    /* Cache-busting: přidá timestamp aby prohlížeč vždy načetl čerstvá data */
    const res = await fetch('products.json?v=' + Date.now(), {
      cache: 'no-store',
    });
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
const Cart = window.Cart = {
  /** Vrátí celý košík z localStorage */
  get() {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.CART_KEY)) || [];
    } catch {
      return [];
    }
  },

  /** Uloží košík do localStorage a aktualizuje badge */
  save(items) {
    localStorage.setItem(CONFIG.CART_KEY, JSON.stringify(items));
    Cart.updateBadge();
  },

  /** Přidá produkt nebo zvýší qty */
  add(product, qty = 1) {
    const items = Cart.get();
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      existing.qty += qty;
    } else {
      items.push({
        id:    product.id,
        name:  product.name,
        price: product.price,
        image: product.images?.[0] || product.image || '',
        qty,
      });
    }
    Cart.save(items);
    showToast(`„${product.name}" přidán do košíku`, 'success');
  },

  /** Odebere položku podle id */
  remove(id) {
    const items = Cart.get().filter(i => i.id !== id);
    Cart.save(items);
  },

  /** Nastaví qty; pokud qty <= 0, odebere */
  setQty(id, qty) {
    if (qty <= 0) { Cart.remove(id); return; }
    const items = Cart.get();
    const item = items.find(i => i.id === id);
    if (item) { item.qty = qty; Cart.save(items); }
  },

  /** Vyprázdní košík */
  clear() {
    localStorage.removeItem(CONFIG.CART_KEY);
    Cart.updateBadge();
  },

  /** Počet kusů celkem */
  count() {
    return Cart.get().reduce((sum, i) => sum + i.qty, 0);
  },

  /** Mezisoučet (bez dopravy) */
  subtotal() {
    return Cart.get().reduce((sum, i) => sum + i.price * i.qty, 0);
  },

  /** Aktualizuje číslo v hlavičce */
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
  return date.toLocaleDateString('cs-CZ', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
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
  const icon = type === 'success' ? '✓' : '✕';
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
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

/* Bezpečnější verze přidání z karty – používá data atributy */
function initProductCards() {
  document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.addToCart);
      const product = await getProduct(id);
      if (product) Cart.add(product);
    });
  });
}

/* ── Header + Footer inject ──────────────────────────────── */
function renderHeader() {
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  const nav = [
    { href: 'index.html',    label: 'Kolekce' },
    { href: 'cart.html',     label: 'Košík' },
    { href: '#kontakt',      label: 'Kontakt' },
  ];

  const navLinks = nav.map(n => `
    <a href="${n.href}" class="${n.href === currentPage ? 'active' : ''}">
      ${n.label}
    </a>`).join('');

  return `
    <header class="site-header">
      <div class="container header-inner">
        <a href="index.html" class="logo">Korálky <span>&amp; Šperky</span></a>
        <nav class="main-nav">${navLinks}</nav>
        <div class="header-actions">
          <a href="cart.html" class="icon-btn" aria-label="Košík">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="1.5">
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
            <p>Ručně vyráběné šperky s příběhem. Každý kousek vzniká s láskou
               a péčí z přírodních materiálů.</p>
            <p style="margin-top:.75rem;font-size:.78rem;color:rgba(138,126,108,.7)">
              IČO: 000 00 000 &nbsp;|&nbsp; Nejsme plátci DPH.
            </p>
          </div>
          <div class="footer-col">
            <h4>Navigace</h4>
            <a href="index.html">Kolekce</a>
            <a href="cart.html">Košík</a>
            <a href="admin.html">Správa</a>
          </div>
          <div class="footer-col">
            <h4>Kontakt</h4>
            <a href="mailto:info@koralkyasperky.cz">info@koralkyasperky.cz</a>
            <a href="tel:+420123456789">+420 123 456 789</a>
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

/* ── Mobile nav toggle ───────────────────────────────────── */
function toggleMobileNav() {
  const nav = document.getElementById('mobile-nav');
  const btn = document.getElementById('hamburger');
  if (!nav || !btn) return;
  const isOpen = nav.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
}

/* Zavři mobilní nav při kliknutí na odkaz */
document.addEventListener('click', (e) => {
  const nav = document.getElementById('mobile-nav');
  const btn = document.getElementById('hamburger');
  if (!nav || !nav.classList.contains('open')) return;
  if (e.target.closest('.mobile-nav a')) {
    nav.classList.remove('open');
    btn?.classList.remove('open');
    document.body.style.overflow = '';
  }
});

/* ── Inicializace při načtení stránky ────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  /* Inject header */
  const headerEl = document.getElementById('site-header');
  if (headerEl) headerEl.outerHTML = renderHeader();

  /* Inject footer */
  const footerEl = document.getElementById('site-footer');
  if (footerEl) footerEl.outerHTML = renderFooter();

  /* Košík badge */
  Cart.updateBadge();

  /* Inicializace karet */
  initProductCards();
});

/* Exporty */
window.loadProducts    = loadProducts;
window.getProduct      = getProduct;
window.toggleMobileNav = toggleMobileNav;
