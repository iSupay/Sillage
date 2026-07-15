import { supabase } from '/assets/js/supabase.js';

const path = window.location.pathname;

// ── LOGIN ──────────────────────────────────────────
if (path.includes('login')) {

  document.getElementById('login-btn').addEventListener('click', async () => {
    const correo = document.getElementById('correo').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');

    errorEl.style.display = 'none';

    const { error } = await supabase.auth.signInWithPassword({ email: correo, password });

    if (error) {
      errorEl.textContent = 'Correo o contraseña incorrectos.';
      errorEl.style.display = 'block';
    } else {
      window.location.href = '/admin/panel.html';
    }
  });
}

// ── PANEL ──────────────────────────────────────────
if (path.includes('panel')) {

  supabase.auth.getSession().then(({ data }) => {
    if (!data.session) window.location.href = '/admin/login.html';
  });

  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/login.html';
  });

  document.querySelectorAll('.panel-sidebar__item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.panel-sidebar__item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const seccion = item.dataset.seccion;
      document.querySelectorAll('.panel-seccion').forEach(s => s.style.display = 'none');
      document.getElementById(`seccion-${seccion}`).style.display = 'block';
    });
  });

  cargarStats();
  cargarPerfumes();
  cargarCategorias();

  // ── ESTADÍSTICAS ──
  async function cargarStats() {
    const [perfumes, marcas, familias, notas] = await Promise.all([
      supabase.from('perfumes').select('id', { count: 'exact' }),
      supabase.from('marcas').select('id', { count: 'exact' }),
      supabase.from('familias_olfativas').select('id', { count: 'exact' }),
      supabase.from('notas_aromaticas').select('id', { count: 'exact' })
    ]);

    document.getElementById('stat-perfumes').textContent = perfumes.count || 0;
    document.getElementById('stat-marcas').textContent = marcas.count || 0;
    document.getElementById('stat-familias').textContent = familias.count || 0;
    document.getElementById('stat-notas').textContent = notas.count || 0;
  }

  // ── PERFUMES ──
  let perfumesData = [];

  async function cargarPerfumes() {
    const { data } = await supabase
      .from('perfumes')
      .select(`
        id, nombre, precio, genero,
        marcas(id, nombre),
        tipos_perfume(id, nombre),
        familias_olfativas(id, nombre)
      `)
      .order('nombre');

    perfumesData = data || [];
    renderTabla(perfumesData);
  }

  function renderTabla(perfumes) {
    const tbody = document.getElementById('perfumes-tbody');
    if (!perfumes.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--color-text-muted)">No hay perfumes</td></tr>';
      return;
    }
    tbody.innerHTML = perfumes.map(p => `
      <tr>
        <td>
          <div>${p.nombre}</div>
          <div class="panel-table__brand">${p.marcas?.nombre || ''}</div>
        </td>
        <td><span class="panel-table__badge">${p.tipos_perfume?.nombre || ''}</span></td>
        <td>${p.familias_olfativas?.nombre || ''}</td>
        <td>$${p.precio} USD</td>
        <td>
          <div class="panel-table__actions">
            <button class="btn-edit" data-id="${p.id}">Editar</button>
            <button class="btn-delete" data-id="${p.id}">Eliminar</button>
          </div>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.btn-edit').forEach(btn =>
      btn.addEventListener('click', () => abrirModal(Number(btn.dataset.id)))
    );

    tbody.querySelectorAll('.btn-delete').forEach(btn =>
      btn.addEventListener('click', () => eliminarPerfume(Number(btn.dataset.id)))
    );
  }

  document.getElementById('perfume-search')?.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    renderTabla(perfumesData.filter(p =>
      p.nombre.toLowerCase().includes(q) || p.marcas?.nombre.toLowerCase().includes(q)
    ));
  });

  // ── MODAL PERFUME ──
  let notasSeleccionadas = [];

  async function abrirModal(id = null) {
    const overlay = document.getElementById('modal-overlay');
    overlay.style.display = 'flex';
    document.getElementById('modal-titulo').textContent = id ? 'Editar perfume' : 'Agregar perfume';

    const [marcas, tipos, familias] = await Promise.all([
      supabase.from('marcas').select('id, nombre').order('nombre'),
      supabase.from('tipos_perfume').select('id, nombre').order('nombre'),
      supabase.from('familias_olfativas').select('id, nombre').order('nombre')
    ]);

    llenarSelect('modal-marca', marcas.data);
    llenarSelect('modal-tipo', tipos.data);
    llenarSelect('modal-familia', familias.data);
    await cargarNotasModal();

    if (id) {
      const perfume = perfumesData.find(p => p.id === id);
      if (perfume) {
        document.getElementById('modal-id').value = id;
        document.getElementById('modal-nombre').value = perfume.nombre;
        document.getElementById('modal-precio').value = perfume.precio;
        document.getElementById('modal-genero').value = perfume.genero || '';
        document.getElementById('modal-marca').value = perfume.marcas?.id || '';
        document.getElementById('modal-tipo').value = perfume.tipos_perfume?.id || '';
        document.getElementById('modal-familia').value = perfume.familias_olfativas?.id || '';
      }

      // Cargar notas existentes
      const { data: notas } = await supabase
        .from('perfumes_notas')
        .select('tipo_nota, notas_aromaticas(id, nombre)')
        .eq('id_perfume', id);

      notasSeleccionadas = (notas || []).map(n => ({
        id: n.notas_aromaticas.id,
        nombre: n.notas_aromaticas.nombre,
        tipo_nota: n.tipo_nota
      }));
    } else {
      document.getElementById('modal-form').reset();
      document.getElementById('modal-id').value = '';
      notasSeleccionadas = [];
    }

    renderNotasAgregadas();
  }

  async function cargarNotasModal() {
    const { data } = await supabase.from('notas_aromaticas').select('id, nombre').order('nombre');
    const opciones = (data || []).map(n => `<option value="${n.id}">${n.nombre}</option>`).join('');
    document.querySelectorAll('.nota-select').forEach(select => {
      const tipo = select.dataset.tipo;
      const labels = { salida: 'salida', corazon: 'corazón', fondo: 'fondo' };
      select.innerHTML = `<option value="">Nota de ${labels[tipo]}...</option>` + opciones;
    });
  }

  function renderNotasAgregadas() {
    const container = document.getElementById('notas-agregadas');
    if (!container) return;
    container.innerHTML = notasSeleccionadas.map((n, i) => `
      <span style="font-size:11px;padding:3px 10px;border-radius:20px;background:var(--color-bg-secondary);border:0.5px solid var(--color-border);color:var(--color-text-muted);display:inline-flex;align-items:center;gap:4px;">
        ${n.nombre} <em style="color:var(--color-accent)">(${n.tipo_nota})</em>
        <button type="button" data-index="${i}" style="background:none;border:none;cursor:pointer;color:var(--color-accent);font-size:13px;">×</button>
      </span>
    `).join('');

    container.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        notasSeleccionadas.splice(Number(btn.dataset.index), 1);
        renderNotasAgregadas();
      });
    });
  }

  document.getElementById('btn-add-nota-row')?.addEventListener('click', () => {
    document.querySelectorAll('.nota-select').forEach(select => {
      if (!select.value) return;
      const yaExiste = notasSeleccionadas.find(n =>
        n.id === Number(select.value) && n.tipo_nota === select.dataset.tipo
      );
      if (yaExiste) return;
      notasSeleccionadas.push({
        id: Number(select.value),
        nombre: select.options[select.selectedIndex].text,
        tipo_nota: select.dataset.tipo
      });
      select.value = '';
    });
    renderNotasAgregadas();
  });

  function llenarSelect(selectId, opciones) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">Selecciona...</option>' +
      (opciones || []).map(o => `<option value="${o.id}">${o.nombre}</option>`).join('');
  }

  document.getElementById('modal-close')?.addEventListener('click', cerrarModal);
  document.getElementById('modal-cancelar')?.addEventListener('click', cerrarModal);
  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modal-overlay')) cerrarModal();
  });

  function cerrarModal() {
    document.getElementById('modal-overlay').style.display = 'none';
  }

  document.getElementById('btn-agregar')?.addEventListener('click', () => abrirModal());

  document.getElementById('modal-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const id = document.getElementById('modal-id').value;
    const datos = {
      nombre: document.getElementById('modal-nombre').value.trim(),
      descripcion: document.getElementById('modal-desc').value.trim(),
      precio: Number(document.getElementById('modal-precio').value),
      genero: document.getElementById('modal-genero').value,
      id_marca: Number(document.getElementById('modal-marca').value),
      id_tipo_perfume: Number(document.getElementById('modal-tipo').value),
      id_familia_olfativa: Number(document.getElementById('modal-familia').value)
    };

    let perfumeId = id ? Number(id) : null;

    if (id) {
      await supabase.from('perfumes').update(datos).eq('id', id);
    } else {
      const { data } = await supabase.from('perfumes').insert([datos]).select();
      perfumeId = data?.[0]?.id;
    }

    // Guardar notas
    if (perfumeId) {
      await supabase.from('perfumes_notas').delete().eq('id_perfume', perfumeId);
      if (notasSeleccionadas.length) {
        await supabase.from('perfumes_notas').insert(
          notasSeleccionadas.map(n => ({
            id_perfume: perfumeId,
            id_nota: n.id,
            tipo_nota: n.tipo_nota
          }))
        );
      }
    }

    notasSeleccionadas = [];
    cerrarModal();
    cargarPerfumes();
    cargarStats();
  });

  async function eliminarPerfume(id) {
    if (!confirm('¿Eliminar este perfume?')) return;
    await supabase.from('perfumes').delete().eq('id', id);
    cargarPerfumes();
    cargarStats();
  }

  // ── CATEGORÍAS ──
  async function cargarCategorias() {
    const tablas = ['marcas', 'tipos_perfume', 'familias_olfativas', 'ocasiones'];
    for (const tabla of tablas) {
      const { data } = await supabase.from(tabla).select('id, nombre').order('nombre');
      renderCategoria(tabla, data || []);
    }
    cargarNotas();
  }

  function renderCategoria(tabla, items) {
    const container = document.getElementById(`cat-${tabla}`);
    if (!container) return;
    container.innerHTML = `
      <table class="panel-table">
        <thead><tr><th>#</th><th>Nombre</th><th>Acciones</th></tr></thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td style="color:var(--color-text-muted)">${item.id}</td>
              <td>${item.nombre}</td>
              <td>
                <div class="panel-table__actions">
                  <button class="btn-delete" data-tabla="${tabla}" data-id="${item.id}">Eliminar</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="add-row">
        <input type="text" placeholder="Nuevo..." id="new-${tabla}">
        <button class="btn btn--primary" style="padding:8px 16px;font-size:12px;" data-tabla="${tabla}">Agregar</button>
      </div>
    `;

    container.querySelectorAll('.btn-delete').forEach(btn =>
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar este elemento?')) return;
        await supabase.from(btn.dataset.tabla).delete().eq('id', btn.dataset.id);
        cargarCategorias();
      })
    );

    container.querySelectorAll('button[data-tabla]').forEach(btn => {
      if (btn.classList.contains('btn-delete')) return;
      btn.addEventListener('click', async () => {
        const input = document.getElementById(`new-${btn.dataset.tabla}`);
        const nombre = input.value.trim();
        if (!nombre) return;
        await supabase.from(btn.dataset.tabla).insert([{ nombre }]);
        input.value = '';
        cargarCategorias();
      });
    });
  }

  async function cargarNotas() {
    const [notas, familias] = await Promise.all([
      supabase.from('notas_aromaticas').select('id, nombre, familias_olfativas(nombre)').order('nombre'),
      supabase.from('familias_olfativas').select('id, nombre').order('nombre')
    ]);

    const container = document.getElementById('cat-notas_aromaticas');
    if (!container) return;

    const opcionesFamilias = (familias.data || []).map(f =>
      `<option value="${f.id}">${f.nombre}</option>`
    ).join('');

    container.innerHTML = `
      <table class="panel-table">
        <thead><tr><th>#</th><th>Nombre</th><th>Familia</th><th>Acciones</th></tr></thead>
        <tbody>
          ${(notas.data || []).map(n => `
            <tr>
              <td style="color:var(--color-text-muted)">${n.id}</td>
              <td>${n.nombre}</td>
              <td>${n.familias_olfativas?.nombre || '—'}</td>
              <td>
                <div class="panel-table__actions">
                  <button class="btn-delete" data-tabla="notas_aromaticas" data-id="${n.id}">Eliminar</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="add-row">
        <input type="text" placeholder="Nueva nota aromática..." id="new-notas_aromaticas">
        <select id="new-nota-familia" style="padding:8px 12px;border:0.5px solid var(--color-border);border-radius:var(--radius-sm);font-family:var(--font-body);font-size:var(--text-sm);background:var(--color-bg);color:var(--color-text);outline:none;">
          <option value="">Familia...</option>
          ${opcionesFamilias}
        </select>
        <button class="btn btn--primary" style="padding:8px 16px;font-size:12px;" id="btn-add-nota">Agregar</button>
      </div>
    `;

    container.querySelectorAll('.btn-delete').forEach(btn =>
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar esta nota?')) return;
        await supabase.from('notas_aromaticas').delete().eq('id', btn.dataset.id);
        cargarNotas();
      })
    );

    document.getElementById('btn-add-nota')?.addEventListener('click', async () => {
      const nombre = document.getElementById('new-notas_aromaticas').value.trim();
      const id_familia = document.getElementById('new-nota-familia').value;
      if (!nombre || !id_familia) return;
      await supabase.from('notas_aromaticas').insert([{ nombre, id_familia_olfativa: Number(id_familia) }]);
      document.getElementById('new-notas_aromaticas').value = '';
      cargarNotas();
    });
  }

  // Tabs de categorías
  document.querySelectorAll('.panel-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.panel-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });
}