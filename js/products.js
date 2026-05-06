/* =============================================================
   products.js
   Datos de productos, categorías y configuración compartida.
   Usado por cart.js (sitio público) y admin.js (panel).

   ▼ ▼ ▼  CONFIGURACIÓN — cambiar acá  ▼ ▼ ▼
   - whatsappNumber: número que recibe los pedidos
   - adminPassword: contraseña del panel /admin.html
   ============================================================= */

const LF_CONFIG = {
  // Número de WhatsApp en formato internacional (sin "+", sin espacios)
  whatsappNumber: '543574432907',

  // Contraseña del panel de administración (admin.html)
  adminPassword: 'famiglia2024',

  // Claves de localStorage (no es necesario tocarlas)
  storageKey: {
    products:   'lafamiglia.products.v1',
    categories: 'lafamiglia.categories.v1',
    cart:       'lafamiglia.cart.v1',
    auth:       'lafamiglia.adminAuth.v1',
  },
};

/* -------------------------------------------------------------
   Categorías por defecto (primera vez que se carga la web)
   ------------------------------------------------------------- */
const LF_DEFAULT_CATEGORIES = [
  { id: 'sorrentinos',         name: 'Sorrentinos',         tag: '',         order: 1 },
  { id: 'sorrentinos-gourmet', name: 'Sorrentinos Gourmet', tag: 'gourmet',  order: 2 },
  { id: 'ravioles',            name: 'Ravioles',            tag: '',         order: 3 },
  { id: 'tallarines',          name: 'Tallarines',          tag: '',         order: 4 },
  { id: 'noquis',              name: 'Ñoquis',              tag: '',         order: 5 },
];

/* -------------------------------------------------------------
   Productos por defecto
   ------------------------------------------------------------- */
const LF_DEFAULT_PRODUCTS = [
  // ====== Sorrentinos ($11.000) ======
  { id: 's-muzza-jamon',         category: 'sorrentinos',         name: 'Muzzarella y jamón',          price: 11000, description: '', available: true, featured: true  },
  { id: 's-cuatro-quesos',       category: 'sorrentinos',         name: 'Cuatro quesos',               price: 11000, description: '', available: true, featured: false },
  { id: 's-calabaza-muzza',      category: 'sorrentinos',         name: 'Calabaza y muzzarella',       price: 11000, description: '', available: true, featured: false },
  { id: 's-ricota-jamon-nuez',   category: 'sorrentinos',         name: 'Ricota, jamón y nuez',        price: 11000, description: '', available: true, featured: false },
  { id: 's-ricota-rucula-parm',  category: 'sorrentinos',         name: 'Ricota, rúcula y parmesano',  price: 11000, description: '', available: true, featured: false },

  // ====== Sorrentinos Gourmet ======
  { id: 'sg-bondiola',           category: 'sorrentinos-gourmet', name: 'Bondiola braseada',           price: 15000, description: '', available: true, featured: false },
  { id: 'sg-hongos',             category: 'sorrentinos-gourmet', name: 'Hongos',                      price: 16000, description: '', available: true, featured: false },
  { id: 'sg-salmon',             category: 'sorrentinos-gourmet', name: 'Salmón',                      price: 19500, description: '', available: true, featured: true  },

  // ====== Ravioles ($9.500) ======
  { id: 'r-carne-verdura',       category: 'ravioles',            name: 'Carne y verdura',             price: 9500,  description: '', available: true, featured: true  },
  { id: 'r-pollo-verdura',       category: 'ravioles',            name: 'Pollo y verdura',             price: 9500,  description: '', available: true, featured: false },
  { id: 'r-ricota-jamon',        category: 'ravioles',            name: 'Ricota y jamón',              price: 9500,  description: '', available: true, featured: false },
  { id: 'r-calabaza-muzza',      category: 'ravioles',            name: 'Calabaza y muzzarella',       price: 9500,  description: '', available: true, featured: false },
  { id: 'r-espinaca-ricota',     category: 'ravioles',            name: 'Espinaca y ricota',           price: 9500,  description: '', available: true, featured: false },

  // ====== Tallarines ======
  { id: 't-1kg',                 category: 'tallarines',          name: '1 kg',                        price: 8500,  description: '', available: true, featured: false },
  { id: 't-medio-kg',            category: 'tallarines',          name: '½ kg',                        price: 5000,  description: '', available: true, featured: false },

  // ====== Ñoquis ======
  { id: 'n-1kg',                 category: 'noquis',              name: '1 kg',                        price: 10000, description: '', available: true, featured: false },
];

/* -------------------------------------------------------------
   Iconos SVG por categoría (mismos que la versión hardcodeada)
   Si se crea una categoría nueva sin icono, usa el _default.
   ------------------------------------------------------------- */
