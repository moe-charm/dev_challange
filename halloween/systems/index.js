// システムのエクスポート

import { RenderingSystem, ObjectRendererFactory } from './rendering.js';
import { InputSystem } from './input.js';
import { MinimapSystem } from './minimap.js';
import { AnimationSystem } from './animation.js';

// ESモジュールとしてエクスポート
export { RenderingSystem, InputSystem, MinimapSystem, AnimationSystem, ObjectRendererFactory };

// グローバルスコープ（window）にも追加
window.RenderingSystem = RenderingSystem;
window.InputSystem = InputSystem;
window.MinimapSystem = MinimapSystem;
window.AnimationSystem = AnimationSystem;
window.ObjectRendererFactory = ObjectRendererFactory;
