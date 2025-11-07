// コウモリオブジェクト

export function renderBat(ctx, screenX, screenY, width, height, distance, time) {
    const brightness = Math.max(0.2, 1 - distance / 15);

    // 羽ばたきアニメーション
    const flapSpeed = 0.01;
    const flapCycle = Math.sin(time * flapSpeed);
    const wingAngle = flapCycle * 0.5; // -0.5 から 0.5

    // 飛行の上下移動
    const flyOffset = Math.sin(time * 0.003 + screenX * 0.02) * 20;
    const adjustedY = screenY + flyOffset;

    // 体（楕円形）
    ctx.fillStyle = adjustBrightness('#1a1a1a', brightness);
    ctx.beginPath();
    ctx.ellipse(screenX, adjustedY, width * 0.15, height * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 頭
    ctx.beginPath();
    ctx.arc(screenX, adjustedY - height * 0.15, width * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // 耳（尖った三角形）
    ctx.beginPath();
    ctx.moveTo(screenX - width * 0.08, adjustedY - height * 0.2);
    ctx.lineTo(screenX - width * 0.12, adjustedY - height * 0.3);
    ctx.lineTo(screenX - width * 0.05, adjustedY - height * 0.22);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(screenX + width * 0.08, adjustedY - height * 0.2);
    ctx.lineTo(screenX + width * 0.12, adjustedY - height * 0.3);
    ctx.lineTo(screenX + width * 0.05, adjustedY - height * 0.22);
    ctx.closePath();
    ctx.fill();

    // 目（赤く光る）
    ctx.fillStyle = adjustBrightness('#ff0000', brightness * 1.5);
    ctx.beginPath();
    ctx.arc(screenX - width * 0.05, adjustedY - height * 0.17, width * 0.02, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(screenX + width * 0.05, adjustedY - height * 0.17, width * 0.02, 0, Math.PI * 2);
    ctx.fill();

    // 左の翼
    ctx.fillStyle = adjustBrightness('#2a2a2a', brightness);
    ctx.beginPath();
    ctx.moveTo(screenX - width * 0.1, adjustedY);

    // 翼の先端（羽ばたきで角度変化）
    const leftWingTipX = screenX - width * 0.5;
    const leftWingTipY = adjustedY - height * 0.1 + wingAngle * height * 0.3;

    ctx.quadraticCurveTo(
        screenX - width * 0.25, adjustedY - height * 0.15 + wingAngle * height * 0.2,
        leftWingTipX, leftWingTipY
    );

    // 翼の下部
    ctx.quadraticCurveTo(
        screenX - width * 0.3, adjustedY + height * 0.1,
        screenX - width * 0.1, adjustedY + height * 0.05
    );
    ctx.closePath();
    ctx.fill();

    // 翼の骨格（指）
    ctx.strokeStyle = adjustBrightness('#1a1a1a', brightness);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(screenX - width * 0.1, adjustedY);
    ctx.lineTo(leftWingTipX, leftWingTipY);
    ctx.stroke();

    // 右の翼
    ctx.fillStyle = adjustBrightness('#2a2a2a', brightness);
    ctx.beginPath();
    ctx.moveTo(screenX + width * 0.1, adjustedY);

    const rightWingTipX = screenX + width * 0.5;
    const rightWingTipY = adjustedY - height * 0.1 + wingAngle * height * 0.3;

    ctx.quadraticCurveTo(
        screenX + width * 0.25, adjustedY - height * 0.15 + wingAngle * height * 0.2,
        rightWingTipX, rightWingTipY
    );

    ctx.quadraticCurveTo(
        screenX + width * 0.3, adjustedY + height * 0.1,
        screenX + width * 0.1, adjustedY + height * 0.05
    );
    ctx.closePath();
    ctx.fill();

    // 右翼の骨格
    ctx.beginPath();
    ctx.moveTo(screenX + width * 0.1, adjustedY);
    ctx.lineTo(rightWingTipX, rightWingTipY);
    ctx.stroke();
}

function adjustBrightness(color, brightness) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `rgb(${Math.floor(r * brightness)}, ${Math.floor(g * brightness)}, ${Math.floor(b * brightness)})`;
}
