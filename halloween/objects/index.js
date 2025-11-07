// オブジェクトレンダラーのエクスポート

import { renderGhost } from './ghost.js';
import { renderPumpkin } from './pumpkin.js';
import { renderWitch } from './witch.js';
import { renderLantern } from './lantern.js';
import { renderBat } from './bat.js';
import { renderCat } from './cat.js';
import { renderSkeleton } from './skeleton.js';
import { renderWitchGirl } from './witch-girl.js';

export { renderGhost, renderPumpkin, renderWitch, renderLantern, renderBat, renderCat, renderSkeleton, renderWitchGirl };

// スプライト描画システム
// スプライトキャッシュ（マップは静的なので一度だけ収集）
let cachedSprites = null;

function collectStaticSprites(map) {
    const sprites = [];
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            const type = map[y][x];
            if (type >= 2 && type <= 11) {
                sprites.push({
                    type,
                    x: x + 0.5,
                    y: y + 0.5
                });
            }
        }
    }
    return sprites;
}

export function renderSprites(ctx, canvas, playerX, playerY, playerAngle, map, time, collectedPumpkins = new Set(), pumpkinPositions = [], witchGirlPosition = null, zBuffer = null, dynamicEnemies = null, collectedLanterns = new Set(), explodedBats = new Set()) {
    // 初回のみマップからスプライトを収集（かぼちゃ以外）
    if (!cachedSprites) {
        cachedSprites = collectStaticSprites(map);
    }

    const visibleSprites = [];

    // 動的な敵を使用する場合は、静的スプライトから敵タイプ(2,7,10)を除外
    const useStaticEnemies = !dynamicEnemies;
    const maxDistance = 15;
    const fov = Math.PI / 3;

    // キャッシュされたスプライト（かぼちゃ以外）から可視判定
    for (let i = 0; i < cachedSprites.length; i++) {
        const sprite = cachedSprites[i];

        // 動的敵を使用する場合、敵タイプ（2,7,10）はスキップ
        if (!useStaticEnemies && (sprite.type === 2 || sprite.type === 7 || sprite.type === 10)) {
            continue;
        }

        // ランタン（type 4）が収集済みならスキップ
        if (sprite.type === 4) {
            const key = `${Math.floor(sprite.x)},${Math.floor(sprite.y)}`;
            if (collectedLanterns.has(key)) {
                continue;
            }
        }

        // コウモリ（type 8）が爆発済みならスキップ
        if (sprite.type === 8) {
            const key = `${Math.floor(sprite.x)},${Math.floor(sprite.y)}`;
            if (explodedBats.has(key)) {
                continue;
            }
        }

        const dx = sprite.x - playerX;
        const dy = sprite.y - playerY;
        const distanceSquared = dx * dx + dy * dy;

        // 距離チェック（平方根を遅延計算）
        if (distanceSquared < maxDistance * maxDistance && distanceSquared > 0.25) {
            const angle = Math.atan2(dy, dx) - playerAngle;

            // FOVチェック（正規化）
            let normalizedAngle = angle;
            while (normalizedAngle > Math.PI) normalizedAngle -= Math.PI * 2;
            while (normalizedAngle < -Math.PI) normalizedAngle += Math.PI * 2;

            if (normalizedAngle > -fov && normalizedAngle < fov) {
                visibleSprites.push({
                    type: sprite.type,
                    x: sprite.x,
                    y: sprite.y,
                    distance: Math.sqrt(distanceSquared),
                    angle: normalizedAngle
                });
            }
        }
    }

    // 動的に配置されたかぼちゃを追加
    for (let i = 0; i < pumpkinPositions.length; i++) {
        const pumpkin = pumpkinPositions[i];
        const key = `${Math.floor(pumpkin.x)},${Math.floor(pumpkin.y)}`;

        // 収集済みの場合はスキップ
        if (collectedPumpkins.has(key)) {
            continue;
        }

        const dx = pumpkin.x - playerX;
        const dy = pumpkin.y - playerY;
        const distanceSquared = dx * dx + dy * dy;

        // 距離チェック（平方根を遅延計算）
        if (distanceSquared < maxDistance * maxDistance && distanceSquared > 0.25) {
            const angle = Math.atan2(dy, dx) - playerAngle;

            // FOVチェック（正規化）
            let normalizedAngle = angle;
            while (normalizedAngle > Math.PI) normalizedAngle -= Math.PI * 2;
            while (normalizedAngle < -Math.PI) normalizedAngle += Math.PI * 2;

            if (normalizedAngle > -fov && normalizedAngle < fov) {
                visibleSprites.push({
                    type: 3, // かぼちゃ
                    x: pumpkin.x,
                    y: pumpkin.y,
                    distance: Math.sqrt(distanceSquared),
                    angle: normalizedAngle
                });
            }
        }
    }

    // 魔女っこを追加
    if (witchGirlPosition) {
        const dx = witchGirlPosition.x - playerX;
        const dy = witchGirlPosition.y - playerY;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared < maxDistance * maxDistance && distanceSquared > 0.25) {
            const angle = Math.atan2(dy, dx) - playerAngle;

            let normalizedAngle = angle;
            while (normalizedAngle > Math.PI) normalizedAngle -= Math.PI * 2;
            while (normalizedAngle < -Math.PI) normalizedAngle += Math.PI * 2;

            if (normalizedAngle > -fov && normalizedAngle < fov) {
                visibleSprites.push({
                    type: 11, // 魔女っこ
                    x: witchGirlPosition.x,
                    y: witchGirlPosition.y,
                    distance: Math.sqrt(distanceSquared),
                    angle: normalizedAngle
                });
            }
        }
    }

    // 動的な敵を追加（逃走フェーズのみ）
    if (dynamicEnemies) {
        for (let i = 0; i < dynamicEnemies.length; i++) {
            const enemy = dynamicEnemies[i];
            const dx = enemy.x - playerX;
            const dy = enemy.y - playerY;
            const distanceSquared = dx * dx + dy * dy;

            if (distanceSquared < maxDistance * maxDistance && distanceSquared > 0.25) {
                const angle = Math.atan2(dy, dx) - playerAngle;

                let normalizedAngle = angle;
                while (normalizedAngle > Math.PI) normalizedAngle -= Math.PI * 2;
                while (normalizedAngle < -Math.PI) normalizedAngle += Math.PI * 2;

                if (normalizedAngle > -fov && normalizedAngle < fov) {
                    visibleSprites.push({
                        type: enemy.type,
                        x: enemy.x,
                        y: enemy.y,
                        distance: Math.sqrt(distanceSquared),
                        angle: normalizedAngle
                    });
                }
            }
        }
    }

    // 距離順にソート（遠い順）
    visibleSprites.sort((a, b) => b.distance - a.distance);

    // 各スプライトを描画
    for (let i = 0; i < visibleSprites.length; i++) {
        drawSprite(ctx, canvas, visibleSprites[i], playerAngle, time, zBuffer);
    }
}

