import { renderHeader } from '/includes/header.js';
import { renderFooter } from '/includes/footer.js';
import { initDrawer, toggleWishlist, isInWishlist } from '/assets/js/wishlist.js';
import { supabase } from '/assets/js/supabase.js';

renderHeader('catalogo');
renderFooter();
initDrawer();

// Estado de filtros
const filtros = {
  tipos: [],
  familias: [],
  ocasiones: [],
  marcas: [],
  generos: [],
  precioMax: 1000
};

let todosPerfumes = [];

// Cargar opciones de filtros desde Supabase
async function cargarFiltros() {
  const [tipos, familias, ocasiones, marcas] = await Promise.all([
    supabase.from('tipos_perfume').select('id, nombre').order('nombre'),
    supabase.from('familias_olfativas').select('id, nombre').order('nombre'),
    supabase.from('ocasiones').select('id, nombre').order('nombre'),
    supabase.from('marcas').select('id, nombre').order('nombre')
  ]);

  renderFiltroOpciones('filter-tipo', 'Tipo', tipos.data, 'tipos');
  renderFiltroOpciones('filter-familia', 'Familia olfativa', familias.data, 'familias');
  renderFiltroOpciones('filter-ocasion', 'Ocasión', ocasiones.data, 'ocasiones');
  renderFiltroOpciones('filter-marca', 'Marca', marcas.data, 'marcas');
  renderFiltroOpciones('filter-genero', 'Género', [
    { id: 'masculino', nombre: 'Masculino' },
    { id: 'femenino', nombre: 'Femenino' },
    { id: 'unisex', nombre: 'Unisex' }
  ], 'generos');
}

// Renderizar un grupo de checkboxes
function renderFiltroOpciones(containerId, label, opciones, key) {
  if (!opciones) return;
  document.getElementById(containerId).innerHTML = `
    <div class="filter-group__label">${label}</div>
    <div class="filter-group__options">
      ${opciones.map(o => `
        <label class="filter-option">
          <input type="checkbox" value="${o.id}" data-key="${key}">
          ${o.nombre}
        </label>
      `).join('')}
    </div>
  `;
}

// Cargar todos los perfumes
async function cargarPerfumes() {
  const { data, error } = await supabase
    .from('perfumes')
    .select(`
      id, nombre, precio, genero,
      id_marca, id_tipo_perfume, id_familia_olfativa,
      marcas(nombre),
      tipos_perfume(nombre),
      familias_olfativas(nombre),
      perfumes_imagenes(imagen_url, orden),
      perfumes_ocasiones(id_ocasion)
    `);

  if (error) {
    console.error('Error:', error);
    return;
  }

  todosPerfumes = data || [];
  renderPerfumes(todosPerfumes);
}

