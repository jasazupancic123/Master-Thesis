import type { KeypointId } from '../enum/keypoint-id';
import type { Point3D } from './point-3d.type';

export type Keypoint = {
  id: KeypointId;
  isValid: boolean; // if it's outlier or not
  position: Point3D; // currently in meters
  velocity: number; // px/ms or px/s,
  // computed as abs(abs(prev_x - curr_x) + abs(prev_y - curr_y)),
  // so the first captured keypoint has velocity of 0 or undefined?
  capturedAt: Date;
  frameNum: number;
  visibility: number; // [0, 1], how likely the keypoint is visible. Not all models provide this.
};
