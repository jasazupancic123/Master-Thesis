// reps-graph.service.ts
'use client';

import type { KeypointHistory } from './class/keypoint-history';
import type { KeypointId } from './enum/keypoint-id';
import type { KeypointValueType } from './enum/keypoint-value-type';
import type { RecordedReps, Rep } from './types/rep.type';
import { KeypointUtil } from './util/keypoint.util';

export class RepsGraphService {
  // ---------- palette ----------
  static palette = {
    start: '#F3A712',
    background: '#111111',
    extreme: '#F22B29',
    extremeToEnd: '#3F88C5',
    end: '#16DB65',
    default: '#F0F6F6',
    atExtremumStart: '#ec1fffff',
    atExtremumEnd: '#eaff00ff',
  };

  // ---------- public API ----------

  /**
   * Builds one chart per rep, renders all via QuickChart, and:
   *  - if combine = true: tries to combine into a single tall PNG.
   *  - otherwise: downloads one PNG per rep.
   *
   * If combine=true fails for any reason, it falls back to multiple files.
   */
  static async downloadReps(
    state: {
      recordedRepsRef: React.RefObject<RecordedReps>;
      keypointId: KeypointId;
      valueType: KeypointValueType;
      constantKeypointHistory: KeypointHistory;
      smooth?: boolean;
    },
    opts?: {
      filenameBase?: string; // base name for files
      width?: number;
      height?: number;
      backgroundColor?: string;
      combine?: boolean; // default true
      spacing?: number; // px between charts when combining
      useGetUrl?: boolean; // default false (POST is safer for big configs)
    }
  ) {
    const {
      filenameBase = 'reps-graph',
      width = 1000,
      height = 500,
      backgroundColor = RepsGraphService.palette.background,
      combine = true,
      spacing = 24,
      useGetUrl = false,
    } = opts ?? {};

    const { configs: perRepConfigs, chunksLength } =
      this.buildConfigsPerRep(state);
    if (perRepConfigs.length === 0) return;

    // Fetch PNG blobs for each rep
    const blobs = await Promise.all(
      perRepConfigs.map((cfg, i) =>
        this.fetchChartPngBlob(cfg, {
          width,
          height,
          backgroundColor,
          useGetUrl,
        }).catch((e) => {
          console.log(`Failed to render rep ${i + 1}:`, e);
          return null as unknown as Blob;
        })
      )
    );

    const validBlobs = blobs.filter(Boolean) as Blob[];
    if (!validBlobs.length) {
      throw new Error('Failed to render all rep charts.');
    }

    // Try to combine into one image (if requested)
    if (combine) {
      try {
        const combinedBlob = await this.combinePngsVertically(
          validBlobs,
          {
            width,
            height,
            spacing,
            backgroundColor,
          },
          { historyChunkCount: chunksLength }
        );
        this.downloadBlob(
          combinedBlob,
          `${filenameBase}_all_${state.keypointId}_${state.smooth ? '_smooth' : ''}.png`
        );
        return;
      } catch (err) {
        console.warn(
          'Combine failed, falling back to individual downloads:',
          err
        );
      }
    }

    // Fallback: individual files
    await this.downloadEach(validBlobs, filenameBase);
  }

  /**
   * Always download one PNG per rep (no combining).
   */
  static async downloadEachRepPNG(
    state: {
      recordedRepsRef: React.RefObject<RecordedReps>;
      keypointId: KeypointId;
      valueType: KeypointValueType;
      constantKeypointHistory: KeypointHistory;
      smooth?: boolean;
    },
    opts?: {
      filenameBase?: string;
      width?: number;
      height?: number;
      backgroundColor?: string;
      useGetUrl?: boolean;
    }
  ) {
    const {
      filenameBase = 'reps-graph',
      width = 1000,
      height = 500,
      backgroundColor = RepsGraphService.palette.background,
      useGetUrl = false,
    } = opts ?? {};

    const { configs: perRepConfigs } = this.buildConfigsPerRep(state);
    if (!perRepConfigs.length) return;

    const blobs = await Promise.all(
      perRepConfigs.map((cfg) =>
        this.fetchChartPngBlob(cfg, {
          width,
          height,
          backgroundColor,
          useGetUrl,
        })
      )
    );

    await this.downloadEach(blobs, filenameBase);
  }

