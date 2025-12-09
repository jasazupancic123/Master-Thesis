import dayjs from 'dayjs';
import type { RefObject } from 'react';

import type { KeypointHistory } from './class/keypoint-history';
import { DEFAULT_STILLNESS_KEYPOINTS } from './const/ai.const';
import type { AINumericConstantName } from './enum/ai-numeric-constant-name.enum';
import { ConditionDirection } from './enum/condition-detection.enum';
import { DetectionStatus } from './enum/detection-status';
import { KeypointId } from './enum/keypoint-id';
import { KeypointValueType } from './enum/keypoint-value-type';
import { RepStatus } from './enum/rep-state';
import { FeedbackService } from './feedback.service';
import type {
  ExerciseAiPrescriptionData,
  ExerciseRepStartCondition,
} from './type/exercise-detection-data';
import type { Keypoint } from './type/keypoint.type';
import type { Point2D } from './type/point.type';
import type { Rep } from './type/rep.type';
import type { RepState } from './type/rep-state.type';
import { AngleUtil } from './util/angle-util';
import { KeypointUtil } from './util/keypoint.util';
import { getStatusMessage } from '@/components/mobile-movement-validation/state';

export class StatusDetectionService {
  private static _instance: StatusDetectionService;
  private readonly keypoint: KeypointUtil;
  private readonly feedback: FeedbackService;
  private readonly angle: AngleUtil;

  private constructor() {
    this.keypoint = KeypointUtil.instance;
    this.feedback = FeedbackService.instance;
    this.angle = AngleUtil.instance;
  }

  static get instance(): StatusDetectionService {
    if (!StatusDetectionService._instance)
      StatusDetectionService._instance = new StatusDetectionService();
    return StatusDetectionService._instance;
  }

