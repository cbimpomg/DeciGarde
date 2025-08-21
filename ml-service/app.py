from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import logging
import os
from typing import List, Dict, Any
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import our ML services
from services.ocr_service import OCRService
from services.marking_service import MarkingService
from services.image_preprocessor import ImagePreprocessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="DeciGarde ML Service",
    description="AI-powered OCR and Script Marking Service",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
ocr_service = OCRService()
marking_service = MarkingService()
image_preprocessor = ImagePreprocessor()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "DeciGarde ML Service is running!",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "ocr": "available",
            "marking": "available",
            "image_preprocessing": "available"
        }
    }

@app.get("/api/ml/capabilities")
async def get_capabilities():
    """Get ML service capabilities and status"""
    try:
        return {
            "ocr": {
                "available_engines": ocr_service.get_available_engines(),
                "engine_status": ocr_service.get_engine_status(),
                "supported_languages": ["eng", "fra", "spa", "deu", "ita", "por", "rus", "chi_sim", "jpn", "kor"],
                "handwriting_optimization": True,
                "batch_processing": True
            },
            "marking": {
                "capabilities": marking_service.get_marking_capabilities(),
                "supported_subjects": ["mathematics", "physics", "chemistry", "biology", "english", "literature", "history", "geography", "general"],
                "ai_approaches": ["keyword_matching", "semantic_similarity", "content_analysis", "llm_evaluation"],
                "batch_processing": True
            },
            "image_preprocessing": {
                "handwriting_enhancement": True,
                "noise_reduction": True,
                "text_edge_enhancement": True,
                "image_quality_analysis": True
            },
            "gpu_support": {
                "enabled": os.getenv('USE_GPU', 'false').lower() == 'true',
                "paddleocr_gpu": 'paddleocr' in ocr_service.get_available_engines(),
                "easyocr_gpu": 'easyocr' in ocr_service.get_available_engines()
            }
        }
    except Exception as e:
        logger.error(f"Error getting capabilities: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get capabilities: {str(e)}")

@app.post("/api/ml/ocr")
async def process_ocr(
    image: UploadFile = File(...),
    language: str = Form("eng"),
    enhance_handwriting: bool = Form(True)
):
    """
    Process OCR on uploaded image
    
    Args:
        image: Image file (JPEG, PNG, etc.)
        language: Language code (eng, fra, spa, etc.)
        enhance_handwriting: Whether to use handwriting-optimized settings
    
    Returns:
        JSON with extracted text and confidence
    """
    try:
        logger.info(f"Processing OCR for image: {image.filename}")
        
        # Validate file type
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image content
        image_content = await image.read()
        
        # Preprocess image
        processed_image = image_preprocessor.preprocess(image_content)
        
        # Extract text using OCR
        ocr_result = ocr_service.extract_text(
            processed_image, 
            language=language,
            enhance_handwriting=enhance_handwriting
        )
        
        logger.info(f"OCR completed for {image.filename}. Confidence: {ocr_result['confidence']}")
        
        return JSONResponse(content={
            "success": True,
            "text": ocr_result["text"],
            "confidence": ocr_result["confidence"],
            "provider": ocr_result["provider"],
            "processing_time": ocr_result.get("processing_time", 0),
            "language": language
        })
        
    except Exception as e:
        logger.error(f"OCR processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {str(e)}")

@app.post("/api/ml/mark")
async def mark_script(
    question: str = Form(...),
    answer: str = Form(...),
    rubric: str = Form(...),
    max_score: int = Form(...),
    subject: str = Form("general")
):
    """
    Mark a script answer using AI
    
    Args:
        question: The question text
        answer: The student's answer text
        rubric: JSON string of marking criteria
        max_score: Maximum possible score
        subject: Subject area for specialized marking
    
    Returns:
        JSON with marking results
    """
    try:
        logger.info(f"Processing marking for question: {question[:50]}...")
        
        # Parse rubric
        try:
            rubric_data = json.loads(rubric)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid rubric JSON format")
        
        # Process marking
        marking_result = marking_service.mark_answer(
            question=question,
            answer=answer,
            rubric=rubric_data,
            max_score=max_score,
            subject=subject
        )
        
        logger.info(f"Marking completed. Score: {marking_result['score']}/{max_score}")
        
        return JSONResponse(content={
            "success": True,
            "score": marking_result["score"],
            "max_score": max_score,
            "feedback": marking_result["feedback"],
            "confidence": marking_result["confidence"],
            "matched_keywords": marking_result["matched_keywords"],
            "semantic_score": marking_result.get("semantic_score", 0),
            "improvements": marking_result.get("improvements", []),
            "subject": subject
        })
        
    except Exception as e:
        logger.error(f"Marking failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Marking failed: {str(e)}")

