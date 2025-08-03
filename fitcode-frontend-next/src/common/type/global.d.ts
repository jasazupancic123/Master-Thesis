export {};

declare global {
  interface Window {
    Pose: { new (config?: PoseConfig): PoseType };
    POSE_LANDMARKS: unknown; // You can replace `any` with a more specific type if needed
    Camera: {
      new (videoElement: HTMLVideoElement, config: CameraConfig): Camera;
    };
  }
}
