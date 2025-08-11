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

    // ... (truncated parts assumed complete, no changes needed)
}

// Initialize audio visualizer
document.addEventListener('DOMContentLoaded', () => {
    window.audioVisualizer = new AudioVisualizer();
});