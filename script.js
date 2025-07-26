/**
 * Meteor Storm - 超絶格好良い隕石落下アニメーション v1.0
 */

class MeteorStorm {
    constructor() {
        // Canvas setup
        this.canvas = document.getElementById('meteorCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.isActive = false;
        this.meteors = [];
        this.particles = [];
        this.meteorCount = 0;
        this.impactPower = 0;
        this.destructionLevels = ['CALM', 'LIGHT', 'MODERATE', 'HEAVY', 'EXTREME', 'APOCALYPTIC'];
        this.currentDestructionIndex = 0;
        
        // Settings
        this.meteorType = 'normal';
        this.intensity = 5;
        this.meteorSize = 3;
        this.soundEnabled = true;
        
        // Animation
        this.animationId = null;
        this.lastTime = 0;
        
        // Audio
        this.audioContext = null;
        this.masterGain = null;
        
        // Effects
        this.impactEffects = [];
        this.shockWaves = [];
        
        this.init();
    }

    init() {
        console.log('🌠 Meteor Storm v1.0 初期化中...');
        
        this.setupCanvas();
        this.setupEventListeners();
        this.initAudio();
        this.createStarField();
        this.updateUI();
        
        // Start animation loop
        this.animate();
        
        console.log('✅ Meteor Storm 準備完了！');
    }

    setupCanvas() {
        const resize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        };
        
        resize();
        window.addEventListener('resize', resize);
    }

