// Audio Visualizer
class AudioVisualizer {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.source = null;
        this.dataArray = null;
        this.bufferLength = 0;
        this.canvas = null;
        this.canvasContext = null;
        this.animationFrame = null;
        
        this.isEnabled = true;
        this.visualizerType = 'bars'; // 'bars', 'wave', 'circular', 'particles'
        this.colors = {
            primary: '#1db954',
            secondary: '#1ed760',
            accent: '#ffffff'
        };
        
        this.settings = {
            sensitivity: 1.0,
            smoothing: 0.8,
            minHeight: 2,
            maxHeight: 100,
            barWidth: 4,
            barSpacing: 1,
            particleCount: 50
        };
        
        this.init();
    }

    async init() {
        try {
            this.setupCanvas();
            this.loadSettings();
            this.setupEventListeners();
            console.log('🌈 Audio Visualizer initialized');
        } catch (error) {
            console.error('Failed to initialize audio visualizer:', error);
        }
    }

    setupCanvas() {
        this.canvas = document.getElementById('audio-visualizer');
        if (!this.canvas) {
            // Create canvas if it doesn't exist
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'audio-visualizer';
            this.canvas.className = 'audio-visualizer-canvas';
            
            // Try to find a suitable container
            const container = document.getElementById('visualizer-container') || 
                             document.getElementById('player-container') ||
                             document.body;
            container.appendChild(this.canvas);
        }
        
        this.canvasContext = this.canvas.getContext('2d');
        this.resizeCanvas();
    }

    resizeCanvas() {
        if (!this.canvas) return;
        
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        this.canvas.width = rect.width || 800;
        this.canvas.height = rect.height || 200;
        
        // Apply high DPI scaling
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = this.canvas.clientWidth;
        const displayHeight = this.canvas.clientHeight;
        
        if (this.canvas.width !== displayWidth * dpr || this.canvas.height !== displayHeight * dpr) {
            this.canvas.width = displayWidth * dpr;
            this.canvas.height = displayHeight * dpr;
            this.canvasContext.scale(dpr, dpr);
            this.canvas.style.width = displayWidth + 'px';
            this.canvas.style.height = displayHeight + 'px';
        }
    }

    setupEventListeners() {
        // Listen for audio events
        document.addEventListener('audio-play', (e) => {
            this.connectAudio(e.detail.audioElement);
        });

        document.addEventListener('audio-pause', () => {
            this.pause();
        });

        document.addEventListener('audio-stop', () => {
            this.stop();
        });

        // Theme change events
        document.addEventListener('theme-changed', (e) => {
            this.updateColors(e.detail.colors);
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });

        // Visualizer controls
        document.addEventListener('click', (e) => {
            if (e.target.matches('#visualizer-toggle')) {
                this.toggle();
            } else if (e.target.matches('#visualizer-type-selector')) {
                this.setVisualizerType(e.target.value);
            }
        });
    }

    async connectAudio(audioElement) {
        try {
            if (!audioElement) return;

            // Create audio context if needed
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Resume context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            // Create source from audio element
            if (this.source) {
                this.source.disconnect();
            }

            this.source = this.audioContext.createMediaElementSource(audioElement);
            
            // Create analyser
            if (!this.analyser) {
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 2048;
                this.analyser.smoothingTimeConstant = this.settings.smoothing;
                this.bufferLength = this.analyser.frequencyBinCount;
                this.dataArray = new Uint8Array(this.bufferLength);
            }

            // Connect audio graph
            this.source.connect(this.analyser);
            this.analyser.connect(this.audioContext.destination);

            // Start visualization
            this.start();

        } catch (error) {
            console.error('Failed to connect audio for visualization:', error);
        }
    }

    start() {
        if (!this.isEnabled || this.animationFrame) return;
        
        this.animate();
    }

    stop() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        this.clearCanvas();
    }

    pause() {
        this.stop();
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        
        if (this.isEnabled) {
            this.start();
        } else {
            this.stop();
        }
        
        this.updateVisualizerToggle();
        this.saveSettings();
    }

    animate() {
        if (!this.isEnabled) return;
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
        
        if (!this.analyser || !this.dataArray) return;
        
        // Get audio data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Clear canvas
        this.clearCanvas();
        
        // Draw visualization based on type
        switch (this.visualizerType) {
            case 'bars':
                this.drawBars();
                break;
            case 'wave':
                this.drawWave();
                break;
            case 'circular':
                this.drawCircular();
                break;
            case 'particles':
                this.drawParticles();
                break;
            default:
                this.drawBars();
        }
    }

    clearCanvas() {
        if (!this.canvasContext) return;
        
        this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Add subtle background gradient
        const gradient = this.canvasContext.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        
        this.canvasContext.fillStyle = gradient;
        this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBars() {
        const ctx = this.canvasContext;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        const barWidth = (width / this.bufferLength) * 2.5;
        let x = 0;
        
        for (let i = 0; i < this.bufferLength; i++) {
            const barHeight = (this.dataArray[i] / 255) * height * this.settings.sensitivity;
            
            // Create gradient for each bar
            const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
            gradient.addColorStop(0, this.colors.secondary);
            gradient.addColorStop(0.6, this.colors.primary);
            gradient.addColorStop(1, this.colors.accent);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, height - barHeight, barWidth - this.settings.barSpacing, barHeight);
            
            x += barWidth;
        }
    }

    drawWave() {
        const ctx = this.canvasContext;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Get time domain data for waveform
        const timeDataArray = new Uint8Array(this.analyser.fftSize);
        this.analyser.getByteTimeDomainData(timeDataArray);
        
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        const sliceWidth = width / timeDataArray.length;
        let x = 0;
        
        for (let i = 0; i < timeDataArray.length; i++) {
            const v = timeDataArray[i] / 128.0;
            const y = (v * height) / 2;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        ctx.stroke();
        
        // Add glow effect
        ctx.shadowColor = this.colors.primary;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    drawCircular() {
        const ctx = this.canvasContext;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 4;
        
        ctx.strokeStyle = this.colors.primary;
        ctx.lineWidth = 2;
        
        for (let i = 0; i < this.bufferLength; i++) {
            const angle = (i / this.bufferLength) * 2 * Math.PI;
            const amplitude = (this.dataArray[i] / 255) * radius * this.settings.sensitivity;
            
            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + amplitude);
            const y2 = centerY + Math.sin(angle) * (radius + amplitude);
            
            // Color based on frequency
            const hue = (i / this.bufferLength) * 360;
            ctx.strokeStyle = `hsl(${hue}, 70%, 60%)`;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.1, 0, 2 * Math.PI);
        ctx.fillStyle = this.colors.accent;
        ctx.fill();
    }

    drawParticles() {
        const ctx = this.canvasContext;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // Initialize particles if needed
        if (!this.particles) {
            this.particles = [];
            for (let i = 0; i < this.settings.particleCount; i++) {
                this.particles.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    size: Math.random() * 4 + 1,
                    color: Math.random() * 360
                });
            }
        }
        
        // Update and draw particles
        this.particles.forEach((particle, index) => {
            // Get audio influence
            const dataIndex = Math.floor((index / this.settings.particleCount) * this.bufferLength);
            const audioLevel = this.dataArray[dataIndex] / 255;
            
            // Update particle
            particle.x += particle.vx * (1 + audioLevel);
            particle.y += particle.vy * (1 + audioLevel);
            particle.size = 1 + audioLevel * 6;
            
            // Wrap around edges
            if (particle.x < 0) particle.x = width;
            if (particle.x > width) particle.x = 0;
            if (particle.y < 0) particle.y = height;
            if (particle.y > height) particle.y = 0;
            
            // Draw particle
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
            ctx.fillStyle = `hsla(${particle.color + audioLevel * 60}, 70%, 60%, ${0.3 + audioLevel * 0.7})`;
            ctx.fill();
            
            // Add glow
            ctx.shadowColor = `hsl(${particle.color}, 70%, 60%)`;
            ctx.shadowBlur = particle.size * 2;
            ctx.fill();
            ctx.shadowBlur = 0;
        });
    }

    setVisualizerType(type) {
        const validTypes = ['bars', 'wave', 'circular', 'particles'];
        if (!validTypes.includes(type)) return;
        
        this.visualizerType = type;
        
        // Reset particles when switching away from particle mode
        if (type !== 'particles') {
            this.particles = null;
        }
        
        this.updateVisualizerSelector();
        this.saveSettings();
        
        if (window.musicApp) {
            window.musicApp.showNotification(`Visualizer: ${type}`, 'info');
        }
    }

    updateColors(themeColors) {
        this.colors = {
            primary: themeColors.primary || '#1db954',
            secondary: themeColors.accent || '#1ed760',
            accent: themeColors.text || '#ffffff'
        };
    }

    updateVisualizerToggle() {
        const toggle = document.getElementById('visualizer-toggle');
        if (toggle) {
            toggle.textContent = this.isEnabled ? '🌈' : '📊';
            toggle.title = `Visualizer ${this.isEnabled ? 'enabled' : 'disabled'}`;
            toggle.classList.toggle('active', this.isEnabled);
        }
    }

    updateVisualizerSelector() {
        const selector = document.getElementById('visualizer-type-selector');
        if (selector) {
            selector.value = this.visualizerType;
        }
    }

    // Settings management
    saveSettings() {
        const settings = {
            isEnabled: this.isEnabled,
            visualizerType: this.visualizerType,
            settings: this.settings
        };
        localStorage.setItem('visualizerSettings', JSON.stringify(settings));
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('visualizerSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.isEnabled = settings.isEnabled ?? true;
                this.visualizerType = settings.visualizerType || 'bars';
                this.settings = { ...this.settings, ...settings.settings };
                
                this.updateVisualizerToggle();
                this.updateVisualizerSelector();
            }
        } catch (error) {
            console.error('Failed to load visualizer settings:', error);
        }
    }

    // Public methods for external control
    setSensitivity(value) {
        this.settings.sensitivity = Math.max(0.1, Math.min(2.0, value));
        this.saveSettings();
    }

    setSmoothing(value) {
        this.settings.smoothing = Math.max(0, Math.min(0.99, value));
        if (this.analyser) {
            this.analyser.smoothingTimeConstant = this.settings.smoothing;
        }
        this.saveSettings();
    }

    getSettings() {
        return { ...this.settings };
    }

    isVisualizerEnabled() {
        return this.isEnabled;
    }

    getCurrentType() {
        return this.visualizerType;
    }

    // Cleanup
    destroy() {
        this.stop();
        
        if (this.source) {
            this.source.disconnect();
        }
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        this.particles = null;
        console.log('🌈 Audio Visualizer destroyed');
    }
}

// Initialize audio visualizer
document.addEventListener('DOMContentLoaded', () => {
    window.audioVisualizer = new AudioVisualizer();
});