  /**
   * Always attempt to combine all reps into one tall PNG (throws on failure).
   */
  static async downloadCombinedPNG(
    state: {
      recordedRepsRef: React.RefObject<RecordedReps>;
      keypointId: KeypointId;
      valueType: KeypointValueType;
      constantKeypointHistory: KeypointHistory;
      smooth?: boolean;
    },
    opts?: {
      filename?: string;
      width?: number;
      height?: number;
      backgroundColor?: string;
      spacing?: number;
      useGetUrl?: boolean;
    }
  ) {
    const {
      filename = 'reps-graph_all.png',
      width = 1000,
      height = 500,
      backgroundColor = RepsGraphService.palette.background,
      spacing = 24,
      useGetUrl = false,
    } = opts ?? {};

    const { configs: perRepConfigs, chunksLength } =
      this.buildConfigsPerRep(state);
    if (!perRepConfigs.length) return;

    const blobs = await Promise.all(
      perRepConfigs.map((cfg) =>
        this.fetchChartPngBlob(cfg, {
          width,
          height,
          backgroundColor,
          useGetUrl,
        })
      )
    );

    const combined = await this.combinePngsVertically(
      blobs,
      {
        width,
        height,
        spacing,
        backgroundColor,
      },
      { historyChunkCount: chunksLength }
    );

    this.downloadBlob(combined, filename);
  }

  // ---------- config builders ----------

