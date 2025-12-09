from abc import ABC, abstractmethod
from dataclasses import dataclass

import numpy as np


@dataclass
class DetectedFace:
    bbox: np.ndarray
    left_eye: np.ndarray
    right_eye: np.ndarray
    nose: np.ndarray
    score: float


class FaceDetector(ABC):
    @abstractmethod
    def detect(self, img: np.ndarray, **kwargs) -> list[DetectedFace]:
        raise NotImplementedError
