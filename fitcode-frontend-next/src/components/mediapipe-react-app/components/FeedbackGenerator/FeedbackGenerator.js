import { Thresholds } from '../../thresholds/Squat';
import {
  calculate3DDistance,
  calculatePlaneNormal,
  calculateShinAngle,
  calculateThighAngle,
  calculateVectorAngle,
  pointToPlaneDistance,
} from '../../utils/Calculations';

export class FeedbackGenerator {
  constructor() {
    // Define feedback messages
    this.feedbackMessages = {
      trunk_angle: 'Keep your back straight.',
      left_knee_valgus: 'Left knee valgus.',
      right_knee_valgus: 'Right knee valgus.',
      left_knee_varus: 'Left knee varus.',
      right_knee_varus: 'Right knee varus.',
      feet_spacing_under: 'Feet too close together.',
      feet_spacing_over: 'Feet too far apart.',
      feet_in: 'Feet too turned in.',
      feet_out: 'Feet too turned out.',
      knees_forward: 'Knees going too far over toes.',
      head_up: 'Keep your head up.',
    };
  }

  analyzePose(poseCoordinates, isCurrentlyInSquat) {
    let feedback = [];
    let verticalAngles = {
      head: 0,
      leftShin: 0,
      rightShin: 0,
      leftThigh: 0,
      rightThigh: 0,
      trunk: 0, // Add trunk angle to the dictionary
    };

    // Calculate vertical angles for the trunk, head, shin, and thigh
    // verticalAngles.trunk = calculateTrunkAngle(poseCoordinates);
    // verticalAngles.head = calculateHeadAngle(poseCoordinates);
    verticalAngles.leftShin = calculateShinAngle(poseCoordinates, 'left');
    verticalAngles.rightShin = calculateShinAngle(poseCoordinates, 'right');
    verticalAngles.leftThigh = calculateThighAngle(poseCoordinates, 'left');
    verticalAngles.rightThigh = calculateThighAngle(poseCoordinates, 'right');

    // run checks based on state
    if (!isCurrentlyInSquat) {
      // check feet spacing and feet angle
      const feetSpacingFeedbackKey = this.checkFeetSpacing(poseCoordinates);
      const feetAngleFeedbackKey = this.checkFeetAngle(poseCoordinates);

      if (feetSpacingFeedbackKey) {
        feedback.push(this.feedbackMessages[feetSpacingFeedbackKey]);
      } else if (feetAngleFeedbackKey) {
        feedback.push(this.feedbackMessages[feetAngleFeedbackKey]);
      }
    } else {
      // const kneeFeedbackKeys = this.checkKneeAlignment(poseCoordinates);
      // // Map feedback keys to messages
      // kneeFeedbackKeys.forEach(key => {
      //     if (this.feedbackMessages[key]) {
      //         feedback.push(this.feedbackMessages[key]);
      //     }
      // });
      // check back angle
      // if (verticalAngles.trunk > Thresholds.TRUNK_VERTICAL_THRESH) {
      //     feedback.push(`${this.feedbackMessages['trunk_angle']}`);
      // }
      // check shins
      if (
        verticalAngles.leftShin > Thresholds.TRUNK_VERTICAL_THRESH ||
        verticalAngles.leftShin > Thresholds.TRUNK_VERTICAL_THRESH
      ) {
        feedback.push(`${this.feedbackMessages['knees_forward']}`);
      }
      // check head
      // if (verticalAngles.head > Thresholds.HEAD_VERTICAL_THRESH) {
      //     feedback.push(`${this.feedbackMessages['head_up']}`);
      // }
    }
    return feedback;
  }

  checkFeetSpacing(poseCoordinates) {
    console.log('inside feet spacing');
    const leftHip = poseCoordinates[23];
    const rightHip = poseCoordinates[24];
    const leftAnkle = poseCoordinates[27];
    const rightAnkle = poseCoordinates[28];

    // Calculate distances between hips and ankles in 3D space
    const hipDistance = calculate3DDistance(leftHip, rightHip);
    const ankleDistance = calculate3DDistance(leftAnkle, rightAnkle);

    // Use Thresholds for comparison
    const ratio = ankleDistance / hipDistance;
    if (ratio < Thresholds.FEET_SPACING[0]) {
      return 'feet_spacing_under';
    } else if (ratio > Thresholds.FEET_SPACING[1]) {
      return 'feet_spacing_over';
    } else {
      return null; // No feedback necessary
    }
  }

