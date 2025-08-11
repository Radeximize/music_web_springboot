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
        if (window.authManager && window.authManager.isAuthenticated) {
            window.authManager.addToPlayHistory(song);
        }
    }

    async loadSong(song, autoPlay = false) {
        if (!song) return;

        this.currentSong = song;
        this.updateNowPlayingUI(song);

        // Set audio source
        if (song.audioFile) {
            this.audioElement.src = song.audioFile;
            
            if (autoPlay) {
                try {
                    await this.audioElement.play();
                    this.isPlaying = true;
                    this.updatePlayButton();
                } catch (error) {
                    console.error('Error playing audio:', error);
                    Utils.showToast('Unable to play this song', 'error');
                }
            }
        } else {
            Utils.showToast('No audio file available for this song', 'warning');
        }

        this.savePlayerState();
        this.updateQueueUI();
    }

    async togglePlayPause() {
        if (!this.currentSong) {
            Utils.showToast('No song selected', 'warning');
            return;
        }

        try {
            if (this.isPlaying) {
                this.audioElement.pause();
                this.isPlaying = false;
            } else {
                await this.audioElement.play();
                this.isPlaying = true;
            }
            this.updatePlayButton();
        } catch (error) {
            console.error('Error toggling play/pause:', error);
            Utils.showToast('Error playing audio', 'error');
        }
    }

    stop() {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.isPlaying = false;
        this.updatePlayButton();
        this.updateProgress();
    }

    async nextSong() {
        if (this.queue.length === 0) return;

        if (this.repeatMode === 'one') {
            // Repeat current song
            this.audioElement.currentTime = 0;
            if (this.isPlaying) {
                await this.audioElement.play();
            }
            return;
        }

        let nextIndex;
        if (this.currentIndex < this.queue.length - 1) {
            nextIndex = this.currentIndex + 1;
        } else if (this.repeatMode === 'all') {
            nextIndex = 0; // Loop back to start
        } else {
            Utils.showToast('End of queue', 'info');
            return;
        }

        this.currentIndex = nextIndex;
        await this.loadSong(this.queue[this.currentIndex], this.isPlaying);
    }

    async previousSong() {
        if (this.queue.length === 0) return;

        // If more than 3 seconds into song, restart current song
        if (this.audioElement.currentTime > 3) {
            this.audioElement.currentTime = 0;
            return;
        }

        let prevIndex;
        if (this.currentIndex > 0) {
            prevIndex = this.currentIndex - 1;
        } else if (this.repeatMode === 'all') {
            prevIndex = this.queue.length - 1; // Loop to end
        } else {
            // Restart current song
            this.audioElement.currentTime = 0;
            return;
        }

        this.currentIndex = prevIndex;
        await this.loadSong(this.queue[this.currentIndex], this.isPlaying);
    }

    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        const shuffleBtn = document.getElementById('shuffleBtn');

        if (this.isShuffled) {
            shuffleBtn.classList.add('active');
            this.shuffleQueue();
        } else {
            shuffleBtn.classList.remove('active');
            this.unshuffleQueue();
        }

        this.savePlayerState();
        Utils.showToast(`Shuffle ${this.isShuffled ? 'on' : 'off'}`, 'info');
    }

    toggleRepeat() {
        const modes = ['none', 'all', 'one'];
        const currentModeIndex = modes.indexOf(this.repeatMode);
        const nextModeIndex = (currentModeIndex + 1) % modes.length;
        this.setRepeatMode(modes[nextModeIndex]);
    }

    setRepeatMode(mode) {
        this.repeatMode = mode;
        const repeatBtn = document.getElementById('repeatBtn');
        const icon = repeatBtn.querySelector('i');

        repeatBtn.classList.remove('active');
        icon.className = 'fas fa-redo';

        switch (mode) {
            case 'one':
                repeatBtn.classList.add('active');
                icon.className = 'fas fa-redo-alt';
                Utils.showToast('Repeat one', 'info');
                break;
            case 'all':
                repeatBtn.classList.add('active');
                Utils.showToast('Repeat all', 'info');
                break;
            default:
                Utils.showToast('Repeat off', 'info');
                break;
        }

        this.savePlayerState();
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.audioElement.volume = this.volume;
        
        const volumeRange = document.getElementById('volumeRange');
        const volumeIcon = document.getElementById('volumeIcon');
        
        volumeRange.value = this.volume * 100;
        
        // Update volume icon
        if (this.volume === 0) {
            volumeIcon.className = 'fas fa-volume-mute';
        } else if (this.volume < 0.5) {
            volumeIcon.className = 'fas fa-volume-down';
        } else {
            volumeIcon.className = 'fas fa-volume-up';
        }

        this.savePlayerState();
    }

    toggleMute() {
        if (this.volume > 0) {
            this.previousVolume = this.volume;
            this.setVolume(0);
        } else {
            this.setVolume(this.previousVolume || CONFIG.DEFAULTS.VOLUME);
        }
    }

    seekToPosition(percentage) {
        if (this.audioElement.duration) {
            const time = (percentage / 100) * this.audioElement.duration;
            this.audioElement.currentTime = time;
        }
    }

    addToQueue(song) {
        if (!song) return;

        // Check if song is already in queue
        const existingIndex = this.queue.findIndex(s => s.songID === song.songID);
        if (existingIndex !== -1) {
            Utils.showToast('Song already in queue', 'info');
            return;
        }

        this.queue.push(song);
        this.originalQueue = [...this.queue];
        
        if (this.isShuffled) {
            this.shuffleQueue();
        }

        this.savePlayerState();
        this.updateQueueUI();
        Utils.showToast('Added to queue', 'success');
    }

    removeFromQueue(index) {
        if (index < 0 || index >= this.queue.length) return;

        this.queue.splice(index, 1);
        
        // Adjust current index if necessary
        if (index < this.currentIndex) {
            this.currentIndex--;
        } else if (index === this.currentIndex && this.currentIndex >= this.queue.length) {
            this.currentIndex = this.queue.length - 1;
        }

        this.originalQueue = [...this.queue];
        this.savePlayerState();
        this.updateQueueUI();
    }

    clearQueue() {
        this.queue = [];
        this.originalQueue = [];
        this.currentIndex = 0;
        this.savePlayerState();
        this.updateQueueUI();
        Utils.showToast('Queue cleared', 'info');
    }

    shuffleQueue() {
        if (this.queue.length <= 1) return;

        // Keep current song at the same position
        const currentSong = this.queue[this.currentIndex];
        const otherSongs = this.queue.filter((_, index) => index !== this.currentIndex);
        const shuffledOtherSongs = Utils.shuffleArray(otherSongs);

        this.queue = [currentSong, ...shuffledOtherSongs];
        this.currentIndex = 0;
        this.updateQueueUI();
    }

    unshuffleQueue() {
        if (this.originalQueue.length === 0) return;

        const currentSong = this.currentSong;
        this.queue = [...this.originalQueue];
        
        // Find current song in original queue
        this.currentIndex = this.queue.findIndex(song => 
            song.songID === currentSong?.songID
        );
        
        if (this.currentIndex === -1) {
            this.currentIndex = 0;
        }

        this.updateQueueUI();
    }

    handleSongEnd() {
        if (this.repeatMode === 'one') {
            this.audioElement.currentTime = 0;
            this.audioElement.play();
        } else {
            this.nextSong();
        }
    }

    handleAudioError(error) {
        console.error('Audio error:', error);
        Utils.showToast('Error loading audio file', 'error');
        this.isPlaying = false;
        this.updatePlayButton();
    }

    handleKeyboardShortcuts(event) {
        // Only handle shortcuts when not typing in input fields
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.togglePlayPause();
                break;
            case 'ArrowRight':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.nextSong();
                }
                break;
            case 'ArrowLeft':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.previousSong();
                }
                break;
            case 'ArrowUp':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.setVolume(this.volume + CONFIG.AUDIO.VOLUME_STEP);
                }
                break;
            case 'ArrowDown':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.setVolume(this.volume - CONFIG.AUDIO.VOLUME_STEP);
                }
                break;
        }
    }

    setupProgressTracking() {
        setInterval(() => {
            if (this.isPlaying && !this.audioElement.paused) {
                this.updateProgress();
            }
        }, 1000);
    }

    updateProgress() {
        const currentTime = this.audioElement.currentTime;
        const duration = this.audioElement.duration;

        if (duration) {
            const percentage = (currentTime / duration) * 100;
            document.getElementById('progress').style.width = percentage + '%';
            document.getElementById('progressRange').value = percentage;
        }

        document.getElementById('currentTime').textContent = Utils.formatDuration(currentTime);
    }

    updateDuration() {
        const duration = this.audioElement.duration;
        document.getElementById('totalTime').textContent = Utils.formatDuration(duration);
    }

    updatePlayButton() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const icon = playPauseBtn.querySelector('i');
        
        if (this.isPlaying) {
            icon.className = 'fas fa-pause';
            playPauseBtn.setAttribute('title', 'Pause');
        } else {
            icon.className = 'fas fa-play';
            playPauseBtn.setAttribute('title', 'Play');
        }
    }

    updateNowPlayingUI(song) {
        if (!song) return;

        document.getElementById('currentSongTitle').textContent = song.title || 'Unknown Title';
        document.getElementById('currentSongArtist').textContent = song.artist?.name || 'Unknown Artist';
        
        const image = document.getElementById('currentSongImage');
        image.src = song.album?.coverImage || Utils.getPlaceholderImage('song', 56);
        image.alt = song.title || 'Current Song';

        // Update favorite button
        this.updateFavoriteButton(song);

        // Update page title
        document.title = `${song.title} - ${song.artist?.name || 'Unknown Artist'} | MusicStream`;
    }

    async updateFavoriteButton(song) {
        const favoriteBtn = document.getElementById('favoriteCurrentBtn');
        const icon = favoriteBtn.querySelector('i');

        if (window.authManager && window.authManager.isAuthenticated) {
            const userId = window.authManager.getCurrentUserId();
            const isFavorited = await apiService.isSongFavorited(userId, song.songID);
            
            if (isFavorited) {
                icon.className = 'fas fa-heart';
                favoriteBtn.classList.add('active');
            } else {
                icon.className = 'far fa-heart';
                favoriteBtn.classList.remove('active');
            }
        } else {
            icon.className = 'far fa-heart';
            favoriteBtn.classList.remove('active');
        }
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