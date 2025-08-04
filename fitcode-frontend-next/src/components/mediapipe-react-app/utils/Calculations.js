import { CoMWeights, Thresholds } from '../thresholds/Squat';

export function denormalizeCoordinates(landmark, frameWidth, frameHeight) {
  return {
    x: landmark.x * frameWidth,
    y: landmark.y * frameHeight,
  };
}

export function calculate3DAngle(landmarkA, landmarkB, landmarkC) {
  if (!landmarkA || !landmarkB || !landmarkC) {
    console.error('One or more landmarks are undefined', {
      landmarkA,
      landmarkB,
      landmarkC,
    });
    return 0; // Return a default value or handle as appropriate
  }

  // Directly using x, y, z properties from landmarks
  const ba = [
    landmarkA.x - landmarkB.x,
    landmarkA.y - landmarkB.y,
    landmarkA.z - landmarkB.z,
  ];
  const bc = [
    landmarkC.x - landmarkB.x,
    landmarkC.y - landmarkB.y,
    landmarkC.z - landmarkB.z,
  ];

  const cosineAngle =
    (ba[0] * bc[0] + ba[1] * bc[1] + ba[2] * bc[2]) /
    (Math.sqrt(ba[0] ** 2 + ba[1] ** 2 + ba[2] ** 2) *
      Math.sqrt(bc[0] ** 2 + bc[1] ** 2 + bc[2] ** 2));

  const angle = Math.acos(cosineAngle);
  return Math.round((angle * 180) / Math.PI);
}

function calculate3DVerticalAngle(landmarkA, landmarkB) {
  if (!landmarkA || !landmarkB) {
    console.error('One or more landmarks are undefined', {
      landmarkA,
      landmarkB,
    });
    return 0; // Return a default value or handle as appropriate
  }

  // Vector from A to B
  const vectorAB = {
    x: landmarkB.x - landmarkA.x,
    y: landmarkB.y - landmarkA.y,
    z: landmarkB.z - landmarkA.z,
  };

  // Vertical vector in 3D, assuming Y is up
  const verticalVector = { x: 0, y: 1, z: 0 };

  // Dot product of vectorAB and verticalVector (since verticalVector's x and z are 0, it simplifies)
  const dotProduct = vectorAB.y * verticalVector.y;

  // Magnitude of vectorAB
  const magnitudeAB = Math.sqrt(
    vectorAB.x ** 2 + vectorAB.y ** 2 + vectorAB.z ** 2
  );

  // Magnitude of verticalVector (which is 1, but included for clarity)
  const magnitudeVertical = 1;

  // Calculate the cosine of the angle
  const cosineAngle = dotProduct / (magnitudeAB * magnitudeVertical);

  // Calculate the angle in radians and then convert to degrees
  const angleRadians = Math.acos(cosineAngle);
  const angleDegrees = Math.round((angleRadians * 180) / Math.PI);

  return angleDegrees;
}

export function calculate2DDistance(pointA, pointB) {
  return Math.sqrt((pointA.x - pointB.x) ** 2 + (pointA.y - pointB.y) ** 2);
}

export function calculate3DDistance(pointA, pointB) {
  return Math.sqrt(
    (pointA.x - pointB.x) ** 2 +
      (pointA.y - pointB.y) ** 2 +
      (pointA.z - pointB.z) ** 2
  );
}

export function calculatePlaneNormal(vec1, vec2) {
  // Calculate the cross product of vec1 and vec2
  const normal = {
    x: vec1.y * vec2.z - vec1.z * vec2.y,
    y: vec1.z * vec2.x - vec1.x * vec2.z,
    z: vec1.x * vec2.y - vec1.y * vec2.x,
  };

  // Optionally, normalize the result to get a unit vector
  const magnitude = Math.sqrt(
    normal.x * normal.x + normal.y * normal.y + normal.z * normal.z
  );
  const normalizedNormal = {
    x: normal.x / magnitude,
    y: normal.y / magnitude,
    z: normal.z / magnitude,
  };

  return normalizedNormal;
}

export function pointToPlaneDistance(point, planePoint, normal) {
  // Calculate the vector from planePoint to the point
  const vec = {
    x: point.x - planePoint.x,
    y: point.y - planePoint.y,
    z: point.z - planePoint.z,
  };

  // Dot product of vec and the plane's normal vector
  const dotProduct = vec.x * normal.x + vec.y * normal.y + vec.z * normal.z;

  // Magnitude of the normal vector
  const normalMagnitude = Math.sqrt(
    normal.x * normal.x + normal.y * normal.y + normal.z * normal.z
  );

  // Distance from point to plane
  return dotProduct / normalMagnitude;
}

