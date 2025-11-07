// ランタンオブジェクト

export function renderLantern(ctx, screenX, screenY, width, height, distance, time) {
    const brightness = Math.max(0.2, 1 - distance / 15);

    // 揺れるアニメーション（風に吹かれる）
    const swayOffset = Math.sin(time * 0.002) * 3;
    const adjustedX = screenX + swayOffset;

    // 炎の明滅
    const flicker = 0.85 + Math.sin(time * 0.01) * 0.1 + Math.sin(time * 0.027) * 0.05;

    // 吊り下げチェーン
    ctx.strokeStyle = adjustBrightness('#4a4a4a', brightness);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(adjustedX, screenY - height * 0.7);
    ctx.lineTo(adjustedX, screenY - height * 0.5);
    ctx.stroke();

    // ランタン上部のフック
    ctx.fillStyle = adjustBrightness('#3a3a3a', brightness);
    ctx.beginPath();
    ctx.arc(adjustedX, screenY - height * 0.5, width * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // ランタン本体の枠（上部）
    ctx.fillStyle = adjustBrightness('#8b7355', brightness);
    ctx.fillRect(adjustedX - width * 0.25, screenY - height * 0.5, width * 0.5, height * 0.08);

    // ガラス部分（半透明）
    ctx.fillStyle = adjustBrightness('#ffdb99', brightness * 0.3);
    ctx.globalAlpha = 0.4;
    ctx.fillRect(adjustedX - width * 0.22, screenY - height * 0.42, width * 0.44, height * 0.6);
    ctx.globalAlpha = 1.0;

    // ガラスの縦枠
    ctx.fillStyle = adjustBrightness('#6b5544', brightness);
    ctx.fillRect(adjustedX - width * 0.24, screenY - height * 0.45, width * 0.04, height * 0.66);
    ctx.fillRect(adjustedX + width * 0.20, screenY - height * 0.45, width * 0.04, height * 0.66);

    // ガラスの横枠（中央）
    ctx.fillRect(adjustedX - width * 0.24, screenY - height * 0.1, width * 0.48, height * 0.05);

    // 炎の光（グロー効果）
    const glowRadius = width * 0.5 * flicker;
    const gradient = ctx.createRadialGradient(adjustedX, screenY, 0, adjustedX, screenY, glowRadius);
    gradient.addColorStop(0, `rgba(255, 200, 100, ${0.8 * brightness * flicker})`);
    gradient.addColorStop(0.5, `rgba(255, 150, 50, ${0.4 * brightness * flicker})`);
    gradient.addColorStop(1, `rgba(255, 100, 0, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(adjustedX, screenY, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // 内部の炎
    ctx.fillStyle = adjustBrightness('#ffcc00', brightness * flicker);
    ctx.beginPath();
    const flameHeight = height * 0.15 * flicker;
    const flameWidth = width * 0.1;

    // 炎の形（涙型）
    ctx.moveTo(adjustedX, screenY - flameHeight);
    ctx.bezierCurveTo(
        adjustedX + flameWidth, screenY - flameHeight * 0.7,
        adjustedX + flameWidth, screenY,
        adjustedX, screenY + height * 0.05
    );
    ctx.bezierCurveTo(
        adjustedX - flameWidth, screenY,
        adjustedX - flameWidth, screenY - flameHeight * 0.7,
        adjustedX, screenY - flameHeight
    );
    ctx.fill();

    // 炎の中心（明るい部分）
    ctx.fillStyle = adjustBrightness('#ffffcc', brightness * flicker);
    ctx.beginPath();
    ctx.ellipse(adjustedX, screenY - flameHeight * 0.3, flameWidth * 0.5, flameHeight * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // ランタン底部の枠
    ctx.fillStyle = adjustBrightness('#8b7355', brightness);
    ctx.fillRect(adjustedX - width * 0.25, screenY + height * 0.21, width * 0.5, height * 0.08);

    // 底部の装飾（リング）
    ctx.strokeStyle = adjustBrightness('#6b5544', brightness);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(adjustedX, screenY + height * 0.25, width * 0.15, 0, Math.PI * 2);
    ctx.stroke();
}

function adjustBrightness(color, brightness) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgb(${Math.floor(r * brightness)}, ${Math.floor(g * brightness)}, ${Math.floor(b * brightness)})`;
}
