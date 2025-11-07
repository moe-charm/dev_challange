// アニメーションシステム

export class AnimationSystem {
    constructor() {
        this.animations = new Map();
        this.time = 0;
    }
    
    update(deltaTime, entityManager) {
        this.time += deltaTime;
        
        // すべてのエンティティのアニメーションを更新
        const animatedEntities = entityManager.query('animation');
        
        for (const entity of animatedEntities) {
            const animation = entity.components.get('animation');
            
            if (animation) {
                this.updateAnimation(entity, animation, deltaTime);
            }
        }
    }
    
    updateAnimation(entity, animation, deltaTime) {
        // 経過時間を更新
        animation.progress = this.time - animation.startTime;
        
        // アニメーションの種類に応じた処理
        switch (animation.type) {
            case 'float':
                this.updateFloatAnimation(entity, animation);
                break;
            case 'pulse':
                this.updatePulseAnimation(entity, animation);
                break;
            case 'levitate':
                this.updateLevitateAnimation(entity, animation);
                break;
            case 'sparkle':
                this.updateSparkleAnimation(entity, animation);
                break;
            case 'flicker':
                this.updateFlickerAnimation(entity, animation);
                break;
        }
        
        // ループチェック
        if (animation.loop && animation.progress > animation.duration) {
            animation.startTime = this.time;
            animation.progress = 0;
        }
    }
    
    // 浮遊アニメーション
    updateFloatAnimation(entity, animation) {
        const position = entity.components.get('position');
        if (!position) return;
        
        // 浮遊の高さを計算
        const floatHeight = Math.sin(animation.progress * 0.001 * Math.PI * 2 / animation.duration * 1000) * 5;
        
        // 浮遊の高さをエンティティに保存（他のシステムが使用できるように）
        if (!entity.floatOffset) entity.floatOffset = 0;
        entity.floatOffset = floatHeight;
    }
    
    // 脈動アニメーション
    updatePulseAnimation(entity, animation) {
        const renderable = entity.components.get('renderable');
        if (!renderable) return;
        
        // 大きさの脈動を計算
        const scale = 1 + Math.sin(animation.progress * 0.001 * Math.PI * 2 / animation.duration * 1000) * 0.2;
        
        // スケールをエンティティに保存
        if (!entity.scale) entity.scale = 1;
        entity.scale = scale;
    }
    
    // 浮上アニメーション（魔女用）
    updateLevitateAnimation(entity, animation) {
        const position = entity.components.get('position');
        if (!position) return;
        
        // 浮遊の高さと回転を計算
        const floatHeight = Math.sin(animation.progress * 0.0008 * Math.PI * 2) * 8;
        const rotation = Math.sin(animation.progress * 0.0005 * Math.PI * 2) * 0.1;
        
        // 値をエンティティに保存
        if (!entity.floatOffset) entity.floatOffset = 0;
        entity.floatOffset = floatHeight;
        
        if (!entity.rotation) entity.rotation = 0;
        entity.rotation = rotation;
    }
    
    // きらきらアニメーション
    updateSparkleAnimation(entity, animation) {
        const renderable = entity.components.get('renderable');
        if (!renderable) return;
        
        // きらめきの強さを計算
        const sparkleIntensity = 0.5 + Math.sin(animation.progress * 0.002 * Math.PI * 2) * 0.5;
        
        // きらめきの強さをエンティティに保存
        if (!entity.sparkleIntensity) entity.sparkleIntensity = 1;
        entity.sparkleIntensity = sparkleIntensity;
    }
    
    // 明滅アニメーション
    updateFlickerAnimation(entity, animation) {
        const renderable = entity.components.get('renderable');
        if (!renderable) return;
        
        // 明滅の強さを計算
        const flickerIntensity = 0.7 + Math.random() * 0.3;
        
        // 明滅の強さをエンティティに保存
        if (!entity.flickerIntensity) entity.flickerIntensity = 1;
        entity.flickerIntensity = flickerIntensity;
    }
    
    // アニメーションを追加
    addAnimation(entityId, type, duration, loop = true) {
        // このメソッドはエンティティマネージャーを介して呼び出される
    }
    
    // アニメーションを削除
    removeAnimation(entityId, type) {
        // このメソッドはエンティティマネージャーを介して呼び出される
    }
}
