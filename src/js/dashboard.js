const API_URL = 'http://localhost:3000';

export async function loadDashboard(currentUser, section = '') {
    const dashboardLinks = document.querySelector('#dashboard-links');
    const dashboardContent = document.querySelector('#dashboard-content');
    if (!dashboardLinks || !dashboardContent) return;

    dashboardLinks.innerHTML = '';
    dashboardContent.innerHTML = '';

    // Set up sidebar links based on user role
    if (currentUser.role === 'admin') {
        dashboardLinks.innerHTML = `
            <a href="#" data-action="kpis">KPIs</a>
            <a href="#" data-action="products">Products</a>
            <a href="#" data-action="users">Users</a>
            <a href="#" data-action="orders">Orders</a>
            <a href="#" data-action="reviews">Reviews</a>
        `;
        section = section || 'kpis';
    } else if (currentUser.role === 'seller') {
        dashboardLinks.innerHTML = `
            <a href="#" data-action="kpis">KPIs</a>
            <a href="#" data-action="products">Products</a>
            <a href="#" data-action="orders">Orders</a>
        `;
        section = section || 'kpis';
    }

    try {
        if (section === 'kpis') {
            await loadKPIs(currentUser, dashboardContent);
        } else if (section === 'products') {
            await loadProductManagement(currentUser, dashboardContent);
        } else if (section === 'users' && currentUser.role === 'admin') {
            await loadUserManagement(dashboardContent);
        } else if (section === 'orders') {
            await loadOrderManagement(currentUser, dashboardContent);
        } else if (section === 'reviews' && currentUser.role === 'admin') {
            await loadReviewManagement(dashboardContent);
        }

        // Add event listeners for product actions
        dashboardContent.addEventListener('click', async (e) => {
            const productId = e.target.dataset.productId;
            if (e.target.classList.contains('edit-product')) {
                editProduct(productId);
            } else if (e.target.classList.contains('delete-product')) {
                deleteProduct(productId);
                loadDashboard(currentUser, 'products');
            } else if (e.target.classList.contains('approve-product')) {
                await approveProduct(productId);
                loadDashboard(currentUser, 'products');
            }
        });

        // Add event listeners for user actions
        dashboardContent.addEventListener('click', async (e) => {
            const userId = e.target.dataset.userId;
            if (e.target.classList.contains('edit-user')) {
                editUser(userId);
            } else if (e.target.classList.contains('delete-user')) {
                await deleteUser(userId);
                loadDashboard(currentUser, 'users');
            }
        });

        // Add event listeners for review actions
        dashboardContent.addEventListener('click', async (e) => {
            const reviewId = e.target.dataset.reviewId;
            if (e.target.classList.contains('delete-review')) {
                await deleteReview(reviewId);
                loadDashboard(currentUser, 'reviews');
            }
        });
    } catch (error) {
        console.error('Load dashboard error:', error);
        dashboardContent.innerHTML = '<p>Error loading dashboard. Please try again.</p>';
    }
}

async function loadKPIs(currentUser, dashboardContent) {
    try {
        const productsResponse = await fetch(`${API_URL}/products${currentUser.role === 'seller' ? `?sellerId=${currentUser.id}` : ''}`);
        const ordersResponse = await fetch(`${API_URL}/orders${currentUser.role === 'seller' ? `?sellerId=${currentUser.id}` : ''}`);
        if (!productsResponse.ok || !ordersResponse.ok) throw new Error('Failed to load KPIs');
        const products = await productsResponse.json();
        const orders = await ordersResponse.json();

        const totalSales = orders.reduce((sum, order) => sum + order.items.reduce((s, item) => s + item.price * item.quantity, 0), 0);
        const totalProducts = products.length;
        const pendingOrders = orders.filter(order => order.status === 'pending').length;

        dashboardContent.innerHTML = `
            <div class="kpi-card">
                <h3>Total Sales</h3>
                <p>$${totalSales.toFixed(2)}</p>
            </div>
            <div class="kpi-card">
                <h3>Total Products</h3>
                <p>${totalProducts}</p>
            </div>
            <div class="kpi-card">
                <h3>Pending Orders</h3>
                <p>${pendingOrders}</p>
            </div>
        `;
    } catch (error) {
        console.error('Load KPIs error:', error);
    }
}

