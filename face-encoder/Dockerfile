FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN python -m pip install --upgrade pip &&\
    pip install -r requirements.txt

COPY fe_lib/ fe_lib/
COPY config.yaml .
COPY main.py .

ENV PORT=8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]