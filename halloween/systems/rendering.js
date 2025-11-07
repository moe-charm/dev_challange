// レンダリングシステム

// マップデータをインポート
import { map } from '../map.js';

// 基本レンダリングシステム
export class RenderingSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Canvasのサイズ設定
        const resizeCanvas = () => {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
    
    update(deltaTime, entityManager) {
        if (!this.ctx) return;
        
        // 天空と地面の描画
        this.renderSkyAndGround();
        
        // 3Dレンダリング
        this.render3D(entityManager);
        
        // 特殊な要素の描画
        this.renderSpecialEffects(entityManager);
    }
    
    // 天空と地面の描画
    renderSkyAndGround() {
        // 天空
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height/2);
        skyGradient.addColorStop(0, '#0a0e27');
        skyGradient.addColorStop(1, '#1a1f3a');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height/2);
        
        // 地面
        const groundGradient = this.ctx.createLinearGradient(0, this.canvas.height/2, 0, this.canvas.height);
        groundGradient.addColorStop(0, '#3d2817');
        groundGradient.addColorStop(1, '#1a0f05');
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, this.canvas.height/2, this.canvas.width, this.canvas.height/2);
    }
    
    // 3Dレンダリング
    render3D(entityManager) {
        // プレイヤーエンティティを取得
        const player = entityManager.query('player')[0];
        if (!player) return;
        
        const position = player.components.get('position');
        const rotation = player.components.get('rotation');
        
        // レイキャストで3D表示
        const fov = Math.PI / 3; // 60度視野
        const numRays = this.canvas.width / 2; // レイの本数
        
        // 各レイのヒット情報を保存
        const hits = [];
        
        for (let i = 0; i < numRays; i++) {
            const rayAngle = rotation.angle - fov/2 + (i/numRays) * fov;
            
            // レイを飛ばして壁までの距離を計算
            const hit = this.castRay(position.x, position.y, rayAngle);
            
            if (hit) {
                // 距離の補正（魚眼効果を軽減）
                hit.correctedDistance = hit.distance * Math.cos(rayAngle - rotation.angle);
                
                // 壁の高さを計算
                hit.wallHeight = this.canvas.height / hit.correctedDistance;
                
                hits.push({
                    x: i,
                    distance: hit.correctedDistance,
                    wallType: hit.wallType,
                    wallHeight: hit.wallHeight,
                    rayAngle: rayAngle
                });
            }
        }
        
        // 壁の描画
        for (const hit of hits) {
            const screenX = (hit.x / numRays) * this.canvas.width;
            const screenY = (this.canvas.height - hit.wallHeight) / 2;
            
            // 各オブジェクトタイプに応じた描画
            this.renderObject(screenX, screenY, hit.wallType, hit.wallHeight, hit.distance);
        }
        
        // 特殊なオブジェクトを前景に描画
        this.renderSpecialObjects(position, rotation, hits);
    }
    
    // レイキャスト
    castRay(originX, originY, angle) {
        const stepSize = 0.05;
        const maxDistance = 20;
        const dx = Math.cos(angle) * stepSize;
        const dy = Math.sin(angle) * stepSize;
        
        let distance = 0;
        let hitWall = false;
        let wallType = 0;
        
        while (!hitWall && distance < maxDistance) {
            distance += stepSize;
            const testX = originX + dx * distance;
            const testY = originY + dy * distance;
            
            // マップの範囲外チェック
            if (testX < 0 || testX >= map[0].length || 
                testY < 0 || testY >= map.length) {
                hitWall = true;
                wallType = 1; // 境界外は壁とみなす
            } else {
                wallType = map[Math.floor(testY)][Math.floor(testX)];
                if (wallType > 0) {
                    hitWall = true;
                }
            }
        }
        
        return hitWall ? { distance, wallType } : null;
    }
    
    // オブジェクトの描画
    renderObject(x, y, type, height, distance) {
        const maxDistance = 20;
        const width = this.canvas.width / (this.canvas.width / 2);
        const brightness = Math.max(0.2, 1 - (distance / maxDistance));
        
        // オブジェクトファクトリーから描画関数を取得
        const renderer = ObjectRendererFactory.getRenderer(type);
        if (renderer) {
            renderer(this.ctx, x, y, width + 1, height, brightness, distance);
        }
    }
    
    // 特殊な効果の描画
    renderSpecialEffects(entityManager) {
        // ハロウィン要素の追加描画
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('🎃 ハッピーハロウィン！', this.canvas.width/2 - 80, 50);
    }
    
    // 特殊なオブジェクトを前景に描画
    renderSpecialObjects(position, rotation, hits) {
        const time = Date.now() / 1000;
        
        // 視野内の特殊オブジェクトを検索して描画
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                const type = map[y][x];
                
                if (type === 2) { // おばけ
                    this.renderFloatingObject(position, rotation, x, y, time, '👻', '#ffffff', 6, 5);
                } else if (type === 3) { // かぼちゃ
                    this.renderFloatingObject(position, rotation, x, y, time, '🎃', '#ff6d00', 4, 3);
                } else if (type === 7) { // 魔女
                    this.renderFloatingWitch(position, rotation, x, y, time);
                }
            }
        }
    }
    
    // 浮遊オブジェクトの描画
    renderFloatingObject(position, rotation, gridX, gridY, time, emoji, color, viewDistance, floatHeight) {
        // プレイヤーからの距離と角度を計算
        const dx = gridX - position.x + 0.5;
        const dy = gridY - position.y + 0.5;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < viewDistance) {
            const angleToObject = Math.atan2(dy, dx);
            let angleDiff = angleToObject - rotation.angle;
            
            // 角度差を-π〜πの範囲に正規化
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            if (Math.abs(angleDiff) < Math.PI / 3) { // 視野内
                // 画面上の位置を計算
                const screenX = this.canvas.width / 2 + (angleDiff / (Math.PI / 3)) * (this.canvas.width / 2);
                const brightness = Math.max(0.2, 1 - (distance / 10));
                const floatY = Math.sin(time * 1.5 + gridX + gridY) * floatHeight;
                const scale = 0.8 + Math.sin(time * 2 + gridX) * 0.2;
                
                // オブジェクトを半透明で描画
                this.ctx.globalAlpha = brightness * 0.8;
                this.ctx.fillStyle = color;
                this.ctx.font = `${30 * brightness * scale}px Arial`;
                this.ctx.fillText(emoji, screenX - 15, this.canvas.height / 2 + floatY);
                this.ctx.globalAlpha = 1;
                
                // まばたき（おばけの場合）
                if (emoji === '👻' && Math.random() > 0.98) {
                    this.ctx.globalAlpha = brightness * 0.8;
                    this.ctx.fillStyle = '#000000';
                    this.ctx.fillRect(screenX - 10, this.canvas.height / 2 + floatY - 5, 20, 2);
                    this.ctx.globalAlpha = 1;
                }
            }
        }
    }
    
    // 魔女の浮遊描画
    renderFloatingWitch(position, rotation, gridX, gridY, time) {
        // プレイヤーからの距離と角度を計算
        const dx = gridX - position.x + 0.5;
        const dy = gridY - position.y + 0.5;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 8) {
            const angleToWitch = Math.atan2(dy, dx);
            let angleDiff = angleToWitch - rotation.angle;
            
            // 角度差を-π〜πの範囲に正規化
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            if (Math.abs(angleDiff) < Math.PI / 3) { // 視野内
                // 画面上の位置を計算
                const screenX = this.canvas.width / 2 + (angleDiff / (Math.PI / 3)) * (this.canvas.width / 2);
                const brightness = Math.max(0.2, 1 - (distance / 10));
                const floatY = Math.sin(time * 0.8 + gridX + gridY) * 8;
                const scale = 0.7 + Math.sin(time * 1.5 + gridX) * 0.3;
                const rotation = Math.sin(time * 0.5) * 0.1;
                
                // 魔女を半透明で描画
                this.ctx.save();
                this.ctx.globalAlpha = brightness * 0.9;
                this.ctx.translate(screenX, this.canvas.height / 2 + floatY);
                this.ctx.rotate(rotation);
                this.ctx.scale(scale, scale);
                
                // 魔女の絵文字
                this.ctx.font = `40px Arial`;
                this.ctx.fillText('🧙‍♀️', -20, 10);
                
                // 魔法の光のエフェクト
                const sparkleCount = 3;
                for (let i = 0; i < sparkleCount; i++) {
                    const sparkleX = Math.cos(time * 2 + i * 2) * 30;
                    const sparkleY = Math.sin(time * 2 + i * 2) * 30;
                    const sparkleSize = 3 + Math.sin(time * 5 + i) * 2;
                    const sparkleAlpha = 0.5 + Math.sin(time * 3 + i) * 0.5;
                    
                    this.ctx.globalAlpha = brightness * sparkleAlpha;
                    this.ctx.fillStyle = '#ffeb3b';
                    this.ctx.beginPath();
                    this.ctx.arc(sparkleX, sparkleY - 20, sparkleSize, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                this.ctx.restore();
                this.ctx.globalAlpha = 1;
            }
        }
    }
}