@app.post("/api/ml/batch-ocr")
async def process_batch_ocr(
    images: List[UploadFile] = File(...),
    language: str = Form("eng"),
    enhance_handwriting: bool = Form(True)
):
    """
    Process OCR on multiple images
    
    Args:
        images: List of image files
        language: Language code
        enhance_handwriting: Whether to use handwriting-optimized settings
    
    Returns:
        JSON with results for each image
    """
    try:
        logger.info(f"Processing batch OCR for {len(images)} images")
        
        results = []
        
        for i, image in enumerate(images):
            try:
                # Validate file type
                if not image.content_type.startswith('image/'):
                    results.append({
                        "filename": image.filename,
                        "success": False,
                        "error": "File must be an image"
                    })
                    continue
                
                # Read and process image
                image_content = await image.read()
                processed_image = image_preprocessor.preprocess(image_content)
                
                # Extract text
                ocr_result = ocr_service.extract_text(
                    processed_image,
                    language=language,
                    enhance_handwriting=enhance_handwriting
                )
                
                results.append({
                    "filename": image.filename,
                    "success": True,
                    "text": ocr_result["text"],
                    "confidence": ocr_result["confidence"],
                    "provider": ocr_result["provider"],
                    "processing_time": ocr_result.get("processing_time", 0)
                })
                
            except Exception as e:
                logger.error(f"Failed to process {image.filename}: {str(e)}")
                results.append({
                    "filename": image.filename,
                    "success": False,
                    "error": str(e)
                })
        
        return JSONResponse(content={
            "success": True,
            "total_images": len(images),
            "processed_images": len([r for r in results if r["success"]]),
            "failed_images": len([r for r in results if not r["success"]]),
            "results": results
        })
        
    except Exception as e:
        logger.error(f"Batch OCR processing failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch OCR processing failed: {str(e)}")

@app.post("/api/ml/batch-mark")
async def mark_batch_scripts(
    marking_data: str = Form(...)
):
    """
    Mark multiple script answers
    
    Args:
        marking_data: JSON string with array of marking requests
    
    Returns:
        JSON with results for each marking request
    """
    try:
        # Parse marking data
        try:
            data = json.loads(marking_data)
            if not isinstance(data, list):
                raise ValueError("marking_data must be a JSON array")
        except (json.JSONDecodeError, ValueError) as e:
            raise HTTPException(status_code=400, detail=f"Invalid marking data format: {str(e)}")
        
        logger.info(f"Processing batch marking for {len(data)} questions")
        
        results = []
        
        for i, item in enumerate(data):
            try:
                # Validate required fields
                required_fields = ["question", "answer", "rubric", "max_score"]
                for field in required_fields:
                    if field not in item:
                        raise ValueError(f"Missing required field: {field}")
                
                # Process marking
                marking_result = marking_service.mark_answer(
                    question=item["question"],
                    answer=item["answer"],
                    rubric=item["rubric"],
                    max_score=item["max_score"],
                    subject=item.get("subject", "general")
                )
                
                results.append({
                    "question_number": i + 1,
                    "success": True,
                    "score": marking_result["score"],
                    "max_score": item["max_score"],
                    "feedback": marking_result["feedback"],
                    "confidence": marking_result["confidence"]
                })
                
            except Exception as e:
                logger.error(f"Failed to mark question {i + 1}: {str(e)}")
                results.append({
                    "question_number": i + 1,
                    "success": False,
                    "error": str(e)
                })
        
        return JSONResponse(content={
            "success": True,
            "total_questions": len(data),
            "processed_questions": len([r for r in results if r["success"]]),
            "failed_questions": len([r for r in results if not r["success"]]),
            "results": results
        })
        
    except Exception as e:
        logger.error(f"Batch marking failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch marking failed: {str(e)}")

if __name__ == "__main__":
    # Run the application
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
