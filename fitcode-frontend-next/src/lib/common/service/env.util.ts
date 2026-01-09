import toast from 'react-hot-toast';

import {
  POSE_LANDMARKER_FULL_PATH,
  POSE_LANDMARKER_HEAVY_PATH,
  POSE_LANDMARKER_LITE_PATH,
} from '@/core/exercise-ai-prescriptions/const/pose-landmarker-paths';
import type { AINumericConstantName } from '@/core/exercise-ai-prescriptions/enum/ai-numeric-constant-name.enum';
import { PoseModel } from '@/core/exercise-ai-prescriptions/enum/pose-model.enum';
import {
  MobileNetMultiplier,
  PoseNetArchitecture,
  PoseNetOutputStride,
} from '@tensorflow-models/pose-detection/dist/posenet/types';
import * as poseDetection from '@tensorflow-models/pose-detection';

export class EnvUtil {
  isProd(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  isDev(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  disableErudaAI(): boolean {
    return process.env.NEXT_PUBLIC_AI_DISABLE_ERUDA === '1';
  }

  disableFpsAI(): boolean {
    return process.env.NEXT_PUBLIC_AI_DISABLE_FPS === '1';
  }

  convertToMetricScale(): boolean {
    return process.env.NEXT_PUBLIC_AI_CONVERT_TO_METRIC_SCALE === '1';
  }

  getPoseLandmarkerModelPath(): string {
    const model = process.env.NEXT_PUBLIC_POSE_LANDMARKER_VERSION;

    if (model === 'lite') return POSE_LANDMARKER_LITE_PATH;
    else if (model === 'heavy') return POSE_LANDMARKER_HEAVY_PATH;

    return POSE_LANDMARKER_FULL_PATH; // default to full
  }

  unoptimizeImages(): boolean {
    return process.env.NEXT_PUBLIC_UNOPTIMIZE_IMAGES === '1';
  }

  getPoseModel(): PoseModel {
    const model = process.env.NEXT_PUBLIC_POSE_MODEL;
    if (!model) {
      toast.error('Pose model is not defined in the environment variables.');
      throw new Error(
        'Pose model is not defined in the environment variables.'
      );
    }

    if (
      ![
        PoseModel.MEDIAPIPE,
        PoseModel.YOLO11,
        PoseModel.YOLO11_LITE,
        PoseModel.YOLO11_ONNX,
        PoseModel.POSE_NET,
        PoseModel.MOVENET,
        PoseModel.BLAZEPOSE,
      ].includes(model as PoseModel)
    ) {
      toast.error(
        `Invalid pose model "${model}" defined in the environment variables.`
      );
      throw new Error(
        `Invalid pose model "${model}" defined in the environment variables.`
      );
    }

    return model as PoseModel;
  }

  getYoloSize(): number {
    const sizeStr = process.env.NEXT_PUBLIC_YOLO_SIZE;
    if (!sizeStr) {
      toast.error('YOLO size is not defined in the environment variables.');
      throw new Error('YOLO size is not defined in the environment variables.');
    }

    const size = parseInt(sizeStr, 10);
    if (isNaN(size)) {
      toast.error(
        `Invalid YOLO size "${sizeStr}" defined in the environment variables.`
      );
      throw new Error(
        `Invalid YOLO size "${sizeStr}" defined in the environment variables.`
      );
    }

    return size;
  }

  getAiNumericConstants(): Record<AINumericConstantName, number> {
    const jsonString = process.env.NEXT_PUBLIC_AI_CONSTANTS;
    if (!jsonString) {
      toast.error('AI constants are not defined in the environment variables.');
      throw new Error(
        'AI constants are not defined in the environment variables.'
      );
    }

    const constants = JSON.parse(jsonString) as Record<
      AINumericConstantName,
      number
    >;
    return constants;
  }

  getPoseNetArchitecture(): PoseNetArchitecture {
    const architecture = process.env.NEXT_PUBLIC_POSE_NET_ARCHITECTURE;
    if (!architecture) {
      toast.error(
        'PoseNet architecture is not defined in the environment variables.'
      );
      throw new Error(
        'PoseNet architecture is not defined in the environment variables.'
      );
    }

    if (!['MobileNetV1', 'ResNet50'].includes(architecture)) {
      toast.error(
        `Invalid PoseNet architecture "${architecture}" defined in the environment variables.`
      );
      throw new Error(
        `Invalid PoseNet architecture "${architecture}" defined in the environment variables.`
      );
    }

    return architecture as PoseNetArchitecture;
  }

  getPoseNetOutputStride(): PoseNetOutputStride {
    const outputStrideStr = process.env.NEXT_PUBLIC_POSE_NET_OUTPUT_STRIDE;

    if (!outputStrideStr) {
      toast.error('Output stride is not defined in the environment variables.');
      throw new Error(
        'Output stride is not defined in the environment variables.'
      );
    }

    const outputStride = parseInt(outputStrideStr, 10);

    if (isNaN(outputStride)) {
      toast.error(
        `Invalid output stride "${outputStrideStr}" defined in the environment variables.`
      );
      throw new Error(
        `Invalid output stride "${outputStrideStr}" defined in the environment variables.`
      );
    }

    if (![8, 16, 32].includes(outputStride)) {
      toast.error(
        `Output stride "${outputStride}" is not one of the allowed values (8, 16, 32).`
      );
      throw new Error(
        `Output stride "${outputStride}" is not one of the allowed values (8, 16, 32).`
      );
    }

    return outputStride as PoseNetOutputStride;
  }

  getPoseNetInputResolution(): { width: number; height: number } {
    const widthStr = process.env.NEXT_PUBLIC_POSE_NET_INPUT_WIDTH;
    const heightStr = process.env.NEXT_PUBLIC_POSE_NET_INPUT_HEIGHT;

    if (!widthStr || !heightStr) {
      toast.error(
        'PoseNet input dimensions are not defined in the environment variables.'
      );
      throw new Error(
        'PoseNet input dimensions are not defined in the environment variables.'
      );
    }

    const width = parseInt(widthStr, 10);
    const height = parseInt(heightStr, 10);

    if (isNaN(width) || isNaN(height)) {
      toast.error(
        `Invalid PoseNet input dimensions "${widthStr}x${heightStr}" defined in the environment variables.`
      );
      throw new Error(
        `Invalid PoseNet input dimensions "${widthStr}x${heightStr}" defined in the environment variables.`
      );
    }

    return { width, height };
  }

  getPoseNetMultiplier(): MobileNetMultiplier {
    const multiplierStr = process.env.NEXT_PUBLIC_POSE_NET_MULTIPLIER;

    if (!multiplierStr) {
      toast.error(
        'PoseNet multiplier is not defined in the environment variables.'
      );
      throw new Error(
        'PoseNet multiplier is not defined in the environment variables.'
      );
    }

    const multiplier = parseFloat(multiplierStr);

    if (isNaN(multiplier)) {
      toast.error(
        `Invalid PoseNet multiplier "${multiplierStr}" defined in the environment variables.`
      );
      throw new Error(
        `Invalid PoseNet multiplier "${multiplierStr}" defined in the environment variables.`
      );
    }

    const validMultipliers = [1.0, 0.75, 0.5];
    if (!validMultipliers.includes(multiplier)) {
      toast.error(
        `PoseNet multiplier "${multiplier}" is not one of the allowed values (${validMultipliers.join(', ')}).`
      );
      throw new Error(
        `PoseNet multiplier "${multiplier}" is not one of the allowed values (${validMultipliers.join(', ')}).`
      );
    }

    return multiplier as MobileNetMultiplier;
  }

  getMoveNetModelType(): string {
    const modelType = process.env.NEXT_PUBLIC_MOVE_NET_MODEL_TYPE;
    if (!modelType) {
      toast.error(
        'MoveNet model type is not defined in the environment variables.'
      );
      throw new Error(
        'MoveNet model type is not defined in the environment variables.'
      );
    }

    if (modelType === 'SINGLEPOSE_LIGHTNING')
      return poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING;
    else if (modelType === 'SINGLEPOSE_THUNDER')
      return poseDetection.movenet.modelType.SINGLEPOSE_THUNDER;
    else if (modelType === 'MULTIPOSE_LIGHTNING')
      return poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING;

    throw new Error(
      `Invalid MoveNet model type "${modelType}" defined in the environment variables.`
    );
  }

  getBlazePoseModelType(): poseDetection.BlazePoseModelType {
    const modelType = process.env.NEXT_PUBLIC_BLAZEPOSE_MODEL_TYPE;
    if (!modelType) {
      toast.error(
        'BlazePose model type is not defined in the environment variables.'
      );
      throw new Error(
        'BlazePose model type is not defined in the environment variables.'
      );
    }

    if (modelType === 'LIGHT') return 'lite';
    else if (modelType === 'FULL') return 'full';
    else if (modelType === 'HEAVY') return 'heavy';

    throw new Error(
      `Invalid BlazePose model type "${modelType}" defined in the environment variables.`
    );
  }
}
