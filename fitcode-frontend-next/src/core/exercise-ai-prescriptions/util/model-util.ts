import * as ort from 'onnxruntime-web';
import { OrtScratch } from '../type/ort-scratch.type';
import { CompiledModel, loadLiteRt, loadAndCompile } from '@litertjs/core';
import { PoseLandmarker } from '@mediapipe/tasks-vision';
import {
  PoseDetector,
  QuantBytes,
  SupportedModels,
} from '@tensorflow-models/pose-detection';
import {
  MobileNetMultiplier,
  PoseNetArchitecture,
} from '@tensorflow-models/pose-detection/dist/posenet/types';
import { PoseModel } from '../enum/pose-model.enum';
import { getPoseLandmarker } from './pose-landmarker-loader.util';
import { lib } from '@/lib';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { RefObject } from 'react';

export class ModelUtil {
  private static _instance: ModelUtil;

  private constructor() {}

  static get instance(): ModelUtil {
    if (!ModelUtil._instance) ModelUtil._instance = new ModelUtil();
    return ModelUtil._instance;
  }

  loadModel = async (
    model: PoseModel,
    loadedPoseLandmarkerTimestampRef: RefObject<Date | null>
  ): Promise<
    | PoseLandmarker
    | tf.GraphModel
    | CompiledModel
    | ort.InferenceSession
    | PoseDetector
    | null
  > => {
    let poseModel:
      | PoseLandmarker
      | tf.GraphModel
      | CompiledModel
      | ort.InferenceSession
      | PoseDetector
      | null = null;

    if (
      [
        PoseModel.MEDIAPIPE_LITE,
        PoseModel.MEDIAPIPE_FULL,
        PoseModel.MEDIAPIPE_HEAVY,
      ].includes(model)
    ) {
      poseModel = await getPoseLandmarker(
        model as
          | PoseModel.MEDIAPIPE_LITE
          | PoseModel.MEDIAPIPE_FULL
          | PoseModel.MEDIAPIPE_HEAVY,
        loadedPoseLandmarkerTimestampRef,
        true,
        lib.common.env.getPredictOnFolderWithImages()
      );
    } else if ([PoseModel.YOLO11_256, PoseModel.YOLO11_640].includes(model)) {
      const yoloSize = model === PoseModel.YOLO11_256 ? '256' : '640';
      const modelUrl = `/models/yolov11/${yoloSize}/yolo11n-pose-web-model/model.json`;
      await import('@tensorflow/tfjs-backend-webgl');
      await tf.setBackend('webgl');
      await tf.ready();

      poseModel = await tf.loadGraphModel(modelUrl);
    }
    // else if (model === PoseModel.YOLO11_LITE) {
    //   await import('@tensorflow/tfjs-backend-wasm');
    //   await tf.setBackend('wasm');
    //   await tf.ready();

    //   await loadLiteRt('/litert-wasm/');

    //   // const backend = tf.backend() as unknown as WebGPUBackend;
    //   // setWebGpuDevice(backend.device);

    //   const modelUrl = `/models/yolov11/${lib.common.env.getYoloSize()}/yolo11n-pose_float32.tflite`;
    //   poseModel = await loadAndCompile(modelUrl, {
    //     accelerator: 'wasm', // or "wasm" :contentReference[oaicite:4]{index=4}
    //   });
    // }
    // else if (model === PoseModel.YOLO11_ONNX) {
    //   console.log('LOADING YOLOv11 ONNX MODEL');
    //   if (typeof window === 'undefined') return null;

    //   const ort = await import('onnxruntime-web/webgl'); // registers multiple EPs (webgl/wasm/webgpu depending build)

    //   // Tell ORT where the wasm binaries live (in /public/ort/)
    //   ort.env.wasm.wasmPaths = '/onnx-wasm/'; // :contentReference[oaicite:3]{index=3}

    //   // Pick execution provider:
    //   // - "wasm" is the most reliable everywhere.
    //   // - "webgl" can be faster, but is sometimes finicky depending on build/bundler.
    //   poseModel = await ort.InferenceSession.create(
    //     `/models/yolov11/${lib.common.env.getYoloSize()}/yolo11n-pose.onnx`,
    //     {
    //       executionProviders: ['webgl'], // or ["webgl"] if you want to try GPU :contentReference[oaicite:4]{index=4}
    //       graphOptimizationLevel: 'all',
    //     }
    //   );
    // }
    else if (
      [PoseModel.POSE_NET_MOBILE_NET, PoseModel.POSE_NET_RES_NET].includes(
        model
      )
    ) {
      console.log('LOADING POkSE NET MODEL');

      const architecture: PoseNetArchitecture =
        model === PoseModel.POSE_NET_MOBILE_NET ? 'MobileNetV1' : 'ResNet50';

      await import('@tensorflow/tfjs-backend-webgl');
      await tf.setBackend('webgl');
      await tf.ready();


      console.log('TF READY');

      const detectorConfig: poseDetection.PosenetModelConfig = {
        /* Can be either MobileNetV1 or ResNet50, ResNet50 is larger and more accurate but slower */
        architecture,
        /*
              outputStride:
              Downsampling factor between your input image and PoseNet’s main output heatmaps.
              outputStride: 16 means the heatmap grid is about 1/16th the input resolution in each dimension.
              With 640x480 input, heatmaps are roughly 40x30 (because 640/16=40, 480/16=30).
              Smaller stride (8) → larger heatmaps → more precise keypoints, but slower.
            */
        outputStride: 16,
        /*
              inputResolution:
              Important detail: PoseNet works best when width/height are compatible with the stride 
              (multiples of 16 if stride is 16). 640 and 480 are perfect for stride 16.
            */
        inputResolution: lib.common.env.getPoseNetInputResolution(),
        /*
              multiplier:
              It is the float multiplier for the depth (number of channels) for all convolution ops.
              Options: 1.0, 0.75, 0.50 for MobileNetV1,
              Options: 1.0 for ResNet50.
            */
        multiplier:
          architecture === 'ResNet50'
            ? 1.0
            : (lib.common.env.getPoseNetMultiplier() as MobileNetMultiplier),
        /*
              quantBytes:
              This argument controls the bytes used for weight quantization. The available options are:
              4: 4 bytes per float (no quantization). Leads to highest accuracy and original model size (~90MB).
              2: 2 bytes per float. Leads to slightly lower accuracy and 2x model size reduction (~45MB).
              1: 1 byte per float. Leads to lower accuracy and 4x model size reduction (~22MB).
            */
        quantBytes: 4 as QuantBytes, // 1, 2, or 4
      };

      console.log('creating detector...')
      poseModel = await poseDetection.createDetector(
        SupportedModels.PoseNet,
        detectorConfig
      );
      console.log('detector created');
    } else if (
      [
        PoseModel.MOVENET_SINGLEPOSE_LIGHTNING,
        PoseModel.MOVENET_SINGLEPOSE_THUNDER,
      ].includes(model)
    ) {
      // console.log('LOADING MOVENET MODEL');

      const modelType =
        model === PoseModel.MOVENET_SINGLEPOSE_LIGHTNING
          ? poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
          : poseDetection.movenet.modelType.SINGLEPOSE_THUNDER;

      await import('@tensorflow/tfjs-backend-webgl');
      await tf.setBackend('webgl');
      await tf.ready();

      const detectorConfig: poseDetection.MoveNetModelConfig = {
        modelType,
      };

      poseModel = await poseDetection.createDetector(
        SupportedModels.MoveNet,
        detectorConfig
      );
    } else if (
      [
        PoseModel.BLAZEPOSE_LITE,
        PoseModel.BLAZEPOSE_FULL,
        PoseModel.BLAZEPOSE_HEAVY,
      ].includes(model)
    ) {
      // console.log('LOADING BLAZEPOSE MODEL');

      await import('@tensorflow/tfjs-backend-webgl');
      await tf.setBackend('webgl');
      await tf.ready();

      const modelType =
        model === PoseModel.BLAZEPOSE_LITE
          ? 'lite'
          : model === PoseModel.BLAZEPOSE_FULL
            ? 'full'
            : 'heavy';

      const detectorConfig: poseDetection.BlazePoseTfjsModelConfig = {
        runtime: 'tfjs',
        enableSmoothing: true,
        modelType,
      };

      poseModel = await poseDetection.createDetector(
        SupportedModels.BlazePose,
        detectorConfig
      );
    }

    return poseModel;
  };

  videoToOrtInputNHWC(
    input: HTMLVideoElement | HTMLCanvasElement,
    inputSize: number,
    scratch: OrtScratch | null
  ) {
    // Reuse objects to avoid GC
    const canvas = scratch?.canvas ?? document.createElement('canvas');
    canvas.width = inputSize;
    canvas.height = inputSize;

    const ctx =
      scratch?.ctx ?? canvas.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(input, 0, 0, inputSize, inputSize);

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