  // if it returns false, it means we need to return in main loop
  async checkAndValidateStatus(
    detectionStatus: DetectionStatus,
    state: {
      repStateRefL: RefObject<RepState>;
      repStateRefR: RefObject<RepState>;
      keypoints: Keypoint[];
      statusRef: RefObject<DetectionStatus>;
      canProceedIntoReadyStateRef: RefObject<boolean>;
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
    }
  ): Promise<boolean> {
    const {
      repStateRefL,
      repStateRefR,
      keypoints,
      statusRef,
      canProceedIntoReadyStateRef,
      keypointBuffer,
      exerciseDetectionData,
      avgFps,
      recordingTimestampRef,
      statusMessage,
      stillnessCountdownRef,
      videoHeight,
      doItTimestamp,
      reloadingModelRef,
      POSE_DETECTION_CONSTANTS,
    } = state;

    if (reloadingModelRef.current === true) return false;

    switch (detectionStatus) {
      case DetectionStatus.NOT_FULLY_IN_FRAME: {
        const isFullyInFrame = this.checkIsFullyInFrame(
          keypoints,
          POSE_DETECTION_CONSTANTS
        );

        const canProceedIntoNotFacingCamera = isFullyInFrame;

        if (!canProceedIntoNotFacingCamera) {
          canProceedIntoReadyStateRef.current = false;
          stillnessCountdownRef.current = null;
        }

        return this.updateStatus(
          statusRef,
          isFullyInFrame,
          DetectionStatus.NOT_FULLY_IN_FRAME,
          DetectionStatus.NOT_FACING_CAMERA,
          statusMessage
        );
      }
      case DetectionStatus.NOT_FACING_CAMERA: {
        const isFacingCamera = this.checkIsFacingCamera(
          keypoints,
          POSE_DETECTION_CONSTANTS,
          exerciseDetectionData.stillnessEvaluationKeypoints
        );

        const canUpdateToNotStill = isFacingCamera;

        if (
          canProceedIntoReadyStateRef.current === false &&
          canUpdateToNotStill
        ) {
          keypointBuffer.clear();
          canProceedIntoReadyStateRef.current = true;
        } else if (!canUpdateToNotStill) {
          canProceedIntoReadyStateRef.current = false;
          stillnessCountdownRef.current = null;
        }

        return this.updateStatus(
          statusRef,
          canUpdateToNotStill,
          DetectionStatus.NOT_FACING_CAMERA,
          DetectionStatus.NOT_STILL,
          statusMessage
        );
      }
      case DetectionStatus.NOT_STILL: {
        const bufferCutOff = this.keypoint.getFramesCountFromSeconds(
          1,
          avgFps?.value || 30
        );

        const isStill = this.checkIsStill({
          keypoints,
          buffer: keypointBuffer,
          avgFps,
          stillnessCountdownRef,
          bufferCutOff,
          videoHeight,
          stillnessEvaluationKeypoints:
            exerciseDetectionData.stillnessEvaluationKeypoints,
          POSE_DETECTION_CONSTANTS,
        });

        return this.updateStatus(
          statusRef,
          isStill,
          DetectionStatus.NOT_STILL,
          DetectionStatus.READY,
          statusMessage
        );
      }
      case DetectionStatus.READY: {
        if (!avgFps || !avgFps.value || avgFps.count < 10) return false;

        // const hasNodded = PoseDetectionService.checkHasNodded({
        //   keypointBuffer,
        //   avgFps,
        // });

        // if (hasNodded)
        //   keypointBuffer.cutAtIndex(keypointBuffer.history.length - 1);

        const isStill = this.checkIsStill({
          keypoints,
          buffer: keypointBuffer,
          avgFps,
          videoHeight,
          POSE_DETECTION_CONSTANTS,
        });

        // const canStartRecording = hasNodded && isStill;
        const canStartRecording = isStill;

        if (canStartRecording) {
          recordingTimestampRef.current = new Date();

          if (repStateRefL.current.status === RepStatus.NONE)
            repStateRefL.current = {
              status: RepStatus.IDLE,
              avgStartValue: null,
              avgExtremeValue: null,
            };
          if (repStateRefR.current.status === RepStatus.NONE)
            repStateRefR.current = {
              status: RepStatus.IDLE,
              avgStartValue: null,
              avgExtremeValue: null,
            };
        }

        if (canStartRecording && !doItTimestamp.current)
          doItTimestamp.current = new Date();

        return this.updateStatus(
          statusRef,
          canStartRecording,
          DetectionStatus.READY,
          DetectionStatus.RECORDING,
          statusMessage
        );
      }
      case DetectionStatus.RECORDING: {
        if (
          dayjs(new Date()).diff(
            dayjs(recordingTimestampRef.current),
            'second'
          ) < POSE_DETECTION_CONSTANTS.MIN_STILL_TIME_TO_STOP_DETECTION_S
        )
          return false;

        // look for 1 second of stillness
        const bufferCutOf = this.keypoint.getFramesCountFromSeconds(
          POSE_DETECTION_CONSTANTS.STILLNESS_DETECTION_WINDOW_DURING_RECORDING_S,
          avgFps?.value || 30
        );

        const isStill = this.checkIsStill({
          keypoints,
          buffer: keypointBuffer,
          avgFps,
          bufferCutOff: bufferCutOf,
          videoHeight,
          POSE_DETECTION_CONSTANTS,
        });

        // const hasNodded = this.checkHasNodded({
        //   keypointBuffer,
        //   avgFps,
        // });

        const hasShakedHead = this.checkHasShakedHead({
          keypointBuffer,
          POSE_DETECTION_CONSTANTS,
          avgFps,
        });

        return this.updateStatus(
          statusRef,
          isStill && hasShakedHead,
          DetectionStatus.RECORDING,
          DetectionStatus.STOPPED,
          statusMessage
        );
      }
      default: {
        return false;
      }
    }
  }

