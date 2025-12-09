import base64
import logging
import os

from contextlib import asynccontextmanager
from pathlib import Path

import cv2
import numpy as np

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fe_lib.face_recognition_config import FaceRecognitionProcessConfig
from fe_lib.subsystems.authentication import (
    FaceEmbedder,
    FacePostProcessor,
    SCRFaceDetector,
)
from google.cloud import storage
from pydantic import BaseModel

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

GCS_BUCKET_NAME = os.environ["GCS_BUCKET_NAME"]
GCS_SCRFD_MODEL_PATH = os.getenv("GCS_SCRFD_MODEL_PATH", "models/scrfd.onnx")
GCS_EMBEDDER_MODEL_PATH = os.getenv("GCS_EMBEDDER_MODEL_PATH", "models/embedder.onnx")
LOCAL_MODEL_DIR = Path("/tmp/models")


def download_models_from_gcs() -> tuple[str, str]:
    """Download ONNX models from GCS and return local paths."""
    LOCAL_MODEL_DIR.mkdir(parents=True, exist_ok=True)

    client = storage.Client()
    bucket = client.bucket(GCS_BUCKET_NAME)

    def download_model(gcs_path: str) -> str:
        local_filename = Path(gcs_path).name
        local_path = LOCAL_MODEL_DIR / local_filename

        if local_path.exists():
            logger.info(f"Model already exists locally: {local_path}")
        else:
            logger.info(f"Downloading gs://{GCS_BUCKET_NAME}/{gcs_path} to {local_path}...")
            blob = bucket.blob(gcs_path)
            blob.download_to_filename(str(local_path))
            logger.info(f"Downloaded {local_filename} successfully")

        return str(local_path)

    scrfd_path = download_model(GCS_SCRFD_MODEL_PATH)
    embedder_path = download_model(GCS_EMBEDDER_MODEL_PATH)

    return scrfd_path, embedder_path


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")

    # Download models from GCS
    scrfd_path, embedder_path = download_models_from_gcs()

    config = FaceRecognitionProcessConfig.from_yaml("config.yaml")

    # override model paths
    config.face_detector_config.path = scrfd_path
    config.face_embedder_config.path = embedder_path

    face_detector = SCRFaceDetector(config.face_detector_config)
    face_detector.init_session()

    face_postprocessor = FacePostProcessor(config.face_post_processor_config)

    face_embedder = FaceEmbedder(config.face_embedder_config)
    face_embedder.init_session()

    app.state.face_detector = face_detector
    app.state.face_postprocessor = face_postprocessor
    app.state.face_embedder = face_embedder

    logger.info("Models initialized successfully")

    yield

    logger.info("Shutting down...")


app = FastAPI(lifespan=lifespan)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://www.blindoff.com",
    "https://staging.web.blindoff.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def decode_base64_image(b64_string: str) -> np.ndarray:
    if "," in b64_string:
        b64_string = b64_string.split(",")[-1]
    img_bytes = base64.b64decode(b64_string)
    nparr = np.frombuffer(img_bytes, np.uint8)

    if len(nparr) == 0:
        raise ValueError("Empty image data")

    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Invalid image data (failed to decode)")

    return img


class EmbeddingRequest(BaseModel):
    image_base64: str


@app.post("/embed")
def get_face_embeddings(payload: EmbeddingRequest):
    try:
        img = decode_base64_image(payload.image_base64)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid base64 image") from e

    # 1. detect faces
    detected_faces = app.state.face_detector.detect(img)

    if not detected_faces:
        raise HTTPException(status_code=400, detail="No faces detected in image")

    if len(detected_faces) > 1:
        logger.warning("Multiple faces detected; using the first one only")
        detected_faces = detected_faces[:1]

    # 2. postprocess faces
    valid_face_img = app.state.face_postprocessor.postprocess(img, detected_faces)[0]
    if valid_face_img is None:
        raise HTTPException(status_code=400, detail="No valid faces found after processing")

    # 3. generate embeddings and normalize
    embedding: np.ndarray = app.state.face_embedder.run(valid_face_img)
    embedding /= np.linalg.norm(embedding)
    embedding = embedding.squeeze()

    return {"faceEmbedding": embedding.tolist()}


@app.get("/health")
def health_check():
    """Health check endpoint for App Engine."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
