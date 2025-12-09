import numpy as np

from fe_lib.subsystems.authentication.face_detection.base import DetectedFace, FaceDetector
from fe_lib.subsystems.authentication.face_detection.scrfd.base import Detections, SCRFDBase
from fe_lib.subsystems.authentication.face_detection.scrfd.schemas import Bbox, Face, Point, Threshold
from fe_lib.subsystems.models.base import BaseModel, BaseModelConfig


class SCRFaceDetectorConfig(BaseModelConfig):
    nms: float
    probability: float
    max_faces: int | None


class SCRFaceDetector(BaseModel[SCRFaceDetectorConfig], FaceDetector):
    def __init__(self, config: SCRFaceDetectorConfig) -> None:
        super().__init__(config)

        self._scrfd_inner = SCRFDBase(self.model)
        self.max_faces = config.max_faces
        self.threshold = Threshold(nms=config.nms, probability=config.probability)

    def run(self, image: np.ndarray) -> Detections:
        return self._scrfd_inner.detect(image, threshold=self.threshold, max_num=self.max_faces)

    def detect(self, image: np.ndarray, **kwargs) -> list[Face]:
        detections = self.run(image)
        return self.parse_detections(detections)

    def parse_detections(self, detections: Detections) -> list[DetectedFace]:
        bboxes = detections.bboxes
        keypoints = detections.keypoints
        if len(bboxes) != len(keypoints):
            return []

        faces = []
        for bbox, kps in zip(bboxes, keypoints):
            bbox = [float(scalar) for scalar in bbox]
            x1, y1, x2, y2, score = bbox
            upper_left = Point(x=x1, y=y1)
            lower_right = Point(x=x2, y=y2)
            bbox = Bbox(upper_left=upper_left, lower_right=lower_right)
            kps = [Point(x=float(x), y=float(y)) for x, y in kps]
            faces.append(
                DetectedFace(
                    bbox=np.array(
                        [
                            int(bbox.upper_left.x),
                            int(bbox.upper_left.y),
                            int(bbox.lower_right.x),
                            int(bbox.lower_right.y),
                        ]
                    ),
                    left_eye=[int(kps[0].x), int(kps[0].y)],
                    right_eye=[int(kps[1].x), int(kps[1].y)],
                    nose=[int(kps[2].x), int(kps[2].y)],
                    score=score,
                )
            )

        return faces
