import lap
import numpy as np

from scipy.spatial.distance import cdist

from fe_lib.subsystems.authentication.face_detection import DetectedFace
from fe_lib.utils.config_utils import BaseConfig


class FaceToPoseMatcherConfig(BaseConfig):
    nose_idx: int = 2
    metric: str = "euclidean"


class FaceToPoseMatcher:
    def __init__(self, config: FaceToPoseMatcherConfig) -> None:
        self.nose_idx = config.nose_idx
        self.metric = config.metric

    def match(self, faces: list[DetectedFace], keypoints: np.ndarray) -> list[int]:
        """
        Mathces detected faces to pose keypoints (takes only nose position into account) using the Hungarian algorithm.

        Args:
            faces: List of detected faces.
            keypoints: np.ndarray of keypoints.

        Returns:
            list[int]: matched indices of faces to pose keypoints - faces[y[i]] corresponds to keypoints[i].
        """

        faces_array = np.vstack([face.nose for face in faces])
        pose_array = np.vstack([person_keypoints[self.nose_idx, :2] for person_keypoints in keypoints])
        cost_matrix = cdist(faces_array, pose_array, metric=self.metric)
        _, _, y = lap.lapjv(cost_matrix, extend_cost=True)
        # TODO: add threshold for matching

        return y
