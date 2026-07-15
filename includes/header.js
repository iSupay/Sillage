export function renderHeader(activePage = '') {
  document.getElementById('header-container').innerHTML = `
    <nav class="navbar">
      <a href="/index.html" class="navbar__logo">Sillage</a>
      <div class="navbar__links">
        <a href="/pages/catalogo.html" class="navbar__link ${activePage === 'catalogo' ? 'navbar__link--active' : ''}">Catálogo</a>
        <button class="navbar__wishlist" id="wishlist-btn" aria-label="Mi lista">
          <span id="wishlist-icon">♡</span>
          <span class="navbar__badge" id="wishlist-badge" style="display:none">0</span>
        </button>
      </div>
    </nav>

    <div class="drawer-overlay" id="drawer-overlay"></div>
    <div class="drawer" id="wishlist-drawer">
      <div class="drawer__header">
        <div>
          <div class="drawer__title">Mi lista</div>
          <div class="drawer__count" id="drawer-count"></div>
        </div>
        <button class="drawer__close" id="drawer-close">✕</button>
      </div>
      <div class="drawer__body" id="drawer-body"></div>
      <div class="drawer__footer">
        <p class="drawer__note">Tu lista se guarda en este navegador.</p>
        <button class="drawer__clear" id="drawer-clear">Limpiar lista</button>
      </div>
    </div>
  `;
}