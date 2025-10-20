export class NumberUtil {
  roundToStep(value: number, step: number) {
    return Math.round(value / step) * step;
  }
}
