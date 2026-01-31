import type { RefObject } from 'react';
import type { Keypoint } from './type/keypoint.type';
import { KeypointUtil } from './util/keypoint.util';
import { CompiledModel } from '@litertjs/core';
import { PoseLandmarker } from '@mediapipe/tasks-vision';
import { PoseDetector } from '@tensorflow-models/pose-detection';
import { InferenceSession } from 'onnxruntime-web';
import { PoseModel } from './enum/pose-model.enum';
import { OrtScratch } from './type/ort-scratch.type';
import * as tf from '@tensorflow/tfjs';
import {
  getFullModelName,
  getKeypointsFromModelOutput,
} from '@/components/mobile-movement-validation/state';
import { lib } from '@/lib';

const ROOT_FOLDER_WITH_IMAGES = '/exercise-cut-videos-to-images';

export class AIImageDetectionService {
  private static _instance: AIImageDetectionService;
  private readonly keypoint: KeypointUtil;

  private constructor() {
    this.keypoint = KeypointUtil.instance;
  }

  static get instance(): AIImageDetectionService {
    if (!AIImageDetectionService._instance)
      AIImageDetectionService._instance = new AIImageDetectionService();
    return AIImageDetectionService._instance;
  }

  async detectOnFolderWithImages(state: {
    canvasRef: RefObject<HTMLCanvasElement | null>;
    loadedPoseLandmarkerTimestampRef: RefObject<Date | null>;
    ortScratchRef: RefObject<OrtScratch | null>;
    frameCountRef: RefObject<number>;
    recycledCanvasRef: RefObject<HTMLCanvasElement | null>;
  }) {
    const {
      canvasRef,
      loadedPoseLandmarkerTimestampRef,
      ortScratchRef,
      frameCountRef,
      recycledCanvasRef,
    } = state;

    const folderUrl = `${ROOT_FOLDER_WITH_IMAGES}/db-biceps-curl_frames_10fps`;
    const folderWithImages = `${folderUrl}/images`;
    const disableKeypointDrawing = true;

    const skippableModels: PoseModel[] = [];

    const allModels = Object.values(PoseModel).filter(
      (m) =>
        m !== PoseModel.YOLO11_LITE &&
        m !== PoseModel.YOLO11_ONNX &&
        !skippableModels.includes(m)
    );

    const files: string[] = await fetch(`${folderUrl}/images.json`)
      .then((r) => r.json())
      .catch((e) => {
        console.error('Error fetching images.json:', e);
        return [];
      });

    if (!canvasRef.current) throw new Error('Canvas ref is null');

    const mod = await import('jszip');
    const JSZipCtor = (mod as any).default ?? (mod as any); // normalize
    const zip = new JSZipCtor();

    let i = 0;
    for (const currentModel of allModels) {
      console.log(
        '---PROCESSING MODEL:---',
        currentModel,
        i++,
        '/',
        allModels.length
      );

      const currentPoseModel = await lib.ai.model.loadModel(
        currentModel,
        loadedPoseLandmarkerTimestampRef
      );

      if (!currentPoseModel) throw new Error('Pose model is null');

      const keypointsOnImages: { file: string; keypoints: Keypoint[] }[] = [];

      let j = 0;
      for (const file of files) {
        if (j % 10 === 0)
          console.log(`Processing image ${j} of ${files.length}`);

        j++;

        const imageSrc = `${folderWithImages}/${file}`;

        const keypoints = await this.detectKeypointsOnImage(
          imageSrc,
          canvasRef.current,
          {
            poseModel: currentPoseModel,
            model: currentModel,
            ortScratchRef,
            startTimeMs: 0,
            frameCountRef,
            recycledCanvasRef,
          },
          disableKeypointDrawing
        );

        keypointsOnImages.push({ file, keypoints });

        if (!disableKeypointDrawing) {
          const blob = await this.canvasToBlob(
            canvasRef.current,
            `${file}-keypoints.png` as any
          );
          zip.file(`${file}-keypoints.png`, blob);
        }
      }

      const fullModelName = getFullModelName(currentModel);

      const modelResults = {
        model: fullModelName,
        keypointsOnImages,
      };

      // write to json file
      const dataStr =
        'data:text/json;charset=utf-8,' +
        encodeURIComponent(JSON.stringify(modelResults));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute('href', dataStr);
      downloadAnchorNode.setAttribute(
        'download',
        fullModelName + '_results.json'
      );
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();

      if (!disableKeypointDrawing) {
        const zipBlob = await zip.generateAsync({ type: 'blob' });

        const a = document.createElement('a');
        a.href = URL.createObjectURL(zipBlob);
        a.download = `${fullModelName}_keypoints_images.zip`;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    }

    console.log('All models processed.');
  }

  private async detectKeypointsOnImage(
    src: string,
    passedCanvas: HTMLCanvasElement,
    state: {
      poseModel:
        | PoseLandmarker
        | tf.GraphModel
        | CompiledModel
        | InferenceSession
        | PoseDetector;
      model: PoseModel;
      ortScratchRef: RefObject<OrtScratch | null>;
      startTimeMs: number;
      frameCountRef: RefObject<number>;
      recycledCanvasRef: RefObject<HTMLCanvasElement | null>;
    },
    disableKeypointsDrawing = false
  ): Promise<Keypoint[]> {
    const { canvas } = await this.loadImageToCanvas(src, passedCanvas);

    const fileName = src.split('/').pop()?.split('.')[0];

    if (!fileName) throw new Error(`Invalid image source URL: ${src}`);

    const keypoints = await getKeypointsFromModelOutput(state, {
      imageInput: canvas,
    });

    if (!disableKeypointsDrawing)
      this.drawKeypointsOnCanvas(
        canvas,
        keypoints,
        canvas.width,
        canvas.height,
        { radius: 4, label: true }
      );

    return keypoints;
  }

  private drawKeypointsOnCanvas(
    canvas: HTMLCanvasElement,
    keypoints: Keypoint[],
    canvasWidth: number,
    canvasHeight: number,
    opts?: { radius?: number; label?: boolean }
  ) {
    const ctx = canvas.getContext('2d')!;

    const r = opts?.radius ?? 4;

    ctx.save();
    ctx.lineWidth = 2;

    for (const kp of keypoints) {
      const x = kp.pixelPosition.x;
      const y = kp.pixelPosition.y;

      lib.common.canvas.drawCircle(
        ctx,
        { x: x * canvasWidth, y: y * canvasHeight },
        r,
        'white'
      );
    }

    ctx.restore();
  }

  private async loadImageToCanvas(src: string, canvas: HTMLCanvasElement) {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // if your images are served from same origin it's fine
    img.src = src;

    // Wait until it’s decoded (better than onload)
    await img.decode();

    const w = img.naturalWidth;
    const h = img.naturalHeight;

    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, w, h);

    return { canvas, width: w, height: h };
  }

  private canvasToBlob(
    canvas: HTMLCanvasElement,
    type: 'image/png' | 'image/jpeg' = 'image/png',
    quality = 0.92
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('toBlob failed'))),
        type,
        quality
      );
    });
  }
}
