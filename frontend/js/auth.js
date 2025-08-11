// Authentication management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        // Load user from storage
        const storedUser = Storage.get(CONFIG.STORAGE_KEYS.USER);
        if (storedUser) {
            this.currentUser = storedUser;
            this.isAuthenticated = true;
            this.updateUI();
        }

        // Set up form listeners
        this.setupFormListeners();
    }

    setupFormListeners() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }
    }

    async handleLogin() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            Utils.showToast('Please fill in all fields', 'warning');
            return;
        }

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AUTH.LOGIN}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password })
            });

            const result = await response.text();
            
            if (result === 'Login successful!') {
                // Create user object (in real app, this would come from server)
                const user = {
                    id: Date.now(), // Temporary ID
                    username: username,
                    email: `${username}@example.com`, // Placeholder
                    loginTime: new Date().toISOString()
                };

                this.setCurrentUser(user);
                Utils.showToast('Login successful!', 'success');
                closeModal();
                
                // Load user-specific data
                this.loadUserData();
            } else {
                Utils.showToast(result, 'error');
            }
        } catch (error) {
            Utils.handleApiError(error);
        }
    }

    async handleRegister() {
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        if (!username || !email || !password) {
            Utils.showToast('Please fill in all fields', 'warning');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Utils.showToast('Please enter a valid email address', 'warning');
            return;
        }

        // Basic password validation
        if (password.length < 6) {
            Utils.showToast('Password must be at least 6 characters long', 'warning');
            return;
        }

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.AUTH.REGISTER}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email, password })
            });

            const result = await response.text();
            
            if (result === 'User registered successfully!') {
                Utils.showToast('Registration successful! Please login.', 'success');
                switchTab('login');
                
                // Pre-fill login form
                document.getElementById('loginUsername').value = username;
            } else {
                Utils.showToast(result, 'error');
            }
        } catch (error) {
            Utils.handleApiError(error);
        }
    }

    setCurrentUser(user) {
        this.currentUser = user;
        this.isAuthenticated = true;
        Storage.set(CONFIG.STORAGE_KEYS.USER, user);
        this.updateUI();
    }

    logout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        Storage.remove(CONFIG.STORAGE_KEYS.USER);
        
        // Clear user-specific data
        Storage.remove(CONFIG.STORAGE_KEYS.FAVORITES);
        Storage.remove(CONFIG.STORAGE_KEYS.QUEUE);
        Storage.remove(CONFIG.STORAGE_KEYS.CURRENT_SONG);
        
        this.updateUI();
        Utils.showToast('Logged out successfully', 'info');
        
        // Reset app state
        if (window.player) {
            window.player.stop();
        }
        showSection('home');
    }

    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const userInfo = document.getElementById('userInfo');
        const userName = document.getElementById('userName');

        if (this.isAuthenticated && this.currentUser) {
            loginBtn.style.display = 'none';
            userInfo.style.display = 'flex';
            userName.textContent = this.currentUser.username;
        } else {
            loginBtn.style.display = 'block';
            userInfo.style.display = 'none';
        }
    }

    async loadUserData() {
        if (!this.isAuthenticated) return;

        try {
            // Load user's playlists
            if (window.playlistManager) {
                await window.playlistManager.loadUserPlaylists();
            }

            // Load user's favorites
            if (window.favoritesManager) {
                await window.favoritesManager.loadFavorites();
            }

            // Load user's play history
            await this.loadPlayHistory();
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async loadPlayHistory() {
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.PLAY_HISTORY}`);
            if (response.ok) {
                const history = await response.json();
                // Filter history for current user if needed
                const userHistory = history.filter(item => 
                    item.user && item.user.id === this.currentUser.id
                );
                
                // Store in memory or update UI
                this.playHistory = userHistory;
            }
        } catch (error) {
            console.error('Error loading play history:', error);
        }
    }

    async addToPlayHistory(song) {
        if (!this.isAuthenticated || !song) return;

        try {
            const historyEntry = {
                user: { id: this.currentUser.id },
                song: { songID: song.songID },
                playedAt: new Date().toISOString()
            };

            await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.PLAY_HISTORY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(historyEntry)
            });
        } catch (error) {
            console.error('Error adding to play history:', error);
        }
    }

    // Check if user owns a playlist
    canEditPlaylist(playlist) {
        return this.isAuthenticated && 
               this.currentUser && 
               playlist.user && 
               playlist.user.id === this.currentUser.id;
    }

    // Get current user ID for API calls
    getCurrentUserId() {
        return this.isAuthenticated && this.currentUser ? this.currentUser.id : null;
    }

    // Require authentication for certain actions
    requireAuth(action) {
        if (!this.isAuthenticated) {
            Utils.showToast('Please login to ' + action, 'warning');
            openModal();
            return false;
        }
        return true;
    }
}

// Modal functions
function openModal() {
    document.getElementById('loginModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Clear form fields
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
}

function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabBtns = document.querySelectorAll('.auth-tabs .tab-btn');

    // Remove active class from all tabs
    tabBtns.forEach(btn => btn.classList.remove('active'));

    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        tabBtns[0].classList.add('active');
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        tabBtns[1].classList.add('active');
    }
}

function logout() {
    if (window.authManager) {
        window.authManager.logout();
    }
}

// Close modal when clicking outside
window.addEventListener('click', (event) => {
    const modal = document.getElementById('loginModal');
    if (event.target === modal) {
        closeModal();
    }
});

// Initialize auth manager
window.authManager = new AuthManager();