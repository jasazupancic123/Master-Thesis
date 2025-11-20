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

  calculatePercentageDiff(
    value1: number | null | undefined,
    value2: number | null | undefined
  ): number | null {
    if (
      value1 === null ||
      value1 === undefined ||
      value2 === null ||
      value2 === undefined
    )
      return null;

    if (value2 === 0) return value1;

    const diff = ((value1 - value2) / value2) * 100;
    return diff;
  }
}
