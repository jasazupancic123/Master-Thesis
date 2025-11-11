import { Point2D } from '../type/point.type';

export class AngleUtil {
  private static _instance: AngleUtil;

  private constructor() {}

  static get instance(): AngleUtil {
    if (!AngleUtil._instance) AngleUtil._instance = new AngleUtil();
    return AngleUtil._instance;
  }

  /**
   *
   * @param point1
   * @param point2
   * @param origin
   * @returns The angle at point origin, normalized between 0 and 180, or null
   */
  calculateAngle(
    point1: Point2D,
    point2: Point2D,
    origin: Point2D
  ): number | null {
    const vector1 = {
      x: point1.x - origin.x,
      y: point1.y - origin.y,
    };

    const vector2 = {
      x: point2.x - origin.x,
      y: point2.y - origin.y,
    };

    const m1 = Math.hypot(vector1.x, vector1.y);
    const m2 = Math.hypot(vector2.x, vector2.y);

    if (m1 === 0 || m2 === 0) return null; // degenerate (overlapping points)

    const dot = vector1.x * vector2.x + vector1.y * vector2.y;

    const cos = Math.min(1, Math.max(-1, dot / (m1 * m2))); // clamp for FP error return Math.acos(cos) * (180 / Math.PI); // 0..180

    const deg = Math.acos(cos) * (180 / Math.PI); // 0..180

    // cos gets fliped when angle is 96 and cos is -0.1 -> then angle is 84 and cos is 0.1

    return deg;
  }
}
