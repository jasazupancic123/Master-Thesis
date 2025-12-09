import numpy as np

from scipy.optimize import linear_sum_assignment

from fe_lib.subsystems.authentication.face_embeddings import FaceEmbedder
from fe_lib.utils.config_utils import BaseConfig


class FaceVerificationConfig(BaseConfig):
    threshold: float


class FaceVerification:
    def __init__(
        self,
        config: FaceVerificationConfig,
        face_embedder: FaceEmbedder,
        ids: list[str] = list(),
        embeddings: np.ndarray | None = None,
    ) -> None:
        self.face_embedder = face_embedder
        self.threshold = config.threshold
        self.ids = ids
        self.embeddings = embeddings

    def update_data(self, ids: list[str], embeddings: np.ndarray) -> None:
        self.ids = ids
        self.embeddings = embeddings

    def verify(self, faces: list[np.ndarray | None]) -> list[str | None]:
        ids = [None for _ in range(len(faces))]

        if len(self.ids) == 0 or self.embeddings is None:
            return ids

        non_none_faces, non_none_idxs = [], []

        for i, face in enumerate(faces):
            if face is not None:
                non_none_faces.append(face)
                non_none_idxs.append(i)

        if len(non_none_faces) == 0:
            return ids

        face_embeddings = self.face_embedder.run(non_none_faces)
        face_embeddings = face_embeddings / np.linalg.norm(face_embeddings, axis=1, keepdims=True)

        similarities = np.dot(face_embeddings, self.embeddings)
        cost_matrix = -similarities
        row_ind, col_ind = linear_sum_assignment(cost_matrix)

        for i, id_idx in zip(row_ind, col_ind):
            if similarities[i, id_idx] > self.threshold:
                ids[non_none_idxs[i]] = self.ids[id_idx]

        return ids
