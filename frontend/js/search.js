// Search functionality
class SearchManager {
    constructor() {
        this.searchResults = [];
        this.searchFilters = {
            searchTerm: '',
            genre: '',
            artist: ''
        };
        this.init();
    }

    init() {
        this.setupSearchListeners();
        this.debouncedSearch = Utils.debounce(() => this.performSearch(), CONFIG.UI.DEBOUNCE_DELAY);
    }
}

// Global search functions
function performSearch() {
    if (window.searchManager) {
        window.searchManager.debouncedSearch();
    }
}

function applyFilters() {
    if (window.searchManager) {
        window.searchManager.performSearch();
    }
}

function toggleSearchView(viewType) {
    if (window.searchManager) {
        window.searchManager.toggleSearchView(viewType);
    }
}

function clearSearch() {
    if (window.searchManager) {
        window.searchManager.clearSearch();
    }
}

function toggleSearchResultFavorite(songId) {
    // Find the song in search results and toggle favorite
    if (window.searchManager && window.favoritesManager) {
        const song = window.searchManager.searchResults.find(s => s.songID === songId);
        if (song) {
            window.favoritesManager.toggleFavorite(song);
        }
    }
}

function showSearchResultMenu(event, songId) {
    // Show context menu for search result
    event.preventDefault();
    if (window.searchManager && window.uiManager) {
        const song = window.searchManager.searchResults.find(s => s.songID === songId);
        if (song) {
            window.uiManager.showContextMenu(event, song, 'song');
        }
    }
}

// Initialize search manager
window.searchManager = new SearchManager();