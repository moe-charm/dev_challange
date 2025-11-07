// 入力システム (bitECS対応)

// マップデータをインポート
import { map } from '../map.js';

export class InputSystem {
    constructor(world, playerQuery, Position, Rotation, Player) {
        this.world = world;
        this.playerQuery = playerQuery;
        this.Position = Position;
        this.Rotation = Rotation;
        this.Player = Player;
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

    update(deltaTime) {
        // プレイヤーエンティティを取得
        const players = this.playerQuery(this.world);
        if (players.length === 0) return;

        const eid = players[0]; // 最初のプレイヤー

        let moved = false;

        // 回転
        if (this.keys['ArrowLeft']) {
            this.Rotation.angle[eid] -= this.Player.rotSpeed[eid];
            moved = true;
        }
        if (this.keys['ArrowRight']) {
            this.Rotation.angle[eid] += this.Player.rotSpeed[eid];
            moved = true;
        }

        // 前進・後退
        if (this.keys['ArrowUp']) {
            const newX = this.Position.x[eid] + Math.cos(this.Rotation.angle[eid]) * this.Player.speed[eid];
            const newY = this.Position.y[eid] + Math.sin(this.Rotation.angle[eid]) * this.Player.speed[eid];

            // 衝突判定
            if (this.canMoveTo(newX, newY)) {
                this.Position.x[eid] = newX;
                this.Position.y[eid] = newY;
                moved = true;
            } else {
                // 境界チェック
                this.checkBounds(eid);
            }
        }
        if (this.keys['ArrowDown']) {
            const newX = this.Position.x[eid] - Math.cos(this.Rotation.angle[eid]) * this.Player.speed[eid];
            const newY = this.Position.y[eid] - Math.sin(this.Rotation.angle[eid]) * this.Player.speed[eid];

            // 衝突判定
            if (this.canMoveTo(newX, newY)) {
                this.Position.x[eid] = newX;
                this.Position.y[eid] = newY;
                moved = true;
            } else {
                // 境界チェック
                this.checkBounds(eid);
            }
        }

        // 足音の再生
        if (window.soundManager) {
            const moving = this.keys['ArrowUp'] || this.keys['ArrowDown'];
            window.soundManager.playFootstep(moving);
        }

        // 常に境界チェック（安全策）
        this.checkBounds(eid);
    }

    canMoveTo(x, y) {
        // マップの境界チェック（少しマージンを持たせる）
        const margin = 0.2;
        if (x < margin || x >= map[0].length - margin || y < margin || y >= map.length - margin) {
            return false;
        }

        // 壁のチェック（建物（1）のみ通行不可、それ以外は通過可能）
        const cellValue = map[Math.floor(y)][Math.floor(x)];
        return cellValue !== 1;  // 建物以外は通過可能
    }

    // 境界チェック
    checkBounds(eid) {
        const margin = 0.5;

        // X座標のチェック
        if (this.Position.x[eid] < margin) {
            this.Position.x[eid] = margin;
        } else if (this.Position.x[eid] >= map[0].length - margin) {
            this.Position.x[eid] = map[0].length - margin - 0.1;
        }

        // Y座標のチェック
        if (this.Position.y[eid] < margin) {
            this.Position.y[eid] = margin;
        } else if (this.Position.y[eid] >= map.length - margin) {
            this.Position.y[eid] = map.length - margin - 0.1;
        }

        // 壁のチェック（建物にいる場合）
        const gridX = Math.floor(this.Position.x[eid]);
        const gridY = Math.floor(this.Position.y[eid]);

        if (gridX >= 0 && gridX < map[0].length &&
            gridY >= 0 && gridY < map.length &&
            map[gridY][gridX] === 1) {  // 建物の場合

            // 壁にいる場合は、安全な場所を見つける
            const safePos = this.findNearbySafePosition(this.Position.x[eid], this.Position.y[eid]);
            this.Position.x[eid] = safePos.x;
            this.Position.y[eid] = safePos.y;
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

                        // 壁のチェック（建物以外は安全）
                        const gridX = Math.floor(newX);
                        const gridY = Math.floor(newY);

                        if (map[gridY][gridX] !== 1) {  // 建物以外は安全
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