  // if it returns false, it means we also need to return in main loop
  private updateStatus(
    statusRef: RefObject<DetectionStatus>,
    condition: boolean,
    currentStatus: DetectionStatus,
    nextStatus: DetectionStatus,
    statusMessage: RefObject<string>
  ): boolean {
    if (!condition && statusRef.current === currentStatus) {
      return false;
    } else if (!condition) {
      statusRef.current = currentStatus;
      statusMessage.current = getStatusMessage(currentStatus);
      return false;
    } else if (condition && statusRef.current === currentStatus) {
      statusRef.current = nextStatus;
      statusMessage.current = getStatusMessage(nextStatus);

      return false;
    }

    return true;
  }

  private checkIsFullyInFrame(
    keypoints: Keypoint[],
    POSE_DETECTION_CONSTANTS: Record<AINumericConstantName, number>
  ): boolean {
    const requiredKeypointCombinations = [
      [KeypointId.LEFT_SHOULDER, KeypointId.LEFT_EYE, KeypointId.LEFT_ANKLE],
      [KeypointId.RIGHT_SHOULDER, KeypointId.RIGHT_EYE, KeypointId.RIGHT_ANKLE],
    ]; // at least one of these needs to be true

    return requiredKeypointCombinations.some((combination) => {
      return combination.every((id) => {
        const kp = this.keypoint.getDesiredKeypointFromArray(keypoints, id);
        return (
          kp &&
          kp.visibility > POSE_DETECTION_CONSTANTS.IN_FRAME_VISIBILITY_THRESHOLD
        );
      });
    });
  }

  private checkIsFacingCamera(
    keypoints: Keypoint[],
    POSE_DETECTION_CONSTANTS: Record<AINumericConstantName, number>,
    passedFacingCameraKeypointIds?: KeypointId[]
  ): boolean {
    const facingCameraKeypointIds = passedFacingCameraKeypointIds || [
      KeypointId.LEFT_EYE,
      KeypointId.RIGHT_EYE,
      KeypointId.LEFT_SHOULDER,
      KeypointId.RIGHT_SHOULDER,
      KeypointId.LEFT_HIP,
      KeypointId.RIGHT_HIP,
      KeypointId.LEFT_KNEE,
      KeypointId.RIGHT_KNEE,
      KeypointId.LEFT_ANKLE,
      KeypointId.RIGHT_ANKLE,
    ];

    const facingCameraKeypoints = facingCameraKeypointIds.map((id) =>
      this.keypoint.getDesiredKeypointFromArray(keypoints, id)
    );

    return facingCameraKeypoints.every(
      (kp) =>
        kp &&
        kp.visibility >
          POSE_DETECTION_CONSTANTS.FACING_CAMERA_VISIBILITY_THRESHOLD
    );
  }

  checkIsStill(state: {
    keypoints: Keypoint[];
    buffer: KeypointHistory;
    avgFps: { value: number; count: number } | null;
    videoHeight: number;
    bufferCutOff?: number;
    stillnessCountdownRef?: RefObject<Date | null>;
    stillnessEvaluationKeypoints?: KeypointId[];
    POSE_DETECTION_CONSTANTS: Record<AINumericConstantName, number>;
  }): boolean {
    const {
      keypoints,
      buffer,
      avgFps,
      videoHeight,
      bufferCutOff,
      stillnessCountdownRef,
      stillnessEvaluationKeypoints,
      POSE_DETECTION_CONSTANTS,
    } = state;

    if (!avgFps) return false;

    const framesNeededInBuffer = Math.min(
      buffer.bufferLength || Infinity,
      POSE_DETECTION_CONSTANTS.MIN_TIME_PASSED_TO_DETECT_STILLNESS_S *
        avgFps.value // at least this much second of data
    );

    const stillnessKeypointIds =
      stillnessEvaluationKeypoints || DEFAULT_STILLNESS_KEYPOINTS;

    const stillnessKeypoints = stillnessKeypointIds.map((id) =>
      this.keypoint.getDesiredKeypointFromArray(keypoints, id)
    );

    if (buffer.history.length < framesNeededInBuffer) return false;

    if (bufferCutOff !== undefined && buffer.history.length < bufferCutOff)
      return false;

    const isStillXY = stillnessKeypoints.every((kp) => {
      if (!kp) return false;

      const history = buffer.getHistoryById(kp.id, bufferCutOff);
      if (history.some((h) => !h)) return false;

      const stdDev = this.calculateStandardDeviation(history);

      const isKeypointStill =
        stdDev < POSE_DETECTION_CONSTANTS.STILLNESS_THRESHOLD_M;

      return isKeypointStill;
    });

    const isStillZ = this.isZAxisStill({
      buffer: buffer,
      videoHeight,
      bufferCutOff,
      tresholdPercentage:
        POSE_DETECTION_CONSTANTS.STILLNESS_Z_AXIS_PERCENTAGE_THRESHOLD,
    });

    const isStill = isStillXY && isStillZ;

    if (!isStill && stillnessCountdownRef) stillnessCountdownRef.current = null;
    else if (isStill && stillnessCountdownRef && !stillnessCountdownRef.current)
      stillnessCountdownRef.current = new Date();

    if (stillnessCountdownRef) {
      const now = new Date();
      const diff = dayjs(now).diff(
        dayjs(stillnessCountdownRef.current),
        'second'
      );

      const passedDiff =
        diff >= POSE_DETECTION_CONSTANTS.STILLNESS_COUNTDOWN_DURATION_S;

      return isStill && passedDiff;
    }

    return isStill;
  }

