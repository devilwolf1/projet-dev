/* ===================== STATE MANAGEMENT ===================== */
let currentSection = 'dashboard';

let products = JSON.parse(localStorage.getItem('products')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || [
  { id: 1, name: 'Électronique' },
  { id: 2, name: 'Informatique' },
  { id: 3, name: 'Téléphonie' }
];
let apiProducts = [];
let currentFilter = '';
let currentSort = 'name-asc';

let barChart = null;
let donutChart = null;

/* ===================== DOM ELEMENTS ===================== */
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');

const productForm = document.getElementById('product-form');
const productList = document.getElementById('product-list');
const apiContainer = document.getElementById('api-products');

const nameInput = document.getElementById('name');
const priceInput = document.getElementById('price');
const quantityInput = document.getElementById('quantity');
const descriptionInput = document.getElementById('description');
const categorySelect = document.getElementById('category-select');
const editId = document.getElementById('edit-id');

const searchLocal = document.getElementById('search-local');
const searchApi = document.getElementById('api-search');
const sortSelect = document.getElementById('sort-products');

const categoryForm = document.getElementById('category-form');
const categoryNameInput = document.getElementById('category-name');
const categoryList = document.getElementById('category-list');

const formTitle = document.getElementById('form-title');
const btnText = document.getElementById('btn-text');
const cancelBtn = document.getElementById('cancel-edit');

const modal = document.getElementById('product-modal');
const modalBody = document.getElementById('modal-body');

/* ===================== SPA NAVIGATION ===================== */
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();

    const targetSection = link.dataset.section;
    currentSection = targetSection;

    navLinks.forEach(l => l.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active-section'));

    link.classList.add('active');
    document.getElementById(targetSection).classList.add('active-section');

    if (targetSection === 'dashboard') {
      updateDashboard(); // ✅ SEULEMENT ICI
    }

    if (targetSection === 'api' && apiProducts.length === 0) {
      fetchApiProducts();
    }
  });
});


/* ===================== STORAGE ===================== */
function saveProducts() {
  localStorage.setItem('products', JSON.stringify(products));
}

function saveCategories() {
  localStorage.setItem('categories', JSON.stringify(categories));
}

/* ===================== CATEGORIES (MODULE 2) ===================== */
function renderCategories() {
  categoryList.innerHTML = '';
  
  if (categories.length === 0) {
    categoryList.innerHTML = '<p class="empty-state"><i class="fas fa-tags"></i><br>Aucune catégorie</p>';
    return;
  }
  
  categories.forEach(cat => {
    const div = document.createElement('div');
    div.className = 'category-item';
    
    const productCount = products.filter(p => p.categoryId === cat.id).length;
    
    div.innerHTML = `
      <div class="category-info">
        <h4>${cat.name}</h4>
        <span>${productCount} produit(s)</span>
      </div>
      <button onclick="deleteCategory(${cat.id})" title="Supprimer">
        <i class="fas fa-trash"></i>
      </button>
    `;
    
    categoryList.appendChild(div);
  });
  
  updateCategorySelect();
 

}

function updateCategorySelect() {
  const currentValue = categorySelect.value;
  categorySelect.innerHTML = '<option value="">-- Sélectionner --</option>';
  
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.name;
    categorySelect.appendChild(option);
  });
  
  if (currentValue) {
    categorySelect.value = currentValue;
  }
}

categoryForm.addEventListener('submit', e => {
  e.preventDefault();
  
  const name = categoryNameInput.value.trim();
  
  if (!name) {
    alert('Le nom de la catégorie est requis');
    return;
  }
  
  if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    alert('Cette catégorie existe déjà');
    return;
  }
  
  categories.push({
    id: Date.now(),
    name: name
  });
  
  saveCategories();
  renderCategories();
  categoryForm.reset();
});

