import { FaceCaptureStep } from '@/core/profile/enum/face-capture-step.enum';

export function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
  const { clientWidth, clientHeight } = canvas;
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const displayWidth = Math.floor(clientWidth * dpr);
  const displayHeight = Math.floor(clientHeight * dpr);
  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
}

// ====== Guide skeletons ======
export function drawGuide(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  step: FaceCaptureStep,
  faceBigEnough: boolean
) {
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.setLineDash([6, 8]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.globalAlpha = 0.9;

  const cx = w / 2;
  const cy = h / 2;
  const rx = Math.min(w, h) * 0.27;
  const ry = rx * 1.25;

  ctx.beginPath();
  if (step === FaceCaptureStep.FRONT) {
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  } else if (step === FaceCaptureStep.RIGHT) {
    ctx.ellipse(cx + rx * 0.15, cy, rx, ry, 0, -Math.PI / 2, Math.PI / 2);
    ctx.moveTo(cx + rx * 0.9, cy);
    ctx.lineTo(cx + rx * 1.05, cy);
  } else {
    // left
    ctx.ellipse(cx - rx * 0.15, cy, rx, ry, 0, Math.PI / 2, -Math.PI / 2);
    ctx.moveTo(cx - rx * 0.9, cy);
    ctx.lineTo(cx - rx * 1.05, cy);
  }
  ctx.stroke();

  if (step === FaceCaptureStep.FRONT) {
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    const eyeOffsetX = rx * 0.45;
    const eyeY = cy - ry * 0.15;
    for (const x of [cx - eyeOffsetX, cx + eyeOffsetX]) {
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(x + i * 6, eyeY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const mouthY = cy + ry * 0.35;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(cx + i * 6, mouthY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.font = '600 16px ui-sans-serif, system-ui, -apple-system';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.globalAlpha = 0.95;
  const label = !faceBigEnough
    ? 'Bring your face closer'
    : step === FaceCaptureStep.FRONT
      ? 'Face forward'
      : step === FaceCaptureStep.RIGHT
        ? 'Turn LEFT (show right profile)'
        : 'Turn RIGHT (show left profile)';

  return label;
}

export function drawProgress(
  ctx: CanvasRenderingContext2D,
  w: number,
  p: number
) {
  const l = 24;
  const cx = l + 16;
  const cy = l + 16;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, l, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();
  ctx.beginPath();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#00FFC2';
  ctx.arc(
    cx,
    cy,
    l - 4,
    -Math.PI / 2,
    -Math.PI / 2 + Math.PI * 2 * Math.min(1, Math.max(0, p))
  );
  ctx.stroke();
  ctx.restore();
}
