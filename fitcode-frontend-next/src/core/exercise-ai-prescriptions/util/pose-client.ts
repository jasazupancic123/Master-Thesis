'use client'

export async function loadPoseDetection() {
  return await import('@tensorflow-models/pose-detection')
}