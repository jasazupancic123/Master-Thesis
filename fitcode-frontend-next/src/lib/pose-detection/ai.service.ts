import { AIDrawingService } from './ai-drawing.service';
import { AngleService } from './feedback.service';
import { PoseDetectionService } from './pose-detection.service';
import { RepDetectionService } from './rep-detection.service';
import { RepsGraphService } from './rep-graph.service';
import { StatusDetectionService } from './status-detection.service';
import { KeypointUtil } from './util/keypoint.util';
import { RepPostProcessingUtil } from './util/rep-post-processing.util';

export class AIService {
  readonly keypoint: KeypointUtil;
  readonly graph: RepsGraphService;
  readonly status: StatusDetectionService;
  readonly pose: PoseDetectionService;
  readonly repPostProcessing: RepPostProcessingUtil;
  readonly rep: RepDetectionService;
  readonly angle: AngleService;
  readonly draw: AIDrawingService;

  constructor() {
    this.keypoint = KeypointUtil.instance;
    this.graph = RepsGraphService.instance;
    this.status = StatusDetectionService.instance;
    this.pose = PoseDetectionService.instance;
    this.repPostProcessing = RepPostProcessingUtil.instance;
    this.rep = RepDetectionService.instance;
    this.angle = AngleService.instance;
    this.draw = AIDrawingService.instance;
  }
}
