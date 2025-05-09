const API_URL = 'http://localhost:3000';

export async function login(username, password) {
    try {
        const response = await fetch(`${API_URL}/users?username=${username}&password=${password}`);
        if (!response.ok) throw new Error('Failed to fetch users');
        const users = await response.json();
        return users.length > 0 ? users[0] : null;
    } catch (error) {
        console.error('Login error:', error);
        return null;
    }
}

export async function register(user) {
    try {
        const checkResponse = await fetch(`${API_URL}/users?username=${user.username}`);
        if (!checkResponse.ok) throw new Error('Failed to check username');
        const existingUsers = await checkResponse.json();
        if (existingUsers.length > 0) return false;

        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        if (!response.ok) throw new Error('Failed to register user');
        return true;
    } catch (error) {
        console.error('Register error:', error);
        return false;
    }
}

export function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart');
}

export function updateAuthUI(user) {
    const userInfo = document.querySelector('#user-info');
    const loginLink = document.querySelector('#login-link');
    const registerLink = document.querySelector('#register-link');
    const logoutLink = document.querySelector('#logout-link');
    const dashboardLink = document.querySelector('#dashboard-link');
    const profileLink = document.querySelector('#profile-link');

    if (user) {
        userInfo.textContent = `Welcome, ${user.username}`;
        loginLink.classList.add('hidden');
        registerLink.classList.add('hidden');
        logoutLink.classList.remove('hidden');
        profileLink.classList.remove('hidden');
        if (user.role === 'admin' || user.role === 'seller') {
            dashboardLink.classList.remove('hidden');
        }
    } else {
        userInfo.textContent = '';
        loginLink.classList.remove('hidden');
        registerLink.classList.remove('hidden');
        logoutLink.classList.add('hidden');
        dashboardLink.classList.add('hidden');
        profileLink.classList.add('hidden');
    }
}