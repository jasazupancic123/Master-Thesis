import { theme } from '@/app/style';
import { Point2D } from '@/lib/pose-detection/type/point.type';
import { alpha } from '@mui/material';

export class CanvasUtil {
  // ---- draw torso guide lines ----
  drawLine = (
    ctx: CanvasRenderingContext2D,
    a: { x: number; y: number },
    b: { x: number; y: number },
    color: string
  ) => {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineWidth = 4;
    ctx.strokeStyle = color;
    ctx.stroke();
  };

  drawCircle = (
    ctx: CanvasRenderingContext2D,
    c: { x: number; y: number },
    r: number,
    color: string,
    borderColor?: string
  ) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, 2 * Math.PI);

    // fill first
    ctx.fillStyle = color;
    ctx.fill();

    // then stroke on top
    if (borderColor) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = borderColor;
      ctx.stroke();
    }
    ctx.restore();
  };

  drawRadar(
    origin: Point2D,
    start: Point2D,
    dynamic: Point2D,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    color: string
  ) {
    // scale (kept as in your code)
    origin.x *= canvas.width;
    origin.y *= canvas.height;
    start.x *= canvas.width;
    start.y *= canvas.height;
    dynamic.x *= canvas.width;
    dynamic.y *= canvas.height;

    // angles from origin to the two rays
    const a1 = Math.atan2(start.y - origin.y, start.x - origin.x);
    const a2 = Math.atan2(dynamic.y - origin.y, dynamic.x - origin.x);

    const dist = (p: Point2D) => Math.hypot(p.x - origin.x, p.y - origin.y);
    const r = Math.max(dist(start), dist(dynamic));

    const startProj = {
      x: origin.x + r * Math.cos(a1),
      y: origin.y + r * Math.sin(a1),
    };

    const angleDiff = (from: number, to: number) => {
      let d = (to - from) % (Math.PI * 2);
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      return d;
    };
    const d = angleDiff(a1, a2);
    const anticlockwise = d < 0;

    ctx.save();
    ctx.beginPath();

    // origin -> start ray
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(startProj.x, startProj.y);

    // circular top edge from start to dynamic around the origin
    ctx.arc(origin.x, origin.y, r, a1, a1 + d, anticlockwise);

    // close back to origin
    ctx.lineTo(origin.x, origin.y);
    ctx.closePath();

    // fill @ 50% and outline
    ctx.fillStyle = alpha(color, 0.5);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.restore();
  }
}
