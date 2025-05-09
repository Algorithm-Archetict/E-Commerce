import { login, register, logout, updateAuthUI } from './auth.js';
import { loadProducts, viewProduct, addToCart, manageProducts, editProduct, deleteProduct, approveProduct, loadCategories, filterProductsByCategory } from './products.js';
import { loadCart, removeFromCart, checkout, updateCartQuantity } from './cart.js';
import { loadDashboard } from './dashboard.js';
import { loadProfile } from './profile.js';
import { submitReview } from './reviews.js';
import { getElement } from './utils.js';

let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI(currentUser);

    const page = window.location.pathname.split('/').pop();

    // Common Event Listeners
    getElement('#logout-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
        updateAuthUI(null);
        window.location.href = 'home.html';
    });

    // Page-Specific Logic
    if (page === 'home.html') {
        loadCategories();
        loadProducts(true); // Load best-sellers
        loadProducts(false, true); // Load products by category
        getElement('#category-buttons')?.addEventListener('click', (e) => {
            if (e.target.closest('.category-button')) {
                const category = e.target.closest('.category-button').dataset.category;
                filterProductsByCategory(category);
            }
        });
    } else if (page === 'products.html') {
        loadProducts();
        getElement('#search')?.addEventListener('input', loadProducts);
        getElement('#product-grid')?.addEventListener('click', (e) => {
            const productId = e.target.dataset.productId;
            if (e.target.classList.contains('view-details')) {
                viewProduct(productId);
            } else if (e.target.classList.contains('add-to-cart')) {
                addToCart(productId);
            }
        });
    } else if (page === 'cart.html') {
        loadCart();
        getElement('#cart-items')?.addEventListener('click', (e) => {
            const productId = e.target.dataset.productId;
            if (e.target.classList.contains('remove-from-cart')) {
                removeFromCart(productId);
            } else if (e.target.classList.contains('quantity-decrease')) {
                updateCartQuantity(productId, -1);
            } else if (e.target.classList.contains('quantity-increase')) {
                updateCartQuantity(productId, 1);
            }
        });
        getElement('#checkout-btn')?.addEventListener('click', () => checkout(currentUser));
    } else if (page === 'dashboard.html') {
        loadDashboard(currentUser);
        getElement('#dashboard-links')?.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                e.preventDefault();
                loadDashboard(currentUser, action);
            }
        });
        getElement('#dashboard-content')?.addEventListener('submit', (e) => {
            if (e.target.id === 'product-form') {
                e.preventDefault();
                const id = getElement('#product-id').value;
                const product = {
                    name: getElement('#product-name').value,
                    price: parseFloat(getElement('#product-price').value),
                    category: getElement('#product-category').value,
                    image: getElement('#product-image').value,
                    sellerId: currentUser.id,
                    status: currentUser.role === 'seller' ? 'pending' : 'approved'
                };
                manageProducts(id ? { ...product, id } : product);
                loadDashboard(currentUser, 'products');
            } else if (e.target.id === 'user-form') {
                e.preventDefault();
                const id = getElement('#user-id').value;
                const user = {
                    username: getElement('#user-username').value,
                    password: getElement('#user-password').value,
                    role: getElement('#user-role').value
                };
                manageUsers(id ? { ...user, id } : user);
                loadDashboard(currentUser, 'users');
            }
        });
    } else if (page === 'profile.html') {
        loadProfile(currentUser);
        getElement('#profile-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = getElement('#profile-username').value;
            const password = getElement('#profile-password').value;
            const updatedUser = { ...currentUser, username, password };
            await manageUsers(updatedUser);
            currentUser = updatedUser;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            updateAuthUI(currentUser);
            alert('Profile updated!');
        });
    } else if (page === 'login.html') {
        getElement('#login-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = getElement('#login-username').value;
            const password = getElement('#login-password').value;
            const user = await login(username, password);
            if (user) {
                currentUser = user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                updateAuthUI(currentUser);
                window.location.href = 'home.html';
            } else {
                alert('Invalid credentials');
            }
        });
    } else if (page === 'register.html') {
        getElement('#register-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = getElement('#register-username').value;
            const password = getElement('#register-password').value;
            const role = getElement('#register-role').value;
            const success = await register({ username, password, role });
            if (success) {
                alert('Registration successful! Please login.');
                window.location.href = 'login.html';
            } else {
                alert('Username already exists');
            }
        });
    } else if (page === 'product-details.html') {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        if (productId) {
            viewProduct(productId);
            getElement('#review-form')?.addEventListener('submit', async (e) => {
                e.preventDefault();
                const rating = parseInt(getElement('#review-rating').value);
                const comment = getElement('#review-comment').value;
                await submitReview({ productId, userId: currentUser.id, rating, comment });
                viewProduct(productId);
            });
            getElement('#product-info')?.addEventListener('click', (e) => {
                if (e.target.classList.contains('add-to-cart')) {
                    addToCart(e.target.dataset.productId);
                }
            });
        }
    }
});

async function manageUsers(user) {
    try {
        const method = user.id ? 'PUT' : 'POST';
        const url = user.id ? `http://localhost:3000/users/${user.id}` : 'http://localhost:3000/users';
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        if (!response.ok) throw new Error('Failed to save user');
    } catch (error) {
        console.error('Manage users error:', error);
    }
}