function deleteCategory(id) {
  const category = categories.find(c => c.id === id);
  const productCount = products.filter(p => p.categoryId === id).length;
  
  if (productCount > 0) {
    if (!confirm(`Cette catégorie contient ${productCount} produit(s). Voulez-vous vraiment la supprimer ?`)) {
      return;
    }
  } else {
    if (!confirm(`Supprimer la catégorie "${category.name}" ?`)) {
      return;
    }
  }
  
  categories = categories.filter(c => c.id !== id);
  saveCategories();
  renderCategories();
}

/* ===================== PRODUCTS (MODULE 1 - CRUD COMPLET) ===================== */
function renderProducts(list = null) {
  const filteredProducts = list || getFilteredAndSortedProducts();
  
  productList.innerHTML = '';
  
  if (filteredProducts.length === 0) {
    productList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-box-open"></i>
        <p>Aucun produit trouvé</p>
      </div>
    `;
    
    return;
  }
  
  filteredProducts.forEach(p => {
    const category = categories.find(c => c.id === p.categoryId);
    const categoryName = category ? category.name : 'Sans catégorie';
    
    // Badge de stock
    let stockBadge = '';
    if (p.quantity > 10) {
      stockBadge = '<span class="product-badge badge-high">Stock élevé</span>';
    } else if (p.quantity <= 5) {
      stockBadge = '<span class="product-badge badge-low">Stock faible</span>';
    } else {
      stockBadge = '<span class="product-badge badge-medium">Stock moyen</span>';
    }
    
    const div = document.createElement('div');
    div.className = 'product-item';
    
    div.innerHTML = `
      ${stockBadge}
      <h4>${p.name}</h4>
      <div class="price">${parseFloat(p.price).toFixed(2)} €</div>
      <p><i class="fas fa-cubes"></i> Quantité: ${p.quantity}</p>
      <span class="category-tag"><i class="fas fa-tag"></i> ${categoryName}</span>
      ${p.description ? `<p style="margin-top:12px; font-size:12px; color:#6b7280;">${p.description.substring(0, 80)}${p.description.length > 80 ? '...' : ''}</p>` : ''}
      <div class="product-actions">
        <button class="btn-view" onclick="viewProduct(${p.id})" title="Voir détails">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn-edit" onclick="editProduct(${p.id})" title="Modifier">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-delete" onclick="deleteProduct(${p.id})" title="Supprimer">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
    
    productList.appendChild(div);
  });
  
  updateDashboard();
}

function getFilteredAndSortedProducts() {
  let filtered = products.filter(p => 
    p.name.toLowerCase().includes(currentFilter.toLowerCase())
  );
  
  // Tri
  switch(currentSort) {
    case 'name-asc':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      filtered.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'price-asc':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'quantity-asc':
      filtered.sort((a, b) => a.quantity - b.quantity);
      break;
    case 'quantity-desc':
      filtered.sort((a, b) => b.quantity - a.quantity);
      break;
  }
  
  return filtered;
}

// Validation du formulaire
function validateForm() {
  let isValid = true;
  
  // Reset errors
  document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
  document.querySelectorAll('input, select').forEach(el => el.classList.remove('error'));
  
  // Nom
  if (!nameInput.value.trim()) {
    showError('name', 'Le nom est requis');
    isValid = false;
  }
  
  // Catégorie
  if (!categorySelect.value) {
    showError('category', 'La catégorie est requise');
    isValid = false;
  }
  
  // Prix
  if (!priceInput.value || parseFloat(priceInput.value) < 0) {
    showError('price', 'Le prix doit être positif');
    isValid = false;
  }
  
  // Quantité
  if (!quantityInput.value || parseInt(quantityInput.value) < 0) {
    showError('quantity', 'La quantité doit être positive');
    isValid = false;
  }
  
  return isValid;
}

function showError(field, message) {
  const input = document.getElementById(field === 'category' ? 'category-select' : field);
  const error = document.getElementById(`${field}-error`);
  
  if (input) input.classList.add('error');
  if (error) {
    error.textContent = message;
    error.style.display = 'block';
  }
}

