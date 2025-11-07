// かわいい魔女っこ（案内役）

export function renderWitchGirl(ctx, screenX, screenY, width, height, distance, time) {
    const brightness = Math.max(0.2, 1 - distance / 15);

    // 浮遊アニメーション
    const floatOffset = Math.sin(time * 0.002) * 15;
    const adjustedY = screenY + floatOffset;

    // 魔女っこは少し大きめに
    const scale = 1.2;
    width *= scale;
    height *= scale;

    // 箒（横に持つ）
    const broomAngle = Math.sin(time * 0.001) * 0.1;
    ctx.save();
    ctx.translate(screenX + width * 0.4, adjustedY + height * 0.2);
    ctx.rotate(broomAngle);

    // 箒の柄
    ctx.fillStyle = adjustBrightness('#8b4513', brightness);
    ctx.fillRect(-width * 0.25, -height * 0.02, width * 0.5, height * 0.04);

    // 箒の先
    ctx.fillStyle = adjustBrightness('#daa520', brightness);
    for (let i = 0; i < 8; i++) {
        ctx.fillRect(
            width * 0.22 + i * 2,
            -height * 0.08 + i * 2,
            2,
            height * 0.16
        );
    }
    ctx.restore();

    // 魔女帽子のつば
    ctx.fillStyle = adjustBrightness('#4a148c', brightness);
    ctx.beginPath();
    ctx.ellipse(screenX, adjustedY - height * 0.5, width * 0.35, height * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    // 帽子の円錐部分
    ctx.beginPath();
    ctx.moveTo(screenX, adjustedY - height * 0.65);
    ctx.lineTo(screenX - width * 0.18, adjustedY - height * 0.5);
    ctx.lineTo(screenX + width * 0.18, adjustedY - height * 0.5);
    ctx.closePath();
    ctx.fill();

    // 帽子のリボン
    ctx.fillStyle = adjustBrightness('#ff9800', brightness);
    ctx.fillRect(screenX - width * 0.18, adjustedY - height * 0.52, width * 0.36, height * 0.04);

    // 髪（茶色、サイドに流れる）
    ctx.fillStyle = adjustBrightness('#8b6914', brightness);

    // 左側の髪
    ctx.beginPath();
    ctx.ellipse(screenX - width * 0.15, adjustedY - height * 0.35, width * 0.12, height * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // 右側の髪
    ctx.beginPath();
    ctx.ellipse(screenX + width * 0.15, adjustedY - height * 0.35, width * 0.12, height * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // 前髪
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(
            screenX - width * 0.08 + i * width * 0.08,
            adjustedY - height * 0.42,
            width * 0.05,
            height * 0.12,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    // 顔
    ctx.fillStyle = adjustBrightness('#ffd4b3', brightness);
    ctx.beginPath();
    ctx.ellipse(screenX, adjustedY - height * 0.35, width * 0.18, height * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // 目（大きめ、アニメ風）
    const eyeBlink = Math.sin(time * 0.002) > 0.98 ? 0.2 : 1;

    // 左目の白
    ctx.fillStyle = adjustBrightness('#ffffff', brightness);
    ctx.beginPath();
    ctx.ellipse(screenX - width * 0.08, adjustedY - height * 0.38, width * 0.06, height * 0.08 * eyeBlink, 0, 0, Math.PI * 2);
    ctx.fill();

    // 右目の白
    ctx.beginPath();
    ctx.ellipse(screenX + width * 0.08, adjustedY - height * 0.38, width * 0.06, height * 0.08 * eyeBlink, 0, 0, Math.PI * 2);
    ctx.fill();

    if (eyeBlink > 0.5) {
        // 左目の瞳
        ctx.fillStyle = adjustBrightness('#8b6914', brightness);
        ctx.beginPath();
        ctx.ellipse(screenX - width * 0.08, adjustedY - height * 0.37, width * 0.04, height * 0.05, 0, 0, Math.PI * 2);
        ctx.fill();

        // 左目のハイライト
        ctx.fillStyle = adjustBrightness('#ffffff', brightness * 1.5);
        ctx.beginPath();
        ctx.arc(screenX - width * 0.09, adjustedY - height * 0.39, width * 0.02, 0, Math.PI * 2);
        ctx.fill();

        // 右目の瞳
        ctx.fillStyle = adjustBrightness('#8b6914', brightness);
        ctx.beginPath();
        ctx.ellipse(screenX + width * 0.08, adjustedY - height * 0.37, width * 0.04, height * 0.05, 0, 0, Math.PI * 2);
        ctx.fill();

        // 右目のハイライト
        ctx.fillStyle = adjustBrightness('#ffffff', brightness * 1.5);
        ctx.beginPath();
        ctx.arc(screenX + width * 0.07, adjustedY - height * 0.39, width * 0.02, 0, Math.PI * 2);
        ctx.fill();
    }

    // まつげ
    ctx.strokeStyle = adjustBrightness('#3d2817', brightness);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX - width * 0.12, adjustedY - height * 0.42);
    ctx.lineTo(screenX - width * 0.14, adjustedY - height * 0.44);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(screenX + width * 0.12, adjustedY - height * 0.42);
    ctx.lineTo(screenX + width * 0.14, adjustedY - height * 0.44);
    ctx.stroke();

    // 頬の赤み
    ctx.fillStyle = adjustBrightness('#ffb6c1', brightness * 0.6);
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(screenX - width * 0.14, adjustedY - height * 0.32, width * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(screenX + width * 0.14, adjustedY - height * 0.32, width * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // 鼻（小さい点）
    ctx.fillStyle = adjustBrightness('#ffb6a0', brightness);
    ctx.beginPath();
    ctx.arc(screenX, adjustedY - height * 0.32, width * 0.015, 0, Math.PI * 2);
    ctx.fill();

    // 口（笑顔）
    ctx.strokeStyle = adjustBrightness('#ff69b4', brightness);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screenX, adjustedY - height * 0.28, width * 0.06, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // ドレス（紫、台形）
    ctx.fillStyle = adjustBrightness('#6a1b9a', brightness);
    ctx.beginPath();
    ctx.moveTo(screenX - width * 0.15, adjustedY - height * 0.15);
    ctx.lineTo(screenX - width * 0.28, adjustedY + height * 0.25);
    ctx.lineTo(screenX + width * 0.28, adjustedY + height * 0.25);
    ctx.lineTo(screenX + width * 0.15, adjustedY - height * 0.15);
    ctx.closePath();
    ctx.fill();

    // ドレスの中心線
    ctx.strokeStyle = adjustBrightness('#4a148c', brightness);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX, adjustedY - height * 0.15);
    ctx.lineTo(screenX, adjustedY + height * 0.25);
    ctx.stroke();

    // 星の模様
    ctx.fillStyle = adjustBrightness('#ffeb3b', brightness);
    drawStar(ctx, screenX - width * 0.15, adjustedY - height * 0.05, width * 0.06, 5);
    drawStar(ctx, screenX + width * 0.12, adjustedY + height * 0.08, width * 0.05, 5);
    drawStar(ctx, screenX - width * 0.08, adjustedY + height * 0.15, width * 0.04, 5);

    // キラキラ（魔法のエフェクト）
    const sparkleTime = (time * 0.003) % (Math.PI * 2);
    if (Math.sin(sparkleTime) > 0.7) {
        ctx.fillStyle = adjustBrightness('#ffeb3b', brightness * 1.5);
        ctx.globalAlpha = Math.sin(sparkleTime);
        drawStar(ctx, screenX - width * 0.35, adjustedY - height * 0.1, width * 0.08, 4);
        ctx.globalAlpha = 1.0;
    }
    if (Math.sin(sparkleTime + Math.PI / 2) > 0.7) {
        ctx.fillStyle = adjustBrightness('#ff69b4', brightness * 1.5);
        ctx.globalAlpha = Math.sin(sparkleTime + Math.PI / 2);
        drawStar(ctx, screenX + width * 0.35, adjustedY + height * 0.05, width * 0.07, 4);
        ctx.globalAlpha = 1.0;
    }
}

function drawStar(ctx, cx, cy, radius, points) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
        const angle = (Math.PI / points) * i - Math.PI / 2;
        const r = i % 2 === 0 ? radius : radius * 0.5;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
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
