// Favorites Manager
class FavoritesManager {
    constructor() {
        this.favorites = new Map(); // songId -> favoriteData
        this.isLoading = false;
        this.currentUserId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        console.log('🤍 Favorites Manager initialized');
    }

    setupEventListeners() {
        // Listen for favorite button clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.favorite-btn')) {
                const btn = e.target.closest('.favorite-btn');
                const songId = parseInt(btn.dataset.songId);
                this.toggleFavorite(songId);
            }
        });

        // Listen for user login/logout
        document.addEventListener('user-login', (e) => {
            this.currentUserId = e.detail.user.id;
            this.loadUserFavorites(this.currentUserId);
        });

        document.addEventListener('user-logout', () => {
            this.clearFavorites();
            this.currentUserId = null;
        });
    }

    async loadUserFavorites(userId) {
        if (!userId || !window.authManager.isAuthenticated()) return;

        try {
            this.isLoading = true;
            this.updateLoadingState();

            const favorites = await window.apiService.getUserFavorites(userId);
            this.favorites.clear();

            favorites.forEach(favorite => {
                this.favorites.set(favorite.song.songID, {
                    song: favorite.song,
                    favoritedAt: new Date(favorite.favoritedAt)
                });
            });

            this.updateUI();
            console.log(`❤️ Loaded ${favorites.length} favorites for user ${userId}`);

        } catch (error) {
            console.error('Failed to load user favorites:', error);
            this.showError('Failed to load your favorites');
        } finally {
            this.isLoading = false;
            this.updateLoadingState();
        }
    }

    async toggleFavorite(songId) {
        if (!this.currentUserId || !window.authManager.isAuthenticated()) {
            this.showError('Please log in to add favorites');
            return;
        }

        if (!songId) return;

        try {
            const isFavorite = this.isFavorite(songId);
            const btn = document.querySelector(`[data-song-id="${songId}"] .favorite-btn`);
            
            if (btn) {
                btn.disabled = true;
                btn.classList.add('loading');
            }

            if (isFavorite) {
                await this.removeFavorite(songId);
            } else {
                await this.addFavorite(songId);
            }

            this.updateFavoriteButton(songId);
            
        } catch (error) {
            console.error('Failed to toggle favorite:', error);
            this.showError('Failed to update favorite');
        } finally {
            const btn = document.querySelector(`[data-song-id="${songId}"] .favorite-btn`);
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('loading');
            }
        }
    }

    async addFavorite(songId) {
        if (!this.currentUserId) return;

        try {
            // Get song details
            const song = await window.apiService.getSong(songId);
            if (!song) {
                throw new Error('Song not found');
            }

            // Add to backend
            const favoriteData = {
                user: { id: this.currentUserId },
                song: { songID: songId }
            };

            await window.apiService.addFavorite(favoriteData);

            // Add to local state
            this.favorites.set(songId, {
                song: song,
                favoritedAt: new Date()
            });

            this.updateUI();
            this.dispatchFavoriteEvent('favorite-added', { songId });
            this.showSuccess('Added to favorites');
        } catch (error) {
            console.error('Failed to add favorite:', error);
            this.showError('Failed to add to favorites');
        }
    }

    async removeFavorite(songId) {
        if (!this.currentUserId) return;

        try {
            const favorite = this.favorites.get(songId);
            
            // Remove from backend
            await window.api.removeFavorite(this.currentUserId, songId);

            // Remove from local state
            this.favorites.delete(songId);

            this.showSuccess(`Removed "${favorite?.song?.title || 'song'}" from favorites`);
            this.dispatchFavoriteEvent('favorite-removed', { songId });

        } catch (error) {
            console.error('Failed to remove favorite:', error);
            throw error;
        }
    }

    isFavorite(songId) {
        return this.favorites.has(songId);
    }

    getFavorites() {
        return Array.from(this.favorites.values()).sort((a, b) => 
            b.favoritedAt - a.favoritedAt
        );
    }

    getFavoriteIds() {
        return Array.from(this.favorites.keys());
    }

    getFavoritesCount() {
        return this.favorites.size;
    }

    updateUI() {
        // Update favorite buttons in song lists
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const songId = parseInt(btn.dataset.songId);
            this.updateFavoriteButton(songId);
        });

        // Update favorites count display
        this.updateFavoritesCount();

        // Update favorites view if currently displayed
        if (this.isCurrentView('favorites')) {
            this.displayFavorites();
        }
    }

    updateFavoriteButton(songId) {
        const buttons = document.querySelectorAll(`[data-song-id="${songId}"] .favorite-btn`);
        const isFavorite = this.isFavorite(songId);

        buttons.forEach(btn => {
            const icon = btn.querySelector('i') || btn;
            
            if (isFavorite) {
                btn.classList.add('favorited');
                icon.textContent = '❤️';
                btn.title = 'Remove from favorites';
            } else {
                btn.classList.remove('favorited');
                icon.textContent = '🤍';
                btn.title = 'Add to favorites';
            }
        });
    }

    updateFavoritesCount() {
        const countElements = document.querySelectorAll('.favorites-count');
        const count = this.getFavoritesCount();
        
        countElements.forEach(element => {
            element.textContent = count;
        });

        // Update navigation badge
        const favoritesNav = document.querySelector('[data-view="favorites"] .nav-badge');
        if (favoritesNav) {
            if (count > 0) {
                favoritesNav.textContent = count;
                favoritesNav.style.display = 'inline';
            } else {
                favoritesNav.style.display = 'none';
            }
        }
    }

    displayFavorites() {
        const container = document.getElementById('favorites-content');
        if (!container) return;

        const favorites = this.getFavorites();

        if (favorites.length === 0) {
            container.innerHTML = this.getEmptyFavoritesHTML();
            return;
        }

        const songsHTML = favorites.map(favorite => 
            this.createFavoriteSongHTML(favorite)
        ).join('');

        container.innerHTML = `
            <div class="favorites-header">
                <h2>Your Favorites</h2>
                <p>${favorites.length} song${favorites.length !== 1 ? 's' : ''}</p>
                <div class="favorites-actions">
                    <button class="btn btn-primary" onclick="favoritesManager.playAllFavorites()">
                        <i>▶️</i> Play All
                    </button>
                    <button class="btn btn-secondary" onclick="favoritesManager.shuffleFavorites()">
                        <i>🔀</i> Shuffle
                    </button>
                </div>
            </div>
            <div class="favorites-list">
                ${songsHTML}
            </div>
        `;
    }

    createFavoriteSongHTML(favorite) {
        const song = favorite.song;
        const favoritedDate = favorite.favoritedAt.toLocaleDateString();
        
        return `
            <div class="song-item" data-song-id="${song.songID}">
                <div class="song-info">
                    <div class="song-cover">
                        <img src="${song.album?.coverImage || '/api/placeholder/50/50'}" 
                             alt="${song.title}" 
                             onerror="this.src='/api/placeholder/50/50'">
                        <button class="play-btn" onclick="player.playSong(${song.songID})">
                            <i>▶️</i>
                        </button>
                    </div>
                    <div class="song-details">
                        <h4>${song.title}</h4>
                        <p>${song.artist?.name || 'Unknown Artist'}</p>
                    </div>
                </div>
                <div class="song-meta">
                    <span class="album">${song.album?.title || 'Unknown Album'}</span>
                    <span class="date-added">Added ${favoritedDate}</span>
                    <span class="duration">${this.formatDuration(song.duration)}</span>
                </div>
                <div class="song-actions">
                    <button class="favorite-btn favorited" data-song-id="${song.songID}" title="Remove from favorites">
                        <i>❤️</i>
                    </button>
                    <button class="more-btn" onclick="showSongMenu(${song.songID})">
                        <i>⋯</i>
                    </button>
                </div>
            </div>
        `;
    }

    getEmptyFavoritesHTML() {
        return `
            <div class="empty-state">
                <div class="empty-icon">💔</div>
                <h3>No favorites yet</h3>
                <p>Start adding songs to your favorites by clicking the heart icon ❤️</p>
                <button class="btn btn-primary" onclick="window.musicApp.handleViewChange('home')">
                    Discover Music
                </button>
            </div>
        `;
    }

    async playAllFavorites() {
        const favorites = this.getFavorites();
        if (favorites.length === 0) return;

        const songs = favorites.map(f => f.song);
        await window.player.setQueue(songs);
        window.player.play();
        
        this.showSuccess(`Playing ${favorites.length} favorite songs`);
    }

    async shuffleFavorites() {
        const favorites = this.getFavorites();
        if (favorites.length === 0) return;

        const songs = this.shuffleArray(favorites.map(f => f.song));
        await window.player.setQueue(songs);
        window.player.setShuffleMode(true);
        window.player.play();
        
        this.showSuccess(`Shuffling ${favorites.length} favorite songs`);
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    formatDuration(seconds) {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    updateLoadingState() {
        const loadingElements = document.querySelectorAll('.favorites-loading');
        loadingElements.forEach(element => {
            element.style.display = this.isLoading ? 'block' : 'none';
        });
    }

    isCurrentView(view) {
        return window.musicApp?.getAppState().currentView === view;
    }

    clearFavorites() {
        this.favorites.clear();
        this.updateUI();
    }

    dispatchFavoriteEvent(eventType, data) {
        const event = new CustomEvent(eventType, {
            detail: data,
            bubbles: true
        });
        document.dispatchEvent(event);
    }

    showSuccess(message) {
        if (window.musicApp) {
            window.musicApp.showNotification(message, 'success');
        }
    }

    showError(message) {
        if (window.musicApp) {
            window.musicApp.showNotification(message, 'error');
        }
    }

    // Export favorites functionality
    async exportFavorites() {
        try {
            const favorites = this.getFavorites();
            const exportData = {
                exportedAt: new Date().toISOString(),
                userId: this.currentUserId,
                count: favorites.length,
                favorites: favorites.map(f => ({
                    title: f.song.title,
                    artist: f.song.artist?.name,
                    album: f.song.album?.title,
                    favoritedAt: f.favoritedAt.toISOString()
                }))
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `my-favorites-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showSuccess('Favorites exported successfully');
        } catch (error) {
            console.error('Failed to export favorites:', error);
            this.showError('Failed to export favorites');
        }
    }
}

// Initialize favorites manager
document.addEventListener('DOMContentLoaded', () => {
    window.favoritesManager = new FavoritesManager();
});