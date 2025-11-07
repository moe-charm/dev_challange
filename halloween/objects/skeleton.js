// 骸骨オブジェクト

export function renderSkeleton(ctx, screenX, screenY, width, height, distance, time) {
    const brightness = Math.max(0.2, 1 - distance / 15);

    // 揺れるアニメーション（カタカタ）
    const rattle = Math.sin(time * 0.01) * 2;
    const adjustedX = screenX + rattle;

    // 頭蓋骨
    ctx.fillStyle = adjustBrightness('#e8e8e8', brightness);
    ctx.beginPath();
    ctx.ellipse(adjustedX, screenY - height * 0.35, width * 0.22, height * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // 頭蓋骨の輪郭を強調
    ctx.strokeStyle = adjustBrightness('#c0c0c0', brightness);
    ctx.lineWidth = 2;
    ctx.stroke();

    // 目の穴（暗い）
    ctx.fillStyle = adjustBrightness('#1a1a1a', brightness);
    ctx.beginPath();
    ctx.ellipse(adjustedX - width * 0.1, screenY - height * 0.38, width * 0.08, height * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(adjustedX + width * 0.1, screenY - height * 0.38, width * 0.08, height * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 目の穴の中に光る点（不気味な光）
    ctx.fillStyle = adjustBrightness('#00ff00', brightness * 1.5);
    ctx.beginPath();
    ctx.arc(adjustedX - width * 0.1, screenY - height * 0.38, width * 0.03, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(adjustedX + width * 0.1, screenY - height * 0.38, width * 0.03, 0, Math.PI * 2);
    ctx.fill();

    // 鼻の穴（三角形）
    ctx.fillStyle = adjustBrightness('#1a1a1a', brightness);
    ctx.beginPath();
    ctx.moveTo(adjustedX, screenY - height * 0.28);
    ctx.lineTo(adjustedX - width * 0.04, screenY - height * 0.22);
    ctx.lineTo(adjustedX + width * 0.04, screenY - height * 0.22);
    ctx.closePath();
    ctx.fill();

    // 歯（上下）
    ctx.fillStyle = adjustBrightness('#ffffff', brightness);
    const toothWidth = width * 0.05;
    const toothCount = 5;
    for (let i = 0; i < toothCount; i++) {
        const toothX = adjustedX - width * 0.12 + (i * toothWidth * 1.1);
        // 上の歯
        ctx.fillRect(toothX, screenY - height * 0.15, toothWidth, height * 0.08);
        // 下の歯
        ctx.fillRect(toothX, screenY - height * 0.07, toothWidth, height * 0.08);
    }

    // 首の骨（椎骨）
    ctx.fillStyle = adjustBrightness('#d0d0d0', brightness);
    ctx.fillRect(adjustedX - width * 0.08, screenY - height * 0.08, width * 0.16, height * 0.12);

    // 肋骨の枠
    ctx.strokeStyle = adjustBrightness('#c0c0c0', brightness);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(adjustedX, screenY + height * 0.15, width * 0.25, height * 0.25, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 肋骨（横線）
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
        const ribY = screenY + height * 0.05 + (i * height * 0.08);
        ctx.beginPath();
        ctx.moveTo(adjustedX - width * 0.2, ribY);
        ctx.lineTo(adjustedX + width * 0.2, ribY);
        ctx.stroke();
    }

    // 背骨（縦線）
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(adjustedX, screenY);
    ctx.lineTo(adjustedX, screenY + height * 0.4);
    ctx.stroke();

    // 左腕
    ctx.strokeStyle = adjustBrightness('#d0d0d0', brightness);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(adjustedX - width * 0.18, screenY + height * 0.05);
    ctx.lineTo(adjustedX - width * 0.35, screenY + height * 0.15);
    ctx.lineTo(adjustedX - width * 0.4, screenY + height * 0.35);
    ctx.stroke();

    // 左手
    ctx.fillStyle = adjustBrightness('#e8e8e8', brightness);
    ctx.beginPath();
    ctx.arc(adjustedX - width * 0.4, screenY + height * 0.35, width * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = adjustBrightness('#c0c0c0', brightness);
    ctx.lineWidth = 2;
    ctx.stroke();

    // 左手の指
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        const angle = (i - 1) * 0.3;
        ctx.beginPath();
        ctx.moveTo(adjustedX - width * 0.4, screenY + height * 0.35);
        ctx.lineTo(
            adjustedX - width * 0.4 + Math.cos(angle + Math.PI / 2) * width * 0.12,
            screenY + height * 0.35 + Math.sin(angle + Math.PI / 2) * width * 0.12
        );
        ctx.stroke();
    }

    // 右腕
    ctx.strokeStyle = adjustBrightness('#d0d0d0', brightness);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(adjustedX + width * 0.18, screenY + height * 0.05);
    ctx.lineTo(adjustedX + width * 0.35, screenY + height * 0.15);
    ctx.lineTo(adjustedX + width * 0.4, screenY + height * 0.35);
    ctx.stroke();

    // 右手
    ctx.fillStyle = adjustBrightness('#e8e8e8', brightness);
    ctx.beginPath();
    ctx.arc(adjustedX + width * 0.4, screenY + height * 0.35, width * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = adjustBrightness('#c0c0c0', brightness);
    ctx.lineWidth = 2;
    ctx.stroke();

    // 右手の指
    for (let i = 0; i < 3; i++) {
        const angle = (i - 1) * 0.3;
        ctx.beginPath();
        ctx.moveTo(adjustedX + width * 0.4, screenY + height * 0.35);
        ctx.lineTo(
            adjustedX + width * 0.4 + Math.cos(angle + Math.PI / 2) * width * 0.12,
            screenY + height * 0.35 + Math.sin(angle + Math.PI / 2) * width * 0.12
        );
        ctx.stroke();
    }

    // 腰骨
    ctx.fillStyle = adjustBrightness('#d0d0d0', brightness);
    ctx.beginPath();
    ctx.ellipse(adjustedX, screenY + height * 0.42, width * 0.2, height * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = adjustBrightness('#c0c0c0', brightness);
    ctx.lineWidth = 2;
    ctx.stroke();
}

function adjustBrightness(color, brightness) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgb(${Math.floor(r * brightness)}, ${Math.floor(g * brightness)}, ${Math.floor(b * brightness)})`;
}
