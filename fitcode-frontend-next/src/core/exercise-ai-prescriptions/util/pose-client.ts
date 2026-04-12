'use client';

export async function loadPoseDetection() {
  const poseDetection = await import('@tensorflow-models/pose-detection');
  return poseDetection;
}
