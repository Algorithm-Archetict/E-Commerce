const API_URL = 'http://localhost:3000';

export async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        if (!response.ok) throw new Error('Failed to load categories');
        const categories = await response.json();
        const categoryButtons = document.querySelector('#category-buttons');
        if (categoryButtons) {
            categoryButtons.innerHTML = `<div class="category-button active" data-category="all">All Categories</div>` +
                categories.map(category => `
                    <div class="category-button" data-category="${category.name}">
                        <img src="${category.image}" alt="${category.name}">
                        <span>${category.name}</span>
                    </div>
                `).join('');
        }
    } catch (error) {
        console.error('Load categories error:', error);
    }
}

export async function loadProducts(isBestSeller = false, byCategory = false) {
    const search = document.querySelector('#search')?.value.toLowerCase() || '';
    try {
        const response = await fetch(`${API_URL}/products?status=approved`);
        if (!response.ok) throw new Error('Failed to load products');
        let products = await response.json();

        if (search) {
            products = products.filter(product =>
                product.name.toLowerCase().includes(search) ||
                product.category.toLowerCase().includes(search)
            );
        }

        if (isBestSeller) {
            products = products.sort((a, b) => b.salesCount - a.salesCount).slice(0, 4);
            const bestSellerGrid = document.querySelector('#best-seller-grid');
            if (bestSellerGrid) {
                bestSellerGrid.innerHTML = products.map(product => `
                    <div class="product-card">
                        <img src="${product.image}" alt="${product.name}">
                        <h3>${product.name}</h3>
                        <p>$${product.price.toFixed(2)}</p>
                        <button class="btn view-details" data-product-id="${product.id}">View Details</button>
                        ${localStorage.getItem('currentUser') && JSON.parse(localStorage.getItem('currentUser')).role === 'customer' ? 
                            `<button class="btn add-to-cart" data-product-id="${product.id}">Add to Cart</button>` : ''}
                    </div>
                `).join('');
            }
        } else if (byCategory) {
            const categoriesResponse = await fetch(`${API_URL}/categories`);
            if (!categoriesResponse.ok) throw new Error('Failed to load categories');
            const categories = await categoriesResponse.json();
            const productsByCategory = document.querySelector('#products-by-category');
            if (productsByCategory) {
                productsByCategory.innerHTML = categories.map(category => {
                    const categoryProducts = products.filter(product => product.category === category.name);
                    return categoryProducts.length ? `
                        <div class="category-section" data-category="${category.name}">
                            <h3>${category.name}</h3>
                            <div class="product-grid">
                                ${categoryProducts.map(product => `
                                    <div class="product-card">
                                        <img src="${product.image}" alt="${product.name}">
                                        <h3>${product.name}</h3>
                                        <p>$${product.price.toFixed(2)}</p>
                                        <button class="btn view-details" data-product-id="${product.id}">View Details</button>
                                        ${localStorage.getItem('currentUser') && JSON.parse(localStorage.getItem('currentUser')).role === 'customer' ? 
                                            `<button class="btn add-to-cart" data-product-id="${product.id}">Add to Cart</button>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : '';
                }).join('');
            }
        } else {
            const productGrid = document.querySelector('#product-grid');
            if (productGrid) {
                productGrid.innerHTML = products.map(product => `
                    <div class="product-card">
                        <img src="${product.image}" alt="${product.name}">
                        <h3>${product.name}</h3>
                        <p>$${product.price.toFixed(2)}</p>
                        <button class="btn view-details" data-product-id="${product.id}">View Details</button>
                        ${localStorage.getItem('currentUser') && JSON.parse(localStorage.getItem('currentUser')).role === 'customer' ? 
                            `<button class="btn add-to-cart" data-product-id="${product.id}">Add to Cart</button>` : ''}
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Load products error:', error);
    }
}

export async function filterProductsByCategory(category) {
    try {
        const response = await fetch(`${API_URL}/products?status=approved`);
        if (!response.ok) throw new Error('Failed to load products');
        let products = await response.json();
        const productsByCategory = document.querySelector('#products-by-category');
        const categoryButtons = document.querySelectorAll('.category-button');

        categoryButtons.forEach(button => button.classList.remove('active'));
        const activeButton = document.querySelector(`.category-button[data-category="${category}"]`);
        if (activeButton) activeButton.classList.add('active');

        if (productsByCategory) {
            if (category === 'all') {
                loadProducts(false, true);
            } else {
                products = products.filter(product => product.category === category);
                productsByCategory.innerHTML = `
                    <div class="category-section" data-category="${category}">
                        <h3>${category}</h3>
                        <div class="product-grid">
                            ${products.map(product => `
                                <div class="product-card">
                                    <img src="${product.image}" alt="${product.name}">
                                    <h3>${product.name}</h3>
                                    <p>$${product.price.toFixed(2)}</p>
                                    <button class="btn view-details" data-product-id="${product.id}">View Details</button>
                                    ${localStorage.getItem('currentUser') && JSON.parse(localStorage.getItem('currentUser')).role === 'customer' ? 
                                        `<button class="btn add-to-cart" data-product-id="${product.id}">Add to Cart</button>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Filter products error:', error);
    }
}

export async function viewProduct(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        if (!response.ok) throw new Error('Failed to load product');
        const product = await response.json();
        const currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        const productInfo = document.querySelector('#product-info');
        if (productInfo) {
            productInfo.innerHTML = `
                <img src="${product.image}" alt="${product.name}">
                <div>
                    <h3>${product.name}</h3>
                    <p>$${product.price.toFixed(2)}</p>
                    <p>Category: ${product.category}</p>
                    ${currentUser && currentUser.role === 'customer' ? 
                        `<button class="btn add-to-cart" data-product-id="${product.id}">Add to Cart</button>` : ''}
                    ${currentUser && currentUser.role === 'admin' ? `
                        ${product.status === 'pending' ? `<button class="btn approve-product" data-product-id="${product.id}">Approve</button>` : ''}
                        <button class="btn delete-product" data-product-id="${product.id}">Delete</button>
                    ` : ''}
                </div>
            `;
        }

        const reviewResponse = await fetch(`${API_URL}/reviews?productId=${productId}`);
        if (!reviewResponse.ok) throw new Error('Failed to load reviews');
        const reviews = await reviewResponse.json();
        const reviewList = document.querySelector('#review-list');
        if (reviewList) {
            reviewList.innerHTML = reviews.map(review => `
                <div class="review-item">
                    <p><strong>Rating:</strong> ${review.rating}/5</p>
                    <p>${review.comment}</p>
                    <p><em>By: User ${review.userId}</em></p>
                </div>
            `).join('');
        }

        let canReview = false;
        if (currentUser && currentUser.role === 'customer') {
            const orderResponse = await fetch(`${API_URL}/orders?userId=${currentUser.id}`);
            if (!orderResponse.ok) throw new Error('Failed to load orders');
            const orders = await orderResponse.json();
            canReview = orders.some(order =>
                order.items.some(item => item.productId === productId)
            );
        }

        const reviewForm = document.querySelector('#review-form');
        if (reviewForm) {
            reviewForm.classList.toggle('hidden', !canReview);
            reviewForm.dataset.productId = productId;
        }
    } catch (error) {
        console.error('View product error:', error);
    }
}

export function addToCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ productId, quantity: 1 });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Added to cart!');
}

export async function manageProducts(product) {
    try {
        const categoriesResponse = await fetch(`${API_URL}/categories`);
        if (!categoriesResponse.ok) throw new Error('Failed to load categories');
        const categories = await categoriesResponse.json();
        const validCategories = categories.map(cat => cat.name);
        if (!validCategories.includes(product.category)) {
            alert('Invalid category. Please choose from: ' + validCategories.join(', '));
            return;
        }

        const method = product.id ? 'PUT' : 'POST';
        const url = product.id ? `${API_URL}/products/${product.id}` : `${API_URL}/products`;
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...product, salesCount: product.salesCount || 0 })
        });
        if (!response.ok) throw new Error('Failed to save product');
    } catch (error) {
        console.error('Manage products error:', error);
    }
}

export async function editProduct(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        if (!response.ok) throw new Error('Failed to load product');
        const product = await response.json();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser.role === 'seller' && product.sellerId !== currentUser.id) {
            alert('You can only edit your own products');
            return;
        }
        const productForm = document.querySelector('#product-form');
        if (productForm) {
            document.querySelector('#product-id').value = product.id;
            document.querySelector('#product-name').value = product.name;
            document.querySelector('#product-price').value = product.price;
            document.querySelector('#product-category').value = product.category;
            document.querySelector('#product-image').value = product.image;
        }
    } catch (error) {
        console.error('Edit product error:', error);
    }
}

export async function deleteProduct(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        if (!response.ok) throw new Error('Failed to load product');
        const product = await response.json();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser.role === 'seller' && product.sellerId !== currentUser.id) {
            alert('You can only delete your own products');
            return;
        }
        const deleteResponse = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE'
        });
        if (!deleteResponse.ok) throw new Error('Failed to delete product');
        loadDashboard(currentUser, 'products');
    } catch (error) {
        console.error('Delete product error:', error);
    }
}

export async function approveProduct(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'approved' })
        });
        if (!response.ok) throw new Error('Failed to approve product');
        loadDashboard(JSON.parse(localStorage.getItem('currentUser')), 'products');
    } catch (error) {
        console.error('Approve product error:', error);
    }
}