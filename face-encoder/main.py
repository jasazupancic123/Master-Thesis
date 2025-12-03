from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64

app = FastAPI()
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://www.blindoff.com",
    "https://staging.web.blindoff.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EmbeddingRequest(BaseModel):
    image_base64: str

@app.post("/embed")
def get_face_embeddings(payload: EmbeddingRequest):
    try:
        # Decode to confirm valid image (you can remove this if you want)
        _ = base64.b64decode(payload.image_base64)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid base64 image") from e

    # TODO: Run your face embedding model here
    embeddings = [1.0, 2.0, 3.0]  # placeholder

    return {"faceEmbedding": embeddings}