export function calculateVectorAngle(vec1, vec2) {
  // Dot product of vec1 and vec2
  const dot = vec1.x * vec2.x + vec1.y * vec2.y + vec1.z * vec2.z;

  // Magnitude of vec1 and vec2
  const magVec1 = Math.sqrt(vec1.x ** 2 + vec1.y ** 2 + vec1.z ** 2);
  const magVec2 = Math.sqrt(vec2.x ** 2 + vec2.y ** 2 + vec2.z ** 2);

  // Cosine of the angle
  const cosAngle = dot / (magVec1 * magVec2);

  // Angle in radians
  const angle = Math.acos(Math.min(Math.max(cosAngle, -1), 1)); // Clamping the value to avoid NaN due to floating point errors

  // Convert to degrees
  return angle * (180 / Math.PI);
}

export function calculateTrunkAngle(poseCoordinates) {
  // MediaPipe landmark indices for shoulders and hips
  const leftShoulder = poseCoordinates[11];
  const rightShoulder = poseCoordinates[12];
  const leftHip = poseCoordinates[23];
  const rightHip = poseCoordinates[24];

  // Calculate midpoints for shoulder and hip
  const shoulderMidpoint = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
    z: (leftShoulder.z + rightShoulder.z) / 2,
  };
  const hipMidpoint = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
    z: (leftHip.z + rightHip.z) / 2,
  };

  return calculate3DVerticalAngle(shoulderMidpoint, hipMidpoint);
}

export function calculateHeadAngle(poseCoordinates) {
  const leftEar = poseCoordinates[7];
  const rightEar = poseCoordinates[8];
  const leftShoulder = poseCoordinates[11];
  const rightShoulder = poseCoordinates[12];

  // Calculate midpoints for ears and shoulders
  const earMidpoint = {
    x: (leftEar.x + rightEar.x) / 2,
    y: (leftEar.y + rightEar.y) / 2,
    z: (leftEar.z + rightEar.z) / 2,
  };
  const shoulderMidpoint = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
    z: (leftShoulder.z + rightShoulder.z) / 2,
  };

  return calculate3DVerticalAngle(earMidpoint, shoulderMidpoint);
}

export function calculateShinAngle(poseCoordinates, side) {
  const knee = poseCoordinates[side === 'left' ? 25 : 26];
  const ankle = poseCoordinates[side === 'left' ? 27 : 28];
  return calculate3DVerticalAngle(knee, ankle);
}

export function calculateThighAngle(poseCoordinates, side) {
  const hip = poseCoordinates[side === 'left' ? 23 : 24];
  const knee = poseCoordinates[side === 'left' ? 25 : 26];
  return calculate3DVerticalAngle(hip, knee);
}

export function validFeetSpacing(poseCoordinates) {
  const leftHip = poseCoordinates[23];
  const rightHip = poseCoordinates[24];
  const leftAnkle = poseCoordinates[27];
  const rightAnkle = poseCoordinates[28];

  // Calculate distances between hips and ankles in 3D space
  const hipDistance = calculate3DDistance(leftHip, rightHip);
  const ankleDistance = calculate3DDistance(leftAnkle, rightAnkle);

  // Use Thresholds for comparison
  const ratio = ankleDistance / hipDistance;
  if (
    ratio < Thresholds.FEET_SPACING[0] ||
    ratio > Thresholds.FEET_SPACING[1]
  ) {
    return false;
  } else {
    return true;
  }
}

export function calculate3DCoM(poseLandmarks, POSE_LANDMARKS) {
  let totalMass = 0;
  let com = { x: 0, y: 0, z: 0 };

  // Calculate head center as average of the two ears
  const leftEar = poseLandmarks[POSE_LANDMARKS.LEFT_EAR];
  const rightEar = poseLandmarks[POSE_LANDMARKS.RIGHT_EAR];
  let headCenter = null;
  if (leftEar && rightEar) {
    headCenter = {
      x: (leftEar.x + rightEar.x) / 2,
      y: (leftEar.y + rightEar.y) / 2,
      z: (leftEar.z + rightEar.z) / 2,
      visibility: Math.min(leftEar.visibility, rightEar.visibility),
    };
  }

  // Include headCenter in the keypoints if it was successfully calculated
  if (headCenter) {
    poseLandmarks.headCenter = headCenter;
  }

  // Iterate over each body part and calculate its contribution to the CoM
  for (const [bodyPart, weight] of Object.entries(CoMWeights)) {
    const landmark = poseLandmarks[bodyPart];
    if (landmark && landmark.visibility > 0.5) {
      com.x += landmark.x * weight;
      com.y += landmark.y * weight;
      com.z += landmark.z * weight;
      totalMass += weight;
    }
  }

  // Normalize the center of mass coordinates by the total mass
  com.x /= totalMass;
  com.y /= totalMass;
  com.z /= totalMass;

  return com;
}

