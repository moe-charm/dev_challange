// 黒猫オブジェクト

export function renderCat(ctx, screenX, screenY, width, height, distance, time) {
    const brightness = Math.max(0.2, 1 - distance / 15);

    // しっぽの揺れアニメーション
    const tailSway = Math.sin(time * 0.003) * 0.3;

    // 地面に配置（下部に固定）
    const catY = screenY + height * 0.3;

    // しっぽ（曲線）
    ctx.strokeStyle = adjustBrightness('#0a0a0a', brightness);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(screenX - width * 0.3, catY + height * 0.1);
    ctx.quadraticCurveTo(
        screenX - width * 0.4 + tailSway * width * 0.2,
        catY - height * 0.2,
        screenX - width * 0.35,
        catY - height * 0.4
    );
    ctx.stroke();

    // しっぽの先端（丸）
    ctx.fillStyle = adjustBrightness('#0a0a0a', brightness);
    ctx.beginPath();
    ctx.arc(screenX - width * 0.35, catY - height * 0.4, width * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // 体（楕円形）
    ctx.fillStyle = adjustBrightness('#0a0a0a', brightness);
    ctx.beginPath();
    ctx.ellipse(screenX, catY, width * 0.3, height * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // 頭
    ctx.beginPath();
    ctx.arc(screenX + width * 0.2, catY - height * 0.05, width * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // 耳（三角形）
    ctx.beginPath();
    ctx.moveTo(screenX + width * 0.1, catY - height * 0.15);
    ctx.lineTo(screenX + width * 0.05, catY - height * 0.3);
    ctx.lineTo(screenX + width * 0.15, catY - height * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(screenX + width * 0.25, catY - height * 0.15);
    ctx.lineTo(screenX + width * 0.2, catY - height * 0.3);
    ctx.lineTo(screenX + width * 0.3, catY - height * 0.2);
    ctx.closePath();
    ctx.fill();

    // 耳の内側（ピンク）
    ctx.fillStyle = adjustBrightness('#ff69b4', brightness * 0.8);
    ctx.beginPath();
    ctx.moveTo(screenX + width * 0.1, catY - height * 0.18);
    ctx.lineTo(screenX + width * 0.08, catY - height * 0.25);
    ctx.lineTo(screenX + width * 0.13, catY - height * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(screenX + width * 0.25, catY - height * 0.18);
    ctx.lineTo(screenX + width * 0.23, catY - height * 0.25);
    ctx.lineTo(screenX + width * 0.28, catY - height * 0.2);
    ctx.closePath();
    ctx.fill();

    // 目（光る黄色）
    const eyeBlink = Math.sin(time * 0.002) > 0.95 ? 0.3 : 1; // まばたき
    ctx.fillStyle = adjustBrightness('#ffff00', brightness * 1.5);
    ctx.globalAlpha = eyeBlink;

    // 左目
    ctx.beginPath();
    ctx.ellipse(screenX + width * 0.15, catY - height * 0.08, width * 0.04, height * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();

    // 右目
    ctx.beginPath();
    ctx.ellipse(screenX + width * 0.28, catY - height * 0.08, width * 0.04, height * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();

    // 瞳孔（縦長の楕円）
    ctx.fillStyle = adjustBrightness('#000000', brightness);
    ctx.beginPath();
    ctx.ellipse(screenX + width * 0.15, catY - height * 0.08, width * 0.015, height * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(screenX + width * 0.28, catY - height * 0.08, width * 0.015, height * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1.0;

    // 鼻（ピンク）
    ctx.fillStyle = adjustBrightness('#ff69b4', brightness);
    ctx.beginPath();
    ctx.moveTo(screenX + width * 0.21, catY - height * 0.02);
    ctx.lineTo(screenX + width * 0.19, catY);
    ctx.lineTo(screenX + width * 0.23, catY);
    ctx.closePath();
    ctx.fill();

    // ひげ
    ctx.strokeStyle = adjustBrightness('#4a4a4a', brightness);
    ctx.lineWidth = 1;

    // 左のひげ
    ctx.beginPath();
    ctx.moveTo(screenX + width * 0.1, catY - height * 0.03);
    ctx.lineTo(screenX - width * 0.05, catY - height * 0.05);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(screenX + width * 0.1, catY);
    ctx.lineTo(screenX - width * 0.05, catY);
    ctx.stroke();

    // 右のひげ
    ctx.beginPath();
    ctx.moveTo(screenX + width * 0.32, catY - height * 0.03);
    ctx.lineTo(screenX + width * 0.47, catY - height * 0.05);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(screenX + width * 0.32, catY);
    ctx.lineTo(screenX + width * 0.47, catY);
    ctx.stroke();

    // 足（4本）
    ctx.fillStyle = adjustBrightness('#0a0a0a', brightness);
    ctx.fillRect(screenX - width * 0.2, catY + height * 0.13, width * 0.08, height * 0.15);
    ctx.fillRect(screenX - width * 0.05, catY + height * 0.13, width * 0.08, height * 0.15);
    ctx.fillRect(screenX + width * 0.1, catY + height * 0.13, width * 0.08, height * 0.15);
    ctx.fillRect(screenX + width * 0.25, catY + height * 0.13, width * 0.08, height * 0.15);
}

function adjustBrightness(color, brightness) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgb(${Math.floor(r * brightness)}, ${Math.floor(g * brightness)}, ${Math.floor(b * brightness)})`;
}
