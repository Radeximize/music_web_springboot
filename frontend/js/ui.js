// UI Management and Theme handling
class UIManager {
    constructor() {
        this.currentSection = 'home';
        this.currentTheme = CONFIG.DEFAULTS.THEME;
        this.contextMenuTarget = null;
        this.init();
    }

    init() {
        this.loadTheme();
        this.setupContextMenu();
        this.setupSectionNavigation();
        this.loadInitialData();
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    loadTheme() {
        const savedTheme = Storage.get(CONFIG.STORAGE_KEYS.THEME, CONFIG.DEFAULTS.THEME);
        this.setTheme(savedTheme);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        Storage.set(CONFIG.STORAGE_KEYS.THEME, theme);
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        Utils.showToast(`Switched to ${newTheme} theme`, 'info');
    }

    setupSectionNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('onclick')?.match(/showSection\('(\w+)'\)/)?.[1];
                if (section) {
                    this.showSection(section);
                }
            });
        });
    }

    showSection(sectionName) {
        // Hide all sections
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => section.classList.remove('active'));

        // Show target section
        const targetSection = document.getElementById(`${sectionName}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionName;
        }

        // Update navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        
        const activeNavItem = document.querySelector(`.nav-item[onclick*="${sectionName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    async loadSectionData(sectionName) {
        try {
            switch (sectionName) {
                case 'home':
                    await this.loadHomeData();
                    break;
                case 'search':
                    await this.loadSearchData();
                    break;
                case 'library':
                    await this.loadLibraryData();
                    break;
                case 'favorites':
                    await this.loadFavoritesData();
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${sectionName} data:`, error);
            Utils.showToast(`Error loading ${sectionName} data`, 'error');
        }
    }

    async loadHomeData() {
        const recentlyPlayedGrid = document.getElementById('recentlyPlayedGrid');
        const artistsGrid = document.getElementById('artistsGrid');

        try {
            // Load recent songs
            const songs = await apiService.getSongs();
            const recentSongs = songs.slice(0, 6); // Get first 6 songs
            this.renderMusicGrid(recentlyPlayedGrid, recentSongs, 'song');

            // Load artists
            const artists = await apiService.getArtists();
            const popularArtists = artists.slice(0, 6); // Get first 6 artists
            this.renderMusicGrid(artistsGrid, popularArtists, 'artist');
        } catch (error) {
            console.error('Error loading home data:', error);
        }
    }

    async loadSearchData() {
        // Implementation for search data loading if needed
    }

    async loadLibraryData() {
        // Implementation for library data
    }

    async loadFavoritesData() {
        // Implementation for favorites data
    }

    renderMusicGrid(container, items, type) {
        if (!container) return;
        container.innerHTML = '';
        items.forEach(item => container.appendChild(this.createMusicCard(item, type)));
    }

    createMusicCard(item, type) {
        const card = Utils.createElement('div', { className: 'music-card' });
        const imageUrl = item.image || Utils.getPlaceholderImage(type);
        card.innerHTML = `
            <img src="${imageUrl}" alt="${item.title || item.name}" onerror="this.src='https://via.placeholder.com/100?text=Error';">
            <h4>${Utils.truncateText(item.title || item.name)}</h4>
            <p>${type === 'song' ? item.artist?.name : item.description || ''}</p>
        `;
        return card;
    }

    showNotification(notification) {
        Utils.showToast(notification.message, notification.type);
    }

    removeNotification(id) {
        // Toasts auto-remove, so no additional action needed
    }

    handleResize() {
        const grids = document.querySelectorAll('.music-grid, .results-grid, .library-grid');
        grids.forEach(grid => {
            const cols = window.innerWidth < 768 ? 2 : 4;
            grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        });
        if (window.audioVisualizer) window.audioVisualizer.resizeCanvas();
    }

    setupContextMenu() {
        document.addEventListener('contextmenu', (event) => {
            const target = event.target.closest('[data-context-type]');
            if (target) {
                event.preventDefault();
                this.contextMenuTarget = {
                    type: target.dataset.contextType,
                    item: JSON.parse(target.dataset.contextItem || '{}')
                };
                this.showContextMenu(event);
            }
        });

        document.addEventListener('click', () => {
            document.getElementById('contextMenu').style.display = 'none';
        });
    }

    showContextMenu(event) {
        const contextMenu = document.getElementById('contextMenu');
        if (!contextMenu) return;

        contextMenu.style.display = 'block';
        contextMenu.style.left = event.pageX + 'px';
        contextMenu.style.top = event.pageY + 'px';

        // Adjust position if menu goes off screen
        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = (event.pageX - rect.width) + 'px';
        }
        if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = (event.pageY - rect.height) + 'px';
        }
    }

    async loadInitialData() {
        // Load data that's needed on startup
        try {
            await this.loadHomeData();
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    updateFavoriteCounts() {
        // Update favorites count in the favorites section
        if (window.favoritesManager) {
            const count = window.favoritesManager.getFavoriteCount();
            const favoritesCount = document.getElementById('favoritesCount');
            if (favoritesCount) {
                favoritesCount.textContent = `${count} song${count !== 1 ? 's' : ''}`;
            }
        }
    }

    showLoading(container) {
        if (container) {
            container.innerHTML = '<div class="loading">Loading...</div>';
        }
    }

    hideLoading() {
        const loadingElements = document.querySelectorAll('.loading');
        loadingElements.forEach(element => {
            element.remove();
        });
    }
}

// Global UI functions
function toggleTheme() {
    if (window.uiManager) {
        window.uiManager.toggleTheme();
    }
}

function showSection(sectionName) {
    if (window.uiManager) {
        window.uiManager.showSection(sectionName);
    }
}

function showLibraryTab(tabName) {
    if (window.uiManager) {
        window.uiManager.showLibraryTab(tabName);
    }
}

// Context menu actions
function playNext() {
    const target = window.uiManager?.contextMenuTarget;
    if (target && target.type === 'song' && window.player) {
        window.player.addToQueue(target.item);
        Utils.showToast('Added to queue', 'success');
    }
    document.getElementById('contextMenu').style.display = 'none';
}

function addToQueue() {
    playNext(); // Same functionality as play next for now
}

function toggleFavorite() {
    const target = window.uiManager?.contextMenuTarget;
    if (target && target.type === 'song' && window.favoritesManager) {
        window.favoritesManager.toggleFavorite(target.item);
    }
    document.getElementById('contextMenu').style.display = 'none';
}

function showAddToPlaylist() {
    const target = window.uiManager?.contextMenuTarget;
    if (target && target.type === 'song' && window.playlistManager) {
        window.playlistManager.showAddToPlaylistModal(target.item);
    }
    document.getElementById('contextMenu').style.display = 'none';
}

function toggleSongFavorite(songId) {
    // Find the song and toggle favorite
    if (window.favoritesManager) {
        // This would need to be implemented to find the song by ID
        console.log('Toggle favorite for song:', songId);
    }
}

function loadRecentlyPlayed() {
    // Implementation for showing all recently played
    Utils.showToast('Recently played - Coming soon!', 'info');
}

function loadArtists() {
    // Implementation for showing all artists
    Utils.showToast('All artists - Coming soon!', 'info');
}

function playFavorites() {
    if (window.favoritesManager) {
        window.favoritesManager.playAllFavorites();
    }
}

function shuffleFavorites() {
    if (window.favoritesManager) {
        window.favoritesManager.shuffleAndPlayFavorites();
    }
}

// Initialize UI manager
window.uiManager = new UIManager();