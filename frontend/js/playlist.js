// Playlist Management
class PlaylistManager {
    constructor() {
        this.userPlaylists = [];
        this.currentPlaylistSong = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Modal close events
        const playlistModal = document.getElementById('playlistModal');
        if (playlistModal) {
            playlistModal.addEventListener('click', (e) => {
                if (e.target === playlistModal) {
                    this.closePlaylistModal();
                }
            });
        }
    }

    async loadUserPlaylists() {
        if (!window.authManager || !window.authManager.isAuthenticated) {
            this.userPlaylists = [];
            return;
        }

        try {
            const allPlaylists = await apiService.getPlaylists();
            const userId = window.authManager.getCurrentUserId();
            
            this.userPlaylists = allPlaylists.filter(playlist => 
                playlist.user && playlist.user.id === userId
            );
            
            this.updatePlaylistsUI();
        } catch (error) {
            console.error('Error loading user playlists:', error);
            this.userPlaylists = [];
        }
    }

    async loadAndDisplayPlaylists() {
        await this.loadUserPlaylists();
        const libraryGrid = document.getElementById('libraryGrid');
        
        if (this.userPlaylists.length === 0) {
            libraryGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-music"></i>
                    <h3>No playlists yet</h3>
                    <p>Create your first playlist to get started</p>
                    <button onclick="createPlaylist()" class="create-btn">
                        <i class="fas fa-plus"></i> Create Playlist
                    </button>
                </div>
            `;
            return;
        }

        // Add song counts to playlists
        const playlistsWithCounts = await Promise.all(
            this.userPlaylists.map(async (playlist) => {
                try {
                    const songCount = await apiService.getPlaylistSongCount(playlist.playlistID);
                    return { ...playlist, songCount };
                } catch (error) {
                    return { ...playlist, songCount: 0 };
                }
            })
        );

        if (window.uiManager) {
            window.uiManager.renderMusicGrid(libraryGrid, playlistsWithCounts, 'playlist');
        }
    }

    updatePlaylistsUI() {
        const playlistsList = document.getElementById('playlistsList');
        if (!playlistsList) return;

        playlistsList.innerHTML = '';

        this.userPlaylists.forEach(playlist => {
            const playlistItem = document.createElement('div');
            playlistItem.className = 'playlist-item nav-item';
            playlistItem.innerHTML = `
                <i class="fas fa-music"></i>
                <span>${Utils.truncateText(playlist.name, 20)}</span>
            `;

            playlistItem.addEventListener('click', () => {
                this.showPlaylistSongs(playlist);
            });

            playlistsList.appendChild(playlistItem);
        });
    }

    async showPlaylistSongs(playlist) {
        try {
            const playlistSongs = await apiService.getSongsByPlaylist(playlist.playlistID);
            const songs = playlistSongs.map(ps => ps.song).filter(Boolean);

            // Switch to library section and show playlist details
            if (window.uiManager) {
                window.uiManager.showSection('library');
            }

            const libraryContent = document.getElementById('libraryContent');
            libraryContent.innerHTML = `
                <div class="playlist-detail-header">
                    <button onclick="goBackToPlaylists()" class="back-btn">
                        <i class="fas fa-arrow-left"></i> Back to Playlists
                    </button>
                    <div class="playlist-header">
                        <div class="playlist-image">
                            <i class="fas fa-music"></i>
                        </div>
                        <div class="playlist-info">
                            <span class="playlist-type">Playlist</span>
                            <h1>${playlist.name}</h1>
                            <p>${songs.length} song${songs.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div class="playlist-actions">
                            <button class="play-btn" onclick="playPlaylist(${playlist.playlistID})">
                                <i class="fas fa-play"></i>
                            </button>
                            <button class="shuffle-btn" onclick="shufflePlaylist(${playlist.playlistID})">
                                <i class="fas fa-random"></i>
                            </button>
                            ${window.authManager?.canEditPlaylist(playlist) ? `
                                <button class="edit-btn" onclick="editPlaylist(${playlist.playlistID})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="delete-btn" onclick="deletePlaylist(${playlist.playlistID})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="songs-list" id="playlistSongsList"></div>
            `;

            const songsList = document.getElementById('playlistSongsList');
            if (window.uiManager) {
                window.uiManager.renderSongsList(songsList, songs);
            }

        } catch (error) {
            console.error('Error loading playlist songs:', error);
            Utils.showToast('Error loading playlist songs', 'error');
        }
    }

    async createPlaylist(name = null) {
        if (!window.authManager || !window.authManager.requireAuth('create a playlist')) {
            return;
        }

        const playlistName = name || prompt('Enter playlist name:');
        if (!playlistName || playlistName.trim() === '') {
            return;
        }

        try {
            const userId = window.authManager.getCurrentUserId();
            const playlistData = {
                name: playlistName.trim(),
                user: { id: userId }
            };

            const newPlaylist = await apiService.createPlaylist(playlistData);
            this.userPlaylists.push(newPlaylist);
            this.updatePlaylistsUI();
            
            Utils.showToast('Playlist created successfully', 'success');
            this.showPlaylistSongs(newPlaylist);
        } catch (error) {
            console.error('Error creating playlist:', error);
            Utils.showToast('Error creating playlist', 'error');
        }
    }
}