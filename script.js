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

/* ── Produkty ────────────────────────────────────────────── */
async function loadProducts() {
  try {
    const res = await fetch('products.json');
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

/* ── Formátování ─────────────────────────────────────────── */
function formatPrice(amount) {
  return `${amount.toLocaleString('cs-CZ')} ${CONFIG.CURRENCY}`;
}

function formatDate(date = new Date()) {
  return date.toLocaleDateString('cs-CZ', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
}

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

/* ── URL parametry ───────────────────────────────────────── */
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ── Renderovací pomocníci ───────────────────────────────── */
function renderProductCard(product) {
  const badge = product.badge
    ? `<span class="product-card__badge">${product.badge}</span>` : '';

  return `
    <article class="product-card">
      <a href="product.html?id=${product.id}" class="product-card__img">
        ${badge}
        <img src="${product.images?.[0] || product.image || 'img/placeholder.jpg'}"
             alt="${product.name}" loading="lazy">
        <button class="product-card__wishlist" aria-label="Přidat do oblíbených">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06
                     a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23
                     l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </a>
      <div class="product-card__body">
        <p class="product-card__category">${product.category || ''}</p>
        <h3 class="product-card__name">
          <a href="product.html?id=${product.id}">${product.name}</a>
        </h3>
        <p class="product-card__price">${formatPrice(product.price)}</p>
        <button class="btn btn-primary btn-sm btn-full"
                onclick="Cart.add(${JSON.stringify(JSON.stringify(product))
                  .slice(1,-1)
                  .replace(/\\/g,'\\\\')})">
          Do košíku
        </button>
      </div>
    </article>`;
}

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

  return `
    <header class="site-header">
      <div class="container header-inner">
        <a href="index.html" class="logo">Korálky <span>&amp; Šperky</span></a>
        <nav class="main-nav">
          ${nav.map(n => `
            <a href="${n.href}"
               class="${n.href === currentPage ? 'active' : ''}">
              ${n.label}
            </a>`).join('')}
        </nav>
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
        </div>
      </div>
    </header>`;
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
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} Korálky &amp; Šperky</span>
          <span>Vyrobeno s ♥</span>
        </div>
      </div>
    </footer>`;
}

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

/* Exporty pro přímé použití v HTML stránkách */
window.Cart       = Cart;
window.loadProducts  = loadProducts;
window.getProduct    = getProduct;
window.formatPrice   = formatPrice;
window.formatDate    = formatDate;
window.showToast     = showToast;
window.getParam      = getParam;
window.renderProductCard = renderProductCard;
window.CONFIG        = CONFIG;
