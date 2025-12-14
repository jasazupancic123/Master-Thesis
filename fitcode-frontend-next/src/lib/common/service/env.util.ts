import toast from 'react-hot-toast';

import {
  POSE_LANDMARKER_FULL_PATH,
  POSE_LANDMARKER_HEAVY_PATH,
  POSE_LANDMARKER_LITE_PATH,
} from '@/core/exercise-ai-prescriptions/const/pose-landmarker-paths';
import type { AINumericConstantName } from '@/core/exercise-ai-prescriptions/enum/ai-numeric-constant-name.enum';
import { PoseModel } from '@/core/exercise-ai-prescriptions/enum/pose-model.enum';

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
      model !== PoseModel.MEDIAPIPE &&
      model !== PoseModel.YOLO11 &&
      model !== PoseModel.YOLO11_LITE
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
}