export function calculate2DCoM(poseLandmarks, POSE_LANDMARKS) {
  let totalMass = 0;
  let com = { x: 0, y: 0 };

  // Calculate head center as average of the two ears, ignore z-axis
  const leftEar = poseLandmarks[POSE_LANDMARKS.LEFT_EAR];
  const rightEar = poseLandmarks[POSE_LANDMARKS.RIGHT_EAR];
  let headCenter = null;
  if (leftEar && rightEar) {
    headCenter = {
      x: (leftEar.x + rightEar.x) / 2,
      y: (leftEar.y + rightEar.y) / 2,
      visibility: Math.min(leftEar.visibility, rightEar.visibility),
    };
  }

  // Include headCenter in the keypoints if it was successfully calculated
  if (headCenter) {
    poseLandmarks.headCenter = headCenter;
  }

  // Iterate over each body part and calculate its contribution to the CoM
  for (const [bodyPart, weight] of Object.entries(CoMWeights)) {
    const landmark = poseLandmarks[bodyPart];
    if (landmark && landmark.visibility > 0.5) {
      com.x += landmark.x * weight;
      com.y += landmark.y * weight;
      totalMass += weight;
    }
  }

  // Normalize the center of mass coordinates by the total mass
  com.x /= totalMass;
  com.y /= totalMass;

  return com;
}

export const calculateStandardDeviation = (positions) => {
  if (positions.length === 0) return 0;
  const meanX =
    positions.reduce((acc, pos) => acc + pos.x, 0) / positions.length;
  const meanY =
    positions.reduce((acc, pos) => acc + pos.y, 0) / positions.length;
  const variances = positions.map(
    (pos) => ((pos.x - meanX) ** 2 + (pos.y - meanY) ** 2) / 2
  );
  const variance =
    variances.reduce((acc, varian) => acc + varian, 0) / positions.length;
  return Math.sqrt(variance);
};

export const calculateStandardDeviation1D = (values) => {
  if (values.length === 0) return 0;
  const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
  const variance =
    values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

export function calculateCmPerPixel(
  userHeightCm,
  poseLandmarks,
  videoHeight,
  POSE_LANDMARKS
) {
  // assuming that eye - top of head is 7% of total height
  const heelEyeHeightCm = userHeightCm * 0.93;

  // Calculate the visible body height in pixels
  const heelY = poseLandmarks[POSE_LANDMARKS.LEFT_HEEL].y * videoHeight;
  const eyeY = poseLandmarks[POSE_LANDMARKS.LEFT_EYE].y * videoHeight;
  const pixelHeight = Math.abs(heelY - eyeY);

  // Calculate the scaling factor (cm per pixel)
  const cmPerPixel = heelEyeHeightCm / pixelHeight;

  return cmPerPixel;
}

export const calculateHipMidpointY = (
  leftHipPosition,
  rightHipPosition,
  videoHeight
) => {
  // Convert normalized Y positions to pixel values
  const leftHipYInPixels = leftHipPosition.y * videoHeight;
  const rightHipYInPixels = rightHipPosition.y * videoHeight;

  // Calculate the Y midpoint in pixels
  const midpointY = (leftHipYInPixels + rightHipYInPixels) / 2;

  // Return the Y midpoint value
  return midpointY;
};

export const calculateAngles = (results, poseLandmarks) => {
  console.log('poseLandmarks inside calculateAngles', poseLandmarks);
  const newLeftKneeAngle = calculate3DAngle(
    results.poseWorldLandmarks[poseLandmarks.LEFT_HIP],
    results.poseWorldLandmarks[poseLandmarks.LEFT_KNEE],
    results.poseWorldLandmarks[poseLandmarks.LEFT_ANKLE]
  );
  const newRightKneeAngle = calculate3DAngle(
    results.poseWorldLandmarks[poseLandmarks.RIGHT_HIP],
    results.poseWorldLandmarks[poseLandmarks.RIGHT_KNEE],
    results.poseWorldLandmarks[poseLandmarks.RIGHT_ANKLE]
  );
  const newLeftHipAngle = calculate3DAngle(
    results.poseWorldLandmarks[poseLandmarks.LEFT_SHOULDER],
    results.poseWorldLandmarks[poseLandmarks.LEFT_HIP],
    results.poseWorldLandmarks[poseLandmarks.LEFT_KNEE]
  );
  const newRightHipAngle = calculate3DAngle(
    results.poseWorldLandmarks[poseLandmarks.RIGHT_SHOULDER],
    results.poseWorldLandmarks[poseLandmarks.RIGHT_HIP],
    results.poseWorldLandmarks[poseLandmarks.RIGHT_KNEE]
  );

  return {
    newLeftKneeAngle,
    newRightKneeAngle,
    newLeftHipAngle,
    newRightHipAngle,
  };
};
