export class NumberUtil {
  roundToStep(value: number, step: number) {
    return Math.round(value / step) * step;
  }

  roundToDecimal(value: number, decimalPlaces: number) {
    const factor = Math.pow(10, decimalPlaces);
    return Math.round(value * factor) / factor;
  }

  formatNumber = (value: number, maximumFractionDigits: number = 2) =>
    value.toLocaleString(undefined, { maximumFractionDigits });
}