  private isZAxisStill = (state: {
    buffer: KeypointHistory;
    videoHeight: number;
    tresholdPercentage: number;
    bufferCutOff?: number;
  }) => {
    const { buffer, videoHeight, tresholdPercentage, bufferCutOff } = state;

    let biggestValueBetweenNoseAndFoots: number | undefined,
      smallestValueBetweenNoseAndFoots: number | undefined;

    buffer.history.slice(bufferCutOff ? bufferCutOff : 0).forEach((frame) => {
      const nose = this.keypoint.getDesiredKeypointFromArray(
        frame,
        KeypointId.NOSE
      );
      const leftFoot = this.keypoint.getDesiredKeypointFromArray(
        frame,
        KeypointId.LEFT_FOOT_INDEX
      );
      const rightFoot = this.keypoint.getDesiredKeypointFromArray(
        frame,
        KeypointId.RIGHT_FOOT_INDEX
      );

      if (!nose || !leftFoot || !rightFoot) return;

      if (
        !nose.pixelPosition ||
        !leftFoot.pixelPosition ||
        !rightFoot.pixelPosition
      )
        return;

      const noseY = nose.pixelPosition.y * videoHeight;
      const meanFootY =
        ((leftFoot.pixelPosition.y + rightFoot.pixelPosition.y) / 2) *
        videoHeight;

      if (!biggestValueBetweenNoseAndFoots)
        biggestValueBetweenNoseAndFoots = Math.abs(noseY - meanFootY);
      if (!smallestValueBetweenNoseAndFoots)
        smallestValueBetweenNoseAndFoots = Math.abs(noseY - meanFootY);

      if (Math.abs(noseY - meanFootY) > biggestValueBetweenNoseAndFoots)
        biggestValueBetweenNoseAndFoots = Math.abs(noseY - meanFootY);

      if (Math.abs(noseY - meanFootY) < smallestValueBetweenNoseAndFoots)
        smallestValueBetweenNoseAndFoots = Math.abs(noseY - meanFootY);
    });

    return (
      biggestValueBetweenNoseAndFoots !== undefined &&
      smallestValueBetweenNoseAndFoots !== undefined &&
      ((Math.abs(biggestValueBetweenNoseAndFoots) +
        Math.abs(smallestValueBetweenNoseAndFoots)) /
        2) *
        tresholdPercentage >=
        Math.abs(
          biggestValueBetweenNoseAndFoots - smallestValueBetweenNoseAndFoots
        )
    );
  };

