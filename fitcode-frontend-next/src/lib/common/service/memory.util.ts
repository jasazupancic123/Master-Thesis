import * as tf from '@tensorflow/tfjs';

export type MemSample = {
  t: number;
  tfBytes?: number;
  heapBytes?: number;
  totalBytes?: number;
};

export class MemoryUtil {
  logHeap(label: string) {
    // @ts-expect-error Chrome only
    const pm = performance.memory;
    if (!pm) return;
    console.log(
      `[${label}] heap used=${(pm.usedJSHeapSize / 1e6).toFixed(1)}MB / total=${(pm.totalJSHeapSize / 1e6).toFixed(1)}MB`
    );
  }

  logTfMem(label: string) {
    const m = tf.memory();
    console.log(
      `[${label}] tf tensors=${m.numTensors}, bytes=${(m.numBytes / 1000000).toFixed(1)}MB, unreliable=${m.unreliable}`
    );
  }

  async sampleMemory(): Promise<MemSample> {
    const s: MemSample = { t: performance.now() };

    // TFJS tensor memory (only meaningful for TFJS models)
    try {
      const mem = (tf as any).memory?.();
      if (mem) s.tfBytes = mem.numBytes;
    } catch {}

    // JS heap (Chrome)
    const pm = (performance as any).memory;
    if (pm) s.heapBytes = pm.usedJSHeapSize;

    // Total memory (if supported)
    // @ts-ignore
    if (performance.measureUserAgentSpecificMemory) {
      // @ts-ignore
      const res = await performance.measureUserAgentSpecificMemory();
      s.totalBytes = res.bytes;
    }

    return s;
  }
}
