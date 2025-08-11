// Queue Manager
class QueueManager {
    constructor() {
        this.queue = [];
        this.originalQueue = []; // Store original order for shuffle/unshuffle
        this.currentIndex = -1;
        this.history = [];
        this.isShuffled = false;
        this.repeatMode = 'off'; // 'off', 'all', 'one'
        this.maxHistorySize = 50;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadSavedQueue();
        console.log('🎵 Queue Manager initialized');
    }

    setupEventListeners() {
        // Listen for player events
        document.addEventListener('song-ended', () => {
            this.handleSongEnd();
        });

        document.addEventListener('queue-updated', (e) => {
            this.saveQueue();
        });

        // Listen for UI events
        document.addEventListener('click', (e) => {
            if (e.target.closest('.queue-item')) {
                const index = parseInt(e.target.closest('.queue-item').dataset.index);
                this.playFromQueue(index);
            }
        });
    }

    // Queue manipulation methods
    setQueue(songs, startIndex = 0) {
        this.queue = [...songs];
        this.originalQueue = [...songs];
        this.currentIndex = startIndex;
        this.history = [];
        
        if (this.isShuffled) {
            this.shuffleQueue(false);
        }
        
        this.updateUI();
        this.dispatchQueueEvent('queue-set', { 
            queue: this.queue, 
            currentIndex: this.currentIndex 
        });
    }

    addToQueue(song, position = 'end') {
        if (position === 'end') {
            this.queue.push(song);
            this.originalQueue.push(song);
        } else if (position === 'next') {
            const insertIndex = this.currentIndex + 1;
            this.queue.splice(insertIndex, 0, song);
            this.originalQueue.splice(insertIndex, 0, song);
        } else if (typeof position === 'number') {
            this.queue.splice(position, 0, song);
            this.originalQueue.splice(position, 0, song);
            if (position <= this.currentIndex) {
                this.currentIndex++;
            }
        }
        
        this.updateUI();
        this.dispatchQueueEvent('song-added', { song, position });
        this.showNotification(`Added "${song.title}" to queue`);
    }

    addMultipleToQueue(songs, position = 'end') {
        songs.forEach((song, index) => {
            if (position === 'end') {
                this.queue.push(song);
                this.originalQueue.push(song);
            } else if (position === 'next') {
                const insertIndex = this.currentIndex + 1 + index;
                this.queue.splice(insertIndex, 0, song);
                this.originalQueue.splice(insertIndex, 0, song);
            }
        });
        
        this.updateUI();
        this.dispatchQueueEvent('songs-added', { songs, position });
        this.showNotification(`Added ${songs.length} songs to queue`);
    }

    removeFromQueue(index) {
        if (index < 0 || index >= this.queue.length) return;
        
        const removedSong = this.queue.splice(index, 1)[0];
        const originalIndex = this.originalQueue.indexOf(removedSong);
        if (originalIndex !== -1) {
            this.originalQueue.splice(originalIndex, 1);
        }
        
        if (index < this.currentIndex) {
            this.currentIndex--;
        } else if (index === this.currentIndex) {
            // If we removed the current song, stay at the same index
            // but update to the song that's now at this index
            if (this.currentIndex >= this.queue.length) {
                this.currentIndex = this.queue.length - 1;
            }
        }
        
        this.updateUI();
        this.dispatchQueueEvent('song-removed', { song: removedSong, index });
        this.showNotification(`Removed "${removedSong.title}" from queue`);
        
        return removedSong;
    }

    clearQueue() {
        this.queue = [];
        this.originalQueue = [];
        this.currentIndex = -1;
        this.history = [];
        
        this.updateUI();
        this.dispatchQueueEvent('queue-cleared');
        this.showNotification('Queue cleared');
    }

    moveInQueue(fromIndex, toIndex) {
        if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || 
            fromIndex >= this.queue.length || toIndex >= this.queue.length) {
            return;
        }
        
        const [movedSong] = this.queue.splice(fromIndex, 1);
        this.queue.splice(toIndex, 0, movedSong);
        