// Renderizar cards de perfumes
function renderPerfumes(perfumes) {
  const grid = document.getElementById('perfumes-grid');
  const count = document.getElementById('results-count');
  count.textContent = `${perfumes.length} resultado${perfumes.length !== 1 ? 's' : ''} encontrado${perfumes.length !== 1 ? 's' : ''}`;

  if (perfumes.length === 0) {
    grid.innerHTML = '<p class="catalogo-empty">No se encontraron perfumes con los filtros seleccionados.</p>';
    return;
  }

  grid.innerHTML = perfumes.map(p => {
    const imagen = p.perfumes_imagenes?.sort((a, b) => a.orden - b.orden)[0]?.imagen_url || '/assets/images/placeholder.jpg';
    const saved = isInWishlist(p.id);
    return `
      <div class="perfume-card">
        <div class="perfume-card__img">
          <img src="${imagen}" alt="${p.nombre}">
          <button class="perfume-card__save ${saved ? 'saved' : ''}"
            data-id="${p.id}"
            data-nombre="${p.nombre}"
            data-marca="${p.marcas?.nombre || ''}"
            data-precio="${p.precio}"
            data-imagen="${imagen}">
            ${saved ? '♥' : '♡'}
          </button>
        </div>
        <div class="perfume-card__body">
          <div class="perfume-card__brand">${p.marcas?.nombre || ''}</div>
          <div class="perfume-card__name">${p.nombre}</div>
          <div class="perfume-card__type">${p.familias_olfativas?.nombre || ''} · ${p.tipos_perfume?.nombre || ''}</div>
          <div class="perfume-card__footer">
            <span class="perfume-card__price">$${p.precio} USD</span>
            <a href="/pages/perfume.html?id=${p.id}" class="perfume-card__link">Ver →</a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Eventos de guardar
  grid.querySelectorAll('.perfume-card__save').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const { id, nombre, marca, precio, imagen } = btn.dataset;
      const saved = toggleWishlist({ id: Number(id), nombre, marca, precio, imagen });
      btn.textContent = saved ? '♥' : '♡';
      btn.classList.toggle('saved', saved);
    });
  });
}

// Aplicar filtros al array local
function aplicarFiltros() {
  let resultado = [...todosPerfumes];

  if (filtros.tipos.length)
    resultado = resultado.filter(p =>
      filtros.tipos.includes(String(p.id_tipo_perfume))
    );

  if (filtros.familias.length)
    resultado = resultado.filter(p =>
      filtros.familias.includes(String(p.id_familia_olfativa))
    );

  if (filtros.marcas.length)
    resultado = resultado.filter(p =>
      filtros.marcas.includes(String(p.id_marca))
    );

  if (filtros.generos.length)
    resultado = resultado.filter(p =>
      filtros.generos.includes(p.genero)
    );

  if (filtros.ocasiones.length)
    resultado = resultado.filter(p =>
      p.perfumes_ocasiones?.some(o =>
        filtros.ocasiones.includes(String(o.id_ocasion))
      )
    );

  resultado = resultado.filter(p => p.precio <= filtros.precioMax);

  const sort = document.getElementById('sort-select').value;
  if (sort === 'precio_asc') resultado.sort((a, b) => a.precio - b.precio);
  if (sort === 'precio_desc') resultado.sort((a, b) => b.precio - a.precio);
  if (sort === 'nombre') resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));

  renderPerfumes(resultado);
  renderActivePills();
}

// Mostrar pills de filtros activos
function renderActivePills() {
  const container = document.getElementById('active-filters');
  const pills = [];

  document.querySelectorAll('.filter-option input:checked').forEach(input => {
    const label = input.parentElement.textContent.trim();
    pills.push(`
      <span class="active-filter-pill">
        ${label}
        <button data-key="${input.dataset.key}" data-value="${input.value}" aria-label="Quitar filtro">×</button>
      </span>
    `);
  });

  container.innerHTML = pills.join('');

  container.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const { key, value } = btn.dataset;

      // Desmarcar el checkbox correspondiente
      const checkbox = document.querySelector(`.filter-option input[data-key="${key}"][value="${value}"]`);
      if (checkbox) checkbox.checked = false;

      // Actualizar el array de filtros directamente
      filtros[key] = filtros[key].filter(v => v !== value);

      // Aplicar filtros y rerenderizar pills
      aplicarFiltros();
    });
  });
}

// Eventos de filtros
document.addEventListener('change', e => {
  if (!e.target.matches('.filter-option input')) return;
  const { key } = e.target.dataset;
  const value = e.target.value;
  if (e.target.checked) {
    filtros[key].push(value);
  } else {
    filtros[key] = filtros[key].filter(v => v !== value);
  }
  aplicarFiltros();
});

document.getElementById('filter-precio').addEventListener('input', e => {
  filtros.precioMax = Number(e.target.value);
  document.getElementById('precio-label').textContent = `$${e.target.value} USD`;
  aplicarFiltros();
});

document.getElementById('sort-select').addEventListener('change', aplicarFiltros);

document.getElementById('clear-filters').addEventListener('click', () => {
  document.querySelectorAll('.filter-option input:checked').forEach(cb => cb.checked = false);
  document.getElementById('filter-precio').value = 1000;
  document.getElementById('precio-label').textContent = '$1000 USD';
  filtros.tipos = [];
  filtros.familias = [];
  filtros.ocasiones = [];
  filtros.marcas = [];
  filtros.generos = [];
  filtros.precioMax = 1000;
  aplicarFiltros();
});

// Iniciar
cargarFiltros();
cargarPerfumes();