import { Step } from '@/common/enum/step.enum';

type Landmark = { x: number; y: number };
type Scored = Landmark & { _score: number };

export const playSuccessSound = () => {
  const audio = new Audio('/sounds/face-recognition-success.wav');
  audio.play().catch(() => {});
};

// Load Mediapipe Tasks Vision dynamically in the browser
export async function createDetector(baseAssetUrl: string, modelUrl: string) {
  const vision = await import('@mediapipe/tasks-vision');
  const { FaceLandmarker, FilesetResolver } = vision;
  const filesetResolver = await FilesetResolver.forVisionTasks(baseAssetUrl);
  const detector = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath: modelUrl,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numFaces: 1,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  });
  return detector;
}

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

// ====== Helper math for pose checks ======
export function computeBBoxFromLandmarks(
  landmarks: { x: number; y: number }[]
) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const lm of landmarks) {
    if (lm.x < minX) minX = lm.x;
    if (lm.y < minY) minY = lm.y;
    if (lm.x > maxX) maxX = lm.x;
    if (lm.y > maxY) maxY = lm.y;
  }
  return {
    minX,
    minY,
    maxX,
    maxY,
    w: maxX - minX,
    h: maxY - minY,
    cx: (minX + maxX) / 2,
    cy: (minY + maxY) / 2,
  };
}

export function estimateYawFromNose(landmarks: Landmark[]): number {
  const bbox = computeBBoxFromLandmarks(landmarks);

  const noseFromIndex: Landmark | undefined = landmarks[1];

  const scoredBest: Scored | null = noseFromIndex
    ? null
    : landmarks.reduce<Scored | null>((best, p) => {
        const score = Math.abs(p.x - bbox.cx) + Math.abs(p.y - bbox.cy);
        if (best === null || score < best._score) {
          return { ...p, _score: score };
        }
        return best;
      }, null);

  const nose: Landmark = noseFromIndex ?? scoredBest ?? landmarks[0];

  const offset = (nose.x - bbox.cx) / Math.max(0.0001, bbox.w);
  return offset * 90; // heuristic degrees
}

// ====== Guide skeletons ======
export function drawGuide(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  step: Step,
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
  if (step === Step.FRONT) {
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  } else if (step === Step.RIGHT) {
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

  if (step === Step.FRONT) {
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
    : step === Step.FRONT
      ? 'Face forward'
      : step === Step.RIGHT
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
