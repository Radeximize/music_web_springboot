// Configuration file for the music streaming app
const CONFIG = {
    API_BASE_URL: 'http://localhost:9188/api',
    
    // Local Storage Keys
    STORAGE_KEYS: {
        USER: 'music_app_user',
        THEME: 'music_app_theme',
        VOLUME: 'music_app_volume',
        QUEUE: 'music_app_queue',
        CURRENT_SONG: 'music_app_current_song',
        SHUFFLE: 'music_app_shuffle',
        REPEAT: 'music_app_repeat',
        FAVORITES: 'music_app_favorites'
    },
    
    // Default values
    DEFAULTS: {
        VOLUME: 0.5,
        THEME: 'dark',
        REPEAT_MODE: 'none', // 'none', 'one', 'all'
        SHUFFLE: false
    },
    
    // API Endpoints
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            FORGOT_PASSWORD: '/auth/forgot-password'
        },
        SONGS: '/songs',
        ARTISTS: '/artists',
        ALBUMS: '/albums',
        GENRES: '/genres',
        PLAYLISTS: '/playlists',
        PLAYLIST_SONGS: '/playlist-songs',
        USER_FAVORITES: '/user-favorites',
        PLAY_HISTORY: '/play-history',
        LYRICS: '/lyrics',
        SYNCED_LYRICS: '/synced-lyrics',
        USERS: '/users'
    },
    
    // UI Constants
    UI: {
        DEBOUNCE_DELAY: 300,
        ANIMATION_DURATION: 300,
        TOAST_DURATION: 3000,
        SEARCH_MIN_LENGTH: 1
    },
    
    // Audio Settings
    AUDIO: {
        CROSSFADE_DURATION: 3000,
        SEEK_STEP: 10, // seconds
        VOLUME_STEP: 0.1
    }
};

// Helper functions for localStorage with error handling
const Storage = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error getting ${key} from localStorage:`, error);
            return defaultValue;
        }
    },
    
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error setting ${key} in localStorage:`, error);
            return false;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing ${key} from localStorage:`, error);
            return false;
        }
    },
    
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
};

// Utility functions
const Utils = {
    // Format duration from seconds to mm:ss
    formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    // Format date to readable string
    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },
    
    // Debounce function for search
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Shuffle array
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },
    
    // Generate random ID
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    },
    
    // Truncate text
    truncateText(text, maxLength = 50) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },
    
    // Get placeholder image
    getPlaceholderImage(type = 'song', size = 300) {
        const colors = {
            song: '4f46e5',
            artist: 'dc2626',
            album: '059669',
            playlist: '7c3aed'
        };
        return `https://via.placeholder.com/${size}x${size}/${colors[type]}/ffffff?text=${type.charAt(0).toUpperCase()}`;
    },
    
    // Show toast notification
    showToast(message, type = 'info', duration = CONFIG.UI.TOAST_DURATION) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Add toast styles
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 24px',
            borderRadius: '8px',
            color: 'white',
            zIndex: '9999',
            opacity: '0',
            transform: 'translateX(100%)',
            transition: 'all 0.3s ease'
        });
        
        // Set background color based on type
        const colors = {
            info: '#3b82f6',
            success: '#10b981',
            warning: '#f59e0b',
            error: '#ef4444'
        };
        toast.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after duration
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    },
    
    // Handle API errors
    handleApiError(error) {
        console.error('API Error:', error);
        let message = 'An error occurred. Please try again.';
        
        if (error.response) {
            // Server responded with error status
            message = error.response.data?.message || `Error ${error.response.status}`;
        } else if (error.request) {
            // Request was made but no response received
            message = 'Network error. Please check your connection.';
        }
        
        Utils.showToast(message, 'error');
        return message;
    }
};

// Export for use in other files
window.CONFIG = CONFIG;
window.Storage = Storage;
window.Utils = Utils;