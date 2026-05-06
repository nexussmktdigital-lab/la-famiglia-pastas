/* =============================================================
   cart.js
   - Renderiza la carta desde products.js / localStorage
   - Maneja estado del carrito (add/remove/qty)
   - Drawer lateral, badge, toast
   - Checkout: arma mensaje y abre wa.me con el pedido
   ============================================================= */

(function () {
  'use strict';

  // ------ Estado en memoria (espejo de localStorage) ------
  let products   = [];
  let categories = [];
  let cart       = [];

  // ------ INIT ------
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    products   = lfLoadProducts();
    categories = lfLoadCategories();
    cart       = lfLoadCart();

    // Limpiar items del carrito que apuntan a productos borrados
    // y re-etiquetar nombres genéricos (ej. "1 kg" → "Tallarines 1 kg")
    cart = cart
      .filter(item => lfGetProductById(products, item.id))
      .map(item => {
        const product = lfGetProductById(products, item.id);
        const label = lfCartLabel(product, categories);
        return label !== item.name ? Object.assign({}, item, { name: label }) : item;
      });
    persistCart();

    renderMenu();
    renderCart();
    bindEvents();
    updateBadge();
  }

  // =============================================================
  // RENDER · CARTA (reemplaza el HTML hardcodeado)
  // =============================================================

  function renderMenu() {
    const container = document.getElementById('carta-container');
    if (!container) return;

    const visible = products.filter(p => p.available);
    const grouped = lfGroupByCategory(visible, categories)
      .filter(g => g.products.length > 0);

    if (grouped.length === 0) {
      container.innerHTML = '<p class="carta-empty">No hay productos disponibles en este momento.</p>';
      return;
    }

    // Distribuir las categorías en dos columnas (igual que el original)
    const half = Math.ceil(grouped.length / 2);
    const col1 = grouped.slice(0, half).map(renderCategory).join('');
    const col2 = grouped.slice(half).map(renderCategory).join('');

    container.innerHTML =
      '<div class="carta-grid">' +
        '<div>' + col1 + '</div>' +
        '<div>' + col2 + '</div>' +
      '</div>';
  }

  function renderCategory(group) {
    const cat = group.category;
    const tag = cat.tag ? ' <span class="cat-tag">' + escapeHTML(cat.tag) + '</span>' : '';
    const icon = LF_CATEGORY_ICONS[cat.id] || LF_CATEGORY_ICONS._default;
    const items = group.products.map(renderProduct).join('');

    return (
      '<article class="carta-cat">' +
        '<div class="cat-head">' +
          '<span class="cat-name">' + icon + escapeHTML(cat.name) + tag + '</span>' +
          '<span class="cat-price-head">Precio</span>' +
        '</div>' +
        '<ul class="menu-list">' + items + '</ul>' +
      '</article>'
    );
  }

  function renderProduct(p) {
    const star = p.featured ? ' <span class="star">★</span>' : '';
    return (
      '<li>' +
        '<span class="name">' + escapeHTML(p.name) + star + '</span>' +
        '<span class="leader"></span>' +
        '<span class="price">' + lfFormatPrice(p.price) + '</span>' +
        '<button class="menu-add" data-id="' + p.id + '" type="button" ' +
          'aria-label="Agregar ' + escapeHTML(p.name) + ' al carrito">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">' +
            '<path d="M12 5v14M5 12h14"/>' +
          '</svg>' +
        '</button>' +
      '</li>'
    );
  }

  // =============================================================
  // CART · operaciones
  // =============================================================

  function addToCart(productId) {
    const product = lfGetProductById(products, productId);
    if (!product || !product.available) return;

    // Etiqueta amigable para el carrito (prefija categoría si el nombre es solo "1 kg", etc.)
    const label = lfCartLabel(product, categories);

    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: product.id,
        name: label,
        price: product.price, // snapshot del precio al momento de agregar
        qty: 1,
      });
    }
    persistCart();
    renderCart();
    updateBadge();
    flashFAB();
    showToast(label + ' · agregado al carrito');
  }

  function changeQty(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(i => i.id !== productId);
    persistCart();
    renderCart();
    updateBadge();
  }

  function removeFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    persistCart();
    renderCart();
    updateBadge();
  }

  function clearCart() {
    cart = [];
    persistCart();
    renderCart();
    updateBadge();
  }

  function getTotal()     { return cart.reduce((s, i) => s + i.price * i.qty, 0); }
  function getItemCount() { return cart.reduce((s, i) => s + i.qty, 0); }

  function persistCart() { lfSaveCart(cart); }

  // =============================================================
  // RENDER · DRAWER del carrito
  // =============================================================

  function renderCart() {
    const list      = document.getElementById('cart-list');
    const totalEl   = document.getElementById('cart-total');
    const checkBtn  = document.getElementById('cart-checkout');
    const emptyEl   = document.getElementById('cart-empty');
    const clearBtn  = document.getElementById('cart-clear');
    if (!list) return;

    if (cart.length === 0) {
      list.innerHTML = '';
      if (emptyEl)  emptyEl.hidden = false;
      if (checkBtn) checkBtn.disabled = true;
      if (clearBtn) clearBtn.hidden = true;
      if (totalEl)  totalEl.textContent = lfFormatPrice(0);
      return;
    }

    if (emptyEl)  emptyEl.hidden = true;
    if (checkBtn) checkBtn.disabled = false;
    if (clearBtn) clearBtn.hidden = false;

    list.innerHTML = cart.map(item =>
      '<li class="cart-item" data-id="' + item.id + '">' +
        '<div class="cart-item-info">' +
          '<span class="cart-item-name">' + escapeHTML(item.name) + '</span>' +
          '<span class="cart-item-price">' + lfFormatPrice(item.price) + ' c/u</span>' +
        '</div>' +
        '<div class="cart-item-controls">' +
          '<button class="qty-btn" data-action="dec" type="button" aria-label="Quitar uno">−</button>' +
          '<span class="qty">' + item.qty + '</span>' +
          '<button class="qty-btn" data-action="inc" type="button" aria-label="Sumar uno">+</button>' +
        '</div>' +
        '<div class="cart-item-line">' + lfFormatPrice(item.price * item.qty) + '</div>' +
        '<button class="cart-item-remove" data-action="remove" type="button" aria-label="Quitar producto">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
            '<path d="M5 5L19 19M19 5L5 19"/>' +
          '</svg>' +
        '</button>' +
      '</li>'
    ).join('');

    if (totalEl) totalEl.textContent = lfFormatPrice(getTotal());
  }

  function updateBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const count = getItemCount();
    badge.textContent = String(count);
    badge.hidden = count === 0;
  }

  function flashFAB() {
    const fab = document.getElementById('cart-fab');
    if (!fab) return;
    fab.classList.remove('flash');
    void fab.offsetWidth; // forzar reflow
    fab.classList.add('flash');
  }

  // ------ Drawer open/close ------
  function openCart()  {
    document.getElementById('cart-drawer')?.classList.add('open');
    document.getElementById('cart-backdrop')?.classList.add('open');
    document.body.classList.add('cart-open');
  }
  function closeCart() {
    document.getElementById('cart-drawer')?.classList.remove('open');
    document.getElementById('cart-backdrop')?.classList.remove('open');
    document.body.classList.remove('cart-open');
  }

  // =============================================================
  // CHECKOUT · arma el mensaje y abre WhatsApp
  // =============================================================

  function checkout() {
    if (cart.length === 0) return;

    const lines = cart.map(i =>
      '- ' + i.qty + 'x ' + i.name + ' (' + lfFormatPrice(i.price * i.qty) + ')'
    );
    const message =
      'Hola! Quiero hacer el siguiente pedido:\n' +
      lines.join('\n') + '\n' +
      'Total: ' + lfFormatPrice(getTotal()) + '\n' +
      '¿Para cuándo estaría listo?';

    const url = 'https://wa.me/' + LF_CONFIG.whatsappNumber +
                '?text=' + encodeURIComponent(message);
    window.open(url, '_blank', 'noopener');
  }

  // =============================================================
  // TOAST
  // =============================================================

  let toastTimer = null;
  function showToast(text) {
    const toast = document.getElementById('cart-toast');
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
  }

  // =============================================================
  // EVENTOS · delegación
  // =============================================================

  function bindEvents() {
    document.addEventListener('click', (e) => {
      // Agregar al carrito desde el menú
      const addBtn = e.target.closest('.menu-add');
      if (addBtn) { addToCart(addBtn.dataset.id); return; }

      // Abrir/cerrar carrito
      if (e.target.closest('#cart-fab') || e.target.closest('[data-cart-open]')) {
        openCart(); return;
      }
      if (e.target.closest('#cart-close') || e.target.closest('#cart-backdrop')) {
        closeCart(); return;
      }

      // Acciones dentro de un item del carrito
      const cartItem = e.target.closest('.cart-item');
      if (cartItem) {
        const id = cartItem.dataset.id;
        const action = e.target.closest('[data-action]')?.dataset?.action;
        if (action === 'inc')    changeQty(id, +1);
        else if (action === 'dec')    changeQty(id, -1);
        else if (action === 'remove') removeFromCart(id);
        return;
      }

      // Checkout
      if (e.target.closest('#cart-checkout')) { checkout(); return; }

      // Vaciar carrito
      if (e.target.closest('#cart-clear')) {
        if (confirm('¿Vaciar el carrito?')) clearCart();
        return;
      }
    });

    // ESC cierra el drawer
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('cart-open')) {
        closeCart();
      }
    });

    // Sincronización entre pestañas (si admin guarda cambios, la carta se actualiza)
    window.addEventListener('storage', (e) => {
      if (e.key === LF_CONFIG.storageKey.cart) {
        cart = lfLoadCart();
        renderCart();
        updateBadge();
      }
      if (e.key === LF_CONFIG.storageKey.products ||
          e.key === LF_CONFIG.storageKey.categories) {
        products   = lfLoadProducts();
        categories = lfLoadCategories();
        // Si el admin borró productos, los limpiamos del carrito
        const before = cart.length;
        cart = cart.filter(item => lfGetProductById(products, item.id));
        if (cart.length !== before) {
          persistCart();
          renderCart();
          updateBadge();
        }
        renderMenu();
      }
    });
  }

  // =============================================================
  // UTIL
  // =============================================================

  function escapeHTML(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

})();
