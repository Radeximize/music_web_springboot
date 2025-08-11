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
        // Load genres and artists for filters
        await this.loadSearchFilters();
    }

    async loadSearchFilters() {
        try {
            const genreFilter = document.getElementById('genreFilter');
            const artistFilter = document.getElementById('artistFilter');

            // Load genres
            const genres = await apiService.getGenres();
            genreFilter.innerHTML = '<option value="">All Genres</option>';
            genres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre.genreID;
                option.textContent = genre.genreName || genre.name;
                genreFilter.appendChild(option);
            });

            // Add special options
            const unknownGenreOption = document.createElement('option');
            unknownGenreOption.value = 'unknown';
            unknownGenreOption.textContent = 'Songs without Genre';
            genreFilter.appendChild(unknownGenreOption);

            // Load artists
            const artists = await apiService.getArtists();
            artistFilter.innerHTML = '<option value="">All Artists</option><option value="none">Songs without Artist</option>';
            artists.forEach(artist => {
                const option = document.createElement('option');
                option.value = artist.artistID;
                option.textContent = artist.name;
                artistFilter.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading search filters:', error);
        }
    }

    async loadLibraryData() {
        if (!window.authManager || !window.authManager.isAuthenticated) {
            document.getElementById('libraryGrid').innerHTML = '<p>Please login to view your library</p>';
            return;
        }

        // Default to playlists tab
        this.showLibraryTab('playlists');
    }

    async loadFavoritesData() {
        if (!window.authManager || !window.authManager.isAuthenticated) {
            document.getElementById('favoritesSongsList').innerHTML = '<p>Please login to view your favorites</p>';
            return;
        }

        if (window.favoritesManager) {
            await window.favoritesManager.loadAndDisplayFavorites();
        }
    }

    async showLibraryTab(tabName) {
        // Update tab buttons
        const tabBtns = document.querySelectorAll('.library-tabs .tab-btn');
        tabBtns.forEach(btn => btn.classList.remove('active'));
        
        // Find the active tab button
        const activeTab = document.querySelector(`.library-tabs .tab-btn[onclick*="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        const libraryGrid = document.getElementById('libraryGrid');

        try {
            switch (tabName) {
                case 'playlists':
                    if (window.playlistManager) {
                        await window.playlistManager.loadAndDisplayPlaylists();
                    }
                    break;
                case 'artists':
                    const artists = await apiService.getArtists();
                    this.renderMusicGrid(libraryGrid, artists, 'artist');
                    break;
                case 'albums':
                    const albums = await apiService.getAlbums();
                    this.renderMusicGrid(libraryGrid, albums, 'album');
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${tabName}:`, error);
            libraryGrid.innerHTML = `<p>Error loading ${tabName}</p>`;
        }
    }

    renderMusicGrid(container, items, type) {
        if (!container) return;

        container.innerHTML = '';
        
        if (!items || items.length === 0) {
            container.innerHTML = `<p>No ${type}s found</p>`;
            return;
        }

        items.forEach(item => {
            const card = this.createMusicCard(item, type);
            container.appendChild(card);
        });
    }

    createMusicCard(item, type) {
        const card = document.createElement('div');
        card.className = 'music-card';
        card.setAttribute('data-type', type);
        card.setAttribute('data-id', this.getItemId(item, type));

        let imageUrl, title, subtitle;

        switch (type) {
            case 'song':
                imageUrl = item.album?.coverImage || Utils.getPlaceholderImage('song');
                title = item.title;
                subtitle = item.artist?.name || 'Unknown Artist';
                break;
            case 'artist':
                imageUrl = Utils.getPlaceholderImage('artist');
                title = item.name;
                subtitle = 'Artist';
                break;
            case 'album':
                imageUrl = item.coverImage || Utils.getPlaceholderImage('album');
                title = item.title;
                subtitle = item.artist?.name || 'Unknown Artist';
                break;
            case 'playlist':
                imageUrl = Utils.getPlaceholderImage('playlist');
                title = item.name;
                subtitle = `${item.songCount || 0} songs`;
                break;
        }

        card.innerHTML = `
            <img src="${imageUrl}" alt="${title}" loading="lazy">
            <h3>${Utils.truncateText(title, 20)}</h3>
            <p>${Utils.truncateText(subtitle, 25)}</p>
            <div class="play-overlay">
                <i class="fas fa-play"></i>
            </div>
        `;

        // Add event listeners
        card.addEventListener('click', () => this.handleCardClick(item, type));
        card.addEventListener('contextmenu', (e) => this.showContextMenu(e, item, type));

        return card;
    }

    getItemId(item, type) {
        switch (type) {
            case 'song': return item.songID;
            case 'artist': return item.artistID;
            case 'album': return item.albumID;
            case 'playlist': return item.playlistID;
            default: return item.id;
        }
    }

    async handleCardClick(item, type) {
        switch (type) {
            case 'song':
                if (window.player) {
                    await window.player.playSong(item);
                }
                break;
            case 'artist':
                await this.showArtistSongs(item);
                break;
            case 'album':
                await this.showAlbumSongs(item);
                break;
            case 'playlist':
                await this.showPlaylistSongs(item);
                break;
        }
    }

    async showArtistSongs(artist) {
        try {
            const songs = await apiService.getSongs({ artist: artist.artistID });
            this.showSongsList(songs, `Songs by ${artist.name}`);
        } catch (error) {
            Utils.handleApiError(error);
        }
    }

    async showAlbumSongs(album) {
        try {
            const songs = await apiService.getSongs();
            const albumSongs = songs.filter(song => song.album?.albumID === album.albumID);
            this.showSongsList(albumSongs, album.title);
        } catch (error) {
            Utils.handleApiError(error);
        }
    }

    async showPlaylistSongs(playlist) {
        if (window.playlistManager) {
            await window.playlistManager.showPlaylistSongs(playlist);
        }
    }

    showSongsList(songs, title) {
        // Create a temporary modal or section to show songs
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <span class="close">&times;</span>
                <h2>${title}</h2>
                <div class="songs-list"></div>
            </div>
        `;

        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
            document.body.style.overflow = 'auto';
        });

        const songsList = modal.querySelector('.songs-list');
        this.renderSongsList(songsList, songs);

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeBtn.click();
            }
        });
    }

    renderSongsList(container, songs) {
        if (!container) return;

        container.innerHTML = '';

        if (!songs || songs.length === 0) {
            container.innerHTML = '<p>No songs found</p>';
            return;
        }

        songs.forEach((song, index) => {
            const songRow = this.createSongRow(song, index + 1);
            container.appendChild(songRow);
        });
    }

    createSongRow(song, index) {
        const row = document.createElement('div');
        row.className = 'song-row';
        row.setAttribute('data-song-id', song.songID);

        const imageUrl = song.album?.coverImage || Utils.getPlaceholderImage('song', 40);
        const duration = Utils.formatDuration(song.duration);

        row.innerHTML = `
            <div class="song-number">${index}</div>
            <div class="song-info">
                <img src="${imageUrl}" alt="${song.title}" loading="lazy">
                <div class="song-details">
                    <h4>${song.title}</h4>
                    <p>${song.artist?.name || 'Unknown Artist'}</p>
                </div>
            </div>
            <div class="song-album">${song.album?.title || 'Unknown Album'}</div>
            <div class="song-duration">${duration}</div>
            <div class="song-actions">
                <button class="favorite-btn" onclick="toggleSongFavorite(${song.songID})">
                    <i class="far fa-heart"></i>
                </button>
            </div>
        `;

        // Add click listener to play song
        row.addEventListener('click', (e) => {
            if (!e.target.closest('.song-actions')) {
                if (window.player) {
                    window.player.playSong(song);
                }
            }
        });

        // Add context menu
        row.addEventListener('contextmenu', (e) => {
            this.showContextMenu(e, song, 'song');
        });

        return row;
    }

    setupContextMenu() {
        const contextMenu = document.getElementById('contextMenu');
        
        // Hide context menu on click outside
        document.addEventListener('click', () => {
            contextMenu.style.display = 'none';
        });

        // Prevent context menu from closing when clicking inside it
        contextMenu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    showContextMenu(event, item, type) {
        event.preventDefault();
        const contextMenu = document.getElementById('contextMenu');
        
        this.contextMenuTarget = { item, type };
        
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