  /**
   * Returns a Chart.js config per rep (one dataset each).
   */
  static buildConfigsPerRep(state: {
    recordedRepsRef: React.RefObject<RecordedReps>;
    keypointId: KeypointId;
    valueType: KeypointValueType;
    constantKeypointHistory: KeypointHistory;
    smooth?: boolean;
  }) {
    const {
      recordedRepsRef,
      keypointId,
      valueType,
      constantKeypointHistory,
      smooth,
    } = state;
    const reps = recordedRepsRef.current ?? [];
    const configs: any[] = [];

    reps.left.forEach((rep, idx) => {
      const points = rep.buffer
        .getHistoryById(keypointId)
        .map((k) => {
          const v = KeypointUtil.getKeypointValueByType(k, valueType);
          if (v === null) return undefined;

          const color =
            k.capturedAt === rep.startTimestamp
              ? this.palette.start
              : k.capturedAt === rep.extremeTimestamp
                ? this.palette.extreme
                : k.capturedAt === rep.extremeToEndTimestamp
                  ? this.palette.extremeToEnd
                  : k.capturedAt === rep.endValueTimestamp
                    ? this.palette.end
                    : k.capturedAt === rep.timeAtExtremumStartTimestamp
                      ? this.palette.atExtremumStart
                      : k.capturedAt === rep.timeAtExtremumEndTimestamp
                        ? this.palette.atExtremumEnd
                        : this.palette.default;

          const ts =
            typeof k.capturedAt === 'number'
              ? k.capturedAt
              : (k.capturedAt?.getTime?.() ?? 0);

          return { value: v as number, color, ts: ts as number };
        })
        .filter(Boolean) as { value: number; color: string; ts: number }[];

      if (!points.length) return;

      // simple index labels; switch to timestamp formatting if you prefer
      const labels: (string | number)[] = Array.from(
        { length: points.length },
        (_, i) => i
      );

      const dataset = {
        type: 'line',
        label: `Rep ${idx + 1}`,
        data: points.map((p) => p.value),
        borderWidth: 2,
        borderColor: '#3F88C5',
        tension: 0.25,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 4,
        pointBackgroundColor: points.map((p) => p.color),
        pointBorderColor: points.map((p) => p.color),
      };

      const config = {
        type: 'line',
        data: { labels, datasets: [dataset] },
        options: {
          responsive: false,
          animation: false,
          plugins: {
            legend: { display: true, labels: { color: this.palette.default } },
            title: {
              display: true,
              text: `Reps Graph - Rep ${idx + 1}`,
              color: this.palette.default,
              font: { size: 16, weight: '600' },
            },
          },
          scales: {
            x: {
              grid: { color: 'rgba(240,246,246,0.15)' },
              ticks: { color: this.palette.default },
            },
            y: {
              grid: { color: 'rgba(240,246,246,0.15)' },
              ticks: { color: this.palette.default },
            },
          },
        },
      };

      configs.push(config);
    });

    // make chunks of length 400 of constantKeypointHistory

    const chunkSize = 250;
    const chunks = [];
    for (
      let i = 0;
      i < constantKeypointHistory.history.length;
      i += chunkSize
    ) {
      chunks.push(constantKeypointHistory.history.slice(i, i + chunkSize));
    }

    const allPointsValues: number[] = [];

    chunks.forEach((chunk, chunkIdx) => {
      const points = chunk
        .map((c) => c.find((k) => k.id === keypointId))
        .filter((k) => k !== null && k !== undefined)
        .map((k) => {
          const v = KeypointUtil.getKeypointValueByType(k, valueType);
          if (v === null) return undefined;

          const color = reps.left.some(
            (rep) => k.capturedAt === rep.startTimestamp
          )
            ? this.palette.start
            : reps.left.some((rep) => k.capturedAt === rep.extremeTimestamp)
              ? this.palette.extreme
              : reps.left.some(
                    (rep) => k.capturedAt === rep.extremeToEndTimestamp
                  )
                ? this.palette.extremeToEnd
                : reps.left.some(
                      (rep) => k.capturedAt === rep.endValueTimestamp
                    )
                  ? this.palette.end
                  : reps.left.some(
                        (rep) =>
                          k.capturedAt === rep.timeAtExtremumStartTimestamp
                      )
                    ? this.palette.atExtremumStart
                    : reps.left.some(
                          (rep) =>
                            k.capturedAt === rep.timeAtExtremumEndTimestamp
                        )
                      ? this.palette.atExtremumEnd
                      : this.palette.default;

          const ts =
            typeof k.capturedAt === 'number'
              ? k.capturedAt
              : (k.capturedAt?.getTime?.() ?? 0);

          return { value: v as number, color, ts: ts as number };
        })
        .filter(Boolean) as { value: number; color: string; ts: number }[];

      if (!points.length) return;

      // SMOOTH VALUES
      if (smooth) {
        const smoothedValues = KeypointUtil.smoothKeypointValues(
          points.map((p) => p.value),
          undefined,
          13,
          2
        );

        // apply smoothed values to points
        smoothedValues.forEach((sv, i) => {
          points[i].value = sv as number;
        });
      }

      allPointsValues.push(...points.map((p) => p.value));

      // simple index labels; switch to timestamp formatting if you prefer
      const labels: (string | number)[] = Array.from(
        { length: points.length },
        (_, i) => i
      );

      const dataset = {
        type: 'line',
        label: `Whole Exercise (part ${chunkIdx + 1})`,
        data: points.map((p) => p.value),
        borderWidth: 2,
        borderColor: '#3F88C5',
        tension: 0.25,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 4,
        pointBackgroundColor: points.map((p) => p.color),
        pointBorderColor: points.map((p) => p.color),
      };

      const config = {
        type: 'line',
        data: { labels, datasets: [dataset] },
        options: {
          responsive: false,
          animation: false,
          plugins: {
            legend: { display: true, labels: { color: this.palette.default } },
            title: {
              display: true,
              text: `Reps Graph - Whole Exercise (part ${chunkIdx + 1})`,
              color: this.palette.default,
              font: { size: 16, weight: '600' },
            },
          },
          scales: {
            x: {
              grid: { color: 'rgba(240,246,246,0.15)' },
              ticks: { color: this.palette.default },
            },
            y: {
              grid: { color: 'rgba(240,246,246,0.15)' },
              ticks: { color: this.palette.default },
            },
          },
        },
      };

      configs.push(config);
    });

    // after you've finished filling allPointsValues

    // function downloadCSV(filename: string, text: string) {
    //   const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    //   const url = URL.createObjectURL(blob);
    //   const a = document.createElement('a');
    //   a.href = url;
    //   a.download = filename;
    //   document.body.appendChild(a);
    //   a.click();
    //   a.remove();
    //   URL.revokeObjectURL(url);
    // }

    // const csv = allPointsValues.map((v) => String(v)).join('\n') + '\n'; // newline at end is nice-to-have
    // downloadCSV('all_points.csv', csv);

    return { configs, chunksLength: chunks.length };
  }

  // ---------- rendering via QuickChart ----------

  static buildQuickChartURL(
    config: any,
    width = 1000,
    height = 500,
    backgroundColor = RepsGraphService.palette.background
  ) {
    const base = 'https://quickchart.io/chart';
    const c = encodeURIComponent(JSON.stringify(config));
    const bg = encodeURIComponent(backgroundColor);
    return `${base}?c=${c}&width=${width}&height=${height}&backgroundColor=${bg}`;
  }

