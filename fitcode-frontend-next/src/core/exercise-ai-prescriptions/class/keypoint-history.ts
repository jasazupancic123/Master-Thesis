import type { Keypoint } from '../type/keypoint.type';

export class KeypointHistory {
  history: Keypoint[][];
  bufferLength?: number;
  isMainHistory?: boolean;

  constructor(
    history: Keypoint[][],
    bufferLength?: number,
    isMainHistory?: boolean
  ) {
    this.history = history;
    this.bufferLength = bufferLength;
    this.isMainHistory = isMainHistory;
  }

  insertFrame(
    keypoints: Keypoint[],
    avgFps?: { value: number; count: number } | null,
    numSeconds?: number
  ) {
    if (!keypoints) return;

    if (this.isMainHistory) {
      // TODO()
      // checks if a keypoint is a outlier via the checkForOutliers function
      // if there's an outlier, then keypoint.isValid becomes false
      // checkForOutliers(keypoints, outliersBuffer);
      // TODO()
      // calculates keypoints velocities based on previous frames
      // updates keypoint.velocity
      // const previousFrameKeypoints = keypoints[keypoints.length - 1]
      // calculateVelocities(keypoints, previousFrameKeypoints);
    }

    // inserts keypoints
    this.history.push(keypoints);

    // Calculate new buffer length based on fps and numSeconds
    if (avgFps && numSeconds && avgFps.count > 10) {
      const maxBufferLength = Math.ceil(avgFps.value * numSeconds);
      this.bufferLength = maxBufferLength;
    }

    if (this.bufferLength && this.history.length > this.bufferLength)
      this.history.shift();
  }

  getHistoryById(keypointId: string, bufferCutOff?: number): Keypoint[] {
    const history =
      bufferCutOff !== undefined
        ? this.history.slice(-bufferCutOff)
        : this.history;
    return history.map((frame) =>
      frame.find((kp) => kp.id === keypointId)
    ) as Keypoint[];
  }

  getLatestFrameNum(): number {
    const latestFrameKeypoints = this.history[this.history.length - 1];
    const frameNum = latestFrameKeypoints.find(
      (kp) => kp.frameNum !== undefined
    )?.frameNum;

    return frameNum ?? this.history.length - 1;
  }

  getFromIndex(index: number): Keypoint[][] {
    return this.history.slice(index);
  }

  cutAtIndex(index: number, clearBufferLength?: boolean) {
    if (index !== -1) {
      this.history = this.history.slice(index);
      if (clearBufferLength) this.bufferLength = undefined;
    }
  }

  clear() {
    this.history = [];
  }
}
