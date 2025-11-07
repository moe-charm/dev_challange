// ECSライブラリを使用したハロウィン街探索ゲーム

// マップデータをインポート
import { map } from './map.js';

// システムをインポート
import { RenderingSystem, InputSystem, MinimapSystem, AnimationSystem, ObjectRendererFactory } from './systems/index.js';

// ゲームエンジンのインスタンスを作成
const game = new ECS.GameEngine();

// システムのインスタンスを作成（後で初期化）
let renderingSystem, inputSystem, minimapSystem, animationSystem;

// ゲーム初期化関数
function initGame() {
    // キャンバスを取得
    const canvas = document.getElementById('gameCanvas');

    // システムを初期化
    renderingSystem = new RenderingSystem(canvas);
    inputSystem = new InputSystem();
    minimapSystem = new MinimapSystem('minimap');
    animationSystem = new AnimationSystem();

    // オブジェクトレンダラーを初期化
    ObjectRendererFactory.initializeAll();

    // システムをゲームエンジンに追加
    game.getSystems().add('input', inputSystem);
    game.getSystems().add('renderer', renderingSystem);
    game.getSystems().add('minimap', minimapSystem);
    game.getSystems().add('animation', animationSystem);

    // プレイヤーエンティティを作成
    const playerId = game.getEntities().create();

    // マップの中央あたりの安全な位置を見つける
    const safePosition = findSafePosition();

    game.getEntities().addComponent(playerId, 'position', ECS.Components.position(safePosition.x, safePosition.y));
    game.getEntities().addComponent(playerId, 'rotation', ECS.Components.rotation(0));
    game.getEntities().addComponent(playerId, 'player', ECS.Components.player());

    // ゲームを開始
    game.start();

    return game;
}

// 安全な位置を見つける関数
function findSafePosition() {
    // マップの中央付近で安全な場所を探す
    const centerX = Math.floor(map[0].length / 2);
    const centerY = Math.floor(map.length / 2);

    // 中心から外側に向かって探索
    for (let radius = 0; radius < Math.max(map[0].length, map.length); radius++) {
        for (let x = centerX - radius; x <= centerX + radius; x++) {
            for (let y = centerY - radius; y <= centerY + radius; y++) {
                // マップ範囲内チェック
                if (x >= 0 && x < map[0].length && y >= 0 && y < map.length) {
                    // 道を探す
                    if (map[y][x] === 0) {
                        return { x: x + 0.5, y: y + 0.5 }; // セルの中央に配置
                    }
                }
            }
        }
    }

    // 安全な場所が見つからない場合は中央に配置
    return { x: centerX + 0.5, y: centerY + 0.5 };
}

// グローバルに公開
window.Game = {
    init: initGame,
    engine: game
};
