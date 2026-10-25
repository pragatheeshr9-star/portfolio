FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app
COPY pyproject.toml ./
COPY app ./app
COPY data ./data
RUN pip install --no-cache-dir .

VOLUME ["/app/results"]
CMD ["python", "-m", "app.cli"]