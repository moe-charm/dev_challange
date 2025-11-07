// 魔女オブジェクト

export function renderWitch(ctx, screenX, screenY, width, height, distance, time) {
    const brightness = Math.max(0.2, 1 - distance / 15);

    // 浮遊アニメーション（ゆっくり）
    const floatOffset = Math.sin(time * 0.0015) * 10;
    const adjustedY = screenY + floatOffset;

    // 魔女の帽子
    ctx.fillStyle = adjustBrightness('#2a0a4c', brightness);
    ctx.beginPath();
    ctx.moveTo(screenX, adjustedY - height * 0.6);
    ctx.lineTo(screenX - width * 0.25, adjustedY - height * 0.2);
    ctx.lineTo(screenX + width * 0.25, adjustedY - height * 0.2);
    ctx.closePath();
    ctx.fill();

    // 帽子のつば
    ctx.fillStyle = adjustBrightness('#4a148c', brightness);
    ctx.fillRect(screenX - width * 0.35, adjustedY - height * 0.25, width * 0.7, height * 0.08);

    // 帽子のリボン
    ctx.fillStyle = adjustBrightness('#ff9800', brightness);
    ctx.fillRect(screenX - width * 0.25, adjustedY - height * 0.22, width * 0.5, height * 0.05);

    // 顔
    ctx.fillStyle = adjustBrightness('#d4a574', brightness);
    ctx.beginPath();
    ctx.ellipse(screenX, adjustedY - height * 0.05, width * 0.22, height * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    // 髪
    ctx.fillStyle = adjustBrightness('#3d2817', brightness);
    ctx.fillRect(screenX - width * 0.3, adjustedY - height * 0.15, width * 0.12, height * 0.2);
    ctx.fillRect(screenX + width * 0.18, adjustedY - height * 0.15, width * 0.12, height * 0.2);

    // 目
    ctx.fillStyle = adjustBrightness('#000000', brightness);
    ctx.beginPath();
    ctx.arc(screenX - width * 0.08, adjustedY - height * 0.08, width * 0.03, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(screenX + width * 0.08, adjustedY - height * 0.08, width * 0.03, 0, Math.PI * 2);
    ctx.fill();

    // 鼻
    ctx.strokeStyle = adjustBrightness('#000000', brightness);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX, adjustedY - height * 0.02);
    ctx.lineTo(screenX - width * 0.05, adjustedY + height * 0.02);
    ctx.stroke();

    // 口（笑顔）
    ctx.beginPath();
    ctx.arc(screenX, adjustedY + height * 0.02, width * 0.08, 0, Math.PI);
    ctx.stroke();

    // 体（紫のローブ）
    ctx.fillStyle = adjustBrightness('#4a148c', brightness);
    ctx.beginPath();
    ctx.moveTo(screenX - width * 0.3, adjustedY + height * 0.1);
    ctx.lineTo(screenX - width * 0.4, adjustedY + height * 0.6);
    ctx.lineTo(screenX + width * 0.4, adjustedY + height * 0.6);
    ctx.lineTo(screenX + width * 0.3, adjustedY + height * 0.1);
    ctx.closePath();
    ctx.fill();

    // 星の模様
    ctx.fillStyle = adjustBrightness('#ffeb3b', brightness);
    drawStar(ctx, screenX - width * 0.1, adjustedY + height * 0.25, width * 0.08, 5);
    drawStar(ctx, screenX + width * 0.15, adjustedY + height * 0.4, width * 0.06, 5);

    // 箒
    ctx.strokeStyle = adjustBrightness('#8b4513', brightness);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(screenX + width * 0.35, adjustedY + height * 0.3);
    ctx.lineTo(screenX + width * 0.5, adjustedY + height * 0.65);
    ctx.stroke();

    // 箒の先
    ctx.fillStyle = adjustBrightness('#daa520', brightness);
    for (let i = 0; i < 5; i++) {
        const angle = (Math.PI / 6) * (i - 2);
        const bx = screenX + width * 0.5 + Math.cos(angle + Math.PI / 2) * width * 0.15;
        const by = adjustedY + height * 0.65 + Math.sin(angle + Math.PI / 2) * width * 0.15;
        ctx.fillRect(bx, by, 2, height * 0.12);
    }
}

function drawStar(ctx, cx, cy, radius, points) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const angle = (Math.PI / points) * i;
        const r = i % 2 === 0 ? radius : radius * 0.5;
        const x = cx + Math.cos(angle - Math.PI / 2) * r;
        const y = cy + Math.sin(angle - Math.PI / 2) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
}

function adjustBrightness(color, brightness) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgb(${Math.floor(r * brightness)}, ${Math.floor(g * brightness)}, ${Math.floor(b * brightness)})`;
}
