export class NumberUtil {
  roundToStep(value: number, step: number) {
    return Math.round(value / step) * step;
  }

  formatNumber = (value: number, maximumFractionDigits: number = 2) =>
    value.toLocaleString(undefined, { maximumFractionDigits });
}
