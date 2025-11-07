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

    // ゲーム状態（収集ゲーム）
    const gameState = {
        collectedPumpkins: new Set(), // 収集済みかぼちゃの座標セット
        totalPumpkins: 15,            // 総かぼちゃ数（ランダム配置）
        startTime: 0,                 // 開始時刻（イベント開始時に設定）
        gameCompleted: false,         // ゲーム完了フラグ
        gameStarted: false,           // ゲーム開始フラグ
        canTalk: false,               // 魔女っこと話せるか
        showTalkPrompt: false,        // 近づくとスタート表示フラグ
        introMessageUntil: 0,         // 開始直後のセリフ表示タイムスタンプ
        autoStartTriggered: false     // 近づいたら自動開始の一回トリガ
    };

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

    // 魔女っこの位置をランダムに配置
    let witchGirlPosition = null;
    if (emptySpaces.length > 0) {
        const randomIndex = Math.floor(Math.random() * emptySpaces.length);
        const pos = emptySpaces[randomIndex];
        witchGirlPosition = { x: pos.x + 0.5, y: pos.y + 0.5 };
        console.log(`🧙‍♀️ 魔女っこを (${pos.x}, ${pos.y}) に配置しました！`);
    }

    // Eキーでのインタラクション
    let isEKeyPressed = false;
    let isSKeyPressed = false;
    let isAKeyPressed = false;

    window.addEventListener('keydown', (e) => {
        // Eキー: 魔女っこに話しかける
        if (e.key === 'e' || e.key === 'E') {
            if (!isEKeyPressed && gameState.canTalk && !gameState.gameStarted) {
                isEKeyPressed = true;
                // ゲーム開始イベント
                gameState.gameStarted = true;
                gameState.startTime = performance.now();
                gameState.canTalk = false;
                gameState.showTalkPrompt = false;

                // ゲーム開始音を鳴らす
                if (window.soundManager) {
                    window.soundManager.play('door');
                }
                console.log('🎮 ゲーム開始！かぼちゃを全部集めよう！');
            }
        }

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
        if (e.key === 'e' || e.key === 'E') {
            isEKeyPressed = false;
        }
        if (e.key === 's' || e.key === 'S') {
            isSKeyPressed = false;
        }
        if (e.key === 'a' || e.key === 'A') {
            isAKeyPressed = false;
        }
    });

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
            if (moved && window.soundManager) {
                window.soundManager.playFootstep(true);
            }
            lastPlayerX = playerX;
            lastPlayerY = playerY;

            // 魔女っことの距離判定（ゲーム未開始時）
            if (!gameState.gameStarted && witchGirlPosition) {
                const dx = witchGirlPosition.x - playerX;
                const dy = witchGirlPosition.y - playerY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 1.5) {
                    // 近づいたら自動開始（1回のみ）
                    if (!gameState.autoStartTriggered) {
                        gameState.autoStartTriggered = true;
                        gameState.gameStarted = true;
                        gameState.startTime = performance.now();
                        gameState.canTalk = false;
                        gameState.showTalkPrompt = false;
                        gameState.introMessageUntil = currentTime + 2000; // 2秒間セリフ表示

                        if (window.soundManager) {
                            window.soundManager.play('door');
                        }
                        console.log('🎮 近づいたのでゲーム開始！かぼちゃを全部集めよう！');
                    }
                } else {
                    gameState.canTalk = false;
                    gameState.showTalkPrompt = false;
                }
            }

            // かぼちゃ収集判定（ゲーム開始後かつ未完了時のみ）
            if (gameState.gameStarted && !gameState.gameCompleted) {
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

                            // 全部集めたかチェック
                            if (gameState.collectedPumpkins.size >= gameState.totalPumpkins) {
                                gameState.gameCompleted = true;
                                const elapsedTime = ((currentTime - gameState.startTime) / 1000).toFixed(2);

                                // ゲーム完了音を鳴らす
                                if (window.soundManager) {
                                    window.soundManager.play('jump');
                                }
                                console.log(`🎉 全てのかぼちゃを収集しました！ タイム: ${elapsedTime}秒`);
                            }
                        }
                    }
                }

                // UI更新
                updateGameUI(currentTime);
            }
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

        // 会話プロンプト表示
        if (talkPromptElement) {
            if (gameState.showTalkPrompt) {
                talkPromptElement.textContent = '💬 魔女っこに近づくとスタート！';
                talkPromptElement.style.display = 'block';
            } else {
                talkPromptElement.style.display = 'none';
            }
        }

        // ゲーム開始前
        if (!gameState.gameStarted) {
            if (collectedElement) {
                collectedElement.textContent = '- / -';
            }
            if (timerElement) {
                timerElement.textContent = '0.0秒';
            }
            if (messageElement) {
                messageElement.textContent = '🧙‍♀️ 魔女っこを探して近づこう！';
                messageElement.style.display = 'block';
                messageElement.style.fontSize = '20px';
                messageElement.style.backgroundColor = 'rgba(138, 43, 226, 0.9)';
            }
            return;
        }

        // ゲーム開始後
        if (collectedElement) {
            collectedElement.textContent = `${gameState.collectedPumpkins.size} / ${gameState.totalPumpkins}`;
        }

        if (timerElement && !gameState.gameCompleted) {
            const elapsed = ((currentTime - gameState.startTime) / 1000).toFixed(1);
            timerElement.textContent = `${elapsed}秒`;
        }

        // 開始直後のセリフ表示
        if (!gameState.gameCompleted && currentTime < gameState.introMessageUntil) {
            if (messageElement) {
                messageElement.textContent = '🧙‍♀️ 魔女っこ: かぼちゃを全部集めてきてね！';
                messageElement.style.display = 'block';
                messageElement.style.fontSize = '22px';
                messageElement.style.backgroundColor = 'rgba(138, 43, 226, 0.9)';
            }
            return;
        }

        // ゲーム完了
        if (gameState.gameCompleted) {
            const finalTime = ((currentTime - gameState.startTime) / 1000).toFixed(2);
            if (messageElement) {
                messageElement.textContent = `🎉 おめでとう！全て集めました！ タイム: ${finalTime}秒`;
                messageElement.style.display = 'block';
                messageElement.style.fontSize = '24px';
                messageElement.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
            }
        } else {
            // ゲーム中はメッセージを非表示
            if (messageElement) {
                messageElement.style.display = 'none';
            }
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
        renderSprites(ctx, canvas, playerX, playerY, playerAngle, map, performance.now(), gameState.collectedPumpkins, pumpkinPositions, witchGirlPosition, zBuffer);

        // ミニマップ
        renderMinimap(playerX, playerY, playerAngle, pumpkinPositions, gameState.collectedPumpkins, witchGirlPosition);
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

            // 窓（ランダム、正方形）
            if (Math.random() > 0.995 && distance < 10 && height > 50) {
                const windowSize = Math.min(height * 0.12, 8);
                ctx.fillStyle = adjustBrightness('#ffcc00', brightness * 1.5);
                ctx.fillRect(x, y + height * 0.3, width, windowSize);

                // 2つ目の窓（縦に並べる）
                if (height > 100 && Math.random() > 0.5) {
                    ctx.fillRect(x, y + height * 0.6, width, windowSize);
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

    function renderMinimap(playerX, playerY, playerAngle, pumpkinPositions = [], collectedPumpkins = new Set(), witchGirlPosition = null) {
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
            // 自動開始後は非表示
            pingLayer.style.display = gameState.gameStarted ? 'none' : 'block';
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

            // ガイドライン（未開始時のみ）
            if (!gameState.gameStarted) {
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
