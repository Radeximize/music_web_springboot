// Music Player Manager
class MusicPlayer {
    constructor() {
        this.audioElement = document.getElementById('audioPlayer');
        this.currentSong = null;
        this.queue = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.isShuffled = false;
        this.repeatMode = 'none'; // 'none', 'one', 'all'
        this.volume = CONFIG.DEFAULTS.VOLUME;
        this.originalQueue = []; // For shuffle/unshuffle
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadPlayerState();
        this.setupProgressTracking();
    }

    setupEventListeners() {
        // Audio element events
        this.audioElement.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audioElement.addEventListener('timeupdate', () => this.updateProgress());
        this.audioElement.addEventListener('ended', () => this.handleSongEnd());
        this.audioElement.addEventListener('error', (e) => this.handleAudioError(e));
        this.audioElement.addEventListener('loadstart', () => this.showLoading());
        this.audioElement.addEventListener('canplay', () => this.hideLoading());

        // Player control events
        document.getElementById('playPauseBtn').addEventListener('click', () => this.togglePlayPause());
        document.getElementById('shuffleBtn').addEventListener('click', () => this.toggleShuffle());
        document.getElementById('repeatBtn').addEventListener('click', () => this.toggleRepeat());
        document.getElementById('volumeRange').addEventListener('input', (e) => this.setVolume(e.target.value / 100));
        document.getElementById('progressRange').addEventListener('input', (e) => this.seekToPosition(e.target.value));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }

    loadPlayerState() {
        // Load volume
        const savedVolume = Storage.get(CONFIG.STORAGE_KEYS.VOLUME, CONFIG.DEFAULTS.VOLUME);
        this.setVolume(savedVolume);

        // Load shuffle state
        const savedShuffle = Storage.get(CONFIG.STORAGE_KEYS.SHUFFLE, CONFIG.DEFAULTS.SHUFFLE);
        if (savedShuffle) {
            this.toggleShuffle();
        }

        // Load repeat mode
        const savedRepeat = Storage.get(CONFIG.STORAGE_KEYS.REPEAT, CONFIG.DEFAULTS.REPEAT_MODE);
        this.setRepeatMode(savedRepeat);

        // Load queue
        const savedQueue = Storage.get(CONFIG.STORAGE_KEYS.QUEUE, []);
        if (savedQueue.length > 0) {
            this.queue = savedQueue;
        }

        // Load current song
        const savedCurrentSong = Storage.get(CONFIG.STORAGE_KEYS.CURRENT_SONG);
        if (savedCurrentSong) {
            this.loadSong(savedCurrentSong, false); // Don't auto-play
        }
    }

    savePlayerState() {
        Storage.set(CONFIG.STORAGE_KEYS.VOLUME, this.volume);
        Storage.set(CONFIG.STORAGE_KEYS.SHUFFLE, this.isShuffled);
        Storage.set(CONFIG.STORAGE_KEYS.REPEAT, this.repeatMode);
        Storage.set(CONFIG.STORAGE_KEYS.QUEUE, this.queue);
        if (this.currentSong) {
            Storage.set(CONFIG.STORAGE_KEYS.CURRENT_SONG, this.currentSong);
        }
    }

    async playSong(song, addToQueue = true) {
        if (!song) return;

        if (addToQueue) {
            this.addToQueue(song);
            this.currentIndex = this.queue.length - 1;
        }

        await this.loadSong(song, true);
        
        // Add to play history
        if (window.authManager && window.authManager.isAuthenticated()) {
            // Implement add to history if needed
        }
    }
    
    async updateFavoriteButton(song) {
        const favoriteBtn = document.getElementById('favoriteBtn');
        if (!window.authManager || !window.authManager.isAuthenticated()) {
            favoriteBtn.style.display = 'none';
            return;
        }
        const userId = window.authManager.getCurrentUserId();
        if (!userId) return;

        const isFavorited = await apiService.isSongFavorited(userId, song.songID);
        favoriteBtn.classList.toggle('favorited', isFavorited);
        favoriteBtn.title = isFavorited ? 'Remove from favorites' : 'Add to favorites';
    }

    updateQueueUI() {
        const queueList = document.getElementById('queueList');
        const queueCurrentSong = document.getElementById('queueCurrentSong');

        // Update current song in queue
        if (this.currentSong) {
            queueCurrentSong.innerHTML = `
                <div class="queue-item">
                    <img src="${this.currentSong.album?.coverImage || Utils.getPlaceholderImage('song', 40)}" 
                         alt="${this.currentSong.title}">
                    <div class="queue-item-info">
                        <h5>${this.currentSong.title}</h5>
                        <p>${this.currentSong.artist?.name || 'Unknown Artist'}</p>
                    </div>
                </div>
            `;
        }

        // Update next up list
        queueList.innerHTML = '';
        const nextSongs = this.queue.slice(this.currentIndex + 1);

        nextSongs.forEach((song, index) => {
            const queueItem = document.createElement('div');
            queueItem.className = 'queue-item';
            queueItem.innerHTML = `
                <img src="${song.album?.coverImage || Utils.getPlaceholderImage('song', 40)}" 
                     alt="${song.title}">
                <div class="queue-item-info">
                    <h5>${song.title}</h5>
                    <p>${song.artist?.name || 'Unknown Artist'}</p>
                </div>
            `;

            queueItem.addEventListener('click', () => {
                this.currentIndex = this.currentIndex + 1 + index;
                this.loadSong(song, this.isPlaying);
            });

            queueList.appendChild(queueItem);
        });
    }

    showLoading() {
        // Could add a loading spinner in the player
        console.log('Loading audio...');
    }

    hideLoading() {
        // Hide loading spinner
        console.log('Audio loaded');
    }

    // Get current playback state
    getState() {
        return {
            currentSong: this.currentSong,
            queue: this.queue,
            currentIndex: this.currentIndex,
            isPlaying: this.isPlaying,
            isShuffled: this.isShuffled,
            repeatMode: this.repeatMode,
            volume: this.volume,
            currentTime: this.audioElement.currentTime,
            duration: this.audioElement.duration
        };
    }
}

// Player control functions for global access
function togglePlayPause() {
    if (window.player) {
        window.player.togglePlayPause();
    }
}

function nextSong() {
    if (window.player) {
        window.player.nextSong();
    }
}

function previousSong() {
    if (window.player) {
        window.player.previousSong();
    }
}

function toggleShuffle() {
    if (window.player) {
        window.player.toggleShuffle();
    }
}

function toggleRepeat() {
    if (window.player) {
        window.player.toggleRepeat();
    }
}

function seekSong(percentage) {
    if (window.player) {
        window.player.seekToPosition(percentage);
    }
}

function changeVolume(volume) {
    if (window.player) {
        window.player.setVolume(volume / 100);
    }
}

function toggleMute() {
    if (window.player) {
        window.player.toggleMute();
    }
}

function toggleCurrentSongFavorite() {
    if (window.player && window.player.currentSong) {
        if (window.favoritesManager) {
            window.favoritesManager.toggleFavorite(window.player.currentSong);
        }
    }
}

// Queue management functions
function toggleQueue() {
    const queueSidebar = document.getElementById('queueSidebar');
    queueSidebar.classList.toggle('active');
}

function clearQueue() {
    if (window.player) {
        window.player.clearQueue();
    }
}

// Initialize player
window.player = new MusicPlayer();