const LF_CATEGORY_ICONS = {
  'sorrentinos':
    '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">' +
      '<circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2"/>' +
      '<circle cx="16" cy="16" r="8"  fill="none" stroke="currentColor" stroke-width="1.4" opacity="0.6"/>' +
      '<circle cx="16" cy="16" r="2"  fill="currentColor"/>' +
    '</svg>',

  'sorrentinos-gourmet':
    '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">' +
      '<path d="M4 22 L 16 6 L 28 22 Z" fill="none" stroke="currentColor" stroke-width="2"/>' +
      '<circle cx="16" cy="18" r="2" fill="currentColor"/>' +
    '</svg>',

  'ravioles':
    '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">' +
      '<rect x="4" y="8" width="24" height="16" rx="1" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2"/>' +
      '<line x1="4" y1="16" x2="28" y2="16" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>' +
      '<line x1="16" y1="8"  x2="16" y2="24" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>' +
    '</svg>',

  'tallarines':
    '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M4 12 q 6 4, 12 0 q 6 -4, 12 0"/>' +
      '<path d="M4 18 q 6 4, 12 0 q 6 -4, 12 0"/>' +
      '<path d="M4 24 q 6 4, 12 0 q 6 -4, 12 0"/>' +
    '</svg>',

  'noquis':
    '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<ellipse cx="11" cy="14" rx="5" ry="3.5"/>' +
      '<ellipse cx="21" cy="14" rx="5" ry="3.5"/>' +
      '<ellipse cx="16" cy="22" rx="5" ry="3.5"/>' +
    '</svg>',

  '_default':
    '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
      '<circle cx="16" cy="16" r="11"/>' +
      '<circle cx="16" cy="16" r="3" fill="currentColor"/>' +
    '</svg>',
};

/* =============================================================
   HELPERS · localStorage (con fallback a defaults)
   ============================================================= */

function lfSafeJSONParse(str, fallback) {
  try { return JSON.parse(str); }
  catch { return fallback; }
}

// Devuelve siempre una copia profunda para no mutar los defaults
function lfClone(obj) { return JSON.parse(JSON.stringify(obj)); }

function lfLoadProducts() {
  const stored = localStorage.getItem(LF_CONFIG.storageKey.products);
  if (!stored) return lfClone(LF_DEFAULT_PRODUCTS);
  const parsed = lfSafeJSONParse(stored, null);
  return Array.isArray(parsed) ? parsed : lfClone(LF_DEFAULT_PRODUCTS);
}

function lfSaveProducts(products) {
  localStorage.setItem(LF_CONFIG.storageKey.products, JSON.stringify(products));
}

function lfLoadCategories() {
  const stored = localStorage.getItem(LF_CONFIG.storageKey.categories);
  if (!stored) return lfClone(LF_DEFAULT_CATEGORIES);
  const parsed = lfSafeJSONParse(stored, null);
  return Array.isArray(parsed) ? parsed : lfClone(LF_DEFAULT_CATEGORIES);
}

function lfSaveCategories(categories) {
  localStorage.setItem(LF_CONFIG.storageKey.categories, JSON.stringify(categories));
}

function lfLoadCart() {
  const stored = localStorage.getItem(LF_CONFIG.storageKey.cart);
  const parsed = lfSafeJSONParse(stored, []);
  return Array.isArray(parsed) ? parsed : [];
}

function lfSaveCart(cart) {
  localStorage.setItem(LF_CONFIG.storageKey.cart, JSON.stringify(cart));
}

/* =============================================================
   HELPERS · varios
   ============================================================= */

function lfFormatPrice(n) {
  return '$' + Number(n || 0).toLocaleString('es-AR');
}

function lfSlugify(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita marcas diacriticas combinantes (acentos, etc.)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Si el nombre del producto es solo un tamaño (ej. "1 kg", "½ kg", "500g"),
// devuelve "{Categoría} {nombre}" para que se entienda en el carrito.
// Para nombres descriptivos (ej. "Muzzarella y jamón") devuelve el nombre tal cual.
function lfCartLabel(product, categories) {
  const name = String(product && product.name || '').trim();
  if (!name) return name;

  // Detectar nombres genéricos: solo cantidad + unidad (kg, gr, g, unidades, u)
  const isJustSize = /^(½|1\/2|\d+([.,]\d+)?)\s*(kg|gr|g|u|un|unidades?)\b/i.test(name);
  if (isJustSize) {
    const cat = lfGetCategoryById(categories, product.category);
    if (cat && cat.name) return cat.name + ' ' + name;
  }
  return name;
}

function lfGetCategoryById(categories, id) {
  return categories.find(c => c.id === id);
}

function lfGetProductById(products, id) {
  return products.find(p => p.id === id);
}

// Devuelve [{ category, products: [] }] ordenado por order
function lfGroupByCategory(products, categories) {
  const sorted = [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));
  return sorted.map(cat => ({
    category: cat,
    products: products.filter(p => p.category === cat.id),
  }));
}

// Restaura defaults (usado por el botón "Restablecer carta" del admin)
function lfResetToDefaults() {
  lfSaveProducts(lfClone(LF_DEFAULT_PRODUCTS));
  lfSaveCategories(lfClone(LF_DEFAULT_CATEGORIES));
}
