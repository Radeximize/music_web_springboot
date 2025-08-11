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

    setupSearchListeners() {
        const searchInput = document.getElementById('searchInput');
        const genreFilter = document.getElementById('genreFilter');
        const artistFilter = document.getElementById('artistFilter');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchFilters.searchTerm = e.target.value.trim();
                this.debouncedSearch();
            });
        }

        if (genreFilter) {
            genreFilter.addEventListener('change', (e) => {
                this.searchFilters.genre = e.target.value;
                this.performSearch();
            });
        }

        if (artistFilter) {
            artistFilter.addEventListener('change', (e) => {
                this.searchFilters.artist = e.target.value;
                this.performSearch();
            });
        }
    }

    async performSearch() {
        const searchResults = document.getElementById('searchResults');
        
        // Show loading if we have any filters applied
        const hasFilters = this.searchFilters.searchTerm || 
                          this.searchFilters.genre || 
                          this.searchFilters.artist;

        if (!hasFilters) {
            searchResults.innerHTML = this.getSearchPrompt();
            return;
        }

        if (window.uiManager) {
            window.uiManager.showLoading(searchResults);
        }

        try {
            const results = await apiService.getSongs(this.searchFilters);
            this.searchResults = results;
            this.displaySearchResults(results);
        } catch (error) {
            console.error('Search error:', error);
            searchResults.innerHTML = '<p>Error performing search. Please try again.</p>';
        }
    }

    displaySearchResults(results) {
        const searchResults = document.getElementById('searchResults');
        
        if (!results || results.length === 0) {
            searchResults.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>No results found</h3>
                    <p>Try adjusting your search terms or filters</p>
                </div>
            `;
            return;
        }

        searchResults.innerHTML = '';
        
        // Create results header
        const resultsHeader = document.createElement('div');
        resultsHeader.className = 'search-results-header';
        resultsHeader.innerHTML = `
            <h3>Search Results (${results.length})</h3>
            <div class="view-options">
                <button onclick="toggleSearchView('grid')" class="view-btn active" data-view="grid">
                    <i class="fas fa-th"></i>
                </button>
                <button onclick="toggleSearchView('list')" class="view-btn" data-view="list">
                    <i class="fas fa-list"></i>
                </button>
            </div>
        `;
        searchResults.appendChild(resultsHeader);

        // Create results container
        const resultsContainer = document.createElement('div');
        resultsContainer.className = 'search-results-grid';
        resultsContainer.id = 'searchResultsContainer';

        results.forEach(song => {
            const songCard = this.createSearchResultCard(song);
            resultsContainer.appendChild(songCard);
        });

        searchResults.appendChild(resultsContainer);
    }

    createSearchResultCard(song) {
        const card = document.createElement('div');
        card.className = 'search-result-card music-card';
        card.setAttribute('data-song-id', song.songID);

        const imageUrl = song.album?.coverImage || Utils.getPlaceholderImage('song');
        const artistName = song.artist?.name || 'Unknown Artist';
        const albumName = song.album?.title || 'Unknown Album';
        const duration = Utils.formatDuration(song.duration);

        card.innerHTML = `
            <img src="${imageUrl}" alt="${song.title}" loading="lazy">
            <div class="song-info">
                <h4>${Utils.truncateText(song.title, 25)}</h4>
                <p class="artist">${Utils.truncateText(artistName, 20)}</p>
                <p class="album">${Utils.truncateText(albumName, 20)}</p>
                <p class="duration">${duration}</p>
            </div>
            <div class="play-overlay">
                <i class="fas fa-play"></i>
            </div>
            <div class="song-actions">
                <button class="favorite-btn" onclick="event.stopPropagation(); toggleSearchResultFavorite(${song.songID})">
                    <i class="far fa-heart"></i>
                </button>
                <button class="menu-btn" onclick="event.stopPropagation(); showSearchResultMenu(event, ${song.songID})">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
        `;

        // Add click listener to play song
        card.addEventListener('click', () => {
            if (window.player) {
                window.player.playSong(song);
            }
        });

        // Add context menu
        card.addEventListener('contextmenu', (e) => {
            if (window.uiManager) {
                window.uiManager.showContextMenu(e, song, 'song');
            }
        });

        return card;
    }

    toggleSearchView(viewType) {
        const resultsContainer = document.getElementById('searchResultsContainer');
        const viewBtns = document.querySelectorAll('.view-btn');
        
        // Update button states
        viewBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-view') === viewType) {
                btn.classList.add('active');
            }
        });

        // Update container class
        if (resultsContainer) {
            if (viewType === 'list') {
                resultsContainer.className = 'search-results-list';
                this.renderListView();
            } else {
                resultsContainer.className = 'search-results-grid';
                this.renderGridView();
            }
        }
    }

    renderListView() {
        const resultsContainer = document.getElementById('searchResultsContainer');
        if (!resultsContainer || !this.searchResults) return;

        resultsContainer.innerHTML = '';

        this.searchResults.forEach((song, index) => {
            const listItem = this.createSearchResultListItem(song, index + 1);
            resultsContainer.appendChild(listItem);
        });
    }

    renderGridView() {
        const resultsContainer = document.getElementById('searchResultsContainer');
        if (!resultsContainer || !this.searchResults) return;

        resultsContainer.innerHTML = '';

        this.searchResults.forEach(song => {
            const gridItem = this.createSearchResultCard(song);
            resultsContainer.appendChild(gridItem);
        });
    }

    createSearchResultListItem(song, index) {
        const item = document.createElement('div');
        item.className = 'search-result-list-item song-row';
        item.setAttribute('data-song-id', song.songID);

        const imageUrl = song.album?.coverImage || Utils.getPlaceholderImage('song', 40);
        const artistName = song.artist?.name || 'Unknown Artist';
        const albumName = song.album?.title || 'Unknown Album';
        const duration = Utils.formatDuration(song.duration);

        item.innerHTML = `
            <div class="song-number">${index}</div>
            <div class="song-info">
                <img src="${imageUrl}" alt="${song.title}" loading="lazy">
                <div class="song-details">
                    <h4>${song.title}</h4>
                    <p>${artistName}</p>
                </div>
            </div>
            <div class="song-album">${albumName}</div>
            <div class="song-duration">${duration}</div>
            <div class="song-actions">
                <button class="favorite-btn" onclick="event.stopPropagation(); toggleSearchResultFavorite(${song.songID})">
                    <i class="far fa-heart"></i>
                </button>
                <button class="menu-btn" onclick="event.stopPropagation(); showSearchResultMenu(event, ${song.songID})">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
            </div>
        `;

        // Add click listener to play song
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.song-actions')) {
                if (window.player) {
                    window.player.playSong(song);
                }
            }
        });

        // Add context menu
        item.addEventListener('contextmenu', (e) => {
            if (window.uiManager) {
                window.uiManager.showContextMenu(e, song, 'song');
            }
        });

        return item;
    }

    getSearchPrompt() {
        return `
            <div class="search-prompt">
                <i class="fas fa-search"></i>
                <h3>Search for music</h3>
                <p>Find your favorite songs, artists, and albums</p>
                <div class="search-tips">
                    <h4>Search tips:</h4>
                    <ul>
                        <li>Type song titles, artist names, or album names</li>
                        <li>Use filters to narrow down your results</li>
                        <li>Try different spellings if you can't find what you're looking for</li>
                    </ul>
                </div>
            </div>
        `;
    }

    clearSearch() {
        document.getElementById('searchInput').value = '';
        document.getElementById('genreFilter').value = '';
        document.getElementById('artistFilter').value = '';
        
        this.searchFilters = {
            searchTerm: '',
            genre: '',
            artist: ''
        };
        
        document.getElementById('searchResults').innerHTML = this.getSearchPrompt();
    }

    // Advanced search with multiple criteria
    async advancedSearch(criteria) {
        const searchResults = document.getElementById('searchResults');
        
        if (window.uiManager) {
            window.uiManager.showLoading(searchResults);
        }

        try {
            const results = await apiService.getSongs(criteria);
            this.searchResults = results;
            this.displaySearchResults(results);
            return results;
        } catch (error) {
            console.error('Advanced search error:', error);
            searchResults.innerHTML = '<p>Error performing search. Please try again.</p>';
            return [];
        }
    }

    // Get current search state
    getSearchState() {
        return {
            filters: { ...this.searchFilters },
            results: [...this.searchResults],
            resultCount: this.searchResults.length
        };
    }

    // Highlight search terms in results
    highlightSearchTerms(text, searchTerm) {
        if (!searchTerm || !text) return text;
        
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
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