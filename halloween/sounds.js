// ハロウィン音効果マネージャー
console.log('🎵 sounds.js ロード開始...');

class SoundManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.enabled = true;
        this.footstepTimer = 0;
        this.footstepDelay = 0.3; // 歩く音の間隔
        this.lastFootstep = 0;
        this.ambientSound = null;
        this.heartbeatSound = null; // 心臓の鼓動音（継続音）
        this.warningSound = null;   // 警告音（継続音）
        this.lastCatMeow = 0;       // 最後に猫が鳴いた時刻
        this.catMeowInterval = 2000; // 猫の鳴き声の間隔（2秒）
        this.initAudio();
    }
    
    initAudio() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            console.log('🔊 AudioContext初期化完了:', this.audioContext.state);
            this.createSounds();
        } catch (e) {
            console.error('❌ Web Audio APIがサポートされていません:', e);
            this.enabled = false;
        }
    }
    
    // ユーザーインタラクション後にオーディオコンテキストを開始
    resumeAudio() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            console.log('🔊 AudioContext再開中...');
            this.audioContext.resume().then(() => {
                console.log('✅ AudioContext再開完了:', this.audioContext.state);
            });
        }
    }
    
    createSounds() {
        if (!this.audioContext) return;
        
        // 足音
        this.sounds.footstep = () => this.createFootstep();
        
        // ドア開閉音
        this.sounds.door = () => this.createDoorSound();
        
        // ゴーストの音
        this.sounds.ghost = () => this.createGhostSound();
        
        // かぼちゃの音
        this.sounds.pumpkin = () => this.createPumpkinSound();
        
        // 環境音
        this.sounds.ambient = () => this.createAmbientSound();
        
        // 急な音（ジャンプ音など）
        this.sounds.jump = () => this.createJumpSound();

        // 勝利ファンファーレ
        this.sounds.victory = () => this.createVictorySound();

        // 猫の鳴き声
        this.sounds.meow = () => this.createMeowSound();

        // 回復音
        this.sounds.heal = () => this.createHealSound();

        // 爆発音
        this.sounds.explosion = () => this.createExplosionSound();

        // 魔女っこの笑い声
        this.sounds.witchLaugh = () => this.createWitchLaughSound();

        // 魔法攻撃音
        this.sounds.magic = () => this.createMagicSound();
    }
    
    // 足音の生成
    createFootstep() {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        
        // 2つの足音を交互に再生
        const foot = Math.random() > 0.5 ? 0.8 : 1.2;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 80 * foot;
        oscillator.type = 'sine';
        
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        oscillator.start(now);
        oscillator.stop(now + 0.1);
    }
    
    // ドア音の生成
    createDoorSound() {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        const bufferSize = this.audioContext.sampleRate * 0.5;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        // ノイズ生成
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
        }
        
        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;
        
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        noise.start(now);
    }
    
    // ゴーストの音（うめき声）
    createGhostSound() {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        const duration = 2;
        
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator1.connect(filter);
        oscillator2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 低い周波数のうめき声
        oscillator1.frequency.setValueAtTime(80, now);
        oscillator1.frequency.exponentialRampToValueAtTime(120, now + duration);
        oscillator1.type = 'sawtooth';
        
        oscillator2.frequency.setValueAtTime(40, now);
        oscillator2.frequency.exponentialRampToValueAtTime(60, now + duration);
        oscillator2.type = 'triangle';
        
        filter.type = 'bandpass';
        filter.frequency.value = 300;
        filter.Q.value = 10;
        
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        oscillator1.start(now);
        oscillator2.start(now);
        oscillator1.stop(now + duration);
        oscillator2.stop(now + duration);
    }
    
    // かぼちゃの音
    createPumpkinSound() {
        if (!this.audioContext) return;
        
        const now = this.audioContext.currentTime;
        const duration = 0.5;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // かぼちゃが割れるような音
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + duration);
        oscillator.type = 'square';
        
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
    }
    
    // 環境音（不気味な雰囲気）
    createAmbientSound() {
        if (!this.audioContext || this.ambientSound) return;
        
        const now = this.audioContext.currentTime;
        
        this.ambientSound = {
            oscillators: [],
            gainNodes: []
        };
        
        // 低い不気味な音
        for (let i = 0; i < 3; i++) {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = 30 + i * 10;
            oscillator.type = 'sine';
            
            gainNode.gain.value = 0.05;
            
            // 周波数の微妙な変化
            oscillator.frequency.setValueAtTime(oscillator.frequency.value, now);
            oscillator.frequency.linearRampToValueAtTime(
                oscillator.frequency.value + (Math.random() - 0.5) * 5, 
                now + 10 + Math.random() * 5
            );
            
            oscillator.start(now);
            
            this.ambientSound.oscillators.push(oscillator);
            this.ambientSound.gainNodes.push(gainNode);
        }
    }
    
    // ジャンプ音
    createJumpSound() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const duration = 0.3;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(300, now + duration);
        oscillator.type = 'square';

        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    // 勝利ファンファーレ（派手な音楽）
    createVictorySound() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;

        // メロディーの音符（ド-ミ-ソ-ド）
        const notes = [
            { freq: 523.25, start: 0, duration: 0.2 },      // ド (C5)
            { freq: 659.25, start: 0.2, duration: 0.2 },    // ミ (E5)
            { freq: 783.99, start: 0.4, duration: 0.2 },    // ソ (G5)
            { freq: 1046.50, start: 0.6, duration: 0.4 }    // ド (C6) - 長め
        ];

        notes.forEach(note => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.value = note.freq;
            oscillator.type = 'triangle';

            gainNode.gain.setValueAtTime(0.3, now + note.start);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + note.start + note.duration);

            oscillator.start(now + note.start);
            oscillator.stop(now + note.start + note.duration);
        });

        // ドラムロール風の効果音
        const bufferSize = this.audioContext.sampleRate * 0.8;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const noiseGain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);

        filter.type = 'highpass';
        filter.frequency.value = 2000;

        noiseGain.gain.setValueAtTime(0.1, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

        noise.start(now);
    }

    // 猫の鳴き声「にゃーん」
    createMeowSound() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const duration = 0.5;

        // 2つの周波数でにゃーん感を出す
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        oscillator1.connect(filter);
        oscillator2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // 高めの周波数から下がる（にゃー）
        oscillator1.frequency.setValueAtTime(800, now);
        oscillator1.frequency.exponentialRampToValueAtTime(400, now + 0.15);
        oscillator1.frequency.exponentialRampToValueAtTime(500, now + duration);
        oscillator1.type = 'sawtooth';

        oscillator2.frequency.setValueAtTime(1000, now);
        oscillator2.frequency.exponentialRampToValueAtTime(500, now + 0.15);
        oscillator2.frequency.exponentialRampToValueAtTime(600, now + duration);
        oscillator2.type = 'triangle';

        // フィルターで柔らかく
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.exponentialRampToValueAtTime(600, now + duration);
        filter.Q.value = 2;

        // 音量の変化（にゃーんの感じ）
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.15, now + 0.02);
        gainNode.gain.linearRampToValueAtTime(0.12, now + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        oscillator1.start(now);
        oscillator2.start(now);
        oscillator1.stop(now + duration);
        oscillator2.stop(now + duration);
    }

    // 回復音（キラキラした上昇音）
    createHealSound() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const duration = 0.6;

        // 3つの音で和音を作る（ドミソ）
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5

        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // キラキラ感のある上昇
            oscillator.frequency.setValueAtTime(freq, now);
            oscillator.frequency.exponentialRampToValueAtTime(freq * 1.5, now + duration);
            oscillator.type = 'sine';

            // 音量エンベロープ
            const delay = index * 0.05; // 少しずつ遅延
            gainNode.gain.setValueAtTime(0, now + delay);
            gainNode.gain.linearRampToValueAtTime(0.15, now + delay + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

            oscillator.start(now + delay);
            oscillator.stop(now + duration);
        });
    }

    // 爆発音（ドーン！）
    createExplosionSound() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const duration = 0.8;

        // ノイズで爆発音を作る
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        // ホワイトノイズ生成
        for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // ローパスフィルターで丸みをつける
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.exponentialRampToValueAtTime(50, now + duration);

        // 音量エンベロープ（爆発的な立ち上がり）
        gainNode.gain.setValueAtTime(0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        noise.start(now);

        // 低音の「ドーン」を追加
        const bass = this.audioContext.createOscillator();
        const bassGain = this.audioContext.createGain();

        bass.connect(bassGain);
        bassGain.connect(this.audioContext.destination);

        bass.frequency.setValueAtTime(60, now);
        bass.frequency.exponentialRampToValueAtTime(30, now + 0.3);
        bass.type = 'sine';

        bassGain.gain.setValueAtTime(0.3, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        bass.start(now);
        bass.stop(now + 0.3);
    }

    // 魔女っこの笑い声「ふふふ...」
    createWitchLaughSound() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const duration = 1.2;

        // 笑い声の3つの「ふ」を表現
        const laughs = [
            { start: 0, freq: 350 },
            { start: 0.35, freq: 380 },
            { start: 0.7, freq: 320 }
        ];

        laughs.forEach(laugh => {
            const oscillator1 = this.audioContext.createOscillator();
            const oscillator2 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();

            oscillator1.connect(filter);
            oscillator2.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // 笑い声の周波数変化
            oscillator1.frequency.setValueAtTime(laugh.freq, now + laugh.start);
            oscillator1.frequency.exponentialRampToValueAtTime(laugh.freq * 0.8, now + laugh.start + 0.25);
            oscillator1.type = 'triangle';

            oscillator2.frequency.setValueAtTime(laugh.freq * 1.5, now + laugh.start);
            oscillator2.frequency.exponentialRampToValueAtTime(laugh.freq * 1.2, now + laugh.start + 0.25);
            oscillator2.type = 'sine';

            // フィルター
            filter.type = 'bandpass';
            filter.frequency.value = 500;
            filter.Q.value = 3;

            // エンベロープ
            gainNode.gain.setValueAtTime(0, now + laugh.start);
            gainNode.gain.linearRampToValueAtTime(0.12, now + laugh.start + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + laugh.start + 0.25);

            oscillator1.start(now + laugh.start);
            oscillator2.start(now + laugh.start);
            oscillator1.stop(now + laugh.start + 0.25);
            oscillator2.stop(now + laugh.start + 0.25);
        });
    }

    // 魔法攻撃音「シュワーン」
    createMagicSound() {
        if (!this.audioContext) return;

        const now = this.audioContext.currentTime;
        const duration = 0.6;

        // 高音のキラキラ＋低音のブーン
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        oscillator1.connect(filter);
        oscillator2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // 高音（キラキラ）
        oscillator1.frequency.setValueAtTime(1200, now);
        oscillator1.frequency.exponentialRampToValueAtTime(600, now + duration);
        oscillator1.type = 'sine';

        // 低音（ブーン）
        oscillator2.frequency.setValueAtTime(150, now);
        oscillator2.frequency.exponentialRampToValueAtTime(80, now + duration);
        oscillator2.type = 'triangle';

        // フィルター（シュワーン感）
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(400, now + duration);
        filter.Q.value = 5;

        // エンベロープ
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

        oscillator1.start(now);
        oscillator2.start(now);
        oscillator1.stop(now + duration);
        oscillator2.stop(now + duration);
    }

    // 心臓の鼓動音（継続的にループ）
    createHeartbeatSound(distance) {
        if (!this.audioContext) return;

        // 距離に応じた音量（近いほど大きく）
        const volume = Math.max(0, Math.min(0.3, (3 - distance) / 3 * 0.3));

        if (this.heartbeatSound) {
            // 既に再生中の場合は音量だけ調整
            this.heartbeatSound.gainNode.gain.value = volume;
            return;
        }

        const now = this.audioContext.currentTime;

        // 低周波の鼓動
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        oscillator1.connect(filter);
        oscillator2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // 心臓の鼓動のような低い音
        oscillator1.frequency.value = 60;
        oscillator1.type = 'sine';

        oscillator2.frequency.value = 40;
        oscillator2.type = 'sine';

        filter.type = 'lowpass';
        filter.frequency.value = 200;

        gainNode.gain.value = volume;

        // ゆっくりとした鼓動リズム（LFOで音量変化）
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();

        lfo.frequency.value = 1.2; // 1.2Hz（約1秒間隔）
        lfo.connect(lfoGain);
        lfoGain.connect(gainNode.gain);
        lfoGain.gain.value = volume * 0.5;

        oscillator1.start(now);
        oscillator2.start(now);
        lfo.start(now);

        this.heartbeatSound = {
            oscillators: [oscillator1, oscillator2, lfo],
            gainNode: gainNode
        };
    }

    // 警告音（非常に近い時）
    createWarningSound(distance) {
        if (!this.audioContext) return;

        const volume = Math.max(0, Math.min(0.2, (1.5 - distance) / 1.5 * 0.2));

        if (this.warningSound) {
            this.warningSound.gainNode.gain.value = volume;
            return;
        }

        const now = this.audioContext.currentTime;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // 高音の警告音
        oscillator.frequency.value = 800;
        oscillator.type = 'triangle';

        gainNode.gain.value = volume;

        // 音量をパルス状に変化
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();

        lfo.frequency.value = 4; // 4Hz（速いパルス）
        lfo.connect(lfoGain);
        lfoGain.connect(gainNode.gain);
        lfoGain.gain.value = volume * 0.5;

        oscillator.start(now);
        lfo.start(now);

        this.warningSound = {
            oscillators: [oscillator, lfo],
            gainNode: gainNode
        };
    }

    // 心臓の鼓動音を停止
    stopHeartbeat() {
        if (this.heartbeatSound) {
            this.heartbeatSound.oscillators.forEach(osc => {
                try {
                    osc.stop();
                } catch (e) {
                    // 既に停止
                }
            });
            this.heartbeatSound = null;
        }
    }

    // 警告音を停止
    stopWarning() {
        if (this.warningSound) {
            this.warningSound.oscillators.forEach(osc => {
                try {
                    osc.stop();
                } catch (e) {
                    // 既に停止
                }
            });
            this.warningSound = null;
        }
    }

    // 敵接近サウンドの更新（距離に応じて）
    updateEnemyProximitySound(closestDistance) {
        if (!this.enabled) {
            this.stopHeartbeat();
            this.stopWarning();
            return;
        }

        if (closestDistance < 1.5) {
            // 非常に近い: 警告音
            this.createWarningSound(closestDistance);
            this.createHeartbeatSound(closestDistance);
        } else if (closestDistance < 3.0) {
            // 近い: 心臓の鼓動のみ
            this.stopWarning();
            this.createHeartbeatSound(closestDistance);
        } else {
            // 遠い: 全て停止
            this.stopHeartbeat();
            this.stopWarning();
        }
    }

    // 猫接近サウンドの更新（距離に応じて）
    updateCatProximitySound(closestCatDistance) {
        if (!this.enabled) return;

        const now = Date.now();

        // 猫が2マス以内にいて、前回の鳴き声から一定時間経過していたら鳴く
        if (closestCatDistance < 2.0 && now - this.lastCatMeow > this.catMeowInterval) {
            this.play('meow');
            this.lastCatMeow = now;
            console.log('🐱 にゃーん！');
        }
    }

    // 音を再生
    play(soundName) {
        if (!this.enabled) {
            console.log('⚠️ 音が無効化されています');
            return;
        }
        if (!this.sounds[soundName]) {
            console.log('⚠️ 音が見つかりません:', soundName);
            return;
        }

        console.log('🔊 再生:', soundName, 'AudioContext状態:', this.audioContext?.state);

        // ユーザーインタラクション後にオーディオコンテキストを開始
        this.resumeAudio();

        this.sounds[soundName]();
    }
    
    // 移動中の足音
    playFootstep(moving) {
        if (!this.enabled || !moving) return;
        
        const now = Date.now() / 1000;
        if (now - this.lastFootstep > this.footstepDelay) {
            this.play('footstep');
            this.lastFootstep = now;
        }
    }
    
    // 環境音の開始/停止
    toggleAmbient() {
        if (!this.enabled) return;
        
        if (this.ambientSound) {
            // 環境音を停止
            this.ambientSound.oscillators.forEach(osc => {
                try {
                    osc.stop();
                } catch (e) {
                    // 既に停止している場合
                }
            });
            this.ambientSound = null;
        } else {
            // 環境音を開始
            this.play('ambient');
        }
    }
    
    // 音の有効/無効
    toggleSound() {
        this.enabled = !this.enabled;
        if (!this.enabled && this.ambientSound) {
            this.toggleAmbient(); // 環境音を停止
        }
        return this.enabled;
    }
}

// 音効果マネージャーのインスタンスを作成
const soundManager = new SoundManager();

// グローバルに公開
window.soundManager = soundManager;

console.log('✅ soundManagerをグローバルに公開しました:', window.soundManager);
