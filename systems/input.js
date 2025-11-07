// 入力システム

// マップデータをインポート
import { map } from '../map.js';

export class InputSystem {
    constructor() {
        this.keys = {};
        this.initEventListeners();
    }
    
    initEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            // 音効果を開始するために最初のキー入力でオーディオコンテキストを有効化
            if (window.soundManager) {
                window.soundManager.resumeAudio();
            }
            
            // 特別なキーに対する処理
            if (e.key === 's' || e.key === 'S') {
                if (window.soundManager) {
                    const soundEnabled = window.soundManager.toggleSound();
                    console.log('音効果:', soundEnabled ? 'オン' : 'オフ');
                }
            }
            
            if (e.key === 'a' || e.key === 'A') {
                if (window.soundManager) {
                    window.soundManager.toggleAmbient();
                    console.log('環境音を切り替え');
                }
            }
            
            // デフォルトのスクロール動作を防止
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }
    
    update(deltaTime, entityManager) {
        // プレイヤーエンティティを取得
        const player = entityManager.query('player')[0];
        if (!player) return;
        
        const position = player.components.get('position');
        const rotation = player.components.get('rotation');
        const playerData = player.components.get('player');
        
        let moved = false;
        
        // 回転
        if (this.keys['ArrowLeft']) {
            rotation.angle -= playerData.rotSpeed;
            moved = true;
        }
        if (this.keys['ArrowRight']) {
            rotation.angle += playerData.rotSpeed;
            moved = true;
        }
        
        // 前進・後退
        if (this.keys['ArrowUp']) {
            const newX = position.x + Math.cos(rotation.angle) * playerData.speed;
            const newY = position.y + Math.sin(rotation.angle) * playerData.speed;
            
            // 衝突判定
            if (this.canMoveTo(newX, newY, entityManager)) {
                position.x = newX;
                position.y = newY;
                moved = true;
            } else {
                // 境界チェック
                this.checkBounds(position);
            }
        }
        if (this.keys['ArrowDown']) {
            const newX = position.x - Math.cos(rotation.angle) * playerData.speed;
            const newY = position.y - Math.sin(rotation.angle) * playerData.speed;
            
            // 衝突判定
            if (this.canMoveTo(newX, newY, entityManager)) {
                position.x = newX;
                position.y = newY;
                moved = true;
            } else {
                // 境界チェック
                this.checkBounds(position);
            }
        }
        
        // 足音の再生
        if (window.soundManager) {
            const moving = this.keys['ArrowUp'] || this.keys['ArrowDown'];
            window.soundManager.playFootstep(moving);
        }
        
        // 常に境界チェック（安全策）
        this.checkBounds(position);
    }
    
    canMoveTo(x, y, entityManager) {
        // マップの境界チェック（少しマージンを持たせる）
        const margin = 0.2;
        if (x < margin || x >= map[0].length - margin || y < margin || y >= map.length - margin) {
            return false;
        }
        
        // 壁のチェック
        return map[Math.floor(y)][Math.floor(x)] === 0;
    }
    
    // 境界チェック
    checkBounds(position) {
        const margin = 0.5;
        
        // X座標のチェック
        if (position.x < margin) {
            position.x = margin;
        } else if (position.x >= map[0].length - margin) {
            position.x = map[0].length - margin - 0.1;
        }
        
        // Y座標のチェック
        if (position.y < margin) {
            position.y = margin;
        } else if (position.y >= map.length - margin) {
            position.y = map.length - margin - 0.1;
        }
        
        // 壁のチェック
        const gridX = Math.floor(position.x);
        const gridY = Math.floor(position.y);
        
        if (gridX >= 0 && gridX < map[0].length && 
            gridY >= 0 && gridY < map.length && 
            map[gridY][gridX] !== 0) {
            
            // 壁にいる場合は、安全な場所を見つける
            const safePos = this.findNearbySafePosition(position.x, position.y);
            position.x = safePos.x;
            position.y = safePos.y;
        }
    }
    
    // 近くの安全な場所を見つける
    findNearbySafePosition(x, y) {
        const maxRadius = 3;
        
        for (let radius = 1; radius <= maxRadius; radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    const newX = x + dx;
                    const newY = y + dy;
                    
                    // マップ範囲内チェック
                    if (newX >= 0.5 && newX < map[0].length - 0.5 && 
                        newY >= 0.5 && newY < map.length - 0.5) {
                        
                        // 壁のチェック
                        const gridX = Math.floor(newX);
                        const gridY = Math.floor(newY);
                        
                        if (map[gridY][gridX] === 0) {
                            return { x: newX, y: newY };
                        }
                    }
                }
            }
        }
        
        // 安全な場所が見つからない場合は元の位置を返す
        return { x, y };
    }
}
