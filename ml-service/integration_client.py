import requests
import json
import logging
from typing import Dict, Any, List, Optional, Union
from pathlib import Path
import time

logger = logging.getLogger(__name__)

class DeciGardeMLClient:
    """
    Client for integrating DeciGarde with the ML Service
    """
    
    def __init__(self, base_url: str = "http://localhost:8000", timeout: int = 300):
        """
        Initialize the ML service client
        
        Args:
            base_url: Base URL of the ML service
            timeout: Request timeout in seconds
        """
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.session = requests.Session()
        
        # Test connection
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                logger.info("✅ ML Service connection established")
            else:
                logger.warning(f"⚠️  ML Service health check failed: {response.status_code}")
        except Exception as e:
            logger.error(f"❌ Failed to connect to ML Service: {e}")
    
    def process_ocr(self, image_path: Union[str, Path], language: str = "eng", enhance_handwriting: bool = True) -> Dict[str, Any]:
        """
        Process OCR on a single image
        
        Args:
            image_path: Path to the image file
            language: Language code for OCR
            enhance_handwriting: Whether to use handwriting optimization
            
        Returns:
            OCR results dictionary
        """
        try:
            with open(image_path, 'rb') as f:
                files = {'image': f}
                data = {
                    'language': language,
                    'enhance_handwriting': enhance_handwriting
                }
                
                response = self.session.post(
                    f"{self.base_url}/api/ml/ocr",
                    files=files,
                    data=data,
                    timeout=self.timeout
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"OCR request failed: {response.status_code} - {response.text}")
                    return {"success": False, "error": f"HTTP {response.status_code}"}
                    
        except Exception as e:
            logger.error(f"OCR processing failed: {e}")
            return {"success": False, "error": str(e)}
    
    def process_batch_ocr(self, image_paths: List[Union[str, Path]], language: str = "eng", enhance_handwriting: bool = True) -> Dict[str, Any]:
        """
        Process OCR on multiple images
        
        Args:
            image_paths: List of image file paths
            language: Language code for OCR
            enhance_handwriting: Whether to use handwriting optimization
            
        Returns:
            Batch OCR results dictionary
        """
        try:
            files = []
            for i, path in enumerate(image_paths):
                with open(path, 'rb') as f:
                    files.append(('images', (Path(path).name, f.read(), 'image/jpeg')))
            
            data = {
                'language': language,
                'enhance_handwriting': enhance_handwriting
            }
            
            response = self.session.post(
                f"{self.base_url}/api/ml/batch-ocr",
                files=files,
                data=data,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Batch OCR request failed: {response.status_code} - {response.text}")
                return {"success": False, "error": f"HTTP {response.status_code}"}
                
        except Exception as e:
            logger.error(f"Batch OCR processing failed: {e}")
            return {"success": False, "error": str(e)}
    
    def mark_answer(self, question: str, answer: str, rubric: dict, max_score: int, subject: str = "general") -> Dict[str, Any]:
        """
        Mark a student answer using AI
        
        Args:
            question: The question text
            answer: The student's answer text
            rubric: Marking criteria dictionary
            max_score: Maximum possible score
            subject: Subject area for specialized marking
            
        Returns:
            Marking results dictionary
        """
        try:
            data = {
                'question': question,
                'answer': answer,
                'rubric': json.dumps(rubric),
                'max_score': max_score,
                'subject': subject
            }
            
            response = self.session.post(
                f"{self.base_url}/api/ml/mark",
                data=data,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Marking request failed: {response.status_code} - {response.text}")
                return {"success": False, "error": f"HTTP {response.status_code}"}
                
        except Exception as e:
            logger.error(f"Answer marking failed: {e}")
            return {"success": False, "error": str(e)}
    
    def mark_batch_answers(self, marking_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Mark multiple answers in batch
        
        Args:
            marking_data: List of marking requests with question, answer, rubric, max_score, subject
            
        Returns:
            Batch marking results dictionary
        """
        try:
            data = {
                'marking_data': json.dumps(marking_data)
            }
            
            response = self.session.post(
                f"{self.base_url}/api/ml/batch-mark",
                data=data,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Batch marking request failed: {response.status_code} - {response.text}")
                return {"success": False, "error": f"HTTP {response.status_code}"}
                
        except Exception as e:
            logger.error(f"Batch answer marking failed: {e}")
            return {"success": False, "error": str(e)}
    
    def analyze_image_quality(self, image_path: Union[str, Path]) -> Dict[str, Any]:
        """
        Analyze image quality for OCR readiness
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Quality analysis results
        """
        try:
            with open(image_path, 'rb') as f:
                files = {'image': f}
                
                response = self.session.post(
                    f"{self.base_url}/api/ml/analyze-quality",
                    files=files,
                    timeout=self.timeout
                )
                
                if response.status_code == 200:
                    return response.json()
                else:
                    logger.error(f"Quality analysis failed: {response.status_code} - {response.text}")
                    return {"error": f"HTTP {response.status_code}"}
                    
        except Exception as e:
            logger.error(f"Image quality analysis failed: {e}")
            return {"error": str(e)}
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get ML service status and capabilities"""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                return response.json()
            else:
                return {"status": "unhealthy", "error": f"HTTP {response.status_code}"}
        except Exception as e:
            return {"status": "unreachable", "error": str(e)}
    
    def get_marking_capabilities(self) -> Dict[str, Any]:
        """Get available marking capabilities"""
        try:
            response = self.session.get(f"{self.base_url}/api/ml/capabilities", timeout=10)
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"HTTP {response.status_code}"}
        except Exception as e:
            return {"error": str(e)}
    
    def close(self):
        """Close the client session"""
        self.session.close()

# Convenience functions for easy integration
def create_ml_client(base_url: str = "http://localhost:8000") -> DeciGardeMLClient:
    """Create and return an ML service client"""
    return DeciGardeMLClient(base_url)

def quick_ocr(image_path: str, language: str = "eng") -> str:
    """
    Quick OCR function for simple text extraction
    
    Args:
        image_path: Path to image file
        language: Language code
        
    Returns:
        Extracted text or empty string if failed
    """
    client = DeciGardeMLClient()
    try:
        result = client.process_ocr(image_path, language)
        if result.get('success'):
            return result.get('text', '')
        else:
            logger.error(f"OCR failed: {result.get('error')}")
            return ''
    finally:
        client.close()

def quick_mark(question: str, answer: str, rubric: dict, max_score: int) -> Dict[str, Any]:
    """
    Quick marking function for single answer evaluation
    
    Args:
        question: Question text
        answer: Student answer
        rubric: Marking criteria
        max_score: Maximum score
        
    Returns:
        Marking results
    """
    client = DeciGardeMLClient()
    try:
        return client.mark_answer(question, answer, rubric, max_score)
    finally:
        client.close()

# Example usage
if __name__ == "__main__":
    # Example of how to use the client
    client = DeciGardeMLClient()
    
    # Check service status
    status = client.get_service_status()
    print(f"Service Status: {status}")
    
    # Example OCR processing
    # result = client.process_ocr("path/to/image.jpg")
    # print(f"OCR Result: {result}")
    
    # Example marking
    # marking_result = client.mark_answer(
    #     question="What is photosynthesis?",
    #     answer="Photosynthesis is the process by which plants make food using sunlight.",
    #     rubric={"keywords": ["photosynthesis", "plants", "sunlight", "food"]},
    #     max_score=10
    # )
    # print(f"Marking Result: {marking_result}")
    
    client.close()
