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

// Export for use in other files
window.CONFIG = CONFIG;
window.Storage = Storage;