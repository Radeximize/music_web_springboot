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


    // Helper method to check if a song is in favorites
    async isSongFavorited(userId, songId) {
        if (!userId || isNaN(userId)) {
            console.error('Invalid userId for isSongFavorited');
            return false;
        }
        try {
            const favorites = await this.getFavoritesByUser(userId);
            return favorites.some(fav => fav.song && fav.song.songID === songId);
        } catch (error) {
            console.error('Error checking if song is favorited:', error);
            return false;
        }
    }

    // Alias for consistency
    getUserFavorites(userId) {
        return this.getFavoritesByUser(userId);
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