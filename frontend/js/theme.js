// Theme Manager
class ThemeManager {
    constructor() {
        this.themes = {
            dark: {
                name: 'Dark',
                icon: '🌙',
                colors: {
                    primary: '#1db954',
                    secondary: '#191414',
                    background: '#121212',
                    surface: '#181818',
                    text: '#ffffff',
                    textSecondary: '#b3b3b3',
                    accent: '#1ed760'
                }
            },
            light: {
                name: 'Light',
                icon: '☀️',
                colors: {
                    primary: '#1db954',
                    secondary: '#f6f6f6',
                    background: '#ffffff',
                    surface: '#f9f9f9',
                    text: '#000000',
                    textSecondary: '#737373',
                    accent: '#1ed760'
                }
            },
            midnight: {
                name: 'Midnight',
                icon: '🌚',
                colors: {
                    primary: '#bb86fc',
                    secondary: '#0a0a0a',
                    background: '#000000',
                    surface: '#1a1a1a',
                    text: '#ffffff',
                    textSecondary: '#aaaaaa',
                    accent: '#cf6679'
                }
            },
            ocean: {
                name: 'Ocean',
                icon: '🌊',
                colors: {
                    primary: '#00bcd4',
                    secondary: '#0d47a1',
                    background: '#0a1929',
                    surface: '#132f4c',
                    text: '#ffffff',
                    textSecondary: '#90caf9',
                    accent: '#29b6f6'
                }
            },
            sunset: {
                name: 'Sunset',
                icon: '🌅',
                colors: {
                    primary: '#ff6b35',
                    secondary: '#2d1b69',
                    background: '#1a0b3d',
                    surface: '#2d1b69',
                    text: '#ffffff',
                    textSecondary: '#ffab91',
                    accent: '#ff8a65'
                }
            },
            forest: {
                name: 'Forest',
                icon: '🌲',
                colors: {
                    primary: '#4caf50',
                    secondary: '#1b5e20',
                    background: '#0d1b0f',
                    surface: '#1b5e20',
                    text: '#ffffff',
                    textSecondary: '#a5d6a7',
                    accent: '#66bb6a'
                }
            }
        };

        this.currentTheme = 'dark';
        this.customThemes = new Map();
        this.init();
    }

    init() {
        this.loadSavedTheme();
        this.setupEventListeners();
        this.createThemeSelector();
        console.log('🎨 Theme Manager initialized');
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('selectedTheme');
        if (savedTheme && this.themes[savedTheme]) {
            this.setTheme(savedTheme);
        } else {
            this.setTheme('dark'); // Default theme
        }
    }

    setupEventListeners() {
        // Theme toggle button
        document.addEventListener('click', (e) => {
            if (e.target.matches('#theme-toggle') || e.target.closest('#theme-toggle')) {
                this.toggleTheme();
            }
        });
    }

    showThemeNotification(themeName, customMessage = null) {
        const theme = this.themes[themeName] || this.customThemes.get(themeName);
        const message = customMessage || `Switched to ${theme.name} theme`;
        
        Utils.showToast(message, 'info');
    }

    showError(message) {
        Utils.showToast(message, 'error');
    }

    dispatchThemeEvent(eventType, data) {
        const event = new CustomEvent(eventType, {
            detail: data,
            bubbles: true
        });
        document.dispatchEvent(event);
    }
}

// Initialize theme manager
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});