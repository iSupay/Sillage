// Importaciones de módulos — header, footer, wishlist y cliente de Supabase
import { renderHeader } from '/includes/header.js';
import { renderFooter } from '/includes/footer.js';
import { initDrawer, toggleWishlist, isInWishlist, updateBadge } from '/assets/js/wishlist.js';
import { supabase } from '/assets/js/supabase.js';

// Se renderizan el header y footer, y se inicializa el drawer de lista de interés
renderHeader('');
renderFooter();
initDrawer();

// Consulta los primeros 4 perfumes de la base de datos para mostrarlos como destacados
async function cargarDestacados() {
  const { data, error } = await supabase
    .from('perfumes')
    .select(`
      id, nombre, precio,
      marcas(nombre),
      tipos_perfume(nombre),
      perfumes_imagenes(imagen_url, orden)
    `)
    .limit(4);

  if (error || !data) return;

  document.getElementById('featured-grid').innerHTML = data.map(p => {
    // Se ordena por el campo "orden" y se toma la primera imagen como portada
    const imagen = p.perfumes_imagenes?.sort((a, b) => a.orden - b.orden)[0]?.imagen_url || '/assets/images/placeholder.jpg';
    // Se verifica si el perfume ya está guardado en localStorage
    const saved = isInWishlist(p.id);
    return `
      <div class="perfume-card">
        <div class="perfume-card__img">
          <img src="${imagen}" alt="${p.nombre}">
          <!-- data-* almacena los datos del perfume en el botón para usarlos al guardar -->
          <button class="perfume-card__save ${saved ? 'saved' : ''}" data-id="${p.id}" data-nombre="${p.nombre}" data-marca="${p.marcas?.nombre || ''}" data-precio="${p.precio}" data-imagen="${imagen}">
            ${saved ? '♥' : '♡'}
          </button>
        </div>
        <div class="perfume-card__body">
          <div class="perfume-card__brand">${p.marcas?.nombre || ''}</div>
          <div class="perfume-card__name">${p.nombre}</div>
          <div class="perfume-card__type">${p.tipos_perfume?.nombre || ''}</div>
          <div class="perfume-card__footer">
            <span class="perfume-card__price">$${p.precio} USD</span>
            <!-- El ID se pasa por parámetro en la URL para que perfume.js lo recupere -->
            <a href="/pages/perfume.html?id=${p.id}" class="perfume-card__link">Ver detalle →</a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Los eventos se asignan después de renderizar porque los botones son dinámicos
  document.querySelectorAll('.perfume-card__save').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const { id, nombre, marca, precio, imagen } = btn.dataset;
      // toggleWishlist agrega o quita el perfume del localStorage y devuelve el nuevo estado
      const saved = toggleWishlist({ id: Number(id), nombre, marca, precio, imagen });
      btn.textContent = saved ? '♥' : '♡';
      btn.classList.toggle('saved', saved);
    });
  });
}

cargarDestacados();