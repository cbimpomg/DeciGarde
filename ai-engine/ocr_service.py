from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from paddleocr import PaddleOCR
from PIL import Image
import io
import uvicorn

app = FastAPI(title="DeciGrade OCR Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OCR once at startup (English by default)
ocr = PaddleOCR(use_angle_cls=True, lang="en")


class OCRResponse(BaseModel):
    text: str
    confidence: float
    provider: str = "paddleocr"


@app.post("/ocr", response_model=OCRResponse)
async def ocr_endpoint(file: UploadFile = File(...)):
    content = await file.read()
    image = Image.open(io.BytesIO(content)).convert("RGB")
    image_bytes = io.BytesIO()
    image.save(image_bytes, format="PNG")
    image_bytes.seek(0)

    # Run OCR
    result = ocr.ocr(image_bytes.getvalue(), cls=True)

    lines = []
    confidences = []
    for page in result:
        for line in page:
            text = line[1][0]
            conf = float(line[1][1]) if line[1][1] is not None else 0.0
            lines.append(text)
            confidences.append(conf)

    full_text = "\n".join(lines).strip()
    avg_conf = float(sum(confidences) / len(confidences)) if confidences else 0.0

    return OCRResponse(text=full_text, confidence=avg_conf, provider="paddleocr")


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("ocr_service:app", host="127.0.0.1", port=8001, reload=False)