  private calculateStandardDeviation = (keypoints: Keypoint[]) => {
    if (keypoints.length === 0) return 0;

    const meanX =
      keypoints.reduce((acc, pos) => acc + pos.position.x, 0) /
      keypoints.length;

    const meanY =
      keypoints.reduce((acc, pos) => acc + pos.position.y, 0) /
      keypoints.length;

    const variances = keypoints.map(
      (pos) =>
        ((pos.position.x - meanX) ** 2 + (pos.position.y - meanY) ** 2) / 2
    );
    const variance =
      variances.reduce((acc, varian) => acc + varian, 0) / keypoints.length;

    return Math.sqrt(variance);
  };

  checkExerciseRepStartConditions(
    keypoints: Keypoint[],
    buffer: KeypointHistory,
    exerciseStartConditions: ExerciseRepStartCondition[],
    avgFps: { value: number; count: number } | null,
    recordedReps: Rep[]
  ): boolean {
    // 5 fps/s, 0.5s -> 3 frames

    const currentBuffer = { ...buffer };

    const lastRep = recordedReps[recordedReps.length - 1];
    if (lastRep) {
      const lastRepEndFrameNum = lastRep.extremeKeypoint?.frameNum;
      if (lastRepEndFrameNum !== undefined) {
        const indexInBuffer = currentBuffer.history.findIndex((frame) =>
          frame.some((k) => k.frameNum === lastRepEndFrameNum)
        );
        if (indexInBuffer !== -1) {
          currentBuffer.history = currentBuffer.history.slice(
            indexInBuffer + 1
          );
        }
      }
    }

    for (const condition of exerciseStartConditions) {
      const fps = avgFps?.value || 30; // default to 30 fps
      const numFrames = Math.ceil((fps * condition.duration) / 1000); // convert ms to seconds

      const historyFrame = currentBuffer.history.slice(
        -Math.min(numFrames, currentBuffer.history.length)
      )[0];

      if (!historyFrame) return false;

      const historyKeypoint = historyFrame.find(
        (k) => k.id === condition.keypointId
      );
      if (!historyKeypoint) return false;

      const currentFrameKeypoint = keypoints.find(
        (k) => k.id === condition.keypointId
      );
      if (!currentFrameKeypoint) return false;

      // const currentValue = this.keypoint.getKeypointValueByType(
      //   currentFrameKeypoint,
      //   condition.type
      // );

      // console.log(condition.keypointId, 'currentValue', currentValue);

      const isValid = this.validateKeypointCondition(
        historyKeypoint,
        currentFrameKeypoint,
        condition
      );

      if (!isValid) return false;
    }

    return true;
  }

