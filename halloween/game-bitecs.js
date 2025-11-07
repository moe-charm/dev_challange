// bitECS版ハロウィン街探索ゲーム

// マップデータをインポート
import { map } from './map.js';

// bitECSコンポーネントとシステムをインポート
import { InputSystem } from './systems/input-bitecs.js';

// スプライトシステムをインポート
import { renderSprites } from './objects/index.js';

// bitECSの初期化を待つ
async function initBitECSGame() {
    // BitECSがロードされるまで待つ
    while (!window.BitECS) {
        console.log('⏳ Waiting for window.BitECS in game-bitecs.js...');
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log('✅ window.BitECS found in game-bitecs.js');
    const { world, Position, Rotation, Player, createPlayerEntity, playerQuery } = window.BitECS;

    // キャンバスを取得
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Canvasのサイズ設定
    const resizeCanvas = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // プレイヤーエンティティを作成
    const safePosition = findSafePosition();
    const playerEid = createPlayerEntity(safePosition.x, safePosition.y, 0);

    // 入力システムを作成
    const inputSystem = new InputSystem(world, playerQuery, Position, Rotation, Player);

    // ゲームフェーズ定義
    const PHASE = {
        INTRO: 'intro',           // 魔女っこを探す
        COLLECT: 'collect',       // かぼちゃ収集
        RETURN: 'return',         // 魔女っこに戻る
        BETRAYAL: 'betrayal',     // 裏切りイベント
        ESCAPE: 'escape',         // 敵から逃走
        GAMEOVER: 'gameover',     // ゲームオーバー
        VICTORY: 'victory'        // 勝利
    };

    // ゲーム状態
    const gameState = {
        phase: PHASE.INTRO,              // 現在のフェーズ
        collectedPumpkins: new Set(),    // 収集済みかぼちゃの座標セット
        totalPumpkins: 5,                // 総かぼちゃ数（5に変更）
        startTime: 0,                    // 開始時刻
        playerHP: 3,                     // プレイヤーHP
        maxHP: 3,                        // 最大HP
        lastDamageTime: 0,               // 最後にダメージを受けた時刻
        invincibleDuration: 1000,        // 無敵時間（ミリ秒）
        escapeStartTime: 0,              // 逃走開始時刻
        escapeDuration: 60000,           // 逃走時間（60秒に延長！）
        betrayalMessageUntil: 0,         // 裏切りメッセージ表示時刻
        introMessageUntil: 0,            // COLLECT直後のセリフ表示時刻
        escapeOverlayUntil: 0,           // ESCAPE冒頭のメッセージ表示終了時刻
        victoryStartTime: 0,             // 勝利演出開始時刻
        finalTimeSec: null,              // 勝利時の最終タイム（固定表示）
        returnOverlayUntil: 0,           // RETURNメッセージ表示終了時刻
        introOverlayUntil: 0,            // INTROの中央メッセージ表示終了時刻
        canTalk: false,                  // 魔女っこと話せるか
        showTalkPrompt: false,           // プロンプト表示フラグ
        catsBetrayed: false,             // 猫が裏切ったか（30秒切ったらtrue）
        collectedLanterns: new Set(),    // 収集済みランタン
        explodedBats: new Set(),         // 爆発済みコウモリ
        explosions: [],                  // アクティブな爆発エフェクト
        witchGirlAttacking: false,       // 魔女っこが攻撃してきているか
        magicAttacks: []                 // アクティブな魔法攻撃
    };

    // INTROの中央メッセージは数秒後に小さなヒントに切り替え
    gameState.introOverlayUntil = performance.now() + 3500; // 3.5秒

    // 空いているマス（道）を収集
    const emptySpaces = [];
    for (let y = 1; y < map.length - 1; y++) {
        for (let x = 1; x < map[y].length - 1; x++) {
            if (map[y][x] === 0) { // 道
                emptySpaces.push({ x, y });
            }
        }
    }

    // ランダムにかぼちゃを配置
    const pumpkinPositions = [];
    const placedPositions = new Set();

    for (let i = 0; i < gameState.totalPumpkins && emptySpaces.length > 0; i++) {
        // ランダムに選択
        const randomIndex = Math.floor(Math.random() * emptySpaces.length);
        const pos = emptySpaces[randomIndex];

        // 配置
        pumpkinPositions.push({ x: pos.x + 0.5, y: pos.y + 0.5 });
        placedPositions.add(`${pos.x},${pos.y}`);

        // 選択した場所を削除（重複回避）
        emptySpaces.splice(randomIndex, 1);
    }

    console.log(`🎃 ${pumpkinPositions.length}個のかぼちゃをランダム配置しました！`);

    // 敵キャラクターの位置を収集（マップから）
    const enemies = [];
    const cats = []; // 猫は最初は敵ではない
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            const type = map[y][x];
            // おばけ(2)、魔女(7)、骸骨(10)を敵として登録
            if (type === 2 || type === 7 || type === 10) {
                const baseSpeed = type === 2 ? 0.015 : (type === 7 ? 0.015 : 0.012);
                enemies.push({
                    type: type,
                    x: x + 0.5,
                    y: y + 0.5,
                    baseSpeed: baseSpeed,  // 初期速度を保存
                    speed: baseSpeed       // 現在の速度（段階的に上昇）
                });
            }
            // 猫(9)は別配列に保存（30秒切ったら敵になる）
            if (type === 9) {
                cats.push({
                    type: type,
                    x: x + 0.5,
                    y: y + 0.5,
                    baseSpeed: 0.018,  // 猫は少し速い！
                    speed: 0.018,
                    isCat: true        // 猫フラグ
                });
            }
        }
    }
    console.log(`👻 ${enemies.length}体の敵を配置しました！`);
    console.log(`🐱 ${cats.length}匹の猫を配置しました（30秒で裏切ります）！`);

    // ランタンの位置を収集（マップから）
    const lanterns = [];
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            if (map[y][x] === 4) { // ランタン
                lanterns.push({ x: x + 0.5, y: y + 0.5 });
            }
        }
    }
    console.log(`🏮 ${lanterns.length}個のランタンを配置しました！`);

    // コウモリの位置を収集（マップから）
    const bats = [];
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            if (map[y][x] === 8) { // コウモリ
                bats.push({ x: x + 0.5, y: y + 0.5 });
            }
        }
    }
    console.log(`🦇 ${bats.length}匹のコウモリを配置しました（近づくと爆発！）！`);

    // 魔女っこの位置をランダムに配置
    let witchGirlPosition = null;
    if (emptySpaces.length > 0) {
        const randomIndex = Math.floor(Math.random() * emptySpaces.length);
        const pos = emptySpaces[randomIndex];
        witchGirlPosition = { x: pos.x + 0.5, y: pos.y + 0.5 };
        console.log(`🧙‍♀️ 魔女っこを (${pos.x}, ${pos.y}) に配置しました！`);
    }

    // キー入力管理
    let isSKeyPressed = false;
    let isAKeyPressed = false;

    window.addEventListener('keydown', (e) => {
        // Sキー: 音のオン/オフ
        if (e.key === 's' || e.key === 'S') {
            if (!isSKeyPressed && window.soundManager) {
                isSKeyPressed = true;
                window.soundManager.resumeAudio();
                const enabled = window.soundManager.toggleSound();
                const soundToggle = document.getElementById('soundToggle');
                if (soundToggle) {
                    soundToggle.textContent = enabled ? '🔊 音オン' : '🔇 音オフ';
                }
                console.log(`🔊 音: ${enabled ? 'オン' : 'オフ'}`);
            }
        }

        // Aキー: 環境音の切り替え
        if (e.key === 'a' || e.key === 'A') {
            if (!isAKeyPressed && window.soundManager) {
                isAKeyPressed = true;
                window.soundManager.resumeAudio();
                window.soundManager.toggleAmbient();
                console.log('🌙 環境音を切り替えました');
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 's' || e.key === 'S') {
            isSKeyPressed = false;
        }
        if (e.key === 'a' || e.key === 'A') {
            isAKeyPressed = false;
        }
    });

    // フェーズ更新関数
    function updatePhase(currentTime, playerX, playerY, witchGirlPosition) {
        if (!witchGirlPosition) return;

        const dx = witchGirlPosition.x - playerX;
        const dy = witchGirlPosition.y - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        switch (gameState.phase) {
            case PHASE.INTRO:
                // 魔女っこに近づくと収集フェーズ開始
                if (distance < 1.5) {
                    gameState.phase = PHASE.COLLECT;
                    gameState.startTime = currentTime;
                    gameState.introMessageUntil = currentTime + 2000; // 2秒間台詞表示
                    if (window.soundManager) {
                        window.soundManager.play('door');
                    }
                    console.log('🎮 ゲーム開始！かぼちゃを10個集めよう！');
                }
                break;

            case PHASE.COLLECT:
                // かぼちゃ収集中（収集処理は別の場所で実施）
                break;

            case PHASE.RETURN:
                // 魔女っこに近づくと裏切りイベント
                if (distance < 1.5) {
                    gameState.phase = PHASE.BETRAYAL;
                    gameState.betrayalMessageUntil = currentTime + 3000; // 3秒間メッセージ表示
                    if (window.soundManager) {
                        window.soundManager.play('ghost'); // 不気味な音
                    }
                    console.log('😈 魔女っこ: ふふふ...実はあなたは生け贄なのよ！');
                }
                break;

            case PHASE.BETRAYAL:
                // 3秒後に逃走フェーズ開始
                if (currentTime >= gameState.betrayalMessageUntil) {
                    gameState.phase = PHASE.ESCAPE;
                    gameState.escapeStartTime = currentTime;
                    gameState.escapeOverlayUntil = currentTime + 3500; // 逃走メッセージは3.5秒
                    if (window.soundManager) {
                        window.soundManager.play('door'); // 緊迫感のある音
                    }
                    console.log('🏃 逃走開始！60秒間敵から逃げ切ろう！');
                }
                break;

            case PHASE.ESCAPE:
                // 敵を更新
                updateEnemies(playerX, playerY, currentTime);

                // 逃走時間チェック
                const escapeElapsed = currentTime - gameState.escapeStartTime;
                if (escapeElapsed >= gameState.escapeDuration) {
                    // 勝利
                    gameState.phase = PHASE.VICTORY;
                    gameState.victoryStartTime = currentTime;
                    gameState.finalTimeSec = ((currentTime - gameState.startTime) / 1000).toFixed(2);
                    if (window.soundManager) {
                        window.soundManager.play('victory'); // ファンファーレ音に変更！
                        window.soundManager.stopHeartbeat(); // 接近サウンドを停止
                        window.soundManager.stopWarning();
                    }
                    console.log('🎉 勝利！生け贄の儀式から逃げ切った！');
                }

                // HP0でゲームオーバー
                if (gameState.playerHP <= 0) {
                    gameState.phase = PHASE.GAMEOVER;
                    if (window.soundManager) {
                        window.soundManager.stopHeartbeat(); // 接近サウンドを停止
                        window.soundManager.stopWarning();
                    }
                    console.log('💀 ゲームオーバー...敵に捕まってしまった');
                }
                break;
        }
    }

    // 敵更新関数（逃走フェーズのみ）
    function updateEnemies(playerX, playerY, currentTime) {
        // 経過時間に応じて難易度を段階的に上昇
        const escapeElapsed = currentTime - gameState.escapeStartTime;
        const remainingTime = gameState.escapeDuration - escapeElapsed;
        let speedMultiplier = 1.0;

        if (escapeElapsed >= 45000) {
            // 45秒以降: 2倍速！
            speedMultiplier = 2.0;
        } else if (escapeElapsed >= 30000) {
            // 30秒以降: 1.5倍速
            speedMultiplier = 1.5;
        }
        // 0-30秒: 通常速度（1.0倍）

        // 残り時間30秒切ったら猫が裏切る！
        if (!gameState.catsBetrayed && remainingTime <= 30000) {
            gameState.catsBetrayed = true;
            // 猫を敵配列に追加
            cats.forEach(cat => {
                enemies.push(cat);
            });
            console.log(`🐱💔 猫が裏切った！残り${(remainingTime / 1000).toFixed(1)}秒`);
            if (window.soundManager) {
                window.soundManager.play('ghost'); // 裏切り音
            }
        }

        // 逃走開始10秒後に魔女っこが攻撃開始！
        if (!gameState.witchGirlAttacking && escapeElapsed >= 10000 && witchGirlPosition) {
            gameState.witchGirlAttacking = true;
            // 魔女っこを敵として追加（速い！）
            enemies.push({
                type: 11, // 魔女っこ
                x: witchGirlPosition.x,
                y: witchGirlPosition.y,
                baseSpeed: 0.025, // かなり速い！
                speed: 0.025,
                isWitchGirl: true,
                lastMagicTime: 0
            });
            console.log(`🧙‍♀️😈 魔女っこが攻撃開始！「ふふふ...逃がさないわよ！」`);
            if (window.soundManager) {
                window.soundManager.play('witchLaugh'); // 笑い声
            }
        }

        // 最も近い敵との距離を追跡
        let closestDistance = Infinity;
        let closestCatDistance = Infinity;

        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            // 速度を段階的に更新
            enemy.speed = enemy.baseSpeed * speedMultiplier;

            // プレイヤーへの方向ベクトル
            const dx = playerX - enemy.x;
            const dy = playerY - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // 最も近い敵との距離を更新
            if (dist < closestDistance) {
                closestDistance = dist;
            }

            // 猫との距離も追跡
            if (enemy.isCat && dist < closestCatDistance) {
                closestCatDistance = dist;
            }

            if (dist > 0.1) {
                // 正規化して移動
                const moveX = (dx / dist) * enemy.speed;
                const moveY = (dy / dist) * enemy.speed;

                // おばけ(2)は壁をすり抜ける（フェーズ中の圧を上げる）
                if (enemy.type === 2) {
                    // ゴーストは壁すり抜け。ただし加速はしない
                    enemy.x += moveX;
                    enemy.y += moveY;
                } else {
                    // 新しい位置
                    const newX = enemy.x + moveX;
                    const newY = enemy.y + moveY;

                    const isWalkable = (x, y) => {
                        const cx = Math.floor(x);
                        const cy = Math.floor(y);
                        return cx >= 0 && cx < map[0].length && cy >= 0 && cy < map.length && map[cy][cx] !== 1;
                    };

                    if (isWalkable(newX, newY)) {
                        enemy.x = newX;
                        enemy.y = newY;
                    } else {
                        // スライド移動（Xだけ / Yだけ）
                        if (isWalkable(enemy.x + moveX, enemy.y)) {
                            enemy.x += moveX;
                        } else if (isWalkable(enemy.x, enemy.y + moveY)) {
                            enemy.y += moveY;
                        } else {
                            // 壁に沿って回避（接線方向に小さく）
                            const tx = -dy / dist;
                            const ty = dx / dist;
                            const sign = Math.sin(currentTime * 0.005 + i) > 0 ? 1 : -1;
                            const sidestep = enemy.speed * 0.8 * sign;
                            const sx = enemy.x + tx * sidestep;
                            const sy = enemy.y + ty * sidestep;
                            if (isWalkable(sx, sy)) {
                                enemy.x = sx;
                                enemy.y = sy;
                            }
                        }
                    }
                }
            }

            // 魔女っこの魔法攻撃（距離3マス以内、3秒ごと）
            if (enemy.isWitchGirl && dist < 3.0) {
                if (currentTime - enemy.lastMagicTime > 3000) {
                    enemy.lastMagicTime = currentTime;
                    // 魔法弾を発射
                    const angle = Math.atan2(dy, dx);
                    gameState.magicAttacks.push({
                        x: enemy.x,
                        y: enemy.y,
                        vx: Math.cos(angle) * 0.05, // 魔法弾の速度
                        vy: Math.sin(angle) * 0.05,
                        createdAt: currentTime
                    });
                    if (window.soundManager) {
                        window.soundManager.play('magic'); // 魔法音
                    }
                    console.log(`🧙‍♀️✨ 魔女っこが魔法攻撃！`);
                }
            }

            // 衝突判定（プレイヤーとの距離）
            if (dist < 0.5) {
                // 無敵時間チェック
                if (currentTime - gameState.lastDamageTime > gameState.invincibleDuration) {
                    gameState.playerHP--;
                    gameState.lastDamageTime = currentTime;

                    if (window.soundManager) {
                        window.soundManager.play('ghost'); // ダメージ音
                    }
                    console.log(`💔 ダメージ！ HP: ${gameState.playerHP}/${gameState.maxHP}`);
                }
            }
        }

        // 魔法弾の更新
        updateMagicAttacks(playerX, playerY, currentTime);

        // 敵接近サウンドの更新（最も近い敵との距離で判定）
        if (window.soundManager) {
            window.soundManager.updateEnemyProximitySound(closestDistance);
            // 猫が近くにいたら「にゃーん」
            window.soundManager.updateCatProximitySound(closestCatDistance);
        }
    }

    // 魔法攻撃の更新
    function updateMagicAttacks(playerX, playerY, currentTime) {
        // 古い魔法弾を削除（5秒経過）
        gameState.magicAttacks = gameState.magicAttacks.filter(magic => {
            const age = currentTime - magic.createdAt;
            return age < 5000;
        });

        // 各魔法弾を更新
        for (let i = gameState.magicAttacks.length - 1; i >= 0; i--) {
            const magic = gameState.magicAttacks[i];

            // 位置を更新
            magic.x += magic.vx;
            magic.y += magic.vy;

            // プレイヤーとの衝突判定
            const dx = magic.x - playerX;
            const dy = magic.y - playerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 0.5) {
                // 魔法弾が当たった！
                gameState.magicAttacks.splice(i, 1);

                // ダメージ判定（無敵時間チェック）
                if (currentTime - gameState.lastDamageTime > gameState.invincibleDuration) {
                    gameState.playerHP--;
                    gameState.lastDamageTime = currentTime;

                    if (window.soundManager) {
                        window.soundManager.play('ghost'); // ダメージ音
                    }
                    console.log(`✨💔 魔法弾が命中！ダメージ！ HP: ${gameState.playerHP}/${gameState.maxHP}`);
                }
            }
        }
    }

    // 爆発エフェクトを生成
    function createExplosion(x, y, currentTime) {
        const particleCount = 20;
        const particles = [];
        const colors = ['#ff6d00', '#ff9c00', '#ffeb3b', '#ff0000', '#ff5555'];

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
            const speed = 0.5 + Math.random() * 1.5;
            const size = 3 + Math.random() * 5;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const lifetime = 300 + Math.random() * 200; // 300-500ms

            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                color: color,
                lifetime: lifetime,
                createdAt: currentTime
            });
        }

        gameState.explosions.push({
            particles: particles,
            createdAt: currentTime
        });
    }

    // 魔法弾エフェクトを描画（3D空間）
    function renderMagicAttacks(ctx, canvas, playerX, playerY, playerAngle) {
        gameState.magicAttacks.forEach(magic => {
            // プレイヤーからの相対位置
            const dx = magic.x - playerX;
            const dy = magic.y - playerY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // 視野内チェック
            if (distance < 0.1 || distance > 15) return;

            const angle = Math.atan2(dy, dx) - playerAngle;
            let normalizedAngle = angle;
            while (normalizedAngle > Math.PI) normalizedAngle -= Math.PI * 2;
            while (normalizedAngle < -Math.PI) normalizedAngle += Math.PI * 2;

            const fov = Math.PI / 3;
            if (normalizedAngle < -fov || normalizedAngle > fov) return;

            // 画面上の位置を計算
            const screenX = (normalizedAngle / fov) * (canvas.width / 2) + canvas.width / 2;
            const screenY = canvas.height / 2;

            // 距離に応じたサイズ
            const screenSize = (20 * canvas.height) / distance;

            // 紫色の輝く魔法弾
            ctx.save();

            // 外側の輝き
            const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, screenSize * 1.5);
            gradient.addColorStop(0, 'rgba(138, 43, 226, 0.8)'); // 紫
            gradient.addColorStop(0.5, 'rgba(186, 85, 211, 0.5)'); // 明るい紫
            gradient.addColorStop(1, 'rgba(138, 43, 226, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(screenX, screenY, screenSize * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // 内側のコア
            ctx.fillStyle = '#ff69b4'; // ピンク
            ctx.beginPath();
            ctx.arc(screenX, screenY, screenSize * 0.6, 0, Math.PI * 2);
            ctx.fill();

            // キラキラエフェクト
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(screenX - screenSize * 0.2, screenY - screenSize * 0.2, screenSize * 0.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }

    // 爆発エフェクトを更新・描画（3D空間）
    function updateAndRenderExplosions(ctx, canvas, playerX, playerY, playerAngle, currentTime) {
        // 古い爆発を削除
        gameState.explosions = gameState.explosions.filter(explosion => {
            const age = currentTime - explosion.createdAt;
            return age < 600; // 600ms以上経過したら削除
        });

        // 各爆発を描画
        gameState.explosions.forEach(explosion => {
            explosion.particles.forEach(particle => {
                const age = currentTime - particle.createdAt;
                if (age > particle.lifetime) return;

                // パーティクルの位置を更新（2D空間での移動）
                const progress = age / particle.lifetime;
                const px = particle.x + particle.vx * progress;
                const py = particle.y + particle.vy * progress;

                // プレイヤーからの相対位置
                const dx = px - playerX;
                const dy = py - playerY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // 視野内チェック
                if (distance < 0.1 || distance > 10) return;

                const angle = Math.atan2(dy, dx) - playerAngle;
                let normalizedAngle = angle;
                while (normalizedAngle > Math.PI) normalizedAngle -= Math.PI * 2;
                while (normalizedAngle < -Math.PI) normalizedAngle += Math.PI * 2;

                const fov = Math.PI / 3;
                if (normalizedAngle < -fov || normalizedAngle > fov) return;

                // 画面上の位置を計算
                const screenX = (normalizedAngle / fov) * (canvas.width / 2) + canvas.width / 2;
                const screenY = canvas.height / 2;

                // 距離に応じたサイズ
                const screenSize = (particle.size * canvas.height) / distance;

                // フェードアウト
                const alpha = 1 - progress;

                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(screenX, screenY, screenSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        });
    }

    // ゲームループ
    let lastTime = performance.now();
    let lastRenderTime = 0;
    const targetFPS = 50; // 軽量化: レンダリングを50fpsに制限
    const frameInterval = 1000 / targetFPS;
    let lastPlayerX = safePosition.x;
    let lastPlayerY = safePosition.y;

    function gameLoop(currentTime) {
        const deltaTime = (currentTime - lastTime) / 1000; // 秒単位
        lastTime = currentTime;

        // 入力システム更新
        inputSystem.update(deltaTime);

        // プレイヤー位置取得
        const players = playerQuery(world);
        if (players.length > 0) {
            const eid = players[0];
            const playerX = Position.x[eid];
            const playerY = Position.y[eid];

            // 移動検知と足音再生
            const moved = Math.abs(playerX - lastPlayerX) > 0.01 || Math.abs(playerY - lastPlayerY) > 0.01;
            if (moved && window.soundManager && gameState.phase !== PHASE.GAMEOVER) {
                window.soundManager.playFootstep(true);
            }
            lastPlayerX = playerX;
            lastPlayerY = playerY;

            // フェーズ別処理
            updatePhase(currentTime, playerX, playerY, witchGirlPosition);

            // かぼちゃ収集判定（収集フェーズのみ）
            if (gameState.phase === PHASE.COLLECT) {
                for (let i = 0; i < pumpkinPositions.length; i++) {
                    const pumpkin = pumpkinPositions[i];
                    const key = `${Math.floor(pumpkin.x)},${Math.floor(pumpkin.y)}`;

                    // 未収集のかぼちゃのみチェック
                    if (!gameState.collectedPumpkins.has(key)) {
                        const dx = pumpkin.x - playerX;
                        const dy = pumpkin.y - playerY;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        // 距離が0.5以下なら収集
                        if (distance < 0.5) {
                            gameState.collectedPumpkins.add(key);

                            // 収集音を鳴らす
                            if (window.soundManager) {
                                window.soundManager.play('pumpkin');
                            }
                            console.log(`🎃 かぼちゃを収集！ (${gameState.collectedPumpkins.size}/${gameState.totalPumpkins})`);

                            // 全部集めたらRETURNフェーズへ
                            if (gameState.collectedPumpkins.size >= gameState.totalPumpkins) {
                                gameState.phase = PHASE.RETURN;
                                gameState.returnOverlayUntil = currentTime + 3500; // 3.5秒だけ案内を表示
                                if (window.soundManager) {
                                    window.soundManager.play('jump');
                                }
                                console.log(`🎉 全てのかぼちゃを収集！魔女っこのところへ戻ろう！`);
                            }
                        }
                    }
                }
            }

            // ランタン回復判定（逃走フェーズのみ、HP減っている時のみ）
            if (gameState.phase === PHASE.ESCAPE && gameState.playerHP < gameState.maxHP) {
                for (let i = 0; i < lanterns.length; i++) {
                    const lantern = lanterns[i];
                    const key = `${Math.floor(lantern.x)},${Math.floor(lantern.y)}`;

                    // 未収集のランタンのみチェック
                    if (!gameState.collectedLanterns.has(key)) {
                        const dx = lantern.x - playerX;
                        const dy = lantern.y - playerY;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        // 距離が0.5以下なら回復
                        if (distance < 0.5) {
                            gameState.collectedLanterns.add(key);
                            gameState.playerHP = Math.min(gameState.maxHP, gameState.playerHP + 1);

                            // 回復音を鳴らす
                            if (window.soundManager) {
                                window.soundManager.play('heal');
                            }
                            console.log(`🏮 ランタン取得！HP回復！ (${gameState.playerHP}/${gameState.maxHP})`);
                        }
                    }
                }
            }

            // コウモリ爆発判定（逃走フェーズのみ）
            if (gameState.phase === PHASE.ESCAPE) {
                for (let i = 0; i < bats.length; i++) {
                    const bat = bats[i];
                    const key = `${Math.floor(bat.x)},${Math.floor(bat.y)}`;

                    // 未爆発のコウモリのみチェック
                    if (!gameState.explodedBats.has(key)) {
                        const dx = bat.x - playerX;
                        const dy = bat.y - playerY;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        // 距離が1.0以下なら爆発！
                        if (distance < 1.0) {
                            gameState.explodedBats.add(key);

                            // 爆発エフェクトを追加
                            createExplosion(bat.x, bat.y, currentTime);

                            // ダメージ判定（無敵時間チェック）
                            if (currentTime - gameState.lastDamageTime > gameState.invincibleDuration) {
                                gameState.playerHP--;
                                gameState.lastDamageTime = currentTime;

                                // 爆発音を鳴らす
                                if (window.soundManager) {
                                    window.soundManager.play('explosion');
                                }
                                console.log(`🦇💥 コウモリが爆発！ダメージ！ HP: ${gameState.playerHP}/${gameState.maxHP}`);
                            } else {
                                // 無敵時間中でもコウモリは消える
                                if (window.soundManager) {
                                    window.soundManager.play('explosion');
                                }
                                console.log(`🦇💥 コウモリが爆発！（無敵時間中）`);
                            }
                        }
                    }
                }
            }

            // UIは全フェーズで更新（表示抜け対策）
            updateGameUI(currentTime);
        }

        // レンダリング（スロットル）
        if (currentTime - lastRenderTime >= frameInterval) {
            lastRenderTime = currentTime;
            render(ctx, canvas, world, playerQuery, Position, Rotation);
        }

        requestAnimationFrame(gameLoop);
    }

    // ゲームUI更新
    function updateGameUI(currentTime) {
        const collectedElement = document.getElementById('collected-count');
        const timerElement = document.getElementById('timer');
        const messageElement = document.getElementById('game-message');
        const talkPromptElement = document.getElementById('talk-prompt');
        // 軽量ヒント要素（なければ作成）
        let hintElement = document.getElementById('game-hint');
        if (!hintElement) {
            const overlay = document.querySelector('.game-overlay');
            if (overlay) {
                hintElement = document.createElement('div');
                hintElement.id = 'game-hint';
                hintElement.className = 'game-hint';
                hintElement.style.display = 'none';
                overlay.appendChild(hintElement);
            }
        }

        // HP表示（逃走フェーズのみ）
        if (collectedElement) {
            if (gameState.phase === PHASE.ESCAPE || gameState.phase === PHASE.GAMEOVER) {
                // HP表示
                const hearts = '❤️'.repeat(gameState.playerHP) + '🖤'.repeat(gameState.maxHP - gameState.playerHP);
                collectedElement.textContent = hearts;
            } else {
                // かぼちゃ収集数表示
                collectedElement.textContent = `${gameState.collectedPumpkins.size} / ${gameState.totalPumpkins}`;
            }
        }

        // タイマー表示
        if (timerElement) {
            if (gameState.phase === PHASE.ESCAPE) {
                // 逃走フェーズ: 残り時間
                const escapeElapsed = currentTime - gameState.escapeStartTime;
                const remaining = Math.max(0, (gameState.escapeDuration - escapeElapsed) / 1000).toFixed(1);
                timerElement.textContent = `残り ${remaining}秒`;
            } else if (gameState.phase === PHASE.COLLECT || gameState.phase === PHASE.RETURN) {
                // 収集フェーズ: 経過時間
                const elapsed = ((currentTime - gameState.startTime) / 1000).toFixed(1);
                timerElement.textContent = `${elapsed}秒`;
            } else if (gameState.phase === PHASE.VICTORY && gameState.finalTimeSec != null) {
                // 勝利時は最終タイムを固定表示
                timerElement.textContent = `タイム ${gameState.finalTimeSec}秒`;
            } else {
                timerElement.textContent = '-';
            }
        }

        // メッセージ表示（フェーズごと）
        if (messageElement) {
            switch (gameState.phase) {
                case PHASE.INTRO:
                    // INTROでは最初の数秒だけ中央に、その後は左上の小ヒントへ
                    if (currentTime < gameState.introOverlayUntil) {
                        messageElement.textContent = '🧙‍♀️ 魔女っこを探して近づこう！';
                        messageElement.style.display = 'block';
                        messageElement.style.fontSize = '20px';
                        messageElement.style.backgroundColor = 'rgba(138, 43, 226, 0.9)';
                        if (hintElement) hintElement.style.display = 'none';
                    } else {
                        messageElement.style.display = 'none';
                        if (hintElement) {
                            hintElement.textContent = '🧙‍♀️ 魔女っこを探して近づこう！';
                            hintElement.style.display = 'block';
                        }
                    }
                    break;

                case PHASE.COLLECT:
                    // 最初の2秒間は魔女っこの台詞を表示
                    if (currentTime < gameState.introMessageUntil) {
                        messageElement.textContent = '🧙‍♀️ 魔女っこ: かぼちゃを全部集めてきてね！';
                        messageElement.style.display = 'block';
                        messageElement.style.fontSize = '22px';
                        messageElement.style.backgroundColor = 'rgba(138, 43, 226, 0.9)';
                    } else {
                        messageElement.style.display = 'none';
                    }
                    // COLLECT以降は小ヒントを非表示
                    if (hintElement) hintElement.style.display = 'none';
                    break;

                case PHASE.RETURN:
                    // RETURNメッセージは一定時間だけ中央に表示
                    if (currentTime < gameState.returnOverlayUntil) {
                        messageElement.textContent = '🎃 全部集めた！魔女っこのところへ戻ろう！';
                        messageElement.style.display = 'block';
                        messageElement.style.fontSize = '22px';
                        messageElement.style.backgroundColor = 'rgba(255, 140, 0, 0.9)';
                    } else {
                        messageElement.style.display = 'none';
                    }
                    if (hintElement) hintElement.style.display = 'none';
                    break;

                case PHASE.BETRAYAL:
                    messageElement.innerHTML = '😈 魔女っこ: ふふふ...実はあなたは生け贄なのよ！<br>さあ、みんな、彼を捕まえて！';
                    messageElement.style.display = 'block';
                    messageElement.style.fontSize = '22px';
                    messageElement.style.backgroundColor = 'rgba(139, 0, 0, 0.95)';
                    if (hintElement) hintElement.style.display = 'none';
                    break;

                case PHASE.ESCAPE:
                    // 逃走フェーズの導入メッセージを3.5秒だけ表示
                    if (currentTime < gameState.escapeOverlayUntil) {
                        messageElement.textContent = '🏃 逃げろ！敵から60秒逃げ切れ！';
                        messageElement.style.display = 'block';
                        messageElement.style.fontSize = '20px';
                        messageElement.style.backgroundColor = 'rgba(255, 0, 0, 0.85)';
                    } else {
                        messageElement.style.display = 'none';
                    }
                    if (hintElement) hintElement.style.display = 'none';
                    break;

                case PHASE.GAMEOVER:
                    messageElement.innerHTML = '💀 ゲームオーバー<br>敵に捕まってしまった...<br><small>F5でリトライ</small>';
                    messageElement.style.display = 'block';
                    messageElement.style.fontSize = '28px';
                    messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
                    break;

                case PHASE.VICTORY:
                    const finalTime = gameState.finalTimeSec != null
                        ? gameState.finalTimeSec
                        : ((currentTime - gameState.startTime) / 1000).toFixed(2);
                    messageElement.innerHTML = `🎉 勝利！<br>生け贄の儀式から逃げ切った！<br>タイム: ${finalTime}秒`;
                    messageElement.style.display = 'block';
                    messageElement.style.fontSize = '32px';
                    // 虹色グラデーションで派手に！
                    messageElement.style.background = 'linear-gradient(90deg, #ff0080, #ff8c00, #ffeb3b, #69f0ae, #64b5f6, #9c27b0)';
                    messageElement.style.backgroundSize = '200% 100%';
                    messageElement.style.animation = 'rainbow 2s linear infinite';
                    messageElement.style.color = '#ffffff';
                    messageElement.style.textShadow = '0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(255,255,255,0.5)';
                    messageElement.style.border = '4px solid #ffeb3b';
                    messageElement.style.boxShadow = '0 0 40px rgba(255, 235, 59, 0.8)';
                    if (hintElement) hintElement.style.display = 'none';
                    break;
            }
        }

        // プロンプト表示（使わないので非表示）
        if (talkPromptElement) {
            talkPromptElement.style.display = 'none';
        }
    }

    // レンダリング関数
    function render(ctx, canvas, world, playerQuery, Position, Rotation) {
        // 天空と地面
        renderSkyAndGround(ctx, canvas);

        // プレイヤー取得
        const players = playerQuery(world);
        if (players.length === 0) return;

        const eid = players[0];
        const playerX = Position.x[eid];
        const playerY = Position.y[eid];
        const playerAngle = Rotation.angle[eid];

        // 3Dレイキャスト（壁のみ）- Z-バッファを取得
        const zBuffer = render3D(ctx, canvas, playerX, playerY, playerAngle);

        // スプライト描画（オブジェクトを壁の上に描画、収集済みかぼちゃを除外、Z-バッファでクリッピング）
        // 逃走フェーズでは敵も動的に描画
        const dynamicEnemies = gameState.phase === PHASE.ESCAPE ? enemies : null;
        renderSprites(ctx, canvas, playerX, playerY, playerAngle, map, performance.now(), gameState.collectedPumpkins, pumpkinPositions, witchGirlPosition, zBuffer, dynamicEnemies, gameState.collectedLanterns, gameState.explodedBats);

        // 爆発エフェクトを描画
        updateAndRenderExplosions(ctx, canvas, playerX, playerY, playerAngle, performance.now());

        // 魔法弾エフェクトを描画
        renderMagicAttacks(ctx, canvas, playerX, playerY, playerAngle);

        // ミニマップ（逃走フェーズでは敵も表示）
        renderMinimap(playerX, playerY, playerAngle, pumpkinPositions, gameState.collectedPumpkins, witchGirlPosition, dynamicEnemies, gameState.phase);

        // 勝利演出（周囲が消えていく + パーティクル）
        if (gameState.phase === PHASE.VICTORY) {
            const now = performance.now();
            const progress = Math.min(1, (now - gameState.victoryStartTime) / 2500);
            renderVictoryVFX(ctx, canvas, progress);
            drawVictoryParticles(ctx, canvas, progress);
        }
    }

    // 勝利時の演出：中央を残して周囲が黒くフェードアウト
    function renderVictoryVFX(ctx, canvas, progress) {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const maxRadius = Math.sqrt(cx * cx + cy * cy);
        const holeRadius = Math.max(0, maxRadius * (1 - progress));

        ctx.save();
        // フルスクリーンを暗転
        ctx.fillStyle = `rgba(0,0,0,${Math.min(1, 0.9 * progress)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 中央に穴をあける
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(cx, cy, holeRadius, 0, Math.PI * 2);
        ctx.fill();

        // 通常描画に戻す
        ctx.globalCompositeOperation = 'source-over';

        // エッジのハロー（外方向へ広がる）
        const halo = ctx.createRadialGradient(cx, cy, holeRadius, cx, cy, holeRadius + 100);
        halo.addColorStop(0, 'rgba(0,0,0,0)');
        halo.addColorStop(1, `rgba(0,0,0,${Math.min(1, 0.9 * progress)})`);
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(cx, cy, holeRadius + 100, 0, Math.PI * 2);
        ctx.fill();

        // 最初のフラッシュ（0.2秒程度）
        if (progress < 0.08) {
            const flash = 1 - (progress / 0.08);
            ctx.fillStyle = `rgba(255,255,255,${0.6 * flash})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.restore();
    }

    // 勝利パーティクル（花火/紙吹雪風）- 派手に増量！
    let victoryParticles = null;
    let fireworks = null; // 花火エフェクト
    function ensureVictoryParticles(canvas) {
        if (victoryParticles) return;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const count = 200; // 120→200に増加！
        const colors = ['#ffeb3b', '#ff9800', '#ff69b4', '#69f0ae', '#64b5f6', '#ff0080', '#00ff80', '#ffff00'];
        victoryParticles = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 120 + Math.random() * 300; // スピード範囲拡大
            const size = 2 + Math.random() * 5; // サイズも大きく
            const color = colors[Math.floor(Math.random() * colors.length)];
            victoryParticles.push({ angle, speed, size, color });
        }

        // 花火エフェクト（複数の位置から爆発）
        fireworks = [];
        const fireworkCount = 6; // 6箇所で花火
        for (let i = 0; i < fireworkCount; i++) {
            const fx = canvas.width * (0.2 + Math.random() * 0.6);
            const fy = canvas.height * (0.2 + Math.random() * 0.5);
            const delay = Math.random() * 0.6; // 爆発タイミングをずらす
            const particleCount = 60;
            const fireworkColor = colors[Math.floor(Math.random() * colors.length)];

            const particles = [];
            for (let j = 0; j < particleCount; j++) {
                const angle = (j / particleCount) * Math.PI * 2;
                const speed = 80 + Math.random() * 120;
                const size = 2 + Math.random() * 4;
                particles.push({ angle, speed, size });
            }

            fireworks.push({
                x: fx,
                y: fy,
                delay: delay,
                color: fireworkColor,
                particles: particles
            });
        }
    }

    function drawVictoryParticles(ctx, canvas, progress) {
        ensureVictoryParticles(canvas);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // 中央の穴半径に合わせてクリップ
        const maxRadius = Math.sqrt(cx * cx + cy * cy);
        const holeRadius = Math.max(0, maxRadius * (1 - progress));
        const ease = (t) => 1 - Math.pow(1 - t, 2); // easeOutQuad

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, holeRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < victoryParticles.length; i++) {
            const p = victoryParticles[i];
            const r = ease(progress) * p.speed;
            const x = cx + Math.cos(p.angle) * r;
            const y = cy + Math.sin(p.angle) * r;
            const alpha = Math.max(0, 1 - progress);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.restore();

        // 花火エフェクトを描画
        drawFireworks(ctx, canvas, progress);
    }

    // 花火エフェクトの描画
    function drawFireworks(ctx, canvas, progress) {
        if (!fireworks) return;

        const ease = (t) => 1 - Math.pow(1 - t, 2); // easeOutQuad

        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        fireworks.forEach(firework => {
            // 遅延を考慮した進行度
            const localProgress = Math.max(0, Math.min(1, (progress - firework.delay) / (1 - firework.delay)));
            if (localProgress <= 0) return;

            const fadeIn = Math.min(1, localProgress * 5); // 素早くフェードイン
            const fadeOut = Math.max(0, 1 - (localProgress - 0.7) / 0.3); // 後半でフェードアウト
            const alpha = Math.min(fadeIn, fadeOut);

            firework.particles.forEach(p => {
                const r = ease(localProgress) * p.speed;
                const x = firework.x + Math.cos(p.angle) * r;
                const y = firework.y + Math.sin(p.angle) * r + localProgress * 80; // 重力で下に落ちる

                ctx.fillStyle = firework.color;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(x, y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
        });

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
    }

    // 星の位置を生成（初回のみ）
    let stars = null;
    // グラデーションキャッシュ
    let cachedSkyGradient = null;
    let cachedGroundGradient = null;
    let cachedGradSize = { w: 0, h: 0 };
    function generateStars(count, width, height) {
        const starArray = [];
        for (let i = 0; i < count; i++) {
            starArray.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 1.5 + 0.5,
                twinkleSpeed: Math.random() * 0.002 + 0.001,
                twinkleOffset: Math.random() * Math.PI * 2
            });
        }
        return starArray;
    }

    function renderSkyAndGround(ctx, canvas) {
        // サイズ変更時のみグラデーションを再生成
        if (cachedGradSize.w !== canvas.width || cachedGradSize.h !== canvas.height) {
            cachedGradSize = { w: canvas.width, h: canvas.height };
            const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height / 2);
            skyGradient.addColorStop(0, '#0a0e27');
            skyGradient.addColorStop(1, '#1a1f3a');
            cachedSkyGradient = skyGradient;

            const groundGradient = ctx.createLinearGradient(0, canvas.height / 2, 0, canvas.height);
            groundGradient.addColorStop(0, '#3d2817');
            groundGradient.addColorStop(1, '#1a0f05');
            cachedGroundGradient = groundGradient;
        }
        // 天空
        ctx.fillStyle = cachedSkyGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height / 2);

        // 月
        const moonX = canvas.width * 0.85;
        const moonY = canvas.height * 0.15;
        const moonRadius = canvas.height * 0.08;

        // 月の光（グロー効果）
        const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, moonRadius * 2);
        moonGlow.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
        moonGlow.addColorStop(0.5, 'rgba(255, 255, 200, 0.1)');
        moonGlow.addColorStop(1, 'rgba(255, 255, 200, 0)');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        // 月本体
        ctx.fillStyle = '#fffacd';
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
        ctx.fill();

        // 月のクレーター
        ctx.fillStyle = 'rgba(200, 200, 180, 0.3)';
        ctx.beginPath();
        ctx.arc(moonX - moonRadius * 0.3, moonY - moonRadius * 0.2, moonRadius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(moonX + moonRadius * 0.2, moonY + moonRadius * 0.3, moonRadius * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(moonX + moonRadius * 0.1, moonY - moonRadius * 0.4, moonRadius * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // 星（初回のみ生成）
        if (!stars || stars.width !== canvas.width || stars.height !== canvas.height) {
            stars = {
                list: generateStars(40, canvas.width, canvas.height / 2), // さらに削減: 60→40
                width: canvas.width,
                height: canvas.height
            };
        }

        // 星の描画（瞬き）
        const time = performance.now();
        for (let i = 0; i < stars.list.length; i++) {
            const star = stars.list[i];
            const twinkle = (Math.sin(time * star.twinkleSpeed + star.twinkleOffset) + 1) * 0.5;
            const opacity = 0.3 + twinkle * 0.7;

            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();

            // 大きい星にはキラキラ効果
            if (star.size > 1.2 && twinkle > 0.7) {
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.5})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(star.x - star.size * 2, star.y);
                ctx.lineTo(star.x + star.size * 2, star.y);
                ctx.moveTo(star.x, star.y - star.size * 2);
                ctx.lineTo(star.x, star.y + star.size * 2);
                ctx.stroke();
            }
        }

        // 地面
        ctx.fillStyle = cachedGroundGradient;
        ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
    }

    // Z-バッファの共有（GC削減）
    let sharedZBuffer = null;
    let sharedZWidth = 0;
    function render3D(ctx, canvas, playerX, playerY, playerAngle) {
        // レイの数を固定（パフォーマンス最適化）
        const rayCount = Math.min(240, Math.floor(canvas.width / 2)); // 控えめに
        const fov = Math.PI / 3; // 60度
        const maxDepth = 20;

        // Z-バッファ（深度バッファ）を再利用
        if (!sharedZBuffer || sharedZWidth !== canvas.width) {
            sharedZBuffer = new Float32Array(canvas.width);
            sharedZWidth = canvas.width;
        }
        const zBuffer = sharedZBuffer;
        zBuffer.fill(maxDepth);

        for (let ray = 0; ray < rayCount; ray++) {
            const rayAngle = playerAngle - fov / 2 + (ray / rayCount) * fov;
            const cosA = Math.cos(rayAngle);
            const sinA = Math.sin(rayAngle);

            let distance = 0;
            let hitWall = false;
            let wallType = 0;
            let hitCellX = 0;
            let hitCellY = 0;

            // プレイヤーの現在のセル
            const playerCellX = Math.floor(playerX);
            const playerCellY = Math.floor(playerY);

            // ステップを少し大きくし、三角関数の再計算を避ける
            const step = 0.15;
            let testX = playerX;
            let testY = playerY;
            while (!hitWall && distance < maxDepth) {
                distance += step;
                testX += cosA * step;
                testY += sinA * step;

                // マップの範囲外チェック
                if (testX < 0 || testX >= map[0].length ||
                    testY < 0 || testY >= map.length) {
                    hitWall = true;
                    distance = maxDepth;
                } else {
                    const cellX = Math.floor(testX);
                    const cellY = Math.floor(testY);
                    const cellValue = map[cellY][cellX];

                    // プレイヤーの足元のセルはスキップ（ただし建物は除く）
                    if (cellX === playerCellX && cellY === playerCellY) {
                        // 足元が建物なら描画（壁の中にいる状態）
                        if (cellValue === 1) {
                            hitWall = true;
                            wallType = cellValue;
                            hitCellX = cellX;
                            hitCellY = cellY;
                        }
                        // それ以外は無視して次へ
                        continue;
                    }

                    // 壁のチェック（建物のみ）
                    // オブジェクト（2-11）は壁として描画せず、スプライトで描画
                    if (cellValue === 1) {
                        hitWall = true;
                        wallType = cellValue;
                        hitCellX = cellX;
                        hitCellY = cellY;
                    }
                }
            }

            // 魚眼レンズ補正
            const correctedDistance = distance * Math.cos(rayAngle - playerAngle);

            // 壁の高さを計算
            const wallHeight = (canvas.height / correctedDistance) * 0.5;
            const wallTop = canvas.height / 2 - wallHeight / 2;
            const wallBottom = canvas.height / 2 + wallHeight / 2;

            // 明るさ（距離による減衰）
            const brightness = Math.max(0.1, 1 - correctedDistance / maxDepth);

            // レイの幅を計算（画面幅 / レイ数）
            const rayWidth = Math.ceil(canvas.width / rayCount);
            const rayX = Math.floor(ray * canvas.width / rayCount);

            // Z-バッファに距離を記録（このレイが描画する範囲のピクセル全て）
            for (let x = rayX; x < Math.min(rayX + rayWidth, canvas.width); x++) {
                zBuffer[x] = correctedDistance;
            }

            // オブジェクトタイプに応じた詳細描画
            renderObject(ctx, rayX, wallTop, rayWidth, wallBottom - wallTop, wallType, brightness, correctedDistance, hitCellX, hitCellY);
        }

        return zBuffer; // Z-バッファを返す
    }

    // エリアに応じた壁の色を取得
    function getWallColorByArea(cellX, cellY) {
        // 左上（幽霊屋敷エリア）: 暗い青紫
        if (cellY >= 1 && cellY <= 8 && cellX >= 1 && cellX <= 8) {
            return '#2a1a4a';
        }
        // 右上（魔女の森エリア）: 深い緑
        if (cellY >= 1 && cellY <= 8 && cellX >= 17 && cellX <= 23) {
            return '#1a3a1a';
        }
        // 左下（墓地エリア）: 灰色
        if (cellY >= 16 && cellY <= 23 && cellX >= 1 && cellX <= 8) {
            return '#4a4a4a';
        }
        // 下部（かぼちゃ畑エリア）: 暗いオレンジ
        if (cellY >= 18 && cellY <= 23 && cellX >= 8 && cellX <= 23) {
            return '#5a3010';
        }
        // 中央（街エリア）: 茶色（デフォルト）
        return '#3a1f0f';
    }

    // 壁の描画（建物のみ）
    function renderObject(ctx, x, y, width, height, type, brightness, distance, cellX, cellY) {
        if (type === 1) {
            // エリアに応じた壁の色
            const wallColor = getWallColorByArea(cellX, cellY);
            ctx.fillStyle = adjustBrightness(wallColor, brightness);
            ctx.fillRect(x, y, width, height);

            // 窓（位置ベースで固定、点滅しない）
            // セル座標のハッシュで窓の有無を決定
            const hasWindow = ((cellX * 7 + cellY * 13) % 5) === 0;

            if (hasWindow && distance < 10 && height > 40) {
                const windowSize = Math.min(height * 0.15, 10);
                const windowMargin = 2;

                // 窓の明かり（黄色）
                ctx.fillStyle = adjustBrightness('#ffcc00', brightness * 1.8);
                ctx.fillRect(x + windowMargin, y + height * 0.25, Math.max(1, width - windowMargin * 2), windowSize);

                // 窓枠（暗い色）
                ctx.fillStyle = adjustBrightness('#1a1a1a', brightness);
                // 横の桟（中央）
                ctx.fillRect(x + windowMargin, y + height * 0.25 + windowSize / 2, Math.max(1, width - windowMargin * 2), 1);

                // 2つ目の窓（縦に並べる）
                if (height > 80 && ((cellX + cellY) % 3) === 0) {
                    ctx.fillStyle = adjustBrightness('#ffcc00', brightness * 1.8);
                    ctx.fillRect(x + windowMargin, y + height * 0.6, Math.max(1, width - windowMargin * 2), windowSize);

                    // 窓枠
                    ctx.fillStyle = adjustBrightness('#1a1a1a', brightness);
                    ctx.fillRect(x + windowMargin, y + height * 0.6 + windowSize / 2, Math.max(1, width - windowMargin * 2), 1);
                }
            }
        }
    }

    // 旧コード（削除予定）
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

    // ミニマップの更新頻度制御（パフォーマンス最適化）
    let minimapLastUpdate = 0;
    const minimapUpdateInterval = 100; // 100msごとに更新（10fps）

    // オーバーレイDOMの取得/作成
    function getOrCreateOverlay(minimapElement) {
        let overlay = minimapElement.querySelector('.minimap-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'minimap-overlay';
            overlay.style.position = 'absolute';
            overlay.style.left = '0';
            overlay.style.top = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.pointerEvents = 'none';
            minimapElement.appendChild(overlay);
        }
        return overlay;
    }

    // プレイヤーマーカーのみ更新（軽量）
    function updateMinimapPlayer(overlayElement, playerX, playerY, playerAngle) {
        const cellSize = 8;

        // 既存のプレイヤーマーカーを探して更新
        const existingPlayer = overlayElement.querySelector('.minimap-player');
        const existingDir = overlayElement.querySelector('.minimap-direction');

        if (existingPlayer) {
            existingPlayer.style.left = `${playerX * cellSize - 2}px`;
            existingPlayer.style.top = `${playerY * cellSize - 2}px`;
        }

        if (existingDir) {
            existingDir.style.left = `${playerX * cellSize}px`;
            existingDir.style.top = `${playerY * cellSize}px`;
            existingDir.style.transform = `rotate(${playerAngle}rad)`;
        }
    }

    function renderMinimap(playerX, playerY, playerAngle, pumpkinPositions = [], collectedPumpkins = new Set(), witchGirlPosition = null, dynamicEnemies = null, phase = PHASE.INTRO) {
        const minimapElement = document.getElementById('minimap');
        if (!minimapElement) return;

        const now = performance.now();

        // 更新頻度を制限（100msに1回）
        if (now - minimapLastUpdate < minimapUpdateInterval) {
            // プレイヤーと視線だけ更新
            const overlay = getOrCreateOverlay(minimapElement);
            updateMinimapPlayer(overlay, playerX, playerY, playerAngle);
            return;
        }

        minimapLastUpdate = now;

        const cellSize = 8;
        // 初期構築: 静的グリッドは一度だけ描画
        if (minimapElement.dataset.built !== '1') {
            minimapElement.style.position = 'relative';
            minimapElement.style.width = `${map[0].length * cellSize}px`;
            minimapElement.style.height = `${map.length * cellSize}px`;

            const base = document.createElement('div');
            base.className = 'minimap-base';
            base.style.position = 'absolute';
            base.style.left = '0';
            base.style.top = '0';
            base.style.width = '100%';
            base.style.height = '100%';

            // マップを描画（静的）
            for (let y = 0; y < map.length; y++) {
                for (let x = 0; x < map[y].length; x++) {
                    const cell = document.createElement('div');
                    cell.style.position = 'absolute';
                    cell.style.left = `${x * cellSize}px`;
                    cell.style.top = `${y * cellSize}px`;
                    cell.style.width = `${cellSize}px`;
                    cell.style.height = `${cellSize}px`;

                    const colors = {
                        0: '#1a1a1a',  // 道
                        1: '#666',     // 建物
                        2: '#8a2be2',  // おばけ
                        3: '#ff6d00',  // かぼちゃ
                        4: '#ffcc00',  // ランタン
                        5: '#8b4513',  // 看板(BOO!)
                        6: '#888',     // 墓石
                        7: '#4a148c',  // 魔女
                        8: '#2a2a2a',  // コウモリ
                        9: '#0a0a0a',  // 黒猫
                        10: '#e8e8e8', // 骸骨
                        11: '#ff69b4'  // 魔女っこ（案内役）
                    };

                    cell.style.backgroundColor = colors[map[y][x]];
                    base.appendChild(cell);
                }
            }

            minimapElement.innerHTML = '';
            minimapElement.appendChild(base);
            getOrCreateOverlay(minimapElement); // overlayも作成
            minimapElement.dataset.built = '1';
        }

        const overlay = getOrCreateOverlay(minimapElement);
        overlay.innerHTML = '';

        // Witch ping layer（初回だけ作成、開始後は非表示）
        if (witchGirlPosition) {
            let pingLayer = minimapElement.querySelector('.minimap-ping-layer');
            const wCenterX = Math.floor(witchGirlPosition.x) * cellSize + cellSize / 2;
            const wCenterY = Math.floor(witchGirlPosition.y) * cellSize + cellSize / 2;
            if (!pingLayer) {
                pingLayer = document.createElement('div');
                pingLayer.className = 'minimap-ping-layer';
                pingLayer.style.position = 'absolute';
                pingLayer.style.left = '0';
                pingLayer.style.top = '0';
                pingLayer.style.width = '100%';
                pingLayer.style.height = '100%';
                pingLayer.style.pointerEvents = 'none';
                pingLayer.style.zIndex = '12';
                minimapElement.appendChild(pingLayer);

                const ping = document.createElement('div');
                ping.className = 'minimap-ping';
                ping.style.left = `${wCenterX}px`;
                ping.style.top = `${wCenterY}px`;
                pingLayer.appendChild(ping);

                const label = document.createElement('div');
                label.className = 'minimap-label minimap-witch-label';
                label.textContent = '🧙';
                label.style.left = `${wCenterX}px`;
                label.style.top = `${wCenterY}px`;
                label.style.zIndex = '13';
                pingLayer.appendChild(label);
            }
            // ゲーム開始（INTRO以外）後は非表示
            pingLayer.style.display = (gameState.phase === PHASE.INTRO) ? 'block' : 'none';
        }

        // 動的に配置されたかぼちゃを描画（収集済みは除外）
        for (let i = 0; i < pumpkinPositions.length; i++) {
            const pumpkin = pumpkinPositions[i];
            const key = `${Math.floor(pumpkin.x)},${Math.floor(pumpkin.y)}`;

            // 収集済みの場合はスキップ
            if (collectedPumpkins.has(key)) {
                continue;
            }

            const pumpkinCell = document.createElement('div');
            pumpkinCell.style.position = 'absolute';
            pumpkinCell.style.left = `${Math.floor(pumpkin.x) * cellSize}px`;
            pumpkinCell.style.top = `${Math.floor(pumpkin.y) * cellSize}px`;
            pumpkinCell.style.width = `${cellSize}px`;
            pumpkinCell.style.height = `${cellSize}px`;
            pumpkinCell.style.backgroundColor = '#ff6d00'; // かぼちゃのオレンジ色
            pumpkinCell.style.borderRadius = '50%';
            pumpkinCell.style.zIndex = '10';
            overlay.appendChild(pumpkinCell);
        }

        // 魔女っこを描画（強調マーカー + ガイドライン）
        if (witchGirlPosition) {
            const witchCell = document.createElement('div');
            witchCell.className = 'minimap-witch';
            witchCell.style.position = 'absolute';
            witchCell.style.left = `${Math.floor(witchGirlPosition.x) * cellSize - 1}px`;
            witchCell.style.top = `${Math.floor(witchGirlPosition.y) * cellSize - 1}px`;
            witchCell.style.width = `${cellSize + 2}px`;
            witchCell.style.height = `${cellSize + 2}px`;
            witchCell.style.backgroundColor = '#ff69b4';
            witchCell.style.borderRadius = '50%';
            witchCell.style.zIndex = '15';
            overlay.appendChild(witchCell);

            // ガイドライン（INTROフェーズのみ）
            if (gameState.phase === PHASE.INTRO) {
                const guide = document.createElement('div');
                guide.className = 'minimap-guide';
                const pX = playerX * cellSize;
                const pY = playerY * cellSize;
                const wX = Math.floor(witchGirlPosition.x) * cellSize + cellSize / 2;
                const wY = Math.floor(witchGirlPosition.y) * cellSize + cellSize / 2;
                const dx = wX - pX;
                const dy = wY - pY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const ang = Math.atan2(dy, dx);
                guide.style.left = `${pX}px`;
                guide.style.top = `${pY}px`;
                guide.style.width = `${Math.max(0, dist - 6)}px`;
                guide.style.transform = `rotate(${ang}rad)`;
                guide.style.zIndex = '14';
                overlay.appendChild(guide);
            }
        }

        // 動的な敵を描画（逃走フェーズのみ）
        if (dynamicEnemies && phase === PHASE.ESCAPE) {
            for (let i = 0; i < dynamicEnemies.length; i++) {
                const enemy = dynamicEnemies[i];
                const enemyCell = document.createElement('div');
                enemyCell.className = 'minimap-enemy';
                enemyCell.style.position = 'absolute';
                enemyCell.style.left = `${enemy.x * cellSize - 4}px`;
                enemyCell.style.top = `${enemy.y * cellSize - 4}px`;
                enemyCell.style.width = '8px';
                enemyCell.style.height = '8px';
                enemyCell.style.backgroundColor = '#ff0000'; // 赤色（敵）
                enemyCell.style.borderRadius = '50%';
                enemyCell.style.zIndex = '18';
                enemyCell.style.boxShadow = '0 0 5px #ff0000';
                overlay.appendChild(enemyCell);
            }
        }

        // プレイヤーを描画
        const player = document.createElement('div');
        player.className = 'minimap-player'; // クラス名追加（軽量更新用）
        player.style.position = 'absolute';
        player.style.left = `${playerX * cellSize - 2}px`;
        player.style.top = `${playerY * cellSize - 2}px`;
        player.style.width = '4px';
        player.style.height = '4px';
        player.style.backgroundColor = '#00ff00';
        player.style.borderRadius = '50%';
        player.style.zIndex = '20';
        overlay.appendChild(player);

        // 視線方向
        const dirLine = document.createElement('div');
        dirLine.className = 'minimap-direction'; // クラス名追加（軽量更新用）
        dirLine.style.position = 'absolute';
        dirLine.style.left = `${playerX * cellSize}px`;
        dirLine.style.top = `${playerY * cellSize}px`;
        dirLine.style.width = '10px';
        dirLine.style.height = '1px';
        dirLine.style.backgroundColor = '#00ff00';
        dirLine.style.transformOrigin = '0 0';
        dirLine.style.transform = `rotate(${playerAngle}rad)`;
        dirLine.style.zIndex = '20';
        overlay.appendChild(dirLine);
    }

    // ゲームループ開始
    gameLoop(performance.now());

    console.log('✅ bitECS Game initialized!');
}

// 安全な位置を見つける関数
function findSafePosition() {
    const centerX = Math.floor(map[0].length / 2);
    const centerY = Math.floor(map.length / 2);

    for (let radius = 0; radius < Math.max(map[0].length, map.length); radius++) {
        for (let x = centerX - radius; x <= centerX + radius; x++) {
            for (let y = centerY - radius; y <= centerY + radius; y++) {
                if (x >= 0 && x < map[0].length && y >= 0 && y < map.length) {
                    if (map[y][x] === 0) {
                        return { x: x + 0.5, y: y + 0.5 };
                    }
                }
            }
        }
    }

    return { x: centerX + 0.5, y: centerY + 0.5 };
}

// グローバルに公開
window.BitECSGame = {
    init: initBitECSGame
};

// 自動初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBitECSGame);
} else {
    initBitECSGame();
}