  checkKneeAlignment(poseCoordinates) {
    const leftKnee = poseCoordinates[25];
    const rightKnee = poseCoordinates[26];
    const leftAnkle = poseCoordinates[27];
    const rightAnkle = poseCoordinates[28];
    const leftHip = poseCoordinates[23];
    const rightHip = poseCoordinates[24];
    const leftToe = poseCoordinates[31];
    const rightToe = poseCoordinates[32];

    // Calculate vectors from hip to ankle
    const leftHipToAnkleVector = {
      x: leftAnkle.x - leftHip.x,
      y: leftAnkle.y - leftHip.y,
      z: leftAnkle.z - leftHip.z,
    };
    const rightHipToAnkleVector = {
      x: rightAnkle.x - rightHip.x,
      y: rightAnkle.y - rightHip.y,
      z: rightAnkle.z - rightHip.z,
    };

    // Calculate vectors from ankle to toe
    const leftAnkleToeVector = {
      x: leftToe.x - leftAnkle.x,
      y: leftToe.y - leftAnkle.y,
      z: leftToe.z - leftAnkle.z,
    };
    const rightAnkleToeVector = {
      x: rightToe.x - rightAnkle.x,
      y: rightToe.y - rightAnkle.y,
      z: rightToe.z - rightAnkle.z,
    };

    // Calculate plane normals using the vectors
    const leftNormal = calculatePlaneNormal(
      leftHipToAnkleVector,
      leftAnkleToeVector
    );
    const rightNormal = calculatePlaneNormal(
      rightHipToAnkleVector,
      rightAnkleToeVector
    );

    // Multiply the left distance by -1 to make negative distance indicate valgus for both legs
    const leftKneeDistance =
      -1 * pointToPlaneDistance(leftKnee, leftAnkle, leftNormal);
    const rightKneeDistance = pointToPlaneDistance(
      rightKnee,
      rightAnkle,
      rightNormal
    );

    const feedbackKeys = [];

    if (leftKneeDistance < Thresholds.KNEE_ALIGNMENT[0]) {
      feedbackKeys.push('left_knee_valgus');
    } else if (leftKneeDistance > Thresholds.KNEE_ALIGNMENT[1]) {
      feedbackKeys.push('left_knee_varus');
    }

    if (rightKneeDistance < Thresholds.KNEE_ALIGNMENT[0]) {
      feedbackKeys.push('right_knee_valgus');
    } else if (rightKneeDistance > Thresholds.KNEE_ALIGNMENT[1]) {
      feedbackKeys.push('right_knee_varus');
    }

    return feedbackKeys;
  }

  checkFeetAngle(poseCoordinates) {
    const leftHeel = poseCoordinates[29];
    const rightHeel = poseCoordinates[30];
    const leftToe = poseCoordinates[31];
    const rightToe = poseCoordinates[32];

    const heelDist = calculate3DDistance(leftHeel, rightHeel);
    const toeDist = calculate3DDistance(leftToe, rightToe);

    // Define vectors for left and right feet from heel to toe
    const leftFootVector = {
      x: leftToe.x - leftHeel.x,
      y: leftToe.y - leftHeel.y,
      z: leftToe.z - leftHeel.z,
    };
    const rightFootVector = {
      x: rightToe.x - rightHeel.x,
      y: rightToe.y - rightHeel.y,
      z: rightToe.z - rightHeel.z,
    };

    // Calculate the angle between the two vectors
    let angle = calculateVectorAngle(leftFootVector, rightFootVector);
    if (toeDist < heelDist) {
      angle = -1 * angle;
    }

    if (angle < Thresholds.FEET_ANGLE[0]) {
      return 'feet_in';
    } else if (angle > Thresholds.FEET_ANGLE[1]) {
      return 'feet_out';
    } else {
      return null;
    }
  }
}
