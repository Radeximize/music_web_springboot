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
            const songs = await window.api.getAllSongs();
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
            this.showNotification(`Welcome back, ${this.currentUser.username}!`, 'success');
        });

        document.addEventListener('user-logout', () => {
            this.currentUser = null;
            localStorage.removeItem('currentUser');
            this.showAuthScreen();
            this.clearAppData();
            this.showNotification('You have been logged out', 'info');
        });

        // Player events
        document.addEventListener('song-ended', () => {
            this.handleSongEnd();
        });

        document.addEventListener('playlist-updated', (e) => {
            this.handlePlaylistUpdate(e.detail);
        });

        // UI events
        document.addEventListener('view-change', (e) => {
            this.handleViewChange(e.detail.view);
        });

        // Error events
        document.addEventListener('app-error', (e) => {
            this.showError(e.detail.message);
        });

        // Network status
        window.addEventListener('online', () => {
            this.showNotification('Connection restored', 'success');
        });

        window.addEventListener('offline', () => {
            this.showNotification('You are offline. Some features may not work.', 'warning');
        });

        // Window events
        window.addEventListener('beforeunload', (e) => {
            this.saveAppState();
        });

        // Resize events
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't handle shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Space bar - play/pause
            if (e.code === 'Space') {
                e.preventDefault();
                this.managers.player.togglePlayPause();
            }
            
            // Arrow keys - previous/next track
            else if (e.code === 'ArrowLeft' && e.ctrlKey) {
                e.preventDefault();
                this.managers.player.previous();
            }
            else if (e.code === 'ArrowRight' && e.ctrlKey) {
                e.preventDefault();
                this.managers.player.next();
            }
            
            // Volume controls
            else if (e.code === 'ArrowUp' && e.ctrlKey) {
                e.preventDefault();
                const currentVolume = this.managers.player.getVolume();
                this.managers.player.setVolume(Math.min(currentVolume + 0.1, 1));
            }
            else if (e.code === 'ArrowDown' && e.ctrlKey) {
                e.preventDefault();
                const currentVolume = this.managers.player.getVolume();
                this.managers.player.setVolume(Math.max(currentVolume - 0.1, 0));
            }
            
            // Mute toggle
            else if (e.code === 'KeyM' && e.ctrlKey) {
                e.preventDefault();
                this.managers.player.toggleMute();
            }
            
            // Search shortcut
            else if (e.code === 'KeyF' && e.ctrlKey) {
                e.preventDefault();
                this.managers.search.focusSearchInput();
            }
            
            // Theme toggle
            else if (e.code === 'KeyT' && e.ctrlKey && e.shiftKey) {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    handleSongEnd() {
        const currentMode = this.managers.player.getRepeatMode();
        
        if (currentMode === 'one') {
            // Repeat current song
            this.managers.player.seekTo(0);
            this.managers.player.play();
        } else if (this.managers.player.hasNext()) {
            // Play next song
            this.managers.player.next();
        } else if (currentMode === 'all') {
            // Restart playlist
            this.managers.player.playFirst();
        } else {
            // Stop playing
            this.managers.player.stop();
        }
    }

    handlePlaylistUpdate(playlistData) {
        this.managers.ui.updatePlaylistDisplay(playlistData);
        this.showNotification('Playlist updated successfully', 'success');
    }

    handleViewChange(view) {
        this.appState.currentView = view;
        this.managers.ui.switchView(view);
        
        // Update active navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[data-view="${view}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
    }

    handleWindowResize() {
        // Update UI layouts for responsive design
        this.managers.ui.handleResize();
        
        // Update player visualizations if needed
        if (this.managers.player.isPlaying()) {
            this.managers.player.updateVisualization();
        }
    }

    showMainApp() {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('main-app').style.display = 'flex';
        
        // Initialize main app components
        this.managers.ui.initializeMainApp();
    }

    showAuthScreen() {
        document.getElementById('main-app').style.display = 'none';
        document.getElementById('auth-container').style.display = 'flex';
    }

    showAppLoading() {
        this.appState.isLoading = true;
        const loadingElement = document.getElementById('app-loading');
        if (loadingElement) {
            loadingElement.style.display = 'flex';
        }
    }

    hideAppLoading() {
        this.appState.isLoading = false;
        const loadingElement = document.getElementById('app-loading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    showError(message, duration = 5000) {
        this.showNotification(message, 'error', duration);
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date()
        };
        
        this.appState.notifications.push(notification);
        this.managers.ui.showNotification(notification);
        
        // Auto-remove notification
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, duration);
    }

    removeNotification(id) {
        this.appState.notifications = this.appState.notifications.filter(n => n.id !== id);
        this.managers.ui.removeNotification(id);
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