  static async fetchChartPngBlob(
    config: any,
    opts: {
      width: number;
      height: number;
      backgroundColor: string;
      useGetUrl: boolean;
    }
  ): Promise<Blob> {
    const { width, height, backgroundColor, useGetUrl } = opts;

    if (useGetUrl) {
      const url = this.buildQuickChartURL(
        config,
        width,
        height,
        backgroundColor
      );
      const res = await fetch(url);
      if (!res.ok) throw new Error(`QuickChart GET failed: ${res.status}`);
      return await res.blob();
    }

    const res = await fetch('https://quickchart.io/chart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chart: config,
        width,
        height,
        backgroundColor,
        format: 'png',
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.log(`QuickChart POST failed: ${res.status} ${text}`);
      throw new Error(`QuickChart POST failed: ${res.status} ${text}`);
    }
    return await res.blob();
  }

  // ---------- image combining (client-side canvas) ----------

  /**
   * Stacks PNGs vertically into one PNG.
   * All images are drawn at their native size; `width/height` here are the size of each original chart.
   */
  static async combinePngsVertically(
    blobs: Blob[],
    opts: {
      width: number;
      height: number;
      spacing: number;
      backgroundColor: string;
    },
    group?: { historyChunkCount?: number } // last N blobs are history chunks
  ): Promise<Blob> {
    const { width, height, spacing, backgroundColor } = opts;
    const historyChunkCount = Math.max(0, group?.historyChunkCount ?? 0);

    // Decode all images
    const bitmaps = await Promise.all(blobs.map((b) => this.blobToBitmap(b)));
    const total = bitmaps.length;
    const repCount = Math.max(0, total - historyChunkCount);

    // History row width
    const croppedLeft = 64;
    const historyRowWidth =
      historyChunkCount > 0
        ? width +
          Math.max(0, historyChunkCount - 1) * (width - croppedLeft) +
          Math.max(0, historyChunkCount - 1) * spacing
        : 0;

    const canvasWidth = Math.max(width, historyRowWidth);
    const rowCount = repCount + (historyChunkCount > 0 ? 1 : 0);
    const canvasHeight =
      rowCount * height + Math.max(0, rowCount - 1) * spacing;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas not available');

    // Background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw reps vertically, cropping 20px from right
    const croppedRight = 20;
    let y = 0;
    for (let i = 0; i < repCount; i++) {
      const bmp = bitmaps[i] as any;
      const srcX = 0;
      const srcY = 0;
      const srcW = Math.max(1, (bmp.width ?? width) - croppedRight);
      const srcH = bmp.height ?? height;

      const destW = Math.max(1, width - croppedRight);
      const destH = height;

      ctx.drawImage(bmp, srcX, srcY, srcW, srcH, 0, y, destW, destH);
      y += height + spacing;
    }

    // Draw history parts in one horizontal row
    if (historyChunkCount > 0) {
      let xHistory = 0;

      // First history chunk: full width
      const firstBmp = bitmaps[repCount];
      ctx.drawImage(firstBmp as any, 0, y, width, height);
      xHistory += width + spacing;

      // Remaining history chunks: crop 64px from left
      for (let j = 1; j < historyChunkCount; j++) {
        const bmp = bitmaps[repCount + j] as any;
        const srcX = croppedLeft;
        const srcY = 0;
        const srcW = Math.max(1, (bmp.width ?? width) - croppedLeft);
        const srcH = bmp.height ?? height;

        const destW = Math.max(1, width - croppedLeft);
        const destH = height;

        ctx.drawImage(bmp, srcX, srcY, srcW, srcH, xHistory, y, destW, destH);
        xHistory += destW + spacing;
      }
    }

    // Export
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
        'image/png',
        1
      )
    );
  }

  static async blobToBitmap(
    blob: Blob
  ): Promise<ImageBitmap | HTMLImageElement> {
    // Prefer createImageBitmap if available
    if (
      'createImageBitmap' in window &&
      typeof createImageBitmap === 'function'
    ) {
      return await createImageBitmap(blob);
    }
    // Fallback to HTMLImageElement
    const url = URL.createObjectURL(blob);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = url;
      });
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // ---------- download helpers ----------

  static async downloadEach(blobs: Blob[], filenameBase: string) {
    for (let i = 0; i < blobs.length; i++) {
      this.downloadBlob(blobs[i], `${filenameBase}_rep${i + 1}.png`);
      // Small gap helps some browsers finish downloads cleanly

      await new Promise((r) => setTimeout(r, 20));
    }
  }

  static downloadBlob(blob: Blob, filename: string) {
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  }
}
