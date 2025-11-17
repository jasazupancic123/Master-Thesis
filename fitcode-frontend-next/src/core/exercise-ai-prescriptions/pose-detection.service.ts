import type { RefObject } from 'react';

import type { KeypointHistory } from './class/keypoint-history';
import type { AINumericConstantName } from './enum/ai-numeric-constant-name.enum';
import { DetectionStatus } from './enum/detection-status';
import { KeypointId } from './enum/keypoint-id';
import { KeypointValueType } from './enum/keypoint-value-type';
import { StatusDetectionService } from './status-detection.service';
import type { ExerciseAiPrescriptionData } from './type/exercise-detection-data';
import type { Keypoint } from './type/keypoint.type';
import type { PoseValidationCondition } from './type/pose-validation-condition.type';
import type { RepState } from './type/rep-state.type';
import { KeypointUtil } from './util/keypoint.util';

export class PoseDetectionService {
  private static _instance: PoseDetectionService;
  private readonly keypoint: KeypointUtil;
  private readonly status: StatusDetectionService;

  private constructor() {
    this.keypoint = KeypointUtil.instance;
    this.status = StatusDetectionService.instance;
  }

  static get instance(): PoseDetectionService {
    if (!PoseDetectionService._instance)
      PoseDetectionService._instance = new PoseDetectionService();
    return PoseDetectionService._instance;
  }

  async checkStatus(state: {
    statusRef: RefObject<DetectionStatus>;
    canProceedIntoReadyStateRef: RefObject<boolean>;
    repStateRefL: RefObject<RepState>;
    repStateRefR: RefObject<RepState>;
    keypoints: Keypoint[];
    keypointBuffer: KeypointHistory;
    keypointHistory: KeypointHistory;
    exerciseDetectionData: ExerciseAiPrescriptionData;
    avgFps: { value: number; count: number } | null;
    recordingTimestampRef: RefObject<Date | null>;
    statusMessage: RefObject<string>;
    stillnessCountdownRef: RefObject<Date | null>;
    videoHeight: number;
    doItTimestamp: RefObject<Date | null>;
    reloadingModelRef: RefObject<boolean>;
    POSE_DETECTION_CONSTANTS: Record<AINumericConstantName, number>;
    reloadModel: () => Promise<void>;
  }) {
    const {
      statusRef,
      canProceedIntoReadyStateRef,
      repStateRefL,
      repStateRefR,
      keypoints,
      keypointBuffer,
      keypointHistory,
      exerciseDetectionData,
      avgFps,
      recordingTimestampRef,
      statusMessage,
      stillnessCountdownRef,
      videoHeight,
      doItTimestamp,
      reloadingModelRef,
      POSE_DETECTION_CONSTANTS,
      reloadModel,
    } = state;

    const initStatuses =
      statusRef.current === DetectionStatus.RECORDING
        ? [DetectionStatus.RECORDING]
        : [
            DetectionStatus.NOT_FULLY_IN_FRAME,
            DetectionStatus.NOT_FACING_CAMERA,
            DetectionStatus.NOT_STILL,
            DetectionStatus.READY,
          ];

    for (const status of initStatuses) {
      const validStatus = await this.status.checkAndValidateStatus(status, {
        repStateRefL,
        repStateRefR,
        keypoints,
        statusRef,
        canProceedIntoReadyStateRef,
        keypointBuffer: keypointBuffer,
        keypointHistory,
        exerciseDetectionData,
        avgFps,
        recordingTimestampRef,
        statusMessage,
        stillnessCountdownRef,
        videoHeight,
        doItTimestamp,
        reloadingModelRef,
        POSE_DETECTION_CONSTANTS,
        reloadModel,
      });

      if (!validStatus) return;
    }
  }

  validateKeypointConditions(
    conditions: PoseValidationCondition[],
    keypoints: Keypoint[]
  ): string | undefined {
    for (const condition of conditions) {
      const keypoint1 = keypoints.find((kp) => kp.id === condition.keypointId1);
      const keypoint2 = keypoints.find((kp) => kp.id === condition.keypointId2);

      if (!keypoint1 || !keypoint2) return condition.errorMessage;

      const { value1, value2 } = this.keypoint.getKeypointsValuesByType(
        keypoint1,
        keypoint2,
        condition.relation
      );

      if (value1 === undefined || value2 === undefined)
        return condition.errorMessage;

      if (Math.abs(value1 - value2) > condition.threshold)
        return condition.errorMessage;
    }
  }

