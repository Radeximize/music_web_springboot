// Authentication Manager
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Load saved user if any
        const savedUser = Storage.get(CONFIG.STORAGE_KEYS.USER);
        if (savedUser) {
            this.currentUser = savedUser;
        }
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login form submit (assume #loginForm exists in index.html)
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('loginUsername').value;
                const password = document.getElementById('loginPassword').value;
                await this.login(username, password);
            });
        }

        // Register form submit
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('registerUsername').value;
                const email = document.getElementById('registerEmail').value;
                const password = document.getElementById('registerPassword').value;
                await this.register(username, email, password);
            });
        }

        // Logout button
        document.addEventListener('click', (e) => {
            if (e.target.matches('#logoutBtn')) {
                this.logout();
            }
        });
    }

    async login(username, password) {
        try {
            const response = await window.apiService.request(CONFIG.ENDPOINTS.AUTH.LOGIN, {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });
            this.currentUser = response.user;
            Storage.set(CONFIG.STORAGE_KEYS.USER, this.currentUser);
            document.dispatchEvent(new CustomEvent('user-login', { detail: { user: this.currentUser } }));
            Utils.showToast('Login successful', 'success');
        } catch (error) {
            Utils.showToast('Login failed: ' + error.message, 'error');
        }
    }

    async register(username, email, password) {
        try {
            const response = await window.apiService.request(CONFIG.ENDPOINTS.AUTH.REGISTER, {
                method: 'POST',
                body: JSON.stringify({ username, email, password })
            });
            this.currentUser = response.user;
            Storage.set(CONFIG.STORAGE_KEYS.USER, this.currentUser);
            document.dispatchEvent(new CustomEvent('user-login', { detail: { user: this.currentUser } }));
            Utils.showToast('Registration successful', 'success');
        } catch (error) {
            Utils.showToast('Registration failed: ' + error.message, 'error');
        }
    }

    logout() {
        this.currentUser = null;
        Storage.remove(CONFIG.STORAGE_KEYS.USER);
        document.dispatchEvent(new CustomEvent('user-logout'));
        Utils.showToast('Logged out', 'info');
    }

    getCurrentUserId() {
        return this.currentUser?.id;
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    setCurrentUser(user) {
        this.currentUser = user;
    }

    // Add if needed for playlist edit permissions
    canEditPlaylist(playlist) {
        return this.currentUser && playlist.user.id === this.currentUser.id;
    }
}

// Initialize auth manager
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});