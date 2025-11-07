// おばけオブジェクト

export function renderGhost(ctx, screenX, screenY, width, height, distance, time) {
    const brightness = Math.max(0.2, 1 - distance / 15);

    // 浮遊アニメーション
    const floatOffset = Math.sin(time * 0.002 + screenX * 0.01) * 15;
    const adjustedY = screenY + floatOffset;

    // おばけの体（紫色）
    ctx.fillStyle = adjustBrightness('#8a2be2', brightness);
    ctx.globalAlpha = 0.85;

    // 波打つ形
    ctx.beginPath();
    ctx.ellipse(screenX, adjustedY, width * 0.5, height * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // 体の下部（波々）
    for (let i = 0; i < 5; i++) {
        const waveX = screenX - width * 0.4 + (width * 0.8 / 4) * i;
        const waveY = adjustedY + height * 0.4;
        ctx.beginPath();
        ctx.arc(waveX, waveY, width * 0.1, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.globalAlpha = 1.0;

    // 目
    ctx.fillStyle = adjustBrightness('#ffffff', brightness);
    const eyeY = adjustedY - height * 0.15;
    ctx.beginPath();
    ctx.ellipse(screenX - width * 0.15, eyeY, width * 0.12, height * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(screenX + width * 0.15, eyeY, width * 0.12, height * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // 瞳
    ctx.fillStyle = adjustBrightness('#000000', brightness);
    ctx.beginPath();
    ctx.arc(screenX - width * 0.15, eyeY, width * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(screenX + width * 0.15, eyeY, width * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // 口（O型）
    ctx.beginPath();
    ctx.ellipse(screenX, adjustedY + height * 0.15, width * 0.1, height * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
}

function adjustBrightness(color, brightness) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgb(${Math.floor(r * brightness)}, ${Math.floor(g * brightness)}, ${Math.floor(b * brightness)})`;
}
