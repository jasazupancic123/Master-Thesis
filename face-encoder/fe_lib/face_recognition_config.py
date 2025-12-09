from fe_lib.subsystems.authentication import (
    FaceEmbedderConfig,
    FacePostProcessorConfig,
    SCRFaceDetectorConfig,
)
from fe_lib.utils.config_utils import BaseConfig


class FaceRecognitionProcessConfig(BaseConfig):
    face_detector_config: SCRFaceDetectorConfig
    face_post_processor_config: FacePostProcessorConfig
    face_embedder_config: FaceEmbedderConfig