productForm.addEventListener('submit', e => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }
  
  const name = nameInput.value.trim();
  const price = parseFloat(priceInput.value);
  const quantity = parseInt(quantityInput.value);
  const categoryId = parseInt(categorySelect.value);
  const description = descriptionInput.value.trim();
  
  if (editId.value) {
    // Modification
    const p = products.find(x => x.id == editId.value);
    if (!p) return;
    
    p.name = name;
    p.price = price;
    p.quantity = quantity;
    p.categoryId = categoryId;
    p.description = description;
    
    alert('Produit modifié avec succès!');
  } else {
    // Ajout
    products.push({
      id: Date.now(),
      name,
      price,
      quantity,
      categoryId,
      description,
      source: 'local'
    });
    
    alert('Produit ajouté avec succès!');
  }
  
  saveProducts();
  renderProducts();
  resetForm();
});

function resetForm() {
  productForm.reset();
  editId.value = '';
  formTitle.textContent = 'Ajouter un produit';
  btnText.textContent = 'Enregistrer';
  cancelBtn.style.display = 'none';
  
  document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
  document.querySelectorAll('input, select').forEach(el => el.classList.remove('error'));
}

cancelBtn.addEventListener('click', resetForm);

function editProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  
  editId.value = p.id;
  nameInput.value = p.name;
  priceInput.value = p.price;
  quantityInput.value = p.quantity;
  categorySelect.value = p.categoryId || '';
  descriptionInput.value = p.description || '';
  
  formTitle.textContent = 'Modifier un produit';
  btnText.textContent = 'Mettre à jour';
  cancelBtn.style.display = 'inline-flex';
  
  // Scroll vers le formulaire
document.querySelector('.main-content').scrollTo({
  top: 0,
  behavior: 'smooth'
});
}

function deleteProduct(id) {
  const product = products.find(p => p.id === id);
  
  if (!confirm(`Êtes-vous sûr de vouloir supprimer "${product.name}" ?`)) {
    return;
  }
  
  products = products.filter(p => p.id !== id);
  saveProducts();
  renderProducts();
  
  alert('Produit supprimé avec succès!');
}

function viewProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  
  const category = categories.find(c => c.id === p.categoryId);
  const categoryName = category ? category.name : 'Sans catégorie';
  
  let stockStatus = '';
  let stockClass = '';
  if (p.quantity > 10) {
    stockStatus = 'Stock élevé';
    stockClass = 'text-success';
  } else if (p.quantity <= 5) {
    stockStatus = 'Stock faible';
    stockClass = 'text-warning';
  } else {
    stockStatus = 'Stock moyen';
    stockClass = 'text-info';
  }
  
  modalBody.innerHTML = `
    <div class="modal-header">
      <h3>${p.name}</h3>
    </div>
    <div class="modal-body">
      <div class="modal-detail">
        <label><i class="fas fa-euro-sign"></i> Prix</label>
        <p class="price">${parseFloat(p.price).toFixed(2)} €</p>
      </div>
      <div class="modal-detail">
        <label><i class="fas fa-cubes"></i> Quantité en stock</label>
        <p>${p.quantity} unité(s) - <span class="${stockClass}">${stockStatus}</span></p>
      </div>
      <div class="modal-detail">
        <label><i class="fas fa-tag"></i> Catégorie</label>
        <p>${categoryName}</p>
      </div>
      ${p.description ? `
        <div class="modal-detail">
          <label><i class="fas fa-align-left"></i> Description</label>
          <p>${p.description}</p>
        </div>
      ` : ''}
      <div class="modal-detail">
        <label><i class="fas fa-calculator"></i> Valeur totale</label>
        <p>${(p.price * p.quantity).toFixed(2)} €</p>
      </div>
    </div>
  `;
  
  modal.classList.add('show');
}