  checkHasNodded(state: {
    keypointBuffer: KeypointHistory;
    avgFps: { value: number; count: number } | null;
    POSE_DETECTION_CONSTANTS: Record<AINumericConstantName, number>;
  }): boolean {
    const { keypointBuffer, avgFps, POSE_DETECTION_CONSTANTS } = state;

    const numFrames = this.keypoint.getFramesCountFromSeconds(
      POSE_DETECTION_CONSTANTS.NOD_DETECTION_BUFFER_DURATION_S,
      avgFps?.value || 30
    );

    const frames = keypointBuffer.history.slice(-numFrames);

    // conditions for nod
    let earsBelowEyesStart = false;
    let earsAboveEyes = false;
    let earsBelowEyesEnd = false;
    let shouldersAlwaysAboveHips = true;

    for (const frame of frames) {
      const leftEyeKeypoint = this.keypoint.getDesiredKeypointFromArray(
        frame,
        KeypointId.LEFT_EYE_OUTER
      );

      const rightEyeKeypoint = this.keypoint.getDesiredKeypointFromArray(
        frame,
        KeypointId.RIGHT_EYE_OUTER
      );

      const leftEarKeypoint = this.keypoint.getDesiredKeypointFromArray(
        frame,
        KeypointId.LEFT_EAR
      );

      const rightEarKeypoint = this.keypoint.getDesiredKeypointFromArray(
        frame,
        KeypointId.RIGHT_EAR
      );

      const leftHipKeypoint = this.keypoint.getDesiredKeypointFromArray(
        frame,
        KeypointId.LEFT_HIP
      );

      const rightHipKeypoint = this.keypoint.getDesiredKeypointFromArray(
        frame,
        KeypointId.RIGHT_HIP
      );

      const leftShoulderKeypoint = this.keypoint.getDesiredKeypointFromArray(
        frame,
        KeypointId.LEFT_SHOULDER
      );

      const rightShoulderKeypoint = this.keypoint.getDesiredKeypointFromArray(
        frame,
        KeypointId.RIGHT_SHOULDER
      );

      if (
        !leftEyeKeypoint ||
        !rightEyeKeypoint ||
        !leftEarKeypoint ||
        !rightEarKeypoint ||
        !leftHipKeypoint ||
        !rightHipKeypoint ||
        !leftShoulderKeypoint ||
        !rightShoulderKeypoint
      )
        continue;

      const leftEyeY = this.keypoint.getKeypointValueByType(
        leftEyeKeypoint,
        KeypointValueType.POSITION_Y
      );
      const rightEyeY = this.keypoint.getKeypointValueByType(
        rightEyeKeypoint,
        KeypointValueType.POSITION_Y
      );

      const leftEarY = this.keypoint.getKeypointValueByType(
        leftEarKeypoint,
        KeypointValueType.POSITION_Y
      );
      const rightEarY = this.keypoint.getKeypointValueByType(
        rightEarKeypoint,
        KeypointValueType.POSITION_Y
      );

      const leftHipY = this.keypoint.getKeypointValueByType(
        leftHipKeypoint,
        KeypointValueType.POSITION_Y
      );
      const rightHipY = this.keypoint.getKeypointValueByType(
        rightHipKeypoint,
        KeypointValueType.POSITION_Y
      );

      const leftShoulderY = this.keypoint.getKeypointValueByType(
        leftShoulderKeypoint,
        KeypointValueType.POSITION_Y
      );
      const rightShoulderY = this.keypoint.getKeypointValueByType(
        rightShoulderKeypoint,
        KeypointValueType.POSITION_Y
      );

      if (
        leftEyeY === undefined ||
        rightEyeY === undefined ||
        leftEarY === undefined ||
        rightEarY === undefined ||
        leftHipY === undefined ||
        rightHipY === undefined ||
        leftShoulderY === undefined ||
        rightShoulderY === undefined
      )
        continue;

      const avgEyeY = (leftEyeY + rightEyeY) / 2;
      const avgEarY = (leftEarY + rightEarY) / 2;

      if (!earsBelowEyesStart) {
        if (avgEarY > avgEyeY) earsBelowEyesStart = true;
        continue;
      }

      if (!earsAboveEyes) {
        if (avgEarY < avgEyeY + POSE_DETECTION_CONSTANTS.Y_POS_HELPER_M) {
          // console.log('EARS ABOVE EYES');
          earsAboveEyes = true;
        }
        continue;
      }

      if (!earsBelowEyesEnd) {
        if (avgEarY > avgEyeY) {
          earsBelowEyesEnd = true;
          break;
        }
      }

      const avgHipY = (leftHipY + rightHipY) / 2;
      const avgShoulderY = (leftShoulderY + rightShoulderY) / 2;

      if (avgShoulderY - 0.2 <= avgHipY) shouldersAlwaysAboveHips = false;
    }

    return (
      earsBelowEyesStart &&
      earsAboveEyes &&
      earsBelowEyesEnd &&
      shouldersAlwaysAboveHips
    );
  }
}
