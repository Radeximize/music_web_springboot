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

        // Theme selector
        document.addEventListener('change', (e) => {
            if (e.target.matches('#theme-selector')) {
                this.setTheme(e.target.value);
            }
        });

        // Custom theme events
        document.addEventListener('theme-created', (e) => {
            this.addCustomTheme(e.detail.theme);
        });
    }

    setTheme(themeName) {
        if (!this.themes[themeName] && !this.customThemes.has(themeName)) {
            console.error(`Theme "${themeName}" not found`);
            return;
        }

        const theme = this.themes[themeName] || this.customThemes.get(themeName);
        this.currentTheme = themeName;

        // Apply theme to document
        document.documentElement.setAttribute('data-theme', themeName);
        
        // Apply CSS custom properties
        this.applyCSSVariables(theme.colors);
        
        // Update theme controls
        this.updateThemeControls(theme);
        
        // Save theme preference
        localStorage.setItem('selectedTheme', themeName);
        
        // Apply special theme effects
        this.applyThemeEffects(themeName);
        
        // Dispatch theme change event
        this.dispatchThemeEvent('theme-changed', { theme: themeName, colors: theme.colors });
        
        console.log(`🎨 Applied theme: ${theme.name}`);
    }

    applyCSSVariables(colors) {
        const root = document.documentElement;
        
        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(`--color-${this.camelToKebab(key)}`, value);
        });

        // Generate additional color variants
        root.style.setProperty('--color-primary-dark', this.darkenColor(colors.primary, 20));
        root.style.setProperty('--color-primary-light', this.lightenColor(colors.primary, 20));
        root.style.setProperty('--color-surface-hover', this.adjustOpacity(colors.surface, 0.8));
        root.style.setProperty('--color-text-muted', this.adjustOpacity(colors.text, 0.6));
    }

    updateThemeControls(theme) {
        // Update theme toggle button
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = theme.icon;
            toggleBtn.title = `Current theme: ${theme.name}`;
        }

        // Update theme selector
        const selector = document.getElementById('theme-selector');
        if (selector) {
            selector.value = this.currentTheme;
        }

        // Update theme indicator
        const indicator = document.querySelector('.theme-indicator');
        if (indicator) {
            indicator.textContent = theme.name;
            indicator.style.color = theme.colors.primary;
        }
    }

    toggleTheme() {
        const themeNames = Object.keys(this.themes);
        const currentIndex = themeNames.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themeNames.length;
        const nextTheme = themeNames[nextIndex];
        
        this.setTheme(nextTheme);
        this.showThemeNotification(nextTheme);
    }

    createThemeSelector() {
        const container = document.getElementById('theme-selector-container');
        if (!container) return;

        const selector = document.createElement('select');
        selector.id = 'theme-selector';
        selector.className = 'theme-selector';

        // Add built-in themes
        Object.entries(this.themes).forEach(([key, theme]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${theme.icon} ${theme.name}`;
            selector.appendChild(option);
        });

        // Add custom themes
        this.customThemes.forEach((theme, key) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `✨ ${theme.name}`;
            selector.appendChild(option);
        });

        container.appendChild(selector);
    }

    applyThemeEffects(themeName) {
        const body = document.body;
        
        // Remove existing theme classes
        body.className = body.className.replace(/theme-\w+/g, '');
        
        // Add current theme class
        body.classList.add(`theme-${themeName}`);

        // Apply special effects based on theme
        switch (themeName) {
            case 'midnight':
                this.addStarField();
                break;
            case 'ocean':
                this.addWaveEffect();
                break;
            case 'sunset':
                this.addGradientOverlay();
                break;
            case 'forest':
                this.addParticleEffect();
                break;
            default:
                this.removeSpecialEffects();
        }
    }

    addStarField() {
        this.removeSpecialEffects();
        const starField = document.createElement('div');
        starField.id = 'star-field';
        starField.className = 'theme-effect';
        
        // Generate random stars
        for (let i = 0; i < 100; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 100 + '%';
            star.style.animationDelay = Math.random() * 3 + 's';
            starField.appendChild(star);
        }
        
        document.body.appendChild(starField);
    }

    addWaveEffect() {
        this.removeSpecialEffects();
        const waveContainer = document.createElement('div');
        waveContainer.id = 'wave-effect';
        waveContainer.className = 'theme-effect';
        waveContainer.innerHTML = `
            <div class="wave wave1"></div>
            <div class="wave wave2"></div>
            <div class="wave wave3"></div>
        `;
        document.body.appendChild(waveContainer);
    }

    addGradientOverlay() {
        this.removeSpecialEffects();
        const overlay = document.createElement('div');
        overlay.id = 'gradient-overlay';
        overlay.className = 'theme-effect';
        document.body.appendChild(overlay);
    }

    addParticleEffect() {
        this.removeSpecialEffects();
        const particles = document.createElement('div');
        particles.id = 'particle-effect';
        particles.className = 'theme-effect';
        
        // Generate floating particles
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 10 + 's';
            particle.style.animationDuration = (Math.random() * 20 + 10) + 's';
            particles.appendChild(particle);
        }
        
        document.body.appendChild(particles);
    }

    removeSpecialEffects() {
        document.querySelectorAll('.theme-effect').forEach(effect => {
            effect.remove();
        });
    }

    // Theme creation functionality
    createCustomTheme(name, colors) {
        const themeKey = name.toLowerCase().replace(/\s+/g, '-');
        const customTheme = {
            name,
            icon: '✨',
            colors: { ...colors },
            custom: true
        };

        this.customThemes.set(themeKey, customTheme);
        this.saveCustomThemes();
        this.updateThemeSelector();
        
        return themeKey;
    }

    addCustomTheme(theme) {
        const themeKey = this.createCustomTheme(theme.name, theme.colors);
        this.showThemeNotification(themeKey, 'Custom theme created successfully!');
    }

    updateThemeSelector() {
        const container = document.getElementById('theme-selector-container');
        if (container) {
            container.innerHTML = '';
            this.createThemeSelector();
        }
    }

    saveCustomThemes() {
        const customThemesData = {};
        this.customThemes.forEach((theme, key) => {
            customThemesData[key] = theme;
        });
        localStorage.setItem('customThemes', JSON.stringify(customThemesData));
    }

    loadCustomThemes() {
        try {
            const savedThemes = localStorage.getItem('customThemes');
            if (savedThemes) {
                const themesData = JSON.parse(savedThemes);
                Object.entries(themesData).forEach(([key, theme]) => {
                    this.customThemes.set(key, theme);
                });
            }
        } catch (error) {
            console.error('Failed to load custom themes:', error);
        }
    }

    exportTheme(themeName) {
        const theme = this.themes[themeName] || this.customThemes.get(themeName);
        if (!theme) return;

        const exportData = {
            name: theme.name,
            colors: theme.colors,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `theme-${themeName}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async importTheme(file) {
        try {
            const text = await file.text();
            const themeData = JSON.parse(text);
            
            if (!themeData.name || !themeData.colors) {
                throw new Error('Invalid theme file format');
            }

            const themeKey = this.createCustomTheme(themeData.name, themeData.colors);
            this.setTheme(themeKey);
            this.showThemeNotification(themeKey, 'Theme imported successfully!');
            
        } catch (error) {
            console.error('Failed to import theme:', error);
            this.showError('Failed to import theme. Please check the file format.');
        }
    }

    // Utility methods
    camelToKebab(str) {
        return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R > 0 ? R : 0) * 0x10000 +
            (G > 0 ? G : 0) * 0x100 + (B > 0 ? B : 0)).toString(16).slice(1);
    }

    adjustOpacity(color, opacity) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getThemeColors(themeName = null) {
        const theme = themeName ? 
            (this.themes[themeName] || this.customThemes.get(themeName)) : 
            (this.themes[this.currentTheme] || this.customThemes.get(this.currentTheme));
        return theme ? theme.colors : null;
    }

    getAllThemes() {
        const allThemes = { ...this.themes };
        this.customThemes.forEach((theme, key) => {
            allThemes[key] = theme;
        });
        return allThemes;
    }

    showThemeNotification(themeName, customMessage = null) {
        const theme = this.themes[themeName] || this.customThemes.get(themeName);
        const message = customMessage || `Switched to ${theme.name} theme`;
        
        if (window.musicApp) {
            window.musicApp.showNotification(message, 'info');
        }
    }

    showError(message) {
        if (window.musicApp) {
            window.musicApp.showNotification(message, 'error');
        }
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