// Fermeture du modal
document.querySelector('.modal-close').addEventListener('click', () => {
  modal.classList.remove('show');
});

modal.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.remove('show');
  }
});

/* ===================== SEARCH & SORT ===================== */
searchLocal.addEventListener('input', () => {
  currentFilter = searchLocal.value;
  renderProducts();
});

sortSelect.addEventListener('change', () => {
  currentSort = sortSelect.value;
  renderProducts();
});

/* ===================== API ASYNCHRONE (MODULE 3) ===================== */
function fetchApiProducts() {
  apiContainer.innerHTML = '<p style="text-align:center; color: var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Chargement des produits...</p>';
  
  fetch('https://fakestoreapi.com/products?limit=12')
    .then(res => {
      if (!res.ok) throw new Error('Erreur réseau');
      return res.json();
    })
    .then(data => {
      apiProducts = data;
      renderApiProducts();
    })
    .catch(err => {
      console.error('API error', err);
      apiContainer.innerHTML = `
        <div class="empty-state" style="color: var(--danger);">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Erreur lors du chargement de l'API</p>
        </div>
      `;
    });
}

function renderApiProducts(list = apiProducts) {
  apiContainer.innerHTML = '';
  
  if (list.length === 0) {
    apiContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-cloud"></i>
        <p>Aucun produit trouvé</p>
      </div>
    `;
    return;
  }
  
  list.forEach(p => {
    const div = document.createElement('div');
    div.className = 'product-item';
    
    const isImported = products.some(prod => prod.name === p.title);
    
    div.innerHTML = `
      <h4>${p.title.substring(0, 50)}${p.title.length > 50 ? '...' : ''}</h4>
      <div class="price">${parseFloat(p.price).toFixed(2)} €</div>
      <p><i class="fas fa-layer-group"></i> ${p.category}</p>
      <div class="product-actions" style="margin-top: 16px;">
        ${isImported 
          ? '<button class="btn-sm" disabled style="background:#e5e7eb; color:#6b7280; cursor:not-allowed;"><i class="fas fa-check"></i> Déjà importé</button>'
          : `<button class="btn-import" onclick="importApi(${p.id})"><i class="fas fa-download"></i> Importer</button>`
        }
      </div>
    `;
    
    apiContainer.appendChild(div);
  });
  
  
}

searchApi.addEventListener('input', () => {
  const q = searchApi.value.toLowerCase();
  renderApiProducts(
    apiProducts.filter(p => p.title.toLowerCase().includes(q))
  );
});

document.getElementById('refresh-api')?.addEventListener('click', fetchApiProducts);

function importApi(id) {
  const p = apiProducts.find(x => x.id === id);
  if (!p) return;
  
  if (products.some(prod => prod.name === p.title)) {
    alert('Ce produit a déjà été importé');
    return;
  }
  
  // Trouver ou créer la catégorie
  let category = categories.find(c => c.name.toLowerCase() === p.category.toLowerCase());
  
  if (!category) {
    category = {
      id: Date.now(),
      name: p.category.charAt(0).toUpperCase() + p.category.slice(1)
    };
    categories.push(category);
    saveCategories();
    renderCategories();
  }
  
  products.push({
    id: Date.now(),
    name: p.title,
    price: p.price,
    quantity: 5, // Quantité par défaut
    categoryId: category.id,
    description: p.description,
    source: 'api'
  });
  
  saveProducts();
  renderProducts();
  renderApiProducts(); // Re-render pour mettre à jour le statut
  
  alert('Produit importé avec succès!');
}

/* ===================== DASHBOARD (MODULE 3) ===================== */
function updateDashboard() {
  // KPI 1: Total produits
  const totalProducts = products.length;
  document.getElementById('kpi-total').textContent = totalProducts;
  
  // KPI 2: Stock total
  const totalStock = products.reduce((sum, p) => sum + parseInt(p.quantity || 0), 0);
  document.getElementById('kpi-stock').textContent = totalStock;
  
  // KPI 3: Prix moyen
  const avgPrice = totalProducts > 0
    ? (products.reduce((sum, p) => sum + parseFloat(p.price || 0), 0) / totalProducts).toFixed(2)
    : 0;
  document.getElementById('kpi-avg').textContent = avgPrice;
  
  // KPI 4: Nombre de catégories
  document.getElementById('kpi-categories').textContent = categories.length;
  
  // Stats additionnelles
  const highStock = products.filter(p => p.quantity > 10).length;
  const lowStock = products.filter(p => p.quantity <= 5).length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0).toFixed(2);
  
  document.getElementById('high-stock').textContent = highStock;
  document.getElementById('low-stock').textContent = lowStock;
  document.getElementById('total-value').textContent = totalValue + '€';
  
  // Charts
  renderBarChart();
  renderDonutChart();
}

/* ===================== BAR CHART ===================== */
function renderBarChart() {
  const ctx = document.getElementById('productsChart');
  if (!ctx) return;
  
  if (barChart) barChart.destroy();
  
  // Limiter à 10 produits pour la lisibilité
  const topProducts = [...products]
    .sort((a, b) => b.price - a.price)
    .slice(0, 10);
  
  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: topProducts.map(p => p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name),
      datasets: [{
        label: 'Prix (€)',
        data: topProducts.map(p => p.price),
        backgroundColor: 'rgba(124, 58, 237, 0.8)',
        borderColor: '#7c3aed',
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#1e1e2e',
          titleColor: '#f5f5f7',
          bodyColor: '#f5f5f7',
          borderColor: '#7c3aed',
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return 'Prix: ' + context.parsed.y.toFixed(2) + ' €';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#6b7280',
            callback: function(value) {
              return value + ' €';
            }
          },
          grid: {
            color: 'rgba(229, 231, 235, 0.3)'
          }
        },
        x: {
          ticks: {
            color: '#6b7280'
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

/* ===================== DONUT CHART ===================== */
function renderDonutChart() {
  const ctx = document.getElementById('stockDonutChart');
  if (!ctx) return;
  
  if (donutChart) donutChart.destroy();
  
  // Limiter à 8 produits
  const topStock = [...products]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);
  
  if (topStock.length === 0) {
    return;
  }
  
  const colors = [
    '#7c3aed', '#9333ea', '#a78bfa', '#6d28d9',
    '#8b5cf6', '#c4b5fd', '#5b21b6', '#7e22ce'
  ];
  
  donutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: topStock.map(p => p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name),
      datasets: [{
        data: topStock.map(p => p.quantity),
        backgroundColor: colors,
        borderWidth: 0,
        hoverOffset: 10
      }]
    },
    options: {
      cutout: '70%',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#6b7280',
            padding: 15,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: '#1e1e2e',
          titleColor: '#f5f5f7',
          bodyColor: '#f5f5f7',
          borderColor: '#7c3aed',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return label + ': ' + value + ' (' + percentage + '%)';
            }
          }
        }
      }
    }
  });
}

/* ===================== SIDEBAR TOGGLE ===================== */
const menuBtn = document.querySelector('.menu-btn');
const sidebar = document.querySelector('.sidebar');

menuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('sidebar-hidden');
});

/* ===================== INITIALIZATION ===================== */
function init() {
  // Sauvegarder les catégories par défaut si nécessaire
  if (!localStorage.getItem('categories')) {
    saveCategories();
  }
  
  // Render initial
  renderCategories();
  renderProducts();
  updateDashboard();
  
  console.log('✅ TechStore initialisé avec succès!');
  console.log(`📦 ${products.length} produits chargés`);
  console.log(`🏷️ ${categories.length} catégories chargées`);
}

// Lancer l'application
init();