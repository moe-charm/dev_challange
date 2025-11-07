// 軽量Entity-Component-Systemライブラリ
// ハロウィン街探索デモ用のオブジェクト管理ライブラリ

// コンポーネントファクトリ
const Components = {
    // 位置情報
    position: (x = 0, y = 0) => ({ x, y }),
    
    // 速度情報
    velocity: (dx = 0, dy = 0) => ({ dx, dy }),
    
    // 向き情報
    rotation: (angle = 0) => ({ angle }),
    
    // 描画情報
    renderable: (type = 'building', color = '#3a1f0f', height = 1) => ({ 
        type, 
        color, 
        height,
        visible: true
    }),
    
    // プレイヤー情報
    player: (speed = 0.1, rotSpeed = 0.05) => ({ speed, rotSpeed }),
    
    // 音源情報
    soundSource: (type = 'ambient', volume = 0.5, loop = false) => ({ 
        type, 
        volume, 
        loop,
        lastPlayed: 0
    }),
    
    // ランタン情報
    lantern: (intensity = 1, color = '#ffcc00', range = 5) => ({
        intensity,
        color,
        range
    }),
    
    // アニメーション情報
    animation: (type = 'float', duration = 2000, loop = true) => ({
        type,
        duration,
        loop,
        progress: 0
    }),
    
    // 衝突判定
    collider: (width = 1, height = 1, solid = true) => ({
        width,
        height,
        solid
    }),
    
    // インタラクション
    interactable: (type = 'touch', effect = null) => ({
        type,
        effect
    })
};

// エンティティマネージャ
class EntityManager {
    constructor() {
        this.entities = new Map();
        this.nextId = 1;
    }
    
    // 新しいエンティティを作成
    create() {
        const id = this.nextId++;
        this.entities.set(id, {
            id,
            components: new Map()
        });
        return id;
    }
    
    // エンティティにコンポーネントを追加
    addComponent(entityId, componentType, data) {
        const entity = this.entities.get(entityId);
        if (entity) {
            entity.components.set(componentType, data);
        }
        return this;
    }
    
    // エンティティからコンポーネントを取得
    getComponent(entityId, componentType) {
        const entity = this.entities.get(entityId);
        return entity ? entity.components.get(componentType) : null;
    }
    
    // エンティティがコンポーネントを持っているかチェック
    hasComponent(entityId, componentType) {
        const entity = this.entities.get(entityId);
        return entity ? entity.components.has(componentType) : false;
    }
    
    // エンティティからコンポーネントを削除
    removeComponent(entityId, componentType) {
        const entity = this.entities.get(entityId);
        if (entity) {
            entity.components.delete(componentType);
        }
        return this;
    }
    
    // エンティティを削除
    destroy(entityId) {
        this.entities.delete(entityId);
        return this;
    }
    
    // 特定のコンポーネントを持つエンティティをすべて取得
    query(componentType) {
        const result = [];
        for (const [id, entity] of this.entries()) {
            if (entity.components.has(componentType)) {
                result.push({
                    id,
                    components: entity.components
                });
            }
        }
        return result;
    }
    
    // 複数のコンポーネントを持つエンティティを取得
    queryMultiple(componentTypes) {
        const result = [];
        for (const [id, entity] of this.entries()) {
            let hasAll = true;
            for (const type of componentTypes) {
                if (!entity.components.has(type)) {
                    hasAll = false;
                    break;
                }
            }
            if (hasAll) {
                result.push({
                    id,
                    components: entity.components
                });
            }
        }
        return result;
    }
    
    // すべてのエンティティを取得
    getAll() {
        return Array.from(this.entries()).map(([id, entity]) => ({
            id,
            components: entity.components
        }));
    }
    
    // イテレータ
    entries() {
        return this.entities.entries();
    }
    
    // エンティティ数を取得
    count() {
        return this.entities.size;
    }
}

// システムマネージャ
class SystemManager {
    constructor() {
        this.systems = new Map();
    }
    
    // システムを追加
    add(name, system) {
        this.systems.set(name, system);
        return this;
    }
    
    // システムを取得
    get(name) {
        return this.systems.get(name);
    }
    
    // すべてのシステムを実行
    update(deltaTime, entityManager) {
        for (const [name, system] of this.systems) {
            if (typeof system.update === 'function') {
                system.update(deltaTime, entityManager);
            }
        }
    }
}

// ゲームエンジン
class GameEngine {
    constructor() {
        this.entityManager = new EntityManager();
        this.systemManager = new SystemManager();
        this.lastTime = 0;
        this.isRunning = false;
    }
    
    // ゲームループを開始
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
        return this;
    }
    
    // ゲームループを停止
    stop() {
        this.isRunning = false;
        return this;
    }
    
    // ゲームループ
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // すべてのシステムを更新
        this.systemManager.update(deltaTime, this.entityManager);
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // エンティティマネージャーを取得
    getEntities() {
        return this.entityManager;
    }
    
    // システムマネージャーを取得
    getSystems() {
        return this.systemManager;
    }
}

// ユーティリティ関数
const Utils = {
    // 2つの点間の距離を計算
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    // 角度をラジアンに変換
    degToRad(deg) {
        return deg * Math.PI / 180;
    },
    
    // ラジアンを角度に変換
    radToDeg(rad) {
        return rad * 180 / Math.PI;
    },
    
    // 値を範囲内に制限
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    // 線形補間
    lerp(start, end, t) {
        return start + (end - start) * t;
    },
    
    // 値を範囲内にマッピング
    map(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }
};

// グローバルに公開
window.ECS = {
    Components,
    EntityManager,
    SystemManager,
    GameEngine,
    Utils
};
