/* =============================================================
   admin.js
   Lógica del panel de administración (admin.html).

   - Login con contraseña hardcodeada (ver products.js → LF_CONFIG.adminPassword)
   - CRUD de productos
   - CRUD de categorías
   - Export / import JSON
   - Reset a defaults

   La sesión se guarda en sessionStorage (al cerrar el navegador
   se cierra sesión automáticamente).
   ============================================================= */

(function () {
  'use strict';

  let products   = [];
  let categories = [];
  let editingProductId  = null;
  let editingCategoryId = null;

  document.addEventListener('DOMContentLoaded', initAuth);

  // =============================================================
  // AUTH
  // =============================================================

  function initAuth() {
    const isAuth = sessionStorage.getItem(LF_CONFIG.storageKey.auth) === '1';
    if (isAuth) showDashboard(); else showAuth();

    document.getElementById('auth-form').addEventListener('submit', handleLogin);
  }

  function handleLogin(e) {
    e.preventDefault();
    const passInput = document.getElementById('auth-pass');
    const hint = document.getElementById('auth-hint');
    if (passInput.value === LF_CONFIG.adminPassword) {
      sessionStorage.setItem(LF_CONFIG.storageKey.auth, '1');
      hint.hidden = true;
      showDashboard();
    } else {
      hint.hidden = false;
      passInput.value = '';
      passInput.focus();
    }
  }

  function logout() {
    sessionStorage.removeItem(LF_CONFIG.storageKey.auth);
    showAuth();
  }

  function showAuth() {
    document.getElementById('auth-screen').hidden = false;
    document.getElementById('dash').hidden = true;
    setTimeout(() => document.getElementById('auth-pass')?.focus(), 50);
  }

  function showDashboard() {
    document.getElementById('auth-screen').hidden = true;
    document.getElementById('dash').hidden = false;
    initDashboard();
  }

  // =============================================================
  // DASHBOARD
  // =============================================================

  let dashInitialized = false;
  function initDashboard() {
    products   = lfLoadProducts();
    categories = lfLoadCategories();

    renderProducts();
    renderCategories();

    if (!dashInitialized) {
      bindTabs();
      bindProductActions();
      bindCategoryActions();
      bindDataActions();
      document.getElementById('logout').addEventListener('click', logout);

      // Cerrar modales con ESC
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          closeModal('product-modal');
          closeModal('category-modal');
        }
      });

      dashInitialized = true;
    }
  }

  function bindTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        document.querySelectorAll('.tab').forEach(t =>
          t.classList.toggle('active', t === tab));
        document.querySelectorAll('.dash-panel').forEach(p =>
          p.hidden = p.id !== ('panel-' + target));
      });
    });
  }

  // =============================================================
  // PRODUCTOS · CRUD
  // =============================================================

  function renderProducts() {
    const list = document.getElementById('products-list');
    const grouped = lfGroupByCategory(products, categories);

    // Categorías con productos
    let html = grouped.map(g => {
      const items = g.products.map(p => renderProductRow(p)).join('');
      return (
        '<section class="prod-cat">' +
          '<h3>' + escapeHTML(g.category.name) +
            (g.category.tag ? ' <span class="cat-tag-inline">' + escapeHTML(g.category.tag) + '</span>' : '') +
            ' <small>(' + g.products.length + ')</small>' +
          '</h3>' +
          (g.products.length === 0
            ? '<p class="prod-empty">Sin productos en esta categoría.</p>'
            : '<ul class="prod-list">' + items + '</ul>') +
        '</section>'
      );
    }).join('');

    // Productos huérfanos (categoría que ya no existe)
    const orphan = products.filter(p => !lfGetCategoryById(categories, p.category));
    if (orphan.length > 0) {
      html += (
        '<section class="prod-cat prod-cat-orphan">' +
          '<h3>Sin categoría <small>(' + orphan.length + ')</small></h3>' +
          '<ul class="prod-list">' + orphan.map(renderProductRow).join('') + '</ul>' +
        '</section>'
      );
    }

    list.innerHTML = html || '<p class="prod-empty">No hay productos. Creá uno con el botón de arriba.</p>';
  }

  function renderProductRow(p) {
    return (
      '<li class="prod-row' + (p.available ? '' : ' unavailable') + '">' +
        '<div class="prod-info">' +
          '<span class="prod-name">' + escapeHTML(p.name) +
            (p.featured ? ' <span class="prod-star">★</span>' : '') +
            (!p.available ? ' <span class="prod-flag">oculto</span>' : '') +
          '</span>' +
          '<span class="prod-price">' + lfFormatPrice(p.price) + '</span>' +
        '</div>' +
        '<div class="prod-actions">' +
          '<button class="btn ghost mini" data-action="toggle-availability" data-id="' + p.id + '" type="button">' +
            (p.available ? 'Ocultar' : 'Mostrar') +
          '</button>' +
          '<button class="btn ghost mini" data-action="edit-product" data-id="' + p.id + '" type="button">Editar</button>' +
          '<button class="btn danger mini" data-action="delete-product" data-id="' + p.id + '" type="button">Borrar</button>' +
        '</div>' +
      '</li>'
    );
  }

  function bindProductActions() {
    document.getElementById('add-product').addEventListener('click', () => openProductModal());

    document.getElementById('products-list').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'edit-product')         openProductModal(id);
      else if (action === 'delete-product')        deleteProduct(id);
      else if (action === 'toggle-availability')   toggleAvailability(id);
    });

    document.getElementById('product-form').addEventListener('submit', handleProductSubmit);

    document.querySelectorAll('#product-modal [data-close]').forEach(el =>
      el.addEventListener('click', () => closeModal('product-modal'))
    );
  }

  function openProductModal(id) {
    editingProductId = id || null;
    const modal = document.getElementById('product-modal');
    const form  = document.getElementById('product-form');
    const title = document.getElementById('product-modal-title');
    const select = form.querySelector('[name="category"]');

    // Llenar el select con categorías ordenadas
    const sortedCats = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));
    select.innerHTML = sortedCats.map(c =>
      '<option value="' + escapeAttr(c.id) + '">' + escapeHTML(c.name) + '</option>'
    ).join('');

    if (id) {
      const p = lfGetProductById(products, id);
      if (!p) return;
      title.textContent = 'Editar producto';
      form.name.value = p.name;
      form.category.value = p.category;
      form.price.value = p.price;
      form.description.value = p.description || '';
      form.available.checked = !!p.available;
      form.featured.checked = !!p.featured;
      form.id.value = p.id;
    } else {
      title.textContent = 'Nuevo producto';
      form.reset();
      form.available.checked = true;
      form.id.value = '';
    }

    modal.hidden = false;
    setTimeout(() => form.name.focus(), 80);
  }

  function handleProductSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
      name:        form.name.value.trim(),
      category:    form.category.value,
      price:       parseInt(form.price.value, 10) || 0,
      description: form.description.value.trim(),
      available:   form.available.checked,
      featured:    form.featured.checked,
    };
    if (!data.name) return;

    if (editingProductId) {
      const idx = products.findIndex(p => p.id === editingProductId);
      if (idx >= 0) products[idx] = Object.assign({}, products[idx], data);
    } else {
      const id = generateId(data.name, products.map(p => p.id));
      products.push(Object.assign({ id: id }, data));
    }

    lfSaveProducts(products);
    renderProducts();
    closeModal('product-modal');
  }

  function deleteProduct(id) {
    const p = lfGetProductById(products, id);
    if (!p) return;
    if (!confirm('¿Borrar el producto "' + p.name + '"?')) return;
    products = products.filter(x => x.id !== id);
    lfSaveProducts(products);
    renderProducts();
  }

  function toggleAvailability(id) {
    const p = lfGetProductById(products, id);
    if (!p) return;
    p.available = !p.available;
    lfSaveProducts(products);
    renderProducts();
  }

  // =============================================================
  // CATEGORÍAS · CRUD
  // =============================================================

  function renderCategories() {
    const list = document.getElementById('categories-list');
    const sorted = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));

    if (sorted.length === 0) {
      list.innerHTML = '<p class="prod-empty">No hay categorías. Creá una con el botón de arriba.</p>';
      return;
    }

    list.innerHTML =
      '<ul class="cat-list">' +
        sorted.map(c => {
          const count = products.filter(p => p.category === c.id).length;
          return (
            '<li class="cat-row">' +
              '<div class="cat-info">' +
                '<span class="cat-order">#' + (c.order || '-') + '</span>' +
                '<span class="cat-name">' + escapeHTML(c.name) + '</span>' +
                (c.tag ? '<span class="cat-tag-inline">' + escapeHTML(c.tag) + '</span>' : '') +
                '<span class="cat-count">' + count + ' producto' + (count === 1 ? '' : 's') + '</span>' +
              '</div>' +
              '<div class="cat-actions">' +
                '<button class="btn ghost mini" data-action="edit-category" data-id="' + c.id + '" type="button">Editar</button>' +
                '<button class="btn danger mini" data-action="delete-category" data-id="' + c.id + '" type="button">Borrar</button>' +
              '</div>' +
            '</li>'
          );
        }).join('') +
      '</ul>';
  }

  function bindCategoryActions() {
    document.getElementById('add-category').addEventListener('click', () => openCategoryModal());

    document.getElementById('categories-list').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.action === 'edit-category')        openCategoryModal(id);
      else if (btn.dataset.action === 'delete-category') deleteCategory(id);
    });

    document.getElementById('category-form').addEventListener('submit', handleCategorySubmit);

    document.querySelectorAll('#category-modal [data-close]').forEach(el =>
      el.addEventListener('click', () => closeModal('category-modal'))
    );
  }

  function openCategoryModal(id) {
    editingCategoryId = id || null;
    const modal = document.getElementById('category-modal');
    const form  = document.getElementById('category-form');
    const title = document.getElementById('category-modal-title');

    if (id) {
      const c = lfGetCategoryById(categories, id);
      if (!c) return;
      title.textContent = 'Editar categoría';
      form.name.value = c.name;
      form.tag.value = c.tag || '';
      form.order.value = c.order || 0;
      form.id.value = c.id;
    } else {
      title.textContent = 'Nueva categoría';
      form.reset();
      const maxOrder = categories.reduce((m, c) => Math.max(m, c.order || 0), 0);
      form.order.value = maxOrder + 1;
      form.id.value = '';
    }

    modal.hidden = false;
    setTimeout(() => form.name.focus(), 80);
  }

  function handleCategorySubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
      name:  form.name.value.trim(),
      tag:   form.tag.value.trim(),
      order: parseInt(form.order.value, 10) || 0,
    };
    if (!data.name) return;

    if (editingCategoryId) {
      const idx = categories.findIndex(c => c.id === editingCategoryId);
      if (idx >= 0) categories[idx] = Object.assign({}, categories[idx], data);
    } else {
      const id = generateId(data.name, categories.map(c => c.id));
      categories.push(Object.assign({ id: id }, data));
    }

    lfSaveCategories(categories);
    renderCategories();
    renderProducts();
    closeModal('category-modal');
  }

  function deleteCategory(id) {
    const c = lfGetCategoryById(categories, id);
    if (!c) return;
    const productsInCat = products.filter(p => p.category === id);
    let msg = '¿Borrar la categoría "' + c.name + '"?';
    if (productsInCat.length > 0) {
      msg += '\n\nTiene ' + productsInCat.length + ' producto(s) que también se borrarán.\n¿Continuar?';
    }
    if (!confirm(msg)) return;

    categories = categories.filter(x => x.id !== id);
    products = products.filter(p => p.category !== id);

    lfSaveCategories(categories);
    lfSaveProducts(products);
    renderCategories();
    renderProducts();
  }

  // =============================================================
  // DATOS · export / import / reset
  // =============================================================

  function bindDataActions() {
    document.getElementById('export-json').addEventListener('click', exportJSON);
    document.getElementById('import-json').addEventListener('click', () =>
      document.getElementById('import-file').click()
    );
    document.getElementById('import-file').addEventListener('change', importJSON);
    document.getElementById('reset-defaults').addEventListener('click', resetDefaults);
  }

  function exportJSON() {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      categories: categories,
      products: products,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lafamiglia-carta-' + todayStamp() + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importJSON(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data.categories) || !Array.isArray(data.products)) {
          throw new Error('El archivo no tiene el formato esperado.');
        }
        if (!confirm('Esto reemplaza la carta actual con la del archivo. ¿Continuar?')) {
          e.target.value = '';
          return;
        }
        categories = data.categories;
        products   = data.products;
        lfSaveCategories(categories);
        lfSaveProducts(products);
        renderProducts();
        renderCategories();
        alert('Carta importada con éxito.');
      } catch (err) {
        alert('Error al importar: ' + err.message);
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  }

  function resetDefaults() {
    if (!confirm('Esto borra todos los cambios y vuelve a la carta original. ¿Continuar?')) return;
    lfResetToDefaults();
    products   = lfLoadProducts();
    categories = lfLoadCategories();
    renderProducts();
    renderCategories();
    alert('Carta restablecida.');
  }

  // =============================================================
  // UTIL
  // =============================================================

  function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.hidden = true;
  }

  function generateId(name, existingIds) {
    const base = lfSlugify(name) || 'item';
    let id = base, counter = 1;
    while (existingIds.includes(id)) {
      id = base + '-' + (counter++);
    }
    return id;
  }

  function todayStamp() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function escapeHTML(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function escapeAttr(str) {
    return escapeHTML(str);
  }

})();