  checkHasShakedHead(state: {
    keypointBuffer: KeypointHistory;
    avgFps: { value: number; count: number } | null;
    POSE_DETECTION_CONSTANTS: Record<AINumericConstantName, number>;
  }): boolean {
    const { keypointBuffer, avgFps, POSE_DETECTION_CONSTANTS } = state;

    const numFrames = this.keypoint.getFramesCountFromSeconds(
      POSE_DETECTION_CONSTANTS.HEAD_SHAKE_DETECTION_BUFFER_DURATION_S,
      avgFps?.value || 30
    );

    const frames = keypointBuffer.history.slice(-numFrames);

    let hasRotatedLeft = false,
      hasRotatedRight = false;

    frames.forEach((frame) => {
      const nose = this.keypoint.getDesiredKeypointFromArray(
        frame,
        KeypointId.NOSE
      );

      const leftShoulder = this.keypoint.getDesiredKeypointFromArray(
        frame,
        KeypointId.LEFT_SHOULDER
      );

      const rightShoulder = this.keypoint.getDesiredKeypointFromArray(
        frame,
        KeypointId.RIGHT_SHOULDER
      );

      const leftHip = this.keypoint.getDesiredKeypointFromArray(
        frame,
        KeypointId.LEFT_HIP
      );

      const rightHip = this.keypoint.getDesiredKeypointFromArray(
        frame,
        KeypointId.RIGHT_HIP
      );

      if (!nose || !leftShoulder || !rightShoulder || !leftHip || !rightHip)
        return;

      const noseX = this.keypoint.getKeypointValueByType(
        nose,
        KeypointValueType.POSITION_X,
        true
      );
      const noseY = this.keypoint.getKeypointValueByType(
        nose,
        KeypointValueType.POSITION_Y,
        true
      );

      const leftShoulderX = this.keypoint.getKeypointValueByType(
        leftShoulder,
        KeypointValueType.POSITION_X,
        true
      );
      const leftShoulderY = this.keypoint.getKeypointValueByType(
        leftShoulder,
        KeypointValueType.POSITION_Y,
        true
      );

      const rightShoulderX = this.keypoint.getKeypointValueByType(
        rightShoulder,
        KeypointValueType.POSITION_X,
        true
      );
      const rightShoulderY = this.keypoint.getKeypointValueByType(
        rightShoulder,
        KeypointValueType.POSITION_Y,
        true
      );

      const leftHipX = this.keypoint.getKeypointValueByType(
        leftHip,
        KeypointValueType.POSITION_X,
        true
      );
      const leftHipY = this.keypoint.getKeypointValueByType(
        leftHip,
        KeypointValueType.POSITION_Y,
        true
      );

      const rightHipX = this.keypoint.getKeypointValueByType(
        rightHip,
        KeypointValueType.POSITION_X,
        true
      );
      const rightHipY = this.keypoint.getKeypointValueByType(
        rightHip,
        KeypointValueType.POSITION_Y,
        true
      );

      if (
        noseX === undefined ||
        noseY === undefined ||
        leftShoulderX === undefined ||
        leftShoulderY === undefined ||
        rightShoulderX === undefined ||
        rightShoulderY === undefined ||
        leftHipX === undefined ||
        leftHipY === undefined ||
        rightHipX === undefined ||
        rightHipY === undefined
      )
        return;

      const middleShoulderX = (leftShoulderX + rightShoulderX) / 2;
      const middleShoulderY = (leftShoulderY + rightShoulderY) / 2;

      const middleHipX = (leftHipX + rightHipX) / 2;
      const middleHipY = (leftHipY + rightHipY) / 2;

      const nosePoint: Point2D = { x: noseX, y: noseY };
      const middleShoulderPoint: Point2D = {
        x: middleShoulderX,
        y: middleShoulderY,
      };
      const middleHipPoint: Point2D = { x: middleHipX, y: middleHipY };

      const angle = this.angle.calculateAngle(
        nosePoint,
        middleHipPoint,
        middleShoulderPoint
      );

      if (angle === null) return;

      const isLeftAngle = nosePoint.x < middleShoulderPoint.x;

      if (
        isLeftAngle &&
        !hasRotatedLeft &&
        angle < POSE_DETECTION_CONSTANTS.HEAD_SHAKE_ANGLE_THRESHOLD_DEGREES
      ) {
        hasRotatedLeft = true;
      } else if (
        !isLeftAngle &&
        !hasRotatedRight &&
        angle < POSE_DETECTION_CONSTANTS.HEAD_SHAKE_ANGLE_THRESHOLD_DEGREES
      ) {
        hasRotatedRight = true;
      }
    });

    return hasRotatedLeft && hasRotatedRight;
  }

  private validateKeypointCondition(
    currentKeypoint: Keypoint,
    nextKeypoint: Keypoint,
    condition: ExerciseRepStartCondition
  ): boolean {
    const { value1: currentValue, value2: nextValue } =
      this.keypoint.getKeypointsValuesByType(
        currentKeypoint,
        nextKeypoint,
        condition.type
      );

    if (currentValue === undefined || nextValue === undefined) return false;

    // const distance = Math.abs(nextValue - currentValue);
    // const isDistanceOk = distance >= condition.distance;

    switch (condition.direction) {
      case ConditionDirection.POSITIVE: {
        return (
          nextValue > currentValue &&
          nextValue - currentValue >= condition.distance
        );
      }
      case ConditionDirection.NEGATIVE:
        return (
          nextValue < currentValue &&
          currentValue - nextValue >= condition.distance
        );
      default:
        return false;
    }
  }
}
