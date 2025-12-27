/* ===================== STATE ===================== */
let products = JSON.parse(localStorage.getItem('products')) || [];
let apiProducts = [];

let barChart = null;
let donutChart = null;

/* ===================== DOM ===================== */
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');

const productForm = document.getElementById('product-form');
const productList = document.getElementById('product-list');
const apiContainer = document.getElementById('api-products');

const nameInput = document.getElementById('name');
const priceInput = document.getElementById('price');
const quantityInput = document.getElementById('quantity');
const descriptionInput = document.getElementById('description');
const editId = document.getElementById('edit-id');

const searchLocal = document.getElementById('search-local');
const searchApi = document.getElementById('api-search');

/* ===================== SPA NAV ===================== */
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();

    navLinks.forEach(l => l.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active-section'));

    link.classList.add('active');
    document
      .getElementById(link.dataset.section)
      .classList.add('active-section');
  });
});

/* ===================== STORAGE ===================== */
function save() {
  localStorage.setItem('products', JSON.stringify(products));
}

/* ===================== CRUD LOCAL ===================== */
function renderProducts(list = products) {
  productList.innerHTML = '';

  if (list.length === 0) {
    productList.innerHTML = `<p style="opacity:.6">Aucun produit local</p>`;
    updateDashboard();
    return;
  }

  list.forEach(p => {
    const div = document.createElement('div');
    div.className = 'product-item';

    div.innerHTML = `
      <h4>${p.name}</h4>
      <p>${p.price} €</p>
      <p>Qté: ${p.quantity}</p>
      <div class="actions">
        <button onclick="editProduct(${p.id})">Modifier</button>
        <button onclick="deleteProduct(${p.id})">Supprimer</button>
      </div>
    `;

    productList.appendChild(div);
  });

  updateDashboard();
}

productForm.addEventListener('submit', e => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const price = Number(priceInput.value);
  const quantity = Number(quantityInput.value);

  if (!name || isNaN(price) || isNaN(quantity)) {
    alert('Champs invalides');
    return;
  }

  if (editId.value) {
    const p = products.find(x => x.id == editId.value);
    if (!p) return;

    p.name = name;
    p.price = price;
    p.quantity = quantity;
    p.description = descriptionInput.value;
  } else {
    products.push({
      id: Date.now(),
      name,
      price,
      quantity,
      description: descriptionInput.value,
      source: 'local'
    });
  }

  save();
  renderProducts();
  productForm.reset();
  editId.value = '';
});
const menuBtn = document.querySelector('.menu-btn');
const sidebar = document.querySelector('.sidebar');

menuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('sidebar-hidden');
});


function editProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  editId.value = p.id;
  nameInput.value = p.name;
  priceInput.value = p.price;
  quantityInput.value = p.quantity;
  descriptionInput.value = p.description;
}

function deleteProduct(id) {
  if (!confirm('Supprimer ce produit ?')) return;

  products = products.filter(p => p.id !== id);
  save();
  renderProducts();
}

/* ===================== SEARCH LOCAL ===================== */
searchLocal.addEventListener('input', () => {
  const q = searchLocal.value.toLowerCase();
  renderProducts(
    products.filter(p => p.name.toLowerCase().includes(q))
  );
});

/* ===================== API ASYNCHRONE ===================== */
fetch('https://fakestoreapi.com/products?limit=8')
  .then(res => res.json())
  .then(data => {
    apiProducts = data;
    renderApiProducts();
  })
  .catch(err => {
    console.error('API error', err);
    apiContainer.innerHTML = `<p style="color:red">Erreur API</p>`;
  });

function renderApiProducts(list = apiProducts) {
  apiContainer.innerHTML = '';

  list.forEach(p => {
    const div = document.createElement('div');
    div.className = 'product-item';

    div.innerHTML = `
      <h4>${p.title}</h4>
      <p>${p.price} €</p>
      <button onclick="importApi(${p.id})">Importer</button>
    `;

    apiContainer.appendChild(div);
  });
}

/* ===================== SEARCH API ===================== */
searchApi.addEventListener('input', () => {
  const q = searchApi.value.toLowerCase();
  renderApiProducts(
    apiProducts.filter(p =>
      p.title.toLowerCase().includes(q)
    )
  );
});

/* ===================== IMPORT API (BONUS) ===================== */
function importApi(id) {
  const p = apiProducts.find(x => x.id === id);
  if (!p) return;

  if (products.some(prod => prod.name === p.title)) {
    alert('Produit déjà importé');
    return;
  }

  products.push({
    id: Date.now(),
    name: p.title,
    price: p.price,
    quantity: 1,
    description: p.description,
    source: 'local'
  });

  save();
  renderProducts();
}

/* ===================== DASHBOARD ===================== */
function updateDashboard() {
  const totalProducts = products.length;

  const totalStock = products.reduce(
    (sum, p) => sum + Number(p.quantity || 0),
    0
  );

  const avgPrice = totalProducts
    ? (
        products.reduce((sum, p) => sum + Number(p.price || 0), 0) /
        totalProducts
      ).toFixed(2)
    : 0;

  document.getElementById('kpi-total').textContent = totalProducts;
  document.getElementById('kpi-stock').textContent = totalStock;
  document.getElementById('kpi-avg').textContent = avgPrice;

  renderBarChart();
  renderDonutChart();
}

/* ===================== BAR CHART ===================== */
function renderBarChart() {
  const ctx = document.getElementById('productsChart');
  if (!ctx) return;

  if (barChart) barChart.destroy();

  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: products.map(p => p.name),
      datasets: [{
        data: products.map(p => p.price),
        backgroundColor: '#7c3aed'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });
}

/* ===================== DONUT CHART ===================== */
function renderDonutChart() {
  const ctx = document.getElementById('stockDonutChart');
  if (!ctx) return;

  if (donutChart) donutChart.destroy();

  donutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: products.map(p => p.name),
      datasets: [{
        data: products.map(p => p.quantity),
        backgroundColor: [
          '#7c3aed',
          '#9333ea',
          '#a78bfa',
          '#6d28d9',
          '#8b5cf6'
        ],
        borderWidth: 0
      }]
    },
    options: {
      cutout: '70%',
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#e5e7eb' }
        }
      }
    }
  });
}
/* ===================== SIDEBAR TOGGLE ===================== */
/* ===================== INIT ===================== */
renderProducts();
