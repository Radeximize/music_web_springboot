// API Service for handling all backend communications
class ApiService {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
    }

    // Generic request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const config = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, config);
            
            // Handle different response types
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API Request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    // Songs API
    async getSongs(filters = {}) {
        let endpoint = CONFIG.ENDPOINTS.SONGS;
        const params = new URLSearchParams();

        if (filters.searchTerm) {
            params.append('searchTerm', filters.searchTerm);
        }
        if (filters.genre) {
            params.append('genre', filters.genre);
        }
        if (filters.artist) {
            params.append('artist', filters.artist);
        }

        if (params.toString()) {
            endpoint += `?${params.toString()}`;
        }

        return this.request(endpoint);
    }

    async getSong(id) {
        return this.request(`${CONFIG.ENDPOINTS.SONGS}/${id}`);
    }

    async createSong(songData) {
        return this.request(CONFIG.ENDPOINTS.SONGS, {
            method: 'POST',
            body: JSON.stringify(songData)
        });
    }

    async updateSong(id, songData) {
        return this.request(`${CONFIG.ENDPOINTS.SONGS}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(songData)
        });
    }

    async deleteSong(id) {
        return this.request(`${CONFIG.ENDPOINTS.SONGS}/${id}`, {
            method: 'DELETE'
        });
    }

    // Artists API
    async getArtists() {
        return this.request(CONFIG.ENDPOINTS.ARTISTS);
    }

    async getArtist(id) {
        return this.request(`${CONFIG.ENDPOINTS.ARTISTS}/${id}`);
    }

    async createArtist(artistData) {
        return this.request(CONFIG.ENDPOINTS.ARTISTS, {
            method: 'POST',
            body: JSON.stringify(artistData)
        });
    }

    async updateArtist(id, artistData) {
        return this.request(`${CONFIG.ENDPOINTS.ARTISTS}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(artistData)
        });
    }

    async deleteArtist(id) {
        return this.request(`${CONFIG.ENDPOINTS.ARTISTS}/${id}`, {
            method: 'DELETE'
        });
    }

    // Albums API
    async getAlbums() {
        return this.request(CONFIG.ENDPOINTS.ALBUMS);
    }

    async getAlbum(id) {
        return this.request(`${CONFIG.ENDPOINTS.ALBUMS}/${id}`);
    }

    async createAlbum(albumData) {
        return this.request(CONFIG.ENDPOINTS.ALBUMS, {
            method: 'POST',
            body: JSON.stringify(albumData)
        });
    }

    async updateAlbum(id, albumData) {
        return this.request(`${CONFIG.ENDPOINTS.ALBUMS}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(albumData)
        });
    }

    async deleteAlbum(id) {
        return this.request(`${CONFIG.ENDPOINTS.ALBUMS}/${id}`, {
            method: 'DELETE'
        });
    }

    // Genres API
    async getGenres() {
        return this.request(CONFIG.ENDPOINTS.GENRES);
    }

    async getGenre(id) {
        return this.request(`${CONFIG.ENDPOINTS.GENRES}/${id}`);
    }

    async createGenre(genreData) {
        return this.request(CONFIG.ENDPOINTS.GENRES, {
            method: 'POST',
            body: JSON.stringify(genreData)
        });
    }

    async updateGenre(id, genreData) {
        return this.request(`${CONFIG.ENDPOINTS.GENRES}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(genreData)
        });
    }

    async deleteGenre(id) {
        return this.request(`${CONFIG.ENDPOINTS.GENRES}/${id}`, {
            method: 'DELETE'
        });
    }

    // Playlists API
    async getPlaylists() {
        return this.request(CONFIG.ENDPOINTS.PLAYLISTS);
    }

    async getPlaylist(id) {
        return this.request(`${CONFIG.ENDPOINTS.PLAYLISTS}/${id}`);
    }

    async createPlaylist(playlistData) {
        return this.request(CONFIG.ENDPOINTS.PLAYLISTS, {
            method: 'POST',
            body: JSON.stringify(playlistData)
        });
    }

    async updatePlaylist(id, playlistData) {
        return this.request(`${CONFIG.ENDPOINTS.PLAYLISTS}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(playlistData)
        });
    }

    async deletePlaylist(id) {
        return this.request(`${CONFIG.ENDPOINTS.PLAYLISTS}/${id}`, {
            method: 'DELETE'
        });
    }

    // Playlist Songs API
    async getPlaylistSongs() {
        return this.request(CONFIG.ENDPOINTS.PLAYLIST_SONGS);
    }

    async getSongsByPlaylist(playlistId) {
        return this.request(`${CONFIG.ENDPOINTS.PLAYLIST_SONGS}/playlist/${playlistId}`);
    }

    async getPlaylistsBySong(songId) {
        return this.request(`${CONFIG.ENDPOINTS.PLAYLIST_SONGS}/song/${songId}`);
    }

    async addSongToPlaylist(playlistSongData) {
        return this.request(CONFIG.ENDPOINTS.PLAYLIST_SONGS, {
            method: 'POST',
            body: JSON.stringify(playlistSongData)
        });
    }

    async removeSongFromPlaylist(playlistId, songId) {
        return this.request(`${CONFIG.ENDPOINTS.PLAYLIST_SONGS}/playlist/${playlistId}/song/${songId}`, {
            method: 'DELETE'
        });
    }

    // User Favorites API
    async getUserFavorites() {
        return this.request(CONFIG.ENDPOINTS.USER_FAVORITES);
    }

    async getFavoritesByUser(userId) {
        return this.request(`${CONFIG.ENDPOINTS.USER_FAVORITES}/user/${userId}`);
    }

    async getUsersBySong(songId) {
        return this.request(`${CONFIG.ENDPOINTS.USER_FAVORITES}/song/${songId}`);
    }

    async addFavorite(favoriteData) {
        return this.request(CONFIG.ENDPOINTS.USER_FAVORITES, {
            method: 'POST',
            body: JSON.stringify(favoriteData)
        });
    }

    async removeFavorite(userId, songId) {
        return this.request(`${CONFIG.ENDPOINTS.USER_FAVORITES}/user/${userId}/song/${songId}`, {
            method: 'DELETE'
        });
    }

    // Play History API
    async getPlayHistory() {
        return this.request(CONFIG.ENDPOINTS.PLAY_HISTORY);
    }

    async getPlayHistoryById(id) {
        return this.request(`${CONFIG.ENDPOINTS.PLAY_HISTORY}/${id}`);
    }

    async addPlayHistory(historyData) {
        return this.request(CONFIG.ENDPOINTS.PLAY_HISTORY, {
            method: 'POST',
            body: JSON.stringify(historyData)
        });
    }

    async deletePlayHistory(id) {
        return this.request(`${CONFIG.ENDPOINTS.PLAY_HISTORY}/${id}`, {
            method: 'DELETE'
        });
    }

    // Lyrics API
    async getLyrics() {
        return this.request(CONFIG.ENDPOINTS.LYRICS);
    }

    async getLyric(id) {
        return this.request(`${CONFIG.ENDPOINTS.LYRICS}/${id}`);
    }

    async getLyricsBySong(songId) {
        return this.request(`${CONFIG.ENDPOINTS.LYRICS}/song/${songId}`);
    }

    async createLyric(lyricData) {
        return this.request(CONFIG.ENDPOINTS.LYRICS, {
            method: 'POST',
            body: JSON.stringify(lyricData)
        });
    }

    async updateLyric(id, lyricData) {
        return this.request(`${CONFIG.ENDPOINTS.LYRICS}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(lyricData)
        });
    }

    async deleteLyric(id) {
        return this.request(`${CONFIG.ENDPOINTS.LYRICS}/${id}`, {
            method: 'DELETE'
        });
    }

    // Synced Lyrics API
    async getSyncedLyrics() {
        return this.request(CONFIG.ENDPOINTS.SYNCED_LYRICS);
    }

    async getSyncedLyric(id) {
        return this.request(`${CONFIG.ENDPOINTS.SYNCED_LYRICS}/${id}`);
    }

    async getSyncedLyricsBySong(songId) {
        return this.request(`${CONFIG.ENDPOINTS.SYNCED_LYRICS}/song/${songId}`);
    }

    async createSyncedLyric(lyricData) {
        return this.request(CONFIG.ENDPOINTS.SYNCED_LYRICS, {
            method: 'POST',
            body: JSON.stringify(lyricData)
        });
    }

    async updateSyncedLyric(id, lyricData) {
        return this.request(`${CONFIG.ENDPOINTS.SYNCED_LYRICS}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(lyricData)
        });
    }

    async deleteSyncedLyric(id) {
        return this.request(`${CONFIG.ENDPOINTS.SYNCED_LYRICS}/${id}`, {
            method: 'DELETE'
        });
    }

    // Users API
    async getUsers() {
        return this.request(CONFIG.ENDPOINTS.USERS);
    }

    async getUser(id) {
        return this.request(`${CONFIG.ENDPOINTS.USERS}/${id}`);
    }

    async createUser(userData) {
        return this.request(CONFIG.ENDPOINTS.USERS, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async updateUser(id, userData) {
        return this.request(`${CONFIG.ENDPOINTS.USERS}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    }

    async deleteUser(id) {
        return this.request(`${CONFIG.ENDPOINTS.USERS}/${id}`, {
            method: 'DELETE'
        });
    }

    // Helper method to check if a song is in favorites
    async isSongFavorited(userId, songId) {
        try {
            const favorites = await this.getFavoritesByUser(userId);
            return favorites.some(fav => fav.song && fav.song.songID === songId);
        } catch (error) {
            console.error('Error checking if song is favorited:', error);
            return false;
        }
    }

    // Helper method to get song count for a playlist
    async getPlaylistSongCount(playlistId) {
        try {
            const songs = await this.getSongsByPlaylist(playlistId);
            return songs.length;
        } catch (error) {
            console.error('Error getting playlist song count:', error);
            return 0;
        }
    }
}

// Create and export API service instance
window.apiService = new ApiService();
