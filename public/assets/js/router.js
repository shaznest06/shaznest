import { renderHome } from './pages/home.js';
import { renderProduct } from './pages/product.js';
import { CustomerPortal } from './components/CustomerPortal.js';
import { AdminPortal } from './components/AdminPortal.js';
import { Checkout } from './components/Checkout.js';
import { ReviewGallery } from './components/ReviewGallery.js';

export function initRouter() {
  const handleRoute = async () => {
    const hash = window.location.hash || '#/';
    const mainContainer = document.querySelector('main') || document.body;
    
    // Clear previous view
    mainContainer.innerHTML = '';

    if (hash === '#/' || hash === '') {
      mainContainer.appendChild(renderHome());
    } else if (hash.startsWith('#/shop/')) {
      const category = hash.split('/')[2];
      const homeEl = renderHome();
      mainContainer.appendChild(homeEl);
      // Trigger category filter if available on page
      window.dispatchEvent(new CustomEvent('shaz:filter-category', { detail: { category } }));
    } else if (hash.startsWith('#/product/')) {
      const productId = hash.split('/')[2];
      mainContainer.appendChild(renderProduct(productId));
    } else if (hash === '#/account') {
      mainContainer.appendChild(CustomerPortal());
    } else if (hash === '#/admin' || hash === '#/admin-portal') {
      mainContainer.appendChild(AdminPortal());
    } else if (hash === '#/checkout') {
      mainContainer.appendChild(Checkout());
    } else if (hash === '#/reviews') {
      mainContainer.appendChild(ReviewGallery());
    } else {
      mainContainer.innerHTML = '<div style="padding: 4rem; text-align: center; color: #d4af37;"><h2>Page Not Found</h2><p>The requested page does not exist in ShaZ Nest.</p><a href="#/" style="color: #fff; text-decoration: underline;">Return Home</a></div>';
    }

    window.scrollTo(0, 0);
  };

  window.addEventListener('hashchange', handleRoute);
  window.addEventListener('DOMContentLoaded', handleRoute);
  handleRoute();
}