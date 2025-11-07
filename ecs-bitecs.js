// bitECSベースのコンポーネント定義

// bitECSがロードされるまで待つ
function waitForBitECS() {
    return new Promise((resolve) => {
        const check = () => {
            // CDNから読み込まれるbitECSはwindow.BITECSになる
            if (window.BITECS) {
                console.log('✅ bitECS found in ecs-bitecs.js');
                resolve(window.BITECS);
            } else {
                console.log('⏳ Waiting for bitECS...');
                setTimeout(check, 50);
            }
        };
        check();
    });
}

// bitECSをグローバルから取得（CDN経由）
const BITECS = await waitForBitECS();
const { createWorld, addEntity, addComponent, removeComponent, defineComponent, defineQuery, Types, pipe } = BITECS;

// コンポーネント定義
export const Position = defineComponent({
    x: Types.f32,
    y: Types.f32
});

export const Rotation = defineComponent({
    angle: Types.f32
});

export const Velocity = defineComponent({
    dx: Types.f32,
    dy: Types.f32
});

export const Player = defineComponent({
    speed: Types.f32,
    rotSpeed: Types.f32
});

export const Renderable = defineComponent({
    type: Types.ui8,  // マップタイプ (1-7)
    color: Types.ui32, // 色をRGB整数値として保存
    height: Types.f32,
    visible: Types.ui8  // 0 or 1
});

export const Animation = defineComponent({
    type: Types.ui8,      // アニメーションタイプ
    duration: Types.f32,  // 継続時間(ms)
    progress: Types.f32,  // 進行状況 (0-1)
    loop: Types.ui8       // ループするか (0 or 1)
});

// ワールド作成
export const world = createWorld();

// ヘルパー関数: エンティティ作成と初期化
export function createPlayerEntity(x, y, angle = 0) {
    const eid = addEntity(world);

    addComponent(world, Position, eid);
    Position.x[eid] = x;
    Position.y[eid] = y;

    addComponent(world, Rotation, eid);
    Rotation.angle[eid] = angle;

    addComponent(world, Player, eid);
    Player.speed[eid] = 0.1;
    Player.rotSpeed[eid] = 0.05;

    return eid;
}

// クエリ定義
export const playerQuery = defineQuery([Player, Position, Rotation]);
export const renderableQuery = defineQuery([Position, Renderable]);
export const animatedQuery = defineQuery([Animation]);

// グローバルに公開（Bは大文字、ECSも大文字）
console.log('📦 Exporting to window.BitECS...');
window.BitECS = {
    world,
    createWorld,
    addEntity,
    addComponent,
    removeComponent,
    defineComponent,
    defineQuery,
    Types,
    pipe,
    // コンポーネント
    Position,
    Rotation,
    Velocity,
    Player,
    Renderable,
    Animation,
    // ヘルパー
    createPlayerEntity,
    // クエリ
    playerQuery,
    renderableQuery,
    animatedQuery
};

console.log('✅ window.BitECS exported successfully!', Object.keys(window.BitECS));
