// Main Application Controller
class MusicStreamingApp {
    constructor() {
        this.isInitialized = false;
        this.managers = {};
        this.currentUser = null;
        this.appState = {
            currentView: 'home',
            isLoading: false,
            notifications: []
        };
        this.init();
    }

    async init() {
        try {
            // Show loading indicator
            this.showAppLoading();

            // Initialize core managers (already initialized)
            this.managers.auth = window.authManager;
            this.managers.ui = window.uiManager;
            this.managers.player = window.player;
            this.managers.playlist = window.playlistManager;
            this.managers.favorites = window.favoritesManager;
            this.managers.search = window.searchManager;

            // Setup global event listeners
            this.setupGlobalEventListeners();

            // Initialize app state
            await this.initializeAppState();

            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();

            // Load initial data
            await this.loadInitialData();

            // Hide loading indicator
            this.hideAppLoading();

            this.isInitialized = true;
            console.log('🎵 MusicStreaming App initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showError('Failed to initialize application. Please refresh and try again.');
        }
    }

    async initializeAppState() {
        // Check if user is logged in
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.managers.auth.setCurrentUser(this.currentUser);
                this.showMainApp();
            } catch (error) {
                console.error('Invalid saved user data:', error);
                localStorage.removeItem('currentUser');
                this.showAuthScreen();
            }
        } else {
            this.showAuthScreen();
        }

        // Initialize theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(savedTheme);
    }

    async loadInitialData() {
        if (!this.currentUser) return;

        try {
            // Load user's playlists
            await this.managers.playlist.loadUserPlaylists(this.currentUser.id);
            
            // Load user's favorites
            await this.managers.favorites.loadUserFavorites(this.currentUser.id);
            
            // Load recent songs or popular songs for home view
            await this.loadHomeContent();
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.showNotification('Some data could not be loaded. Please try refreshing.', 'warning');
        }
    }

    async loadHomeContent() {
        try {
            // Load all songs for now (in a real app, this would be curated content)
            const songs = await window.apiService.getAllSongs();
            this.managers.ui.displaySongs(songs.slice(0, 20)); // Show first 20 songs
        } catch (error) {
            console.error('Failed to load home content:', error);
        }
    }

    setupGlobalEventListeners() {
        // Authentication events
        document.addEventListener('user-login', (e) => {
            this.currentUser = e.detail.user;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.showMainApp();
            this.loadInitialData();
            this.showNotification(`Welcome back, ${this.currentUser.username}`);
        });

        document.addEventListener('user-logout', () => {
            this.currentUser = null;
            localStorage.removeItem('currentUser');
            this.clearAppData();
            this.showAuthScreen();
            this.showNotification('Logged out successfully', 'info');
        });

        // Window resize
        window.addEventListener('resize', this.handleWindowResize.bind(this));
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) return;

            switch (e.key.toLowerCase()) {
                case ' ':
                    e.preventDefault();
                    this.managers.player.togglePlayPause();
                    break;
                case 'arrowright':
                    this.managers.player.nextSong();
                    break;
                case 'arrowleft':
                    this.managers.player.previousSong();
                    break;
                // Add more shortcuts as needed
            }
        });
    }

    showAppLoading() {
        // Implement loading indicator, e.g., show a spinner
        document.body.classList.add('loading');
    }

    hideAppLoading() {
        document.body.classList.remove('loading');
    }

    showAuthScreen() {
        const mainApp = document.getElementById('main-app');
        const authContainer = document.getElementById('auth-container');
        if (mainApp) mainApp.style.display = 'none';
        if (authContainer) authContainer.style.display = 'flex';
        else console.error('Auth container not found');
    }

    showMainApp() {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('main-app').style.display = 'flex';
    }

    handleWindowResize() {
        this.managers.ui.handleResize();
    }

    showNotification(message, type = 'info') {
        const notification = { id: Utils.generateId(), message, type };
        this.appState.notifications.push(notification);
        this.managers.ui.showNotification(notification);
        setTimeout(() => this.removeNotification(notification.id), 3000);
    }

    removeNotification(id) {
        this.appState.notifications = this.appState.notifications.filter(n => n.id !== id);
        this.managers.ui.removeNotification(id);
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update theme toggle button
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
            themeToggle.title = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        this.showNotification(`Switched to ${newTheme} theme`, 'info');
    }

    clearAppData() {
        // Clear sensitive data when user logs out
        this.managers.playlist.clearPlaylists();
        this.managers.favorites.clearFavorites();
        this.managers.player.stop();
        this.managers.search.clearSearchResults();
    }

    saveAppState() {
        // Save important app state
        const state = {
            volume: this.managers.player.getVolume(),
            repeatMode: this.managers.player.getRepeatMode(),
            shuffleMode: this.managers.player.getShuffleMode(),
            currentView: this.appState.currentView
        };
        
        localStorage.setItem('appState', JSON.stringify(state));
    }

    restoreAppState() {
        try {
            const savedState = localStorage.getItem('appState');
            if (savedState) {
                const state = JSON.parse(savedState);
                
                // Restore player settings
                if (state.volume !== undefined) {
                    this.managers.player.setVolume(state.volume);
                }
                if (state.repeatMode) {
                    this.managers.player.setRepeatMode(state.repeatMode);
                }
                if (state.shuffleMode !== undefined) {
                    this.managers.player.setShuffleMode(state.shuffleMode);
                }
                if (state.currentView) {
                    this.handleViewChange(state.currentView);
                }
            }
        } catch (error) {
            console.error('Failed to restore app state:', error);
        }
    }

    // Public methods for external access
    getCurrentUser() {
        return this.currentUser;
    }

    isUserLoggedIn() {
        return this.currentUser !== null;
    }

    getAppState() {
        return { ...this.appState };
    }

    // Cleanup method
    destroy() {
        // Clean up event listeners
        // Stop any ongoing processes
        // Clear timers/intervals
        this.saveAppState();
        console.log('🎵 MusicStreaming App destroyed');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the main application
    window.musicApp = new MusicStreamingApp();
    
    // Restore app state after initialization
    setTimeout(() => {
        if (window.musicApp.isInitialized) {
            window.musicApp.restoreAppState();
        }
    }, 1000);
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    if (window.musicApp) {
        window.musicApp.showError('An unexpected error occurred. Please refresh the page if problems persist.');
    }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    if (window.musicApp) {
        window.musicApp.showError('A network or processing error occurred.');
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MusicStreamingApp;
}