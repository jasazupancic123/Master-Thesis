import { RefObject } from 'react';
import { lib } from '..';
import { KeypointId } from './enum/keypoint-id';
import { MoreLess } from './enum/more-less.enum';
import { ExerciseAngleCondition } from './type/exercise-start-condition.type';
import { Keypoint } from './type/keypoint.type';
import { KeypointUtil } from './util/keypoint.util';
import { AngleUtil } from './util/angle-util';

export class FeedbackService {
  private static _instance: FeedbackService;
  private readonly keypoint: KeypointUtil;
  private readonly angle: AngleUtil;

  private constructor() {
    this.keypoint = KeypointUtil.instance;
    this.angle = AngleUtil.instance;
  }

  static get instance(): FeedbackService {
    if (!FeedbackService._instance)
      FeedbackService._instance = new FeedbackService();
    return FeedbackService._instance;
  }

  /**
   * Checks the angle feedbacks, if they are incorrect, it draws a red dot on the origin point of the angle
   * @param state
   */
  checkAngleFeedbacks(state: {
    angles: ExerciseAngleCondition[] | undefined;
    currentFrameKeypoints: Keypoint[];
    currentInvalidAnglesRef: RefObject<ExerciseAngleCondition[]>;
  }) {
    const { angles, currentFrameKeypoints, currentInvalidAnglesRef } = state;

    if (!angles || !angles.length) return;

    angles.forEach((angle) => {
      const isAngleIncorrect = lib.ai.angle.checkIsAngleIncorrect(
        angle,
        currentFrameKeypoints
      );

      if (
        isAngleIncorrect &&
        !currentInvalidAnglesRef.current.some((a) => a.id === angle.id)
      ) {
        currentInvalidAnglesRef.current.push(angle);
      } else if (
        !isAngleIncorrect &&
        currentInvalidAnglesRef.current.some((a) => a.id === angle.id)
      ) {
        currentInvalidAnglesRef.current =
          currentInvalidAnglesRef.current.filter((a) => a.id !== angle.id);
      }
    });
  }

  /**
   * Returns true, if the angle is over the threshold (angle is not ok) and false if the angle is ok
   * @param keypoints
   * @param angle
   */
  private checkIsAngleIncorrect(
    angle: ExerciseAngleCondition,
    keypoints: Keypoint[]
  ): boolean {
    const point1Keypoints = this.getAnglePointKeypoints(
      angle.point1,
      keypoints
    );
    const point2Keypoints = this.getAnglePointKeypoints(
      angle.point2,
      keypoints
    );
    const originKeypoints = this.getAnglePointKeypoints(
      angle.origin,
      keypoints
    );

    if (
      angle.point1.length !== point1Keypoints.length ||
      angle.point2.length !== point2Keypoints.length ||
      angle.origin.length !== originKeypoints.length
    ) {
      // some keypoints are missing, cannot calculate angle
      return false;
    }

    const point1 = this.keypoint.getAvgPointCoordinates(point1Keypoints, true);
    const point2 = this.keypoint.getAvgPointCoordinates(point2Keypoints, true);
    const origin = this.keypoint.getAvgPointCoordinates(originKeypoints, true);

    if (!point1 || !point2 || !origin) return false;

    const deg = this.angle.calculateAngle(point1, point2, origin);

    if (deg === null) return false;

    if (angle.moreLess === MoreLess.MORE && deg > angle.threshold) return true;
    else if (angle.moreLess === MoreLess.LESS && deg < angle.threshold)
      return true;

    return false;
  }

  getAnglePointKeypoints(
    anglePoints: KeypointId[],
    keypoints: Keypoint[]
  ): Keypoint[] {
    return anglePoints
      .map((k) => this.keypoint.getDesiredKeypointFromArray(keypoints, k))
      .filter((k) => k !== undefined);
  }
}
