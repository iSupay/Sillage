export function renderFooter() {
  document.getElementById('footer-container').innerHTML = `
    <footer class="footer">
      <div class="footer__logo">Sillage</div>
      <div class="footer__text">© 2026 Sillage — Proyecto académico UACJ</div>
      <div style="display:flex;gap:1rem;">
        <a href="/pages/catalogo.html" class="footer__text">Catálogo</a>
        <a href="/cookies.html" class="footer__text">Cookies</a>
      </div>
    </footer>
  `;
}