function drawSprite(ctx, canvas, sprite, playerAngle, time, zBuffer) {
    const { type, angle, distance } = sprite;

    // 画面上のX座標（-1〜1を0〜canvas.widthに変換）
    const fov = Math.PI / 3;
    const screenX = (angle / fov + 0.5) * canvas.width;

    // 距離に応じたサイズ
    const spriteHeight = (canvas.height / distance) * 0.8;
    const spriteWidth = spriteHeight * 0.8;

    // 画面中央からの高さ
    const screenY = canvas.height / 2;

    // Z-バッファチェック（壁貫通を防ぐ）
    if (zBuffer) {
        // スプライトの描画範囲のX座標をチェック
        const spriteLeft = Math.max(0, Math.floor(screenX - spriteWidth / 2));
        const spriteRight = Math.min(canvas.width - 1, Math.floor(screenX + spriteWidth / 2));

        // スプライトの中央付近のいくつかのポイントでZ-バッファをチェック
        let visiblePoints = 0;
        const checkPoints = 5; // チェックするポイント数

        for (let i = 0; i < checkPoints; i++) {
            const checkX = Math.floor(spriteLeft + (spriteRight - spriteLeft) * (i / (checkPoints - 1)));
            if (checkX >= 0 && checkX < zBuffer.length) {
                // スプライトが壁より手前にあるか（少し余裕を持たせる）
                if (distance < zBuffer[checkX] + 0.1) {
                    visiblePoints++;
                }
            }
        }

        // 半分以上のポイントが見えていない場合は描画しない
        if (visiblePoints < checkPoints / 2) {
            return;
        }
    }

    // 敵の視認性向上: ほんのり赤いハロー
    const isEnemy = (type === 2 || type === 7 || type === 10);
    if (isEnemy) {
        const haloAlpha = Math.max(0.15, 1 - distance / 15) * 0.5;
        ctx.save();
        ctx.fillStyle = `rgba(255,0,0,${haloAlpha})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, spriteWidth * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // タイプに応じて描画
    switch (type) {
        case 2: // おばけ
            renderGhost(ctx, screenX, screenY, spriteWidth, spriteHeight, distance, time);
            break;
        case 3: // かぼちゃ
            renderPumpkin(ctx, screenX, screenY, spriteWidth, spriteHeight, distance, time);
            break;
        case 4: // ランタン
            renderLantern(ctx, screenX, screenY, spriteWidth, spriteHeight, distance, time);
            break;
        case 5: // 看板
            renderSign(ctx, screenX, screenY, spriteWidth, spriteHeight, distance);
            break;
        case 6: // 墓石
            renderGravestone(ctx, screenX, screenY, spriteWidth, spriteHeight, distance);
            break;
        case 7: // 魔女
            renderWitch(ctx, screenX, screenY, spriteWidth, spriteHeight, distance, time);
            break;
        case 8: // コウモリ
            renderBat(ctx, screenX, screenY, spriteWidth, spriteHeight, distance, time);
            break;
        case 9: // 黒猫
            renderCat(ctx, screenX, screenY, spriteWidth, spriteHeight, distance, time);
            break;
        case 10: // 骸骨
            renderSkeleton(ctx, screenX, screenY, spriteWidth, spriteHeight, distance, time);
            break;
        case 11: // 魔女っこ（案内役）
            renderWitchGirl(ctx, screenX, screenY, spriteWidth, spriteHeight, distance, time);
            break;
    }
}

// 簡易レンダラー（別ファイル化していないもの）
function renderSign(ctx, screenX, screenY, width, height, distance) {
    const brightness = Math.max(0.2, 1 - distance / 15);

    // 看板の枠
    ctx.fillStyle = adjustBrightness('#4a2511', brightness);
    ctx.fillRect(screenX - width * 0.45, screenY - height * 0.35, width * 0.9, height * 0.5);

    // 看板の板
    ctx.fillStyle = adjustBrightness('#8b4513', brightness);
    ctx.fillRect(screenX - width * 0.4, screenY - height * 0.3, width * 0.8, height * 0.4);

    // 支柱
    ctx.fillStyle = adjustBrightness('#6b4423', brightness);
    ctx.fillRect(screenX - width * 0.05, screenY - height * 0.05, width * 0.1, height * 0.5);

    // 文字「BOO!」
    ctx.fillStyle = adjustBrightness('#ff4500', brightness * 1.2);
    ctx.font = `bold ${height * 0.25}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BOO!', screenX, screenY - height * 0.1);

    // 文字の影
    ctx.fillStyle = adjustBrightness('#000000', brightness * 0.5);
    ctx.fillText('BOO!', screenX + 1, screenY - height * 0.1 + 1);
}

function renderGravestone(ctx, screenX, screenY, width, height, distance) {
    const brightness = Math.max(0.2, 1 - distance / 15);

    // 墓石本体
    ctx.fillStyle = adjustBrightness('#5a5a5a', brightness);
    ctx.fillRect(screenX - width * 0.3, screenY - height * 0.4, width * 0.6, height * 0.8);

    // 十字架
    ctx.fillStyle = adjustBrightness('#000000', brightness);
    ctx.fillRect(screenX - width * 0.05, screenY - height * 0.2, width * 0.1, height * 0.3);
    ctx.fillRect(screenX - width * 0.15, screenY - height * 0.1, width * 0.3, width * 0.1);
}

function adjustBrightness(color, brightness) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgb(${Math.floor(r * brightness)}, ${Math.floor(g * brightness)}, ${Math.floor(b * brightness)})`;
}
