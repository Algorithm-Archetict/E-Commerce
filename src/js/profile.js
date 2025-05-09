export function loadProfile(currentUser) {
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    const profileForm = document.querySelector('#profile-form');
    if (profileForm) {
        document.querySelector('#profile-username').value = currentUser.username;
        document.querySelector('#profile-password').value = currentUser.password;
    }
}