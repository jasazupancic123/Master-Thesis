type BufItem = { frameNum: number; bmp: ImageBitmap };

export class FrameBitmapBuffer {
  public history: BufItem[] = [];
  private maxLen: number;

  // lazily created on client
  public canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor(maxLen: number) {
    this.maxLen = maxLen;
    // ❌ no `document` here
  }

  private ensureCanvas(doc: Document, video?: HTMLVideoElement): boolean {
    // create once
    if (!this.canvas) {
      const c = doc.createElement('canvas');
      const ctx = c.getContext('2d', { willReadFrequently: true });
      if (!ctx) return false;
      this.canvas = c;
      this.ctx = ctx;
    }
    // size to video if provided
    if (video && video.videoWidth && video.videoHeight) {
      if (
        this.canvas!.width !== video.videoWidth ||
        this.canvas!.height !== video.videoHeight
      ) {
        this.canvas!.width = video.videoWidth;
        this.canvas!.height = video.videoHeight;
      }
    }
    return true;
  }

  setCanvasWidthHeight(doc: Document, video: HTMLVideoElement) {
    this.ensureCanvas(doc, video);
  }

  async insertFrame(frameNum: number, video: HTMLVideoElement, doc: Document) {
    if (!video || video.readyState < 2 || !video.videoWidth) return;
    if (!this.ensureCanvas(doc, video)) return;

    this.ctx!.drawImage(video, 0, 0);

    const bmp = await createImageBitmap(this.canvas!);
    this.history.push({ frameNum, bmp });
    if (this.history.length > this.maxLen) {
      const old = this.history.shift();
      old?.bmp.close?.();
    }
  }

  async toBlobByFrameNum(
    frameNum: number,
    type: 'image/jpeg' | 'image/png' = 'image/jpeg',
    quality = 0.9,
    doc?: Document // only needed for DOM-canvas fallback
  ): Promise<Blob | null> {
    if (!this.history.length) return null;

    // pick nearest
    let best = this.history[0];
    let bestDiff = Math.abs(best.frameNum - frameNum);
    for (let i = 1; i < this.history.length; i++) {
      const d = Math.abs(this.history[i].frameNum - frameNum);
      if (d < bestDiff) {
        best = this.history[i];
        bestDiff = d;
      }
    }

    // OffscreenCanvas if available (no global `window` access)
    if (typeof OffscreenCanvas !== 'undefined') {
      const off = new OffscreenCanvas(best.bmp.width, best.bmp.height);
      const octx = off.getContext('2d')!;
      octx.drawImage(best.bmp, 0, 0);
      return off.convertToBlob({ type, quality });
    }

    // Fallback needs a DOM document
    if (!doc) return null;
    const c = doc.createElement('canvas');
    c.width = best.bmp.width;
    c.height = best.bmp.height;
    c.getContext('2d')!.drawImage(best.bmp, 0, 0);
    return await new Promise<Blob | null>((res) =>
      c.toBlob(res, type, quality)
    );
  }
}
