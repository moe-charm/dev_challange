// オブジェクト関連コンポーネント

// 基本オブジェクトコンポーネント
export const ObjectComponents = {
    // 基本オブジェクト
    base: (type, x, y) => ({
        type,
        x,
        y,
        discovered: false
    }),
    
    // 位置情報
    position: (x, y) => ({ x, y }),
    
    // 速度情報
    velocity: (dx, dy) => ({ dx, dy }),
    
    // 向き情報
    rotation: (angle) => ({ angle }),
    
    // 描画情報
    renderable: (type, color, height = 1) => ({ 
        type, 
        color, 
        height,
        visible: true
    }),
    
    // アニメーション情報
    animation: (type, duration, loop = true) => ({
        type,
        duration,
        loop,
        progress: 0,
        startTime: Date.now()
    }),
    
    // 音源情報
    soundSource: (type, volume = 0.5, loop = false) => ({ 
        type, 
        volume, 
        loop,
        lastPlayed: 0
    }),
    
    // 衝突判定
    collider: (width, height, solid = true) => ({
        width,
        height,
        solid
    }),
    
    // インタラクション
    interactable: (type, effect) => ({
        type,
        effect
    })
};

// 建物コンポーネント
export const BuildingComponents = {
    // 基本建物
    building: (type, color, hasWindows = true) => ({
        type,
        color,
        hasWindows,
        windowPositions: []
    }),
    
    // 窓
    window: (x, y, width, height, isLit = false) => ({
        x, y, width, height, isLit,
        flickerSpeed: Math.random() * 0.5 + 0.5
    }),
    
    // ドア
    door: (x, y, width, height, isOpen = false) => ({
        x, y, width, height, isOpen
    })
};

// 魔法系オブジェクトコンポーネント
export const MagicComponents = {
    // 魔法の光
    glow: (color, intensity, range) => ({
        color,
        intensity,
        range,
        pulseSpeed: Math.random() * 2 + 1
    }),
    
    // 魔法粒子
    particle: (color, size, lifespan) => ({
        color,
        size,
        lifespan,
        age: 0,
        velocity: {
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2
        }
    }),
    
    // 魔法効果
    spellEffect: (type, duration, target) => ({
        type,
        duration,
        target,
        startTime: Date.now()
    })
};

// キャラクターコンポーネント
export const CharacterComponents = {
    // 基本キャラクター
    character: (name, type) => ({
        name,
        type,
        health: 100,
        mood: 'neutral'
    }),
    
    // 魔女
    witch: (powerLevel = 1) => ({
        powerLevel,
        spells: ['teleport', 'levitate'],
        mana: 100,
        maxMana: 100,
        broom: {
            speed: 1.5,
            hoverHeight: 8
        }
    }),
    
    // おばけ
    ghost: (scareLevel = 1) => ({
        scareLevel,
        transparency: 0.7,
        floatHeight: 5,
        phrases: ['Boo!', 'Wooo...', ' spooky!']
    }),
    
    // かぼちゃ（ジャック・オ・ランタン）
    pumpkin: (isLit = true) => ({
        isLit,
        glowIntensity: 0.8,
        candleFlicker: true,
        evilGrin: true
    })
};

// 環境オブジェクトコンポーネント
export const EnvironmentComponents = {
    // ランタン
    lantern: (intensity = 1, color = '#ffcc00') => ({
        intensity,
        color,
        range: 5,
        flickerSpeed: Math.random() * 0.3 + 0.1
    }),
    
    // 看板
    sign: (text, fontSize = 12) => ({
        text,
        fontSize,
        material: 'wood',
        weathering: Math.random() * 0.5
    }),
    
    // 墓石
    gravestone: (epitaph = '') => ({
        epitaph,
        material: 'stone',
        age: Math.floor(Math.random() * 100) + 10,
        crossType: 'simple'
    })
};

// 複合コンポーネント（複数のコンポーネントを組み合わせる）
export const CompositeComponents = {
    // ハロウィン建物
    hauntedHouse: (x, y) => ({
        ...ObjectComponents.position(x, y),
        ...ObjectComponents.renderable('building', '#3a1f0f', 2),
        ...BuildingComponents.building('haunted', '#3a1f0f', true),
        ...MagicComponents.glow('#8a2be2', 0.3, 3)
    }),
    
    // 浮遊おばけ
    floatingGhost: (x, y) => ({
        ...ObjectComponents.position(x, y),
        ...ObjectComponents.renderable('ghost', '#8a2be2', 1.5),
        ...CharacterComponents.ghost(2),
        ...ObjectComponents.animation('float', 3000, true),
        ...MagicComponents.glow('#8a2be2', 0.5, 2)
    }),
    
    // かぼちゃランタン
    jackOLantern: (x, y) => ({
        ...ObjectComponents.position(x, y),
        ...ObjectComponents.renderable('pumpkin', '#ff6d00', 1),
        ...CharacterComponents.pumpkin(true),
        ...EnvironmentComponents.lantern(0.8, '#ff6d00'),
        ...ObjectComponents.animation('pulse', 2000, true)
    }),
    
    // 魔女
    witch: (x, y) => ({
        ...ObjectComponents.position(x, y),
        ...ObjectComponents.renderable('witch', '#4a148c', 2),
        ...CharacterComponents.witch(3),
        ...ObjectComponents.animation('levitate', 4000, true),
        ...MagicComponents.spellEffect('sparkle', 1000, null),
        ...MagicComponents.particle('#ffeb3b', 3, 5000)
    })
};
