const API_URL = 'http://localhost:3000';

export async function loadCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItems = document.querySelector('#cart-items');
    if (cartItems) {
        cartItems.innerHTML = '';
        for (const item of cart) {
            try {
                const response = await fetch(`${API_URL}/products/${item.productId}`);
                if (!response.ok) throw new Error('Failed to load product');
                const product = await response.json();
                cartItems.innerHTML += `
                    <div class="cart-item">
                        <img src="${product.image}" alt="${product.name}">
                        <div class="cart-item-details">
                            <h3>${product.name}</h3>
                            <p>$${product.price.toFixed(2)}</p>
                            <div class="quantity-control">
                                <button class="quantity-decrease" data-product-id="${item.productId}">-</button>
                                <span>${item.quantity}</span>
                                <button class="quantity-increase" data-product-id="${item.productId}">+</button>
                            </div>
                            <button class="btn remove-from-cart" data-product-id="${item.productId}">Remove</button>
                        </div>
                    </div>
                `;
            } catch (error) {
                console.error('Load cart error:', error);
            }
        }
    }
}

export function removeFromCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.productId !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
}

export function updateCartQuantity(productId, change) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const item = cart.find(item => item.productId === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.productId !== productId);
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCart();
    }
}

export async function checkout(currentUser) {
    if (!currentUser) {
        alert('Please login to checkout');
        window.location.href = 'login.html';
        return;
    }

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert('Cart is empty');
        return;
    }

    try {
        const itemsWithPrice = [];
        for (const item of cart) {
            const productResponse = await fetch(`${API_URL}/products/${item.productId}`);
            if (!productResponse.ok) throw new Error('Failed to load product');
            const product = await productResponse.json();
            itemsWithPrice.push({ ...item, price: product.price });
        }

        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, items: itemsWithPrice, status: 'pending' })
        });
        if (!response.ok) throw new Error('Failed to place order');

        localStorage.removeItem('cart');
        alert('Order placed successfully!');
        window.location.href = 'home.html';
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Failed to place order');
    }
}