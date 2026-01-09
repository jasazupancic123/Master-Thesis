import * as ort from 'onnxruntime-web';
import { OrtScratch } from '../type/ort-scratch.type';

export class ModelUtil {
  private static _instance: ModelUtil;

  private constructor() {}

  static get instance(): ModelUtil {
    if (!ModelUtil._instance) ModelUtil._instance = new ModelUtil();
    return ModelUtil._instance;
  }

  videoToOrtInputNHWC(
    video: HTMLVideoElement,
    inputSize: number,
    scratch: OrtScratch | null
  ) {
    // Reuse objects to avoid GC
    const canvas = scratch?.canvas ?? document.createElement('canvas');
    canvas.width = inputSize;
    canvas.height = inputSize;

    const ctx =
      scratch?.ctx ?? canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(video, 0, 0, inputSize, inputSize);

    // Read pixels
    const img = ctx.getImageData(0, 0, inputSize, inputSize).data; // Uint8ClampedArray RGBA
    const size = inputSize * inputSize * 3;

    const data = scratch?.data ?? new Float32Array(size);

    // RGBA -> RGB float32 [0..1]
    // NHWC layout: [y][x][c]
    let j = 0;
    for (let i = 0; i < img.length; i += 4) {
      data[j++] = img[i] / 255; // R
      data[j++] = img[i + 1] / 255; // G
      data[j++] = img[i + 2] / 255; // B
    }

    const tensor = new ort.Tensor('float32', data, [
      1,
      3,
      inputSize,
      inputSize,
    ]);

    return { tensor, scratch: { canvas, ctx, data } };
  }
}