async function loadProductManagement(currentUser, dashboardContent) {
    try {
        const productsResponse = await fetch(`${API_URL}/products${currentUser.role === 'seller' ? `?sellerId=${currentUser.id}` : ''}`);
        const categoriesResponse = await fetch(`${API_URL}/categories`);
        if (!productsResponse.ok || !categoriesResponse.ok) throw new Error('Failed to load products or categories');
        const products = await productsResponse.json();
        const categories = await categoriesResponse.json();

        dashboardContent.innerHTML = `
            <h2>Manage Products</h2>
            <form id="product-form" class="form">
                <input type="hidden" id="product-id">
                <div class="form-group">
                    <label for="product-name">Name</label>
                    <input type="text" id="product-name" required>
                </div>
                <div class="form-group">
                    <label for="product-price">Price</label>
                    <input type="number" id="product-price" step="0.01" required>
                </div>
                <div class="form-group">
                    <label for="product-category">Category</label>
                    <select id="product-category" required>
                        ${categories.map(category => `<option value="${category.name}">${category.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label for="product-image">Image URL</label>
                    <input type="url" id="product-image" required>
                </div>
                <button type="submit" class="btn">Save Product</button>
            </form>
            <h3>Product List</h3>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => `
                        <tr>
                            <td>${product.name}</td>
                            <td>$${product.price.toFixed(2)}</td>
                            <td>${product.category}</td>
                            <td>${product.status}</td>
                            <td>
                                <button class="btn edit-product" data-product-id="${product.id}">Edit</button>
                                <button class="btn delete-product" data-product-id="${product.id}">Delete</button>
                                ${currentUser.role === 'admin' && product.status === 'pending' ? 
                                    `<button class="btn approve-product" data-product-id="${product.id}">Approve</button>` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Load product management error:', error);
    }
}




{/* async function loadUserManagement(dashboardContent) {
    try {
        const response = await fetch(`${API_URL}/users`);
        if (!response.ok) throw new Error('Failed to load users');
        const users = await response.json();

        dashboardContent.innerHTML = `
            <h2>Manage Users</h2>
            <form id="user-form" class="form">
                <input type="hidden" id="user-id">
                <div class="form-group">
                    <label for="user-username">Username</label>
                    <input type="text" id="user-username" required>
                </div>
                <div class="form-group">
                    <label for="user-password">Password</label>
                    <input type="password" id="user-password" required>
                </div>
                <div class="form-group">
                    <label for="user-role">Role</label>
                    <select id="user-role" required>
                        <option value="admin">Admin</option>
                        <option value="seller">Seller</option>
                        <option value="customer">Customer</option>
                    </select>
                </div>
                <button type="submit" class="btn">Save User</button>
            </form>
            <h3>User List</h3>
            <table>
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.username}</td>
                            <td>${user.role}</td>
                            <td>
                                <button class="btn edit-user" data-user-id="${user.id}">Edit</button>
                                <button class="btn delete-user" data-user-id="${user.id}">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Load user management error:', error);
    }
} */}

