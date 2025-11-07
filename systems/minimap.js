// ミニマップシステム

// マップデータをインポート
import { map } from '../map.js';

export class MinimapSystem {
    constructor(minimapId) {
        this.minimapElement = document.getElementById(minimapId);
        this.cellSize = 12;
    }
    
    update(deltaTime, entityManager) {
        if (!this.minimapElement) return;
        
        this.minimapElement.innerHTML = '';
        
        // マップの描画
        this.renderMap();
        
        // プレイヤーの位置を描画
        this.renderPlayer(entityManager);
    }
    
    // マップの描画
    renderMap() {
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                const cell = document.createElement('div');
                cell.style.position = 'absolute';
                cell.style.width = `${this.cellSize}px`;
                cell.style.height = `${this.cellSize}px`;
                cell.style.left = `${x * this.cellSize}px`;
                cell.style.top = `${y * this.cellSize}px`;
                
                // マップの種類に応じた色を設定
                this.setCellColor(cell, map[y][x]);
                
                this.minimapElement.appendChild(cell);
            }
        }
    }
    
    // セルの色を設定
    setCellColor(cell, type) {
        switch(type) {
            case 0: // 道
                cell.style.backgroundColor = '#3d2817';
                break;
            case 1: // 建物
                cell.style.backgroundColor = '#5a2f0f';
                break;
            case 2: // おばけ
                cell.style.backgroundColor = '#8a2be2';
                break;
            case 3: // かぼちゃ
                cell.style.backgroundColor = '#ff6d00';
                break;
            case 4: // ランタン
                cell.style.backgroundColor = '#ffcc00';
                break;
            case 5: // 看板
                cell.style.backgroundColor = '#8b4513';
                break;
            case 6: // 墓石
                cell.style.backgroundColor = '#5a5a5a';
                break;
            case 7: // 魔女
                cell.style.backgroundColor = '#4a148c';
                cell.style.boxShadow = '0 0 4px rgba(255, 235, 59, 0.5)'; // 魔法の光
                break;
        }
    }
    
    // プレイヤーの位置を描画
    renderPlayer(entityManager) {
        const player = entityManager.query('player')[0];
        if (!player) return;
        
        const position = player.components.get('position');
        
        // プレイヤーがマップ範囲内にいることを確認
        if (position.x >= 0 && position.x < map[0].length && 
            position.y >= 0 && position.y < map.length) {
            
            const playerMarker = document.createElement('div');
            playerMarker.style.position = 'absolute';
            playerMarker.style.width = '6px';
            playerMarker.style.height = '6px';
            playerMarker.style.backgroundColor = '#ff0000';
            playerMarker.style.borderRadius = '50%';
            playerMarker.style.left = `${position.x * this.cellSize - 3}px`;
            playerMarker.style.top = `${position.y * this.cellSize - 3}px`;
            playerMarker.style.zIndex = '10';
            playerMarker.style.boxShadow = '0 0 4px rgba(255, 255, 255, 0.8)'; // 見やすくするために光を追加
            
            this.minimapElement.appendChild(playerMarker);
        } else {
            // プレイヤーがマップ範囲外にいる場合の処理
            console.warn(`Player out of bounds: x=${position.x}, y=${position.y}`);
            
            // プレイヤーをマップ内に戻す
            position.x = Math.max(0.5, Math.min(map[0].length - 0.5, position.x));
            position.y = Math.max(0.5, Math.min(map.length - 0.5, position.y));
        }
        
        // 座標情報を表示
        this.renderCoordinates(position);
    }
    
    // 座標情報を表示
    renderCoordinates(position) {
        const coordsDisplay = document.createElement('div');
        coordsDisplay.style.position = 'absolute';
        coordsDisplay.style.bottom = '2px';
        coordsDisplay.style.right = '2px';
        coordsDisplay.style.color = '#ffffff';
        coordsDisplay.style.fontSize = '10px';
        coordsDisplay.style.fontFamily = 'monospace';
        coordsDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        coordsDisplay.style.padding = '2px';
        coordsDisplay.style.borderRadius = '3px';
        coordsDisplay.style.zIndex = '20';
        coordsDisplay.textContent = `X: ${position.x.toFixed(1)}, Y: ${position.y.toFixed(1)}`;
        
        // 境界チェックの警告
        if (position.x < 0.5 || position.x >= map[0].length - 0.5 || 
            position.y < 0.5 || position.y >= map.length - 0.5) {
            coordsDisplay.style.color = '#ff0000';
            coordsDisplay.textContent += ' [OUT OF BOUNDS]';
        }
        
        this.minimapElement.appendChild(coordsDisplay);
    }
}
