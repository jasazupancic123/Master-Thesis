import math

from typing import Sequence

import numpy as np

from PIL import Image

from fe_lib.subsystems.authentication.face_detection import DetectedFace
from fe_lib.utils.config_utils import BaseConfig


class FacePostProcessorConfig(BaseConfig):
    filter_faces: bool
    min_relative_width: float
    reduce_percentage_bbox_filter: float


def euclidean_distance(a: Sequence[float], b: Sequence[float]) -> float:
    return math.sqrt(((b[0] - a[0]) * (b[0] - a[0])) + ((b[1] - a[1]) * (b[1] - a[1])))


class FacePostProcessor:
    def __init__(self, config: FacePostProcessorConfig) -> None:
        self.filter_faces = config.filter_faces
        self.min_relative_width = config.min_relative_width
        self.reduce_percentage_bbox_filter = config.reduce_percentage_bbox_filter

    def postprocess(self, img: np.ndarray, faces: list[DetectedFace]) -> list[np.ndarray | None]:
        return [self._crop_and_proces_face(img, face) for face in faces]

    def _crop_and_proces_face(self, img: np.ndarray, face: DetectedFace) -> np.ndarray | None:
        if face is None:
            return None
        left_eye = face.left_eye
        right_eye = face.right_eye
        nose = face.nose

        if left_eye[1] > right_eye[1]:  # left eye higher than right eye
            point_3rd = [right_eye[0], left_eye[1]]  # right eye x, left eye y - we move right eye UP
            direction = -1
        else:
            point_3rd = [left_eye[0], right_eye[1]]  # we move left eye UP
            direction = 1

        a = euclidean_distance(left_eye, point_3rd)
        b = euclidean_distance(right_eye, left_eye)
        c = euclidean_distance(right_eye, point_3rd)

        # if any of the distances is 0, we cannot calculate the angle because float division by zero
        if a == 0 or b == 0 or c == 0:
            angle = 0
        else:
            cos_a = (b * b + c * c - a * a) / (2 * b * c)
            angle = np.arccos(cos_a)

            angle = (angle * 180) / math.pi
            if direction == -1:
                angle = 90 - angle

        if self.filter_faces:
            # if bounding box too small or distance between eyes too small, we cannot return a valid cut face
            if (face.bbox[2] - face.bbox[0]) < img.shape[1] * self.min_relative_width:
                return None

            smaller_bbox = [
                face.bbox[0] + (face.bbox[2] - face.bbox[0]) * (self.reduce_percentage_bbox_filter / 2),
                face.bbox[1] + (face.bbox[3] - face.bbox[1]) * (self.reduce_percentage_bbox_filter / 2),
                face.bbox[2] - (face.bbox[2] - face.bbox[0]) * (self.reduce_percentage_bbox_filter / 2),
                face.bbox[3] - (face.bbox[3] - face.bbox[1]) * (self.reduce_percentage_bbox_filter / 2),
            ]

            # to remove evaluating side profiles when the face is not looking straight
            # if nose not in the smaller bbox, we cannot return a valid cut face
            if not (smaller_bbox[0] < nose[0] < smaller_bbox[2] and smaller_bbox[1] < nose[1] < smaller_bbox[3]):
                return None

        new_img = Image.fromarray(img[face.bbox[1] : face.bbox[3], face.bbox[0] : face.bbox[2]])
        new_img = new_img.rotate(direction * angle)
        new_img = np.array(new_img)
        if any(dim == 0 for dim in new_img.shape):
            return None
        return new_img
