// Utility Functions
class Utils {
    // Time formatting
    static formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return '--:--';
        
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    static formatTimeAgo(date) {
        if (!date) return 'Unknown';
        
        const now = new Date();
        const diffMs = now - new Date(date);
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffWeeks < 4) return `${diffWeeks}w ago`;
        if (diffMonths < 12) return `${diffMonths}mo ago`;
        return `${diffYears}y ago`;
    }

    // String utilities
    static truncateText(text, maxLength = 50) {
        if (!text || text.length <= maxLength) return text || '';
        return text.substring(0, maxLength) + '...';
    }

    static capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    static slugify(text) {
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Array utilities
    static shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    static removeDuplicates(array, key = null) {
        if (!key) {
            return [...new Set(array)];
        }
        const seen = new Set();
        return array.filter(item => {
            const value = typeof key === 'function' ? key(item) : item[key];
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
        });
    }

    static groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = typeof key === 'function' ? key(item) : item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }

    // Object utilities
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
        return obj;
    }

    // DOM utilities
    static createElement(tag, attributes = {}) {
        const element = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                element.innerHTML = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        return element;
    }

    // Animation utilities
    static fadeIn(element, duration = 300) {
        return new Promise(resolve => {
            element.style.opacity = '0';
            element.style.display = '';
            const start = performance.now();
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.opacity = progress.toString();
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    static fadeOut(element, duration = 300) {
        return new Promise(resolve => {
            const start = performance.now();
            const initialOpacity = parseFloat(getComputedStyle(element).opacity);
            
            const animate = (currentTime) => {
                const elapsed = currentTime - start;
                const progress = Math.min(elapsed / duration, 1);
                
                element.style.opacity = (initialOpacity * (1 - progress)).toString();
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.display = 'none';
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    // Notification utilities
    static showToast(message, type = 'info', duration = 3000) {
        const toast = this.createElement('div', {
            className: `toast toast-${type}`,
            innerHTML: message
        });
        
        const container = document.getElementById('toast-container') || document.body;
        container.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => container.removeChild(toast), 300);
        }, duration);
        
        return toast;
    }

    // Error handling
    static handleError(error, context = 'Unknown') {
        console.error(`Error in ${context}:`, error);
        
        // Send to error reporting service if available
        if (window.errorReporter) {
            window.errorReporter.report(error, context);
        }
        
        // Show user-friendly message
        if (window.musicApp) {
            window.musicApp.showNotification(
                'An error occurred. Please try again.',
                'error'
            );
        }
    }

    // Feature detection
    static supportsLocalStorage() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    static supportsWebAudio() {
        return !!(window.AudioContext || window.webkitAudioContext);
    }

    static supportsMediaSession() {
        return 'mediaSession' in navigator;
    }

    static supportsNotifications() {
        return 'Notification' in window;
    }

    // Merged from config.js
    static formatDate(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static shuffleArray(array) { // Already had, but ensuring no duplicate
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    static generateId() { // Already had, but ensuring
        return Math.random().toString(36).substr(2, 9);
    }

    static truncateText(text, maxLength = 50) { // Already had
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    static getPlaceholderImage(type = 'song', size = 300) {
        const colors = {
            song: '4f46e5',
            artist: 'dc2626',
            album: '059669',
            playlist: '7c3aed'
        };
        return `https://via.placeholder.com/${size}x${size}/${colors[type]}/ffffff?text=${type.charAt(0).toUpperCase()}`;
    }

    static showToast(message, type = 'info', duration = CONFIG.UI.TOAST_DURATION) {
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
    }

    static handleApiError(error) {
        console.error('API Error:', error);
        let message = 'An error occurred. Please try again.';
        
        if (error.response) {
            message = error.response.data?.message || `Error ${error.response.status}`;
        } else if (error.request) {
            message = 'Network error. Please check your connection.';
        }
        
        Utils.showToast(message, 'error');
        return message;
    }
}

// Export Utils class
window.Utils = Utils;

// Create convenient global shortcuts for commonly used utilities
window.formatDuration = Utils.formatDuration;
window.formatTimeAgo = Utils.formatTimeAgo;
window.debounce = Utils.debounce;
// Add more if needed