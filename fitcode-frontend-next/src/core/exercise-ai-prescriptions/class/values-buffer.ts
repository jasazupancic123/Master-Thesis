export class ValuesBuffer {
  values: number[];
  normalizedValues: number[];
  bufferLength?: number;

  constructor(bufferLength?: number) {
    this.values = [];
    this.normalizedValues = [];
    this.bufferLength = bufferLength;
  }

  insertFrame(
    value: number,
    avgFps?: { value: number; count: number } | null,
    numSeconds?: number,
    normalize = true
  ) {
    this.values.push(value);

    // Calculate new buffer length based on fps and numSeconds
    if (avgFps && numSeconds && avgFps.count > 10) {
      const maxBufferLength = Math.ceil(avgFps.value * numSeconds);
      this.bufferLength = maxBufferLength;
    }

    if (this.bufferLength && this.values.length > this.bufferLength)
      this.values.shift();

    if (normalize) this.normalizeBuffer(this.values);
  }

  private normalizeBuffer(values: number[]) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    if (max - min === 0) return values.map(() => 0);
    this.normalizedValues = values.map((v) => (v - min) / (max - min));
  }
}
