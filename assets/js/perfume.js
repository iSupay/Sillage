import { renderHeader } from '/includes/header.js';
import { renderFooter } from '/includes/footer.js';
import { initDrawer, toggleWishlist, isInWishlist } from '/assets/js/wishlist.js';
import { supabase } from '/assets/js/supabase.js';

renderHeader('');
renderFooter();
initDrawer();

const id = new URLSearchParams(window.location.search).get('id');
const container = document.getElementById('perfume-container');

if (!id) {
  container.innerHTML = '<p class="error">Perfume no encontrado.</p>';
} else {
  cargarPerfume(id);
}

async function cargarPerfume(id) {
  const { data, error } = await supabase
    .from('perfumes')
    .select(`
      id, nombre, descripcion, precio, genero,
      marcas(nombre),
      tipos_perfume(nombre),
      familias_olfativas(nombre),
      perfumes_imagenes(imagen_url, orden),
      perfumes_ocasiones(ocasiones(nombre)),
      perfumes_notas(tipo_nota, notas_aromaticas(nombre))
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    container.innerHTML = '<p class="error">No se pudo cargar el perfume.</p>';
    return;
  }

  document.title = `${data.nombre} — Sillage`;
  document.getElementById('breadcrumb-nombre').textContent = data.nombre;

  const imagenes = data.perfumes_imagenes?.sort((a, b) => a.orden - b.orden) || [];
  const imagenPrincipal = imagenes[0]?.imagen_url || '/assets/images/placeholder.jpg';
  const saved = isInWishlist(data.id);

  const notas = { salida: [], corazon: [], fondo: [] };
  data.perfumes_notas?.forEach(n => {
    if (notas[n.tipo_nota]) notas[n.tipo_nota].push(n.notas_aromaticas?.nombre);
  });

  const ocasiones = data.perfumes_ocasiones?.map(o => o.ocasiones?.nombre).filter(Boolean) || [];

  container.innerHTML = `
    <div class="perfume-top">

      <div class="galeria">
        <div class="galeria__principal">
          <img src="${imagenPrincipal}" alt="${data.nombre}" id="img-principal">
        </div>
        <div class="galeria__thumbs">
          ${imagenes.map((img, i) => `
            <div class="galeria__thumb ${i === 0 ? 'active' : ''}" data-src="${img.imagen_url}">
              <img src="${img.imagen_url}" alt="${data.nombre}">
            </div>
          `).join('')}
        </div>
      </div>

      <div class="info">
        <div class="info__eyebrow">${data.tipos_perfume?.nombre || ''} · ${data.familias_olfativas?.nombre || ''}</div>
        <div class="info__marca">${data.marcas?.nombre || ''}</div>
        <h1 class="info__nombre">${data.nombre}</h1>
        <div class="info__precio">$${data.precio} USD</div>
        <div class="info__tags">
          <span class="info__tag">${data.tipos_perfume?.nombre || ''}</span>
          <span class="info__tag info__tag--accent">${data.genero || ''}</span>
        </div>
        <p class="info__desc">${data.descripcion || ''}</p>
        <div class="info__btns">
          <button class="btn ${saved ? 'btn--saved' : 'btn--primary'}" id="save-btn">
            ${saved ? '♥ Guardado' : '♡ Guardar en lista'}
          </button>
          <a href="/pages/catalogo.html" class="btn btn--outline">← Volver</a>
        </div>
        <p class="info__save-note" id="save-note" style="display:${saved ? 'block' : 'none'}">
          Haz clic para quitar de tu lista.
        </p>
      </div>

    </div>

    <div class="divider"></div>

    <div class="piramide">
      <div class="piramide__header">
        <div class="section-eyebrow">Composición</div>
        <div class="section-title">Pirámide olfativa</div>
        <div class="section-sub">Las notas evolucionan con el tiempo sobre la piel</div>
      </div>
      <div class="piramide__grid">
        <div class="piramide__col">
          <div class="piramide__tipo">Salida</div>
          <div class="piramide__subtitulo">Notas de cabeza</div>
          ${notas.salida.map(n => `<div class="piramide__nota">${n}</div>`).join('') || '<div class="piramide__nota">—</div>'}
        </div>
        <div class="piramide__col piramide__col--highlight">
          <div class="piramide__tipo">Corazón</div>
          <div class="piramide__subtitulo">Notas de cuerpo</div>
          ${notas.corazon.map(n => `<div class="piramide__nota">${n}</div>`).join('') || '<div class="piramide__nota">—</div>'}
        </div>
        <div class="piramide__col">
          <div class="piramide__tipo">Fondo</div>
          <div class="piramide__subtitulo">Notas de base</div>
          ${notas.fondo.map(n => `<div class="piramide__nota">${n}</div>`).join('') || '<div class="piramide__nota">—</div>'}
        </div>
      </div>
    </div>

    ${ocasiones.length > 0 ? `
      <div class="divider"></div>
      <div class="ocasiones">
        <div class="section-eyebrow">Uso recomendado</div>
        <div class="section-title">Ocasiones</div>
        <div class="ocasiones__pills">
          ${ocasiones.map(o => `<span class="ocasiones__pill">${o}</span>`).join('')}
        </div>
      </div>
    ` : ''}
  `;

  // Galería — cambiar imagen principal al hacer clic en miniatura
  container.querySelectorAll('.galeria__thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.getElementById('img-principal').src = thumb.dataset.src;
      container.querySelectorAll('.galeria__thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  // Botón guardar
  document.getElementById('save-btn').addEventListener('click', () => {
    const saved = toggleWishlist({
      id: data.id,
      nombre: data.nombre,
      marca: data.marcas?.nombre || '',
      precio: data.precio,
      imagen: imagenPrincipal
    });
    const btn = document.getElementById('save-btn');
    const note = document.getElementById('save-note');
    btn.textContent = saved ? '♥ Guardado' : '♡ Guardar en lista';
    btn.className = `btn ${saved ? 'btn--saved' : 'btn--primary'}`;
    note.style.display = saved ? 'block' : 'none';
  });
}