// オブジェクトレンダリングファクトリー
export const ObjectRendererFactory = {
    renderers: new Map(),
    
    // レンダラーを登録
    register(type, renderer) {
        this.renderers.set(type, renderer);
    },
    
    // レンダラーを取得
    getRenderer(type) {
        return this.renderers.get(type);
    },
    
    // すべてのレンダラーを初期化
    initializeAll() {
        // 建物のレンダラー
        this.register(1, (ctx, x, y, width, height, brightness, distance) => {
            ctx.fillStyle = adjustBrightness('#3a1f0f', brightness);
            ctx.fillRect(x, y, width, height);
            
            // 建物の窓
            if (Math.random() > 0.7 && distance < 10) {
                const windowHeight = 10;
                const windowWidth = 5;
                const windowY = y + Math.random() * (height - windowHeight);
                const windowX = x + Math.random() * (width - windowWidth);
                
                ctx.fillStyle = adjustBrightness('#ffcc00', brightness * 1.5);
                ctx.fillRect(windowX, windowY, windowWidth, windowHeight);
            }
        });
        
        // おばけのレンダラー
        this.register(2, (ctx, x, y, width, height, brightness, distance) => {
            ctx.fillStyle = adjustBrightness('#8a2be2', brightness);
            ctx.fillRect(x, y, width, height);
            
            // おばけの顔
            if (distance < 8) {
                ctx.fillStyle = adjustBrightness('#ffffff', brightness);
                const faceY = y + height * 0.3;
                const faceSize = height * 0.2;
                
                // 目
                ctx.fillRect(x + width * 0.3, faceY, width * 0.15, faceSize * 0.3);
                ctx.fillRect(x + width * 0.6, faceY, width * 0.15, faceSize * 0.3);
                
                // 口
                ctx.fillRect(x + width * 0.4, faceY + faceSize * 0.5, width * 0.3, faceSize * 0.2);
            }
        });
        
        // かぼちゃのレンダラー
        this.register(3, (ctx, x, y, width, height, brightness, distance) => {
            ctx.fillStyle = adjustBrightness('#ff6d00', brightness);
            ctx.fillRect(x, y, width, height);
            
            // かぼちゃの顔
            if (distance < 8) {
                ctx.fillStyle = adjustBrightness('#000000', brightness);
                const faceY = y + height * 0.3;
                const faceSize = height * 0.25;
                
                // 目（三角形）
                ctx.beginPath();
                ctx.moveTo(x + width * 0.3, faceY + faceSize * 0.2);
                ctx.lineTo(x + width * 0.4, faceY + faceSize * 0.6);
                ctx.lineTo(x + width * 0.25, faceY + faceSize * 0.6);
                ctx.closePath();
                ctx.fill();
                
                ctx.beginPath();
                ctx.moveTo(x + width * 0.7, faceY + faceSize * 0.2);
                ctx.lineTo(x + width * 0.8, faceY + faceSize * 0.6);
                ctx.lineTo(x + width * 0.65, faceY + faceSize * 0.6);
                ctx.closePath();
                ctx.fill();
                
                // 口
                ctx.fillRect(x + width * 0.4, faceY + faceSize * 0.6, width * 0.25, faceSize * 0.2);
            }
        });
        
        // ランタンのレンダラー
        this.register(4, (ctx, x, y, width, height, brightness, distance) => {
            ctx.fillStyle = adjustBrightness('#ffcc00', brightness);
            ctx.fillRect(x, y, width, height);
            
            // ランタンの光
            if (distance < 6) {
                const glowHeight = height * 0.8;
                const glowY = y + (height - glowHeight) / 2;
                
                const gradient = ctx.createLinearGradient(x, glowY, x, glowY + glowHeight);
                gradient.addColorStop(0, `rgba(255, 204, 0, ${0.8 * brightness})`);
                gradient.addColorStop(0.5, `rgba(255, 204, 0, ${0.3 * brightness})`);
                gradient.addColorStop(1, `rgba(255, 204, 0, ${0.1 * brightness})`);
                
                ctx.fillStyle = gradient;
                ctx.fillRect(x, glowY, width, glowHeight);
            }
        });
        
        // 看板のレンダラー
        this.register(5, (ctx, x, y, width, height, brightness, distance) => {
            ctx.fillStyle = adjustBrightness('#8b4513', brightness);
            ctx.fillRect(x, y, width, height);
            
            // 看板の文字
            if (distance < 10) {
                ctx.fillStyle = adjustBrightness('#ff9c00', brightness);
                const textY = y + height * 0.5;
                const fontSize = Math.max(8, height / 8);
                ctx.font = `${fontSize}px Arial`;
                ctx.fillText("!", x + width * 0.4, textY);
            }
        });
        
        // 墓石のレンダラー
        this.register(6, (ctx, x, y, width, height, brightness, distance) => {
            ctx.fillStyle = adjustBrightness('#5a5a5a', brightness);
            ctx.fillRect(x, y, width, height);
            
            // 墓石の十字架
            if (distance < 8) {
                ctx.fillStyle = adjustBrightness('#000000', brightness);
                const crossY = y + height * 0.3;
                const crossHeight = height * 0.3;
                
                // 縦棒
                ctx.fillRect(x + width * 0.45, crossY, width * 0.1, crossHeight);
                
                // 横棒
                ctx.fillRect(x + width * 0.35, crossY + crossHeight * 0.2, width * 0.3, width * 0.1);
            }
        });
        
        // 魔女のレンダラー
        this.register(7, (ctx, x, y, width, height, brightness, distance) => {
            ctx.fillStyle = adjustBrightness('#4a148c', brightness);
            ctx.fillRect(x, y, width, height);
            
            // 魔女の詳細な描画
            if (distance < 10) {
                const witchHeight = height * 0.8;
                const witchY = y + (height - witchHeight) / 2;
                
                // 魔女の帽子
                ctx.fillStyle = adjustBrightness('#4a148c', brightness);
                const hatY = witchY;
                const hatHeight = witchHeight * 0.3;
                
                // 帽子の三角部分
                ctx.beginPath();
                ctx.moveTo(x + width * 0.5, hatY);
                ctx.lineTo(x + width * 0.2, hatY + hatHeight);
                ctx.lineTo(x + width * 0.8, hatY + hatHeight);
                ctx.closePath();
                ctx.fill();
                
                // 帽子のつば
                ctx.fillRect(x + width * 0.1, hatY + hatHeight * 0.8, width * 0.8, width * 0.1);
                
                // 帽子のリボン
                ctx.fillStyle = adjustBrightness('#ff9800', brightness);
                ctx.fillRect(x + width * 0.4, hatY + hatHeight * 0.7, width * 0.2, width * 0.05);
                
                // 魔女の顔
                ctx.fillStyle = adjustBrightness('#ffdbac', brightness);
                const faceY = hatY + hatHeight * 0.8;
                const faceHeight = witchHeight * 0.2;
                ctx.fillRect(x + width * 0.3, faceY, width * 0.4, faceHeight);
                
                // 魔女の髪
                ctx.fillStyle = adjustBrightness('#8b4513', brightness);
                ctx.fillRect(x + width * 0.2, faceY, width * 0.1, faceHeight);
                ctx.fillRect(x + width * 0.7, faceY, width * 0.1, faceHeight);
                
                // 魔女の体（紫色のローブ）
                ctx.fillStyle = adjustBrightness('#4a148c', brightness);
                const bodyY = faceY + faceHeight;
                const bodyHeight = witchHeight * 0.5;
                ctx.fillRect(x + width * 0.2, bodyY, width * 0.6, bodyHeight);
                
                // 星の模様
                ctx.fillStyle = adjustBrightness('#ffeb3b', brightness);
                ctx.font = `${width * 0.3}px Arial`;
                ctx.fillText('★', x + width * 0.35, bodyY + bodyHeight * 0.3);
                ctx.fillText('★', x + width * 0.55, bodyY + bodyHeight * 0.6);
                
                // 魔女の足
                ctx.fillStyle = adjustBrightness('#212121', brightness);
                const legY = bodyY + bodyHeight;
                ctx.fillRect(x + width * 0.35, legY, width * 0.15, witchHeight * 0.1);
                ctx.fillRect(x + width * 0.5, legY, width * 0.15, witchHeight * 0.1);
            }
        });
    }
};

// 色の明るさ調整
function adjustBrightness(color, brightness) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const adjustedR = Math.floor(r * brightness);
    const adjustedG = Math.floor(g * brightness);
    const adjustedB = Math.floor(b * brightness);

    return `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`;
}