async function loadUserManagement(dashboardContent) {
    try {
        const response = await fetch(`${API_URL}/users`);
        if (!response.ok) throw new Error('Failed to load users');
        const users = await response.json();

        dashboardContent.innerHTML = `
            <h2>Manage Users</h2>
            <form id="user-form" class="form">
                <input type="hidden" id="user-id">
                <div class="form-group">
                    <label for="user-FirstName">FirstName</label>
                    <input type="text" id="user-FirstName" required>
                </div>

                <div class="form-group">
                    <label for="user-LastName">LastName</label>
                    <input type="text" id="user-LastName" required>
                </div>

                <div class="form-group">
                    <label for="user-email">E-mail</label>
                    <input type="email" id="user-email" required>
                </div>
                <div class="form-group">
                    <label for="user-username">Username</label>
                    <input type="text" id="user-username" required>
                </div>
                <div class="form-group">
                    <label for="user-password">Password</label>
                    <input type="password" id="user-password" required>
                </div>
                <div class="form-group">
                    <label for="user-role">Role</label>
                    <select id="user-role" required>
                        <option value="admin">Admin</option>
                        <option value="seller">Seller</option>
                        <option value="customer">Customer</option>
                    </select>
                </div>
                <button type="submit" class="btn">Save User</button>
            </form>
            <h3>User List</h3>
            <table>
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.username}</td>
                            <td>${user.role}</td>
                            <td>
                                <button class="btn edit-user" data-user-id="${user.id}">Edit</button>
                                <button class="btn delete-user" data-user-id="${user.id}">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Load user management error:', error);
    }
}

async function loadOrderManagement(currentUser, dashboardContent) {
    try {
        const response = await fetch(`${API_URL}/orders${currentUser.role === 'seller' ? `?sellerId=${currentUser.id}` : ''}`);
        if (!response.ok) throw new Error('Failed to load orders');
        const orders = await response.json();

        dashboardContent.innerHTML = `
            <h2>Manage Orders</h2>
            <table>
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>User ID</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr>
                            <td>${order.id}</td>
                            <td>${order.userId}</td>
                            <td>$${order.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</td>
                            <td>${order.status}</td>
                            <td>
                                ${currentUser.role === 'admin' || currentUser.role === 'seller' ? `
                                    <button class="btn update-order-status" data-order-id="${order.id}" data-status="shipped">Ship</button>
                                    <button class="btn update-order-status" data-order-id="${order.id}" data-status="delivered">Deliver</button>
                                ` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Add event listeners for order status updates
        dashboardContent.addEventListener('click', async (e) => {
            const orderId = e.target.dataset.orderId;
            const status = e.target.dataset.status;
            if (e.target.classList.contains('update-order-status')) {
                await updateOrderStatus(orderId, status);
                loadDashboard(currentUser, 'orders');
            }
        });
    } catch (error) {
        console.error('Load order management error:', error);
    }
}

async function loadReviewManagement(dashboardContent) {
    try {
        const response = await fetch(`${API_URL}/reviews`);
        if (!response.ok) throw new Error('Failed to load reviews');
        const reviews = await response.json();

        dashboardContent.innerHTML = `
            <h2>Manage Reviews</h2>
            <table>
                <thead>
                    <tr>
                        <th>Product ID</th>
                        <th>User ID</th>
                        <th>Rating</th>
                        <th>Comment</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${reviews.map(review => `
                        <tr>
                            <td>${review.productId}</td>
                            <td>${review.userId}</td>
                            <td>${review.rating}</td>
                            <td>${review.comment}</td>
                            <td>
                                <button class="btn delete-review" data-review-id="${review.id}">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Load review management error:', error);
    }
}

async function editProduct(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        if (!response.ok) throw new Error('Failed to load product');
        const product = await response.json();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser.role === 'seller' && product.sellerId !== currentUser.id) {
            alert('You can only edit your own products');
            return;
        }
        document.querySelector('#product-id').value = product.id;
        document.querySelector('#product-name').value = product.name;
        document.querySelector('#product-price').value = product.price;
        document.querySelector('#product-category').value = product.category;
        document.querySelector('#product-image').value = product.image;
    } catch (error) {
        console.error('Edit product error:', error);
    }
}

async function deleteProduct(productId) {
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
    } catch (error) {
        console.error('Delete product error:', error);
    }
}

async function approveProduct(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'approved' })
        });
        if (!response.ok) throw new Error('Failed to approve product');
    } catch (error) {
        console.error('Approve product error:', error);
    }
}

async function editUser(userId) {
    try {
        const response = await fetch(`${API_URL}/users/${userId}`);
        if (!response.ok) throw new Error('Failed to load user');
        const user = await response.json();
        document.querySelector('#user-id').value = user.id;
        document.querySelector('#user-username').value = user.username;
        document.querySelector('#user-password').value = user.password;
        document.querySelector('#user-role').value = user.role;
    } catch (error) {
        console.error('Edit user error:', error);
    }
}

async function deleteUser(userId) {
    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete user');
    } catch (error) {
        console.error('Delete user error:', error);
    }
}

async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`${API_URL}/orders/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (!response.ok) throw new Error('Failed to update order status');
    } catch (error) {
        console.error('Update order status error:', error);
    }
}

async function deleteReview(reviewId) {
    try {
        const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete review');
    } catch (error) {
        console.error('Delete review error:', error);
    }
}