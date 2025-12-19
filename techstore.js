const menuBtn = document.querySelector('.menu-btn');
const sidebar = document.querySelector('.sidebar');
const mainContent = document.querySelector('.main-content');

menuBtn.addEventListener('click', () => {
  sidebar.classList.toggle('hidden');
  mainContent.classList.toggle('full');
});
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();

   
    const targetId = link.dataset.section;

    // Gestion des liens actifs
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    // Cacher toutes les sections
    sections.forEach(section => {
      section.classList.remove('active-section');
    });

    // Afficher la section cible
    const targetSection = document.getElementById(targetId);
    if (targetSection) {
      targetSection.classList.add('active-section');
    }
  });
});
// ====== PRODUITS ======

// Tableau des produits
let products = [];

// Sélection des éléments
const productForm = document.getElementById('product-form');
const nameInput = document.getElementById('name');
const priceInput = document.getElementById('price');
const quantityInput = document.getElementById('quantity');
const descriptionInput = document.getElementById('description');
const productList = document.getElementById('product-list');

// Écoute du formulaire
productForm.addEventListener('submit', function (e) {
  e.preventDefault();

  // Création du produit
  const product = {
    id: Date.now(),
    name: nameInput.value,
    price: priceInput.value,
    quantity: quantityInput.value,
    description: descriptionInput.value
  };

  // Ajout au tableau
  products.push(product);

  // Mise à jour de l'affichage
  displayProducts();

  // Réinitialiser le formulaire
  productForm.reset();
});

// Affichage des produits
function displayProducts() {
  productList.innerHTML = '';

  products.forEach(product => {
    const div = document.createElement('div');
    div.classList.add('product-item');

    div.innerHTML = `
      <h4>${product.name}</h4>
      <p>Prix : ${product.price}</p>
      <p>Quantité : ${product.quantity}</p>
      <p>${product.description}</p>
    `;

    productList.appendChild(div);
  });
}
