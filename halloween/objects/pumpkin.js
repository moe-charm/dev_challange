// かぼちゃオブジェクト

export function renderPumpkin(ctx, screenX, screenY, width, height, distance, time) {
    const brightness = Math.max(0.2, 1 - distance / 15);

    // パルスアニメーション
    const pulse = 1 + Math.sin(time * 0.003) * 0.1;
    const adjustedWidth = width * pulse;
    const adjustedHeight = height * pulse;

    // かぼちゃの体（オレンジ）
    ctx.fillStyle = adjustBrightness('#ff6d00', brightness);

    // 楕円形
    ctx.beginPath();
    ctx.ellipse(screenX, screenY, adjustedWidth * 0.45, adjustedHeight * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // 縦の溝（3本）
    ctx.strokeStyle = adjustBrightness('#cc5500', brightness);
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(screenX + adjustedWidth * 0.15 * i, screenY - adjustedHeight * 0.35);
        ctx.lineTo(screenX + adjustedWidth * 0.15 * i, screenY + adjustedHeight * 0.35);
        ctx.stroke();
    }

    // ヘタ（茎）
    ctx.fillStyle = adjustBrightness('#228b22', brightness);
    ctx.fillRect(screenX - adjustedWidth * 0.08, screenY - adjustedHeight * 0.55, adjustedWidth * 0.16, adjustedHeight * 0.12);

    // 顔（黒）
    ctx.fillStyle = adjustBrightness('#000000', brightness);

    // 三角の目
    ctx.beginPath();
    ctx.moveTo(screenX - adjustedWidth * 0.25, screenY - adjustedHeight * 0.1);
    ctx.lineTo(screenX - adjustedWidth * 0.15, screenY - adjustedHeight * 0.25);
    ctx.lineTo(screenX - adjustedWidth * 0.05, screenY - adjustedHeight * 0.1);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(screenX + adjustedWidth * 0.05, screenY - adjustedHeight * 0.1);
    ctx.lineTo(screenX + adjustedWidth * 0.15, screenY - adjustedHeight * 0.25);
    ctx.lineTo(screenX + adjustedWidth * 0.25, screenY - adjustedHeight * 0.1);
    ctx.fill();

    // ギザギザの口
    ctx.beginPath();
    ctx.moveTo(screenX - adjustedWidth * 0.3, screenY + adjustedHeight * 0.1);
    for (let i = 0; i <= 6; i++) {
        const x = screenX - adjustedWidth * 0.3 + (adjustedWidth * 0.6 / 6) * i;
        const y = screenY + adjustedHeight * 0.1 + (i % 2 === 0 ? 0 : adjustedHeight * 0.1);
        ctx.lineTo(x, y);
    }
    ctx.lineTo(screenX - adjustedWidth * 0.3, screenY + adjustedHeight * 0.2);
    ctx.fill();

    // 光（内側から）
    if (distance < 10) {
        ctx.fillStyle = `rgba(255, 200, 0, ${0.3 * brightness})`;
        ctx.beginPath();
        ctx.ellipse(screenX, screenY, adjustedWidth * 0.35, adjustedHeight * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

function adjustBrightness(color, brightness) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgb(${Math.floor(r * brightness)}, ${Math.floor(g * brightness)}, ${Math.floor(b * brightness)})`;
}