    setupEventListeners() {
        // Control elements
        const meteorTypeSelect = document.getElementById('meteorType');
        const intensitySlider = document.getElementById('intensity');
        const sizeSlider = document.getElementById('meteorSize');
        
        // Buttons
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const resetBtn = document.getElementById('resetBtn');
        const soundBtn = document.getElementById('soundBtn');

        // Event listeners
        meteorTypeSelect.addEventListener('change', (e) => {
            this.meteorType = e.target.value;
            this.showNotification('隕石タイプ変更', `${this.getMeteorTypeName()} に変更されました`);
        });

        intensitySlider.addEventListener('input', (e) => {
            this.intensity = parseInt(e.target.value);
            document.getElementById('intensityValue').textContent = this.intensity;
        });

        sizeSlider.addEventListener('input', (e) => {
            this.meteorSize = parseInt(e.target.value);
            document.getElementById('sizeValue').textContent = this.meteorSize;
        });

        startBtn.addEventListener('click', () => this.start());
        stopBtn.addEventListener('click', () => this.stop());
        resetBtn.addEventListener('click', () => this.reset());
        soundBtn.addEventListener('click', () => this.toggleSound());
    }

    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        } catch (error) {
            console.log('Web Audio API not supported');
        }
    }

    createStarField() {
        const starField = document.getElementById('starField');
        
        for (let i = 0; i < 200; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 70 + '%';
            star.style.width = (Math.random() * 2 + 1) + 'px';
            star.style.height = star.style.width;
            star.style.animationDelay = Math.random() * 3 + 's';
            star.style.animationDuration = (Math.random() * 2 + 2) + 's';
            starField.appendChild(star);
        }
    }

    start() {
        this.isActive = true;
        this.playSound('start');
        this.showNotification('隕石雨開始', '隕石落下シミュレーション開始');
        document.getElementById('soundVisualizer').classList.add('active');
    }

    stop() {
        this.isActive = false;
        this.showNotification('停止', '隕石落下を停止しました');
        document.getElementById('soundVisualizer').classList.remove('active');
    }

    reset() {
        this.meteors = [];
        this.particles = [];
        this.impactEffects = [];
        this.shockWaves = [];
        this.meteorCount = 0;
        this.impactPower = 0;
        this.currentDestructionIndex = 0;
        this.updateUI();
        this.clearEffects();
        this.showNotification('リセット', 'すべての効果をクリアしました');
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const icon = document.querySelector('#soundBtn .btn-icon');
        icon.textContent = this.soundEnabled ? '🔊' : '🔇';
        
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(
                this.soundEnabled ? 0.3 : 0,
                this.audioContext.currentTime
            );
        }
    }

    animate(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }

    update(deltaTime) {
        if (this.isActive) {
            this.spawnMeteors();
        }

        // Update meteors
        this.meteors = this.meteors.filter(meteor => {
            meteor.x += meteor.vx * deltaTime * 0.001;
            meteor.y += meteor.vy * deltaTime * 0.001;
            meteor.rotation += meteor.rotationSpeed * deltaTime * 0.001;
            
            // Apply gravity
            meteor.vy += 300 * deltaTime * 0.001;
            
            // Check ground collision
            if (meteor.y > this.canvas.height - 120) {
                this.createImpact(meteor);
                return false;
            }
            
            return meteor.x > -100 && meteor.x < this.canvas.width + 100;
        });

        // Update particles
        this.updateParticles(deltaTime);
        
        // Update effects
        this.updateEffects(deltaTime);
    }

    spawnMeteors() {
        const spawnRate = this.intensity * 0.02;
        
        if (Math.random() < spawnRate) {
            this.createMeteor();
        }
    }

    createMeteor() {
        const baseSize = 10 + this.meteorSize * 5;
        const size = baseSize + Math.random() * baseSize;
        
        const meteor = {
            x: Math.random() * (this.canvas.width + 200) - 100,
            y: -50,
            vx: (Math.random() - 0.5) * 200 + Math.sin(Date.now() * 0.001) * 100,
            vy: 200 + Math.random() * 300,
            size: size,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 5,
            type: this.meteorType,
            trail: [],
            life: 1,
            heat: Math.random()
        };
        
        this.meteors.push(meteor);
    }

    createImpact(meteor) {
        this.meteorCount++;
        this.impactPower += Math.floor(meteor.size);
        
        // Update destruction level
        const newIndex = Math.min(
            Math.floor(this.impactPower / 100),
            this.destructionLevels.length - 1
        );
        
        if (newIndex > this.currentDestructionIndex) {
            this.currentDestructionIndex = newIndex;
            this.showNotification(
                '破壊レベル上昇',
                `${this.destructionLevels[newIndex]} レベルに到達！`
            );
        }
        
        // Create visual effects
        this.createImpactFlash(meteor.x, this.canvas.height - 120, meteor.size);
        this.createShockWave(meteor.x, this.canvas.height - 120, meteor.size);
        this.createImpactParticles(meteor.x, this.canvas.height - 120, meteor);
        
        // Play sound
        this.playSound('impact', meteor.size);
        
        this.updateUI();
    }

    createImpactFlash(x, y, size) {
        const flash = document.createElement('div');
        flash.className = 'impact-flash';
        flash.style.left = (x - size) + 'px';
        flash.style.top = (y - size) + 'px';
        flash.style.width = (size * 2) + 'px';
        flash.style.height = (size * 2) + 'px';
        
        document.getElementById('impactEffects').appendChild(flash);
        
        setTimeout(() => flash.remove(), 800);
    }

    createShockWave(x, y, size) {
        const wave = document.createElement('div');
        wave.className = 'shock-wave';
        wave.style.left = (x - size * 0.5) + 'px';
        wave.style.top = (y - size * 0.5) + 'px';
        wave.style.width = size + 'px';
        wave.style.height = size + 'px';
        
        document.getElementById('shockWaves').appendChild(wave);
        
        setTimeout(() => wave.remove(), 1500);
    }

    createImpactParticles(x, y, meteor) {
        const particleCount = Math.floor(meteor.size / 3) + 10;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
            const speed = 100 + Math.random() * 200;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 100,
                size: 2 + Math.random() * 4,
                color: this.getMeteorColor(meteor.type),
                life: 1,
                decay: 0.01 + Math.random() * 0.01,
                type: 'impact'
            });
        }

        // Add ground debris
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * meteor.size,
                y: y,
                vx: (Math.random() - 0.5) * 300,
                vy: -Math.random() * 200,
                size: 1 + Math.random() * 3,
                color: '#8b4513',
                life: 1,
                decay: 0.005,
                type: 'debris'
            });
        }
    }

    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx * deltaTime * 0.001;
            particle.y += particle.vy * deltaTime * 0.001;
            particle.vy += 500 * deltaTime * 0.001; // gravity
            particle.life -= particle.decay;
            
            return particle.life > 0;
        });
    }

    updateEffects(deltaTime) {
        // Update any custom effects here
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw meteors
        this.meteors.forEach(meteor => this.drawMeteor(meteor));
        
        // Draw particles
        this.particles.forEach(particle => this.drawParticle(particle));
    }

    drawMeteor(meteor) {
        this.ctx.save();
        
        // Draw trail
        if (meteor.trail.length > 1) {
            this.ctx.strokeStyle = this.getMeteorColor(meteor.type, 0.3);
            this.ctx.lineWidth = meteor.size * 0.3;
            this.ctx.lineCap = 'round';
            
            this.ctx.beginPath();
            meteor.trail.forEach((point, index) => {
                if (index === 0) {
                    this.ctx.moveTo(point.x, point.y);
                } else {
                    this.ctx.lineTo(point.x, point.y);
                }
            });
            this.ctx.stroke();
        }
        
        // Add current position to trail
        meteor.trail.push({ x: meteor.x, y: meteor.y });
        if (meteor.trail.length > 10) {
            meteor.trail.shift();
        }
        
        // Draw meteor body
        this.ctx.translate(meteor.x, meteor.y);
        this.ctx.rotate(meteor.rotation);
        
        // Outer glow
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, meteor.size * 1.5);
        gradient.addColorStop(0, this.getMeteorColor(meteor.type, 0.8));
        gradient.addColorStop(0.7, this.getMeteorColor(meteor.type, 0.3));
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(-meteor.size * 1.5, -meteor.size * 1.5, meteor.size * 3, meteor.size * 3);
        
        // Core
        this.ctx.fillStyle = this.getMeteorColor(meteor.type);
        this.ctx.shadowColor = this.getMeteorColor(meteor.type);
        this.ctx.shadowBlur = 20;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, meteor.size * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Surface details
        this.ctx.fillStyle = this.getMeteorColor(meteor.type, 0.6);
        this.ctx.shadowBlur = 0;
        
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const x = Math.cos(angle) * meteor.size * 0.3;
            const y = Math.sin(angle) * meteor.size * 0.3;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, meteor.size * 0.1, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }

    drawParticle(particle) {
        this.ctx.save();
        this.ctx.globalAlpha = particle.life;
        
        if (particle.type === 'impact') {
            // Impact particles with glow
            this.ctx.shadowColor = particle.color;
            this.ctx.shadowBlur = 10;
        }
        
        this.ctx.fillStyle = particle.color;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    getMeteorColor(type, alpha = 1) {
        const colors = {
            normal: `rgba(255, 107, 53, ${alpha})`,
            fire: `rgba(255, 0, 0, ${alpha})`,
            ice: `rgba(173, 216, 230, ${alpha})`,
            electric: `rgba(255, 255, 0, ${alpha})`,
            plasma: `rgba(128, 0, 255, ${alpha})`,
            rainbow: `rgba(${Math.floor(Math.sin(Date.now() * 0.01) * 127 + 128)}, ${Math.floor(Math.sin(Date.now() * 0.013) * 127 + 128)}, ${Math.floor(Math.sin(Date.now() * 0.017) * 127 + 128)}, ${alpha})`
        };
        
        return colors[type] || colors.normal;
    }

    getMeteorTypeName() {
        const names = {
            normal: '通常隕石',
            fire: '火炎隕石',
            ice: '氷結隕石',
            electric: '電撃隕石',
            plasma: 'プラズマ隕石',
            rainbow: '虹色隕石'
        };
        
        return names[this.meteorType] || names.normal;
    }

    updateUI() {
        document.getElementById('meteorCount').textContent = this.meteorCount;
        document.getElementById('impactPower').textContent = this.impactPower;
        document.getElementById('destructionLevel').textContent = this.destructionLevels[this.currentDestructionIndex];
    }

    clearEffects() {
        document.getElementById('impactEffects').innerHTML = '';
        document.getElementById('shockWaves').innerHTML = '';
    }

    showNotification(title, text) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-text">${text}</div>
        `;
        
        document.getElementById('notifications').appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.animation = 'notificationSlide 0.5s ease-out reverse';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    playSound(type, intensity = 1) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        
        switch(type) {
            case 'start':
                this.playStartSound();
                break;
            case 'impact':
                this.playImpactSound(intensity);
                break;
            case 'atmosphere':
                this.playAtmosphereSound();
                break;
        }
    }

    playStartSound() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 1);
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 1);
    }

    playImpactSound(intensity) {
        // Bass impact
        const bassOsc = this.audioContext.createOscillator();
        const bassGain = this.audioContext.createGain();
        
        bassOsc.connect(bassGain);
        bassGain.connect(this.masterGain);
        
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(60 + intensity, this.audioContext.currentTime);
        bassOsc.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.5);
        
        bassGain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
        bassGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        bassOsc.start();
        bassOsc.stop(this.audioContext.currentTime + 0.5);
        
        // Explosion noise
        const noiseBuffer = this.createNoiseBuffer(0.3);
        const noiseSource = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        noiseSource.buffer = noiseBuffer;
        noiseSource.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000 + intensity * 100, this.audioContext.currentTime);
        filter.Q.setValueAtTime(5, this.audioContext.currentTime);
        
        noiseGain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
        
        noiseSource.start();
        noiseSource.stop(this.audioContext.currentTime + 0.3);
    }

    playAtmosphereSound() {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + 0.2);
    }

    createNoiseBuffer(duration) {
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }
}

// Initialize application
let meteorStorm;

document.addEventListener('DOMContentLoaded', () => {
    console.log('🌠 Meteor Storm - 超絶格好良い隕石落下アニメーション v1.0');
    meteorStorm = new MeteorStorm();
});

// Export for debugging
window.MeteorStorm = MeteorStorm;