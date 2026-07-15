// Obtener lista del localStorage
export function getWishlist() {
  return JSON.parse(localStorage.getItem('sillage_wishlist') || '[]');
}

// Guardar lista en localStorage
function saveWishlist(items) {
  localStorage.setItem('sillage_wishlist', JSON.stringify(items));
}

// Agregar o quitar un perfume — devuelve true si se agregó
export function toggleWishlist(perfume) {
  const items = getWishlist();
  const index = items.findIndex(i => i.id === perfume.id);
  if (index === -1) {
    items.push(perfume);
  } else {
    items.splice(index, 1);
  }
  saveWishlist(items);
  updateBadge();
  renderDrawer();
  return index === -1;
}

// Verificar si un perfume está en la lista
export function isInWishlist(id) {
  return getWishlist().some(i => i.id === id);
}

// Actualizar el ícono y badge del navbar
export function updateBadge() {
  const items = getWishlist();
  const icon = document.getElementById('wishlist-icon');
  const badge = document.getElementById('wishlist-badge');
  if (!icon || !badge) return;
  icon.textContent = items.length > 0 ? '♥' : '♡';
  badge.style.display = items.length > 0 ? 'flex' : 'none';
  badge.textContent = items.length;
}

// Renderizar las cards del drawer
export function renderDrawer() {
  const items = getWishlist();
  const body = document.getElementById('drawer-body');
  const count = document.getElementById('drawer-count');
  if (!body) return;

  count.textContent = `${items.length} perfume${items.length !== 1 ? 's' : ''} guardado${items.length !== 1 ? 's' : ''}`;

  if (items.length === 0) {
    body.innerHTML = `<p class="drawer__empty">Tu lista está vacía. Guarda perfumes usando el ♡</p>`;
    return;
  }

  body.innerHTML = items.map(p => `
    <div class="saved-card">
      <div class="saved-card__img">
        <img src="${p.imagen}" alt="${p.nombre}">
      </div>
      <div class="saved-card__info">
        <div class="saved-card__brand">${p.marca}</div>
        <div class="saved-card__name">${p.nombre}</div>
        <div class="saved-card__price">$${p.precio} USD</div>
      </div>
      <div class="saved-card__actions">
        <button class="saved-card__remove" data-id="${p.id}">♥</button>
        <a href="/pages/perfume.html?id=${p.id}" class="saved-card__view">Ver detalle</a>
      </div>
    </div>
  `).join('');

  // Eventos de quitar
  body.querySelectorAll('.saved-card__remove').forEach(btn => {
    btn.addEventListener('click', () => {
      const items = getWishlist().filter(i => i.id !== Number(btn.dataset.id));
      saveWishlist(items);
      updateBadge();
      renderDrawer();
    });
  });
}

// Inicializar drawer y sus eventos
export function initDrawer() {
  updateBadge();
  renderDrawer();

  document.getElementById('wishlist-btn')?.addEventListener('click', () => {
    document.getElementById('drawer-overlay').classList.add('active');
    document.getElementById('wishlist-drawer').classList.add('active');
  });

  const cerrar = () => {
    document.getElementById('drawer-overlay').classList.remove('active');
    document.getElementById('wishlist-drawer').classList.remove('active');
  };

  document.getElementById('drawer-close')?.addEventListener('click', cerrar);
  document.getElementById('drawer-overlay')?.addEventListener('click', cerrar);

  document.getElementById('drawer-clear')?.addEventListener('click', () => {
    localStorage.removeItem('sillage_wishlist');
    updateBadge();
    renderDrawer();
  });
}