        // Update current index if necessary
        if (fromIndex === this.currentIndex) {
            this.currentIndex = toIndex;
        } else if (fromIndex < this.currentIndex && toIndex >= this.currentIndex) {
            this.currentIndex--;
        } else if (fromIndex > this.currentIndex && toIndex <= this.currentIndex) {
            this.currentIndex++;
        }
        
        this.updateUI();
        this.dispatchQueueEvent('queue-reordered', { fromIndex, toIndex });
    }

    // Navigation methods
    playFromQueue(index) {
        if (index < 0 || index >= this.queue.length) return null;
        
        // Add current song to history if valid
        if (this.currentIndex >= 0 && this.currentIndex < this.queue.length) {
            this.addToHistory(this.queue[this.currentIndex]);
        }
        
        this.currentIndex = index;
        const song = this.queue[index];
        
        this.updateUI();
        this.dispatchQueueEvent('song-changed', { song, index });
        
        return song;
    }

    getCurrentSong() {
        if (this.currentIndex >= 0 && this.currentIndex < this.queue.length) {
            return this.queue[this.currentIndex];
        }
        return null;
    }

    getNextSong() {
        if (this.repeatMode === 'one') {
            return this.getCurrentSong();
        }
        
        const nextIndex = this.currentIndex + 1;
        if (nextIndex < this.queue.length) {
            return this.queue[nextIndex];
        } else if (this.repeatMode === 'all' && this.queue.length > 0) {
            return this.queue[0];
        }
        
        return null;
    }

    getPreviousSong() {
        if (this.repeatMode === 'one') {
            return this.getCurrentSong();
        }
        
        const prevIndex = this.currentIndex - 1;
        if (prevIndex >= 0) {
            return this.queue[prevIndex];
        } else if (this.repeatMode === 'all' && this.queue.length > 0) {
            return this.queue[this.queue.length - 1];
        }
        
        return null;
    }

    next() {
        if (this.repeatMode === 'one') {
            return this.getCurrentSong();
        }
        
        const nextIndex = this.currentIndex + 1;
        if (nextIndex < this.queue.length) {
            return this.playFromQueue(nextIndex);
        } else if (this.repeatMode === 'all' && this.queue.length > 0) {
            return this.playFromQueue(0);
        }
        
        return null;
    }

    previous() {
        if (this.repeatMode === 'one') {
            return this.getCurrentSong();
        }
        
        // Check if we have history to go back to
        if (this.history.length > 0) {
            const previousSong = this.history.pop();
            const songIndex = this.queue.findIndex(s => s.songID === previousSong.songID);
            if (songIndex !== -1) {
                return this.playFromQueue(songIndex);
            }
        }
        
        // Fall back to previous in queue
        const prevIndex = this.currentIndex - 1;
        if (prevIndex >= 0) {
            return this.playFromQueue(prevIndex);
        } else if (this.repeatMode === 'all' && this.queue.length > 0) {
            return this.playFromQueue(this.queue.length - 1);
        }
        
        return null;
    }

    // Shuffle and repeat methods
    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        this.shuffleQueue(this.isShuffled);
        
        this.dispatchQueueEvent('shuffle-toggled', { isShuffled: this.isShuffled });
        this.showNotification(`Shuffle ${this.isShuffled ? 'enabled' : 'disabled'}`);
        
        return this.isShuffled;
    }

    shuffleQueue(enable) {
        if (enable) {
            // Save current song
            const currentSong = this.getCurrentSong();
            
            // Shuffle the queue
            const shuffled = [...this.queue];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            
            this.queue = shuffled;
            
            // Find the current song in the shuffled queue
            if (currentSong) {
                this.currentIndex = this.queue.findIndex(s => s.songID === currentSong.songID);
            }
        } else {
            // Restore original order
            const currentSong = this.getCurrentSong();
            this.queue = [...this.originalQueue];
            
            // Find the current song in the original queue
            if (currentSong) {
                this.currentIndex = this.queue.findIndex(s => s.songID === currentSong.songID);
            }
        }
        
        this.updateUI();
    }

    setRepeatMode(mode) {
        const validModes = ['off', 'all', 'one'];
        if (!validModes.includes(mode)) return;
        
        this.repeatMode = mode;
        this.dispatchQueueEvent('repeat-mode-changed', { mode });
        
        const modeText = mode === 'off' ? 'disabled' : `set to ${mode}`;
        this.showNotification(`Repeat ${modeText}`);
        
        return mode;
    }

    toggleRepeatMode() {
        const modes = ['off', 'all', 'one'];
        const currentModeIndex = modes.indexOf(this.repeatMode);
        const nextModeIndex = (currentModeIndex + 1) % modes.length;
        return this.setRepeatMode(modes[nextModeIndex]);
    }

    // History methods
    addToHistory(song) {
        if (!song) return;
        
        // Don't add the same song twice in a row
        if (this.history.length > 0 && 
            this.history[this.history.length - 1].songID === song.songID) {
            return;
        }
        
        this.history.push(song);
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    getHistory() {
        return [...this.history];
    }

    clearHistory() {
        this.history = [];
        this.dispatchQueueEvent('history-cleared');
    }

    handleSongEnd() {
        const nextSong = this.next();
        if (nextSong && window.player) {
            window.player.playSong(nextSong.songID);
        }
    }

    // UI methods
    updateUI() {
        this.updateQueueDisplay();
        this.updatePlayerControls();
        this.updateNowPlayingInfo();
    }

    updateQueueDisplay() {
        const container = document.getElementById('queue-list');
        if (!container) return;

        if (this.queue.length === 0) {
            container.innerHTML = this.getEmptyQueueHTML();
            return;
        }

        const queueHTML = this.queue.map((song, index) => 
            this.createQueueItemHTML(song, index)
        ).join('');

        container.innerHTML = `
            <div class="queue-header">
                <h3>Queue (${this.queue.length} songs)</h3>
                <div class="queue-actions">
                    <button class="btn btn-sm" onclick="queueManager.clearQueue()">Clear</button>
                    <button class="btn btn-sm" onclick="queueManager.saveQueueAsPlaylist()">Save as Playlist</button>
                </div>
            </div>
            <div class="queue-items">
                ${queueHTML}
            </div>
        `;
    }

    createQueueItemHTML(song, index) {
        const isCurrentSong = index === this.currentIndex;
        const isPlaying = isCurrentSong && window.player?.isPlaying();
        
        return `
            <div class="queue-item ${isCurrentSong ? 'current' : ''}" data-index="${index}">
                <div class="queue-item-number">
                    ${isCurrentSong ? (isPlaying ? '🔊' : '⏸️') : index + 1}
                </div>
                <div class="queue-item-info">
                    <div class="song-cover">
                        <img src="${song.album?.coverImage || '/api/placeholder/40/40'}" 
                             alt="${song.title}"
                             onerror="this.src='/api/placeholder/40/40'">
                    </div>
                    <div class="song-details">
                        <h5>${song.title}</h5>
                        <p>${song.artist?.name || 'Unknown Artist'}</p>
                    </div>
                </div>
                <div class="queue-item-duration">
                    ${this.formatDuration(song.duration)}
                </div>
                <div class="queue-item-actions">
                    <button class="btn btn-sm" onclick="queueManager.removeFromQueue(${index})" title="Remove from queue">
                        <i>❌</i>
                    </button>
                </div>
            </div>
        `;
    }

    getEmptyQueueHTML() {
        return `
            <div class="empty-state">
                <div class="empty-icon">🎵</div>
                <h3>Your queue is empty</h3>
                <p>Add some songs to get started!</p>
                <button class="btn btn-primary" onclick="window.musicApp.handleViewChange('home')">
                    Browse Music
                </button>
            </div>
        `;
    }

    updatePlayerControls() {
        // Update shuffle button
        const shuffleBtn = document.getElementById('shuffle-btn');
        if (shuffleBtn) {
            shuffleBtn.classList.toggle('active', this.isShuffled);
            shuffleBtn.title = `Shuffle ${this.isShuffled ? 'enabled' : 'disabled'}`;
        }

        // Update repeat button
        const repeatBtn = document.getElementById('repeat-btn');
        if (repeatBtn) {
            repeatBtn.className = `control-btn ${this.repeatMode !== 'off' ? 'active' : ''}`;
            repeatBtn.innerHTML = this.getRepeatIcon();
            repeatBtn.title = `Repeat ${this.repeatMode}`;
        }

        // Update next/previous button states
        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');
        
        if (nextBtn) {
            nextBtn.disabled = !this.hasNext() && this.repeatMode === 'off';
        }
        if (prevBtn) {
            prevBtn.disabled = !this.hasPrevious() && this.repeatMode === 'off';
        }
    }

    updateNowPlayingInfo() {
        const currentSong = this.getCurrentSong();
        if (!currentSong) return;

        // Update now playing display
        const nowPlaying = document.getElementById('now-playing');
        if (nowPlaying) {
            nowPlaying.innerHTML = `
                <div class="now-playing-cover">
                    <img src="${currentSong.album?.coverImage || '/api/placeholder/60/60'}" 
                         alt="${currentSong.title}"
                         onerror="this.src='/api/placeholder/60/60'">
                </div>
                <div class="now-playing-info">
                    <h4>${currentSong.title}</h4>
                    <p>${currentSong.artist?.name || 'Unknown Artist'}</p>
                </div>
            `;
        }

        // Update page title
        document.title = `${currentSong.title} - ${currentSong.artist?.name || 'Unknown Artist'} | Music App`;
    }

    getRepeatIcon() {
        switch (this.repeatMode) {
            case 'all': return '🔁';
            case 'one': return '🔂';
            default: return '↩️';
        }
    }

    formatDuration(seconds) {
        if (!seconds) return '--:--';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Utility methods
    hasNext() {
        return this.currentIndex < this.queue.length - 1 || this.repeatMode !== 'off';
    }

    hasPrevious() {
        return this.currentIndex > 0 || this.history.length > 0 || this.repeatMode !== 'off';
    }

    getQueueLength() {
        return this.queue.length;
    }

    getCurrentIndex() {
        return this.currentIndex;
    }

    getQueue() {
        return [...this.queue];
    }

    isShuffleEnabled() {
        return this.isShuffled;
    }

    getRepeatMode() {
        return this.repeatMode;
    }

    // Playlist integration
    async saveQueueAsPlaylist() {
        if (this.queue.length === 0) {
            this.showError('Cannot save empty queue as playlist');
            return;
        }

        const playlistName = prompt('Enter playlist name:', `Queue - ${new Date().toLocaleDateString()}`);
        if (!playlistName) return;

        try {
            if (window.playlistManager) {
                await window.playlistManager.createPlaylistFromSongs(playlistName, this.queue);
                this.showNotification(`Saved queue as "${playlistName}"`);
            }
        } catch (error) {
            console.error('Failed to save queue as playlist:', error);
            this.showError('Failed to save queue as playlist');
        }
    }

    // Drag and drop support
    enableDragAndDrop() {
        const container = document.getElementById('queue-items');
        if (!container) return;

        let draggedIndex = null;

        container.addEventListener('dragstart', (e) => {
            const item = e.target.closest('.queue-item');
            if (item) {
                draggedIndex = parseInt(item.dataset.index);
                e.dataTransfer.effectAllowed = 'move';
                item.classList.add('dragging');
            }
        });

        container.addEventListener('dragend', (e) => {
            const item = e.target.closest('.queue-item');
            if (item) {
                item.classList.remove('dragging');
            }
            draggedIndex = null;
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const item = e.target.closest('.queue-item');
            if (item && draggedIndex !== null) {
                const rect = item.getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                
                if (e.clientY < midY) {
                    item.classList.add('drop-before');
                    item.classList.remove('drop-after');
                } else {
                    item.classList.add('drop-after');
                    item.classList.remove('drop-before');
                }
            }
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            const item = e.target.closest('.queue-item');
            
            if (item && draggedIndex !== null) {
                const dropIndex = parseInt(item.dataset.index);
                const isAfter = item.classList.contains('drop-after');
                const targetIndex = isAfter ? dropIndex + 1 : dropIndex;
                
                this.moveInQueue(draggedIndex, targetIndex);
            }
            
            // Clean up drag styles
            container.querySelectorAll('.queue-item').forEach(item => {
                item.classList.remove('drop-before', 'drop-after');
            });
        });
    }

    // Persistence methods
    saveQueue() {
        try {
            const queueData = {
                queue: this.queue,
                originalQueue: this.originalQueue,
                currentIndex: this.currentIndex,
                history: this.history.slice(-10), // Save only recent history
                isShuffled: this.isShuffled,
                repeatMode: this.repeatMode,
                timestamp: Date.now()
            };
            
            localStorage.setItem('musicQueue', JSON.stringify(queueData));
        } catch (error) {
            console.error('Failed to save queue:', error);
        }
    }

    loadSavedQueue() {
        try {
            const savedQueue = localStorage.getItem('musicQueue');
            if (!savedQueue) return;
            
            const queueData = JSON.parse(savedQueue);
            
            // Check if data is recent (within 24 hours)
            const isRecent = Date.now() - queueData.timestamp < 24 * 60 * 60 * 1000;
            if (!isRecent) return;
            
            // Restore queue data
            this.queue = queueData.queue || [];
            this.originalQueue = queueData.originalQueue || [...this.queue];
            this.currentIndex = queueData.currentIndex || -1;
            this.history = queueData.history || [];
            this.isShuffled = queueData.isShuffled || false;
            this.repeatMode = queueData.repeatMode || 'off';
            
            this.updateUI();
            console.log('📻 Restored saved queue with', this.queue.length, 'songs');
            
        } catch (error) {
            console.error('Failed to load saved queue:', error);
            localStorage.removeItem('musicQueue'); // Clear corrupted data
        }
    }

    // Search within queue
    searchQueue(query) {
        if (!query) return this.queue;
        
        const searchTerm = query.toLowerCase();
        return this.queue.filter((song, index) => {
            const matchesTitle = song.title.toLowerCase().includes(searchTerm);
            const matchesArtist = song.artist?.name?.toLowerCase().includes(searchTerm);
            const matchesAlbum = song.album?.title?.toLowerCase().includes(searchTerm);
            
            return matchesTitle || matchesArtist || matchesAlbum;
        }).map(song => ({
            ...song,
            queueIndex: this.queue.indexOf(song)
        }));
    }

    // Statistics
    getQueueStats() {
        const totalDuration = this.queue.reduce((total, song) => total + (song.duration || 0), 0);
        const artists = new Set(this.queue.map(song => song.artist?.name).filter(Boolean));
        const albums = new Set(this.queue.map(song => song.album?.title).filter(Boolean));
        
        return {
            totalSongs: this.queue.length,
            totalDuration: totalDuration,
            totalDurationFormatted: this.formatDuration(totalDuration),
            uniqueArtists: artists.size,
            uniqueAlbums: albums.size,
            currentPosition: this.currentIndex + 1,
            remainingSongs: this.queue.length - this.currentIndex - 1
        };
    }

    // Event handling
    dispatchQueueEvent(eventType, data = {}) {
        const event = new CustomEvent(eventType, {
            detail: { ...data, queueManager: this },
            bubbles: true
        });
        document.dispatchEvent(event);
    }

    showNotification(message, type = 'info') {
        if (window.musicApp) {
            window.musicApp.showNotification(message, type);
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }
}

// Initialize queue manager
document.addEventListener('DOMContentLoaded', () => {
    window.queueManager = new QueueManager();
});