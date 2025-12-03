# Face Encoder Service

A Python-based service that takes a Base64 image as input and returns an array of face embeddings.
This service is designed to be deployed on **Google Cloud Run**, but can also be run locally for development and testing.

---

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Setup & Run Locally](#setup--run-locally)
- [Testing the Endpoint](#testing-the-endpoint)
- [Deployment to Google Cloud Run](#deployment-to-google-cloud-run)

---

## Setup & Run Locally

1. Clone the repository or copy the service files:
    ```bash
    git clone <repo-url>
    cd face-encoder
    ```

2. Create a virtual environment:
    ```bash
    python3 -m venv venv
    source venv/bin/activate      # Linux/macOS
    venv\Scripts\activate         # Windows
    ```

3. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4. Run the service (locally):
    ```bash
    uvicorn main:app --reload
    ```

5. Open your browser to access API docs:
    ```
    http://127.0.0.1:8000/docs
    ```

---

## Testing the Endpoint

### Using curl:
```bash
curl -X POST http://127.0.0.1:8000/embed \
     -H "Content-Type: application/json" \
     -d '{"image_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=="}'
```

## Deployment to Google Cloud Run

```bash
# Set your GCP project
gcloud projects list
gcloud config set project <YOUR_PROJECT_ID>

# Deploy the service
gcloud run deploy --source .
```