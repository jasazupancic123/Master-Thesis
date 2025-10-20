export class PoseDetectionUIUtil {
  static normalizeValue(
    currentUnNormalizedValue: number,
    min: number,
    max: number
  ) {
    if (max - min === 0) return 0;
    return (currentUnNormalizedValue - min) / (max - min);
  }
}
