import cv2
import numpy as np

from fe_lib.subsystems.base_models.base import BaseModel, BaseModelConfig


class FaceEmbedderConfig(BaseModelConfig):
    transpose: bool
    normalization_type: str


def normalize_input(img: np.ndarray, normalization: str) -> np.ndarray:
    if normalization == "base":
        return img

    img *= 255

    if normalization == "raw":
        pass  # return just restored pixels

    elif normalization == "mean":
        # usually max = 2.4, min = -1.1
        mean, std = img.mean(), img.std()
        img = (img - mean) / std

    elif normalization == "mean-standard":
        mean, std = img.mean(), img.std()
        img = (img - mean) / std

        # scale pixel values to [-1,1]
        img = cv2.normalize(img, None, alpha=-1, beta=1, norm_type=cv2.NORM_MINMAX)

    elif normalization == "normalize-128":
        img = (img - 127.5) / 128.0
    return img


def resize_image(img: np.ndarray, target_size: tuple[int, int]) -> np.ndarray:
    factor_0 = target_size[0] / img.shape[0]
    factor_1 = target_size[1] / img.shape[1]
    factor = min(factor_0, factor_1)

    dsize = (
        int(img.shape[1] * factor),
        int(img.shape[0] * factor),
    )
    img = cv2.resize(img, dsize)

    diff_0 = target_size[0] - img.shape[0]
    diff_1 = target_size[1] - img.shape[1]

    img = np.pad(
        img,
        (
            (diff_0 // 2, diff_0 - diff_0 // 2),
            (diff_1 // 2, diff_1 - diff_1 // 2),
            (0, 0),
        ),
        "constant",
    )

    if img.shape[0:2] != target_size:
        img = cv2.resize(img, target_size)

    img = np.expand_dims(img, axis=0)

    if img.max() > 1:
        img = (img.astype(np.float32) / 255.0).astype(np.float32)

    return img


class FaceEmbedder(BaseModel[FaceEmbedderConfig]):
    def __init__(self, config: FaceEmbedderConfig):
        super().__init__(config)

        self.transpose = config.transpose
        self.normalization_type = config.normalization_type
        self.img_size = (config.input_shape[0], config.input_shape[1])
        self.input_name = self.model.get_inputs()[0].name
        self.output_names = [output.name for output in self.model.get_outputs()]

    def run(self, imgs: np.ndarray | list[np.ndarray]) -> np.ndarray:
        imgs = [imgs] if isinstance(imgs, np.ndarray) else imgs
        image_stack = np.vstack(
            [normalize_input(resize_image(img, self.img_size), normalization=self.normalization_type) for img in imgs]
        ).astype(np.float32)
        if self.transpose:
            image_stack = np.transpose(image_stack, (0, 3, 1, 2))

        try:
            embs = self.model.run(self.output_names, {self.input_name: image_stack})[0]
            embs /= np.linalg.norm(embs, axis=1, keepdims=True)
            return embs
        # TODO: don't handle this with exception, have a flag
        except Exception:
            embs = []
            for img in image_stack:
                img = np.expand_dims(img, axis=0)
                emb = self.model.run(self.output_names, {self.input_name: img})[0]
                emb /= np.linalg.norm(emb, axis=1, keepdims=True)
                embs.append(emb)
            return np.vstack(embs)
