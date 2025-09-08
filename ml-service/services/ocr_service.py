import pytesseract
import cv2
import numpy as np
from PIL import Image
import io
import time
import logging
from typing import Dict, Any, Optional
import os

# Try to import optional OCR engines
try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False

try:
    from paddleocr import PaddleOCR
    PADDLEOCR_AVAILABLE = True
except ImportError:
    PADDLEOCR_AVAILABLE = False

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

logger = logging.getLogger(__name__)

class OCRService:
    """
    Advanced OCR service with multiple engines and handwriting optimization
    """
    
    def __init__(self):
        self.engines = {}
        self.initialize_engines()
        
    def initialize_engines(self):
        """Initialize available OCR engines"""
        try:
            # Initialize PaddleOCR if available
            if PADDLEOCR_AVAILABLE:
                # Enable GPU if available
                use_gpu = os.getenv('USE_GPU', 'false').lower() == 'true'
                paddle_gpu = os.getenv('PADDLEOCR_USE_GPU', 'false').lower() == 'true'
                
                try:
                    # Try with GPU support first
                    if use_gpu and paddle_gpu:
                        self.engines['paddleocr'] = PaddleOCR(
                            use_angle_cls=True, 
                            lang='en',
                            use_gpu=True
                        )
                        logger.info("✅ PaddleOCR initialized successfully with GPU support")
                    else:
                        self.engines['paddleocr'] = PaddleOCR(
                            use_angle_cls=True, 
                            lang='en'
                        )
                        logger.info("✅ PaddleOCR initialized successfully (CPU mode)")
                except Exception as e:
                    # Fallback to CPU mode if any initialization fails
                    logger.warning(f"PaddleOCR initialization failed: {e}")
                    try:
                        self.engines['paddleocr'] = PaddleOCR(
                            use_angle_cls=True, 
                            lang='en'
                        )
                        logger.info("✅ PaddleOCR initialized successfully (CPU mode - fallback)")
                    except Exception as e2:
                        logger.error(f"PaddleOCR fallback initialization failed: {e2}")
                        self.engines['paddleocr'] = None
            else:
                logger.warning("⚠️  PaddleOCR not available")
                
            # Initialize EasyOCR if available
            if EASYOCR_AVAILABLE:
                # Check GPU availability and configuration
                gpu_available = torch.cuda.is_available() if TORCH_AVAILABLE else False
                easy_gpu = os.getenv('EASYOCR_USE_GPU', 'false').lower() == 'true'
                use_gpu = os.getenv('USE_GPU', 'false').lower() == 'true'
                
                try:
                    if gpu_available and easy_gpu and use_gpu:
                        self.engines['easyocr'] = easyocr.Reader(['en'], gpu=True)
                        logger.info("✅ EasyOCR initialized successfully with GPU support")
                    else:
                        self.engines['easyocr'] = easyocr.Reader(['en'], gpu=False)
                        logger.info("✅ EasyOCR initialized successfully (CPU mode)")
                except Exception as e:
                    # Fallback to CPU mode if GPU initialization fails
                    logger.warning(f"EasyOCR initialization failed: {e}")
                    try:
                        self.engines['easyocr'] = easyocr.Reader(['en'], gpu=False)
                        logger.info("✅ EasyOCR initialized successfully (CPU mode - fallback)")
                    except Exception as e2:
                        logger.error(f"EasyOCR fallback initialization failed: {e2}")
                        self.engines['easyocr'] = None
            else:
                logger.warning("⚠️  EasyOCR not available")
                
            # Check Tesseract installation
            try:
                pytesseract.get_tesseract_version()
                logger.info("✅ Tesseract initialized successfully")
            except Exception as e:
                logger.warning(f"⚠️  Tesseract not available: {e}")
                logger.info("ℹ️  OCR will work with PaddleOCR and EasyOCR only")
                
        except Exception as e:
            logger.error(f"Error initializing OCR engines: {e}")
    
    def extract_text(self, image_data: bytes, language: str = "eng", enhance_handwriting: bool = True) -> Dict[str, Any]:
        """
        Extract text from image using multiple OCR engines
        
        Args:
            image_data: Image bytes
            language: Language code
            enhance_handwriting: Whether to use handwriting-optimized settings
            
        Returns:
            Dictionary with text, confidence, and provider info
        """
        start_time = time.time()
        
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise ValueError("Failed to decode image")
            
            # Try multiple OCR engines for better accuracy
            results = []
            
            # 1. Try PaddleOCR first (best for handwriting)
            if 'paddleocr' in self.engines and self.engines['paddleocr'] is not None and enhance_handwriting:
                try:
                    paddle_result = self._extract_with_paddleocr(image)
                    if paddle_result['text'].strip():
                        results.append(paddle_result)
                        logger.info(f"PaddleOCR extracted {len(paddle_result['text'])} characters")
                except Exception as e:
                    logger.warning(f"PaddleOCR failed: {e}")
            
            # 2. Try EasyOCR
            if 'easyocr' in self.engines and self.engines['easyocr'] is not None:
                try:
                    easyocr_result = self._extract_with_easyocr(image, language)
                    if easyocr_result['text'].strip():
                        results.append(easyocr_result)
                        logger.info(f"EasyOCR extracted {len(easyocr_result['text'])} characters")
                except Exception as e:
                    logger.warning(f"EasyOCR failed: {e}")
            
            # 3. Try Tesseract (fallback) - only if available
            try:
                pytesseract.get_tesseract_version()  # Check if Tesseract is available
                tesseract_result = self._extract_with_tesseract(image, language, enhance_handwriting)
                if tesseract_result['text'].strip():
                    results.append(tesseract_result)
                    logger.info(f"Tesseract extracted {len(tesseract_result['text'])} characters")
            except Exception as e:
                logger.debug(f"Tesseract not available or failed: {e}")
            
            # Combine results for best accuracy
            if results:
                final_result = self._combine_ocr_results(results)
                final_result['processing_time'] = time.time() - start_time
                return final_result
            else:
                raise Exception("All OCR engines failed to extract text")
                
        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
            return {
                "text": "",
                "confidence": 0.0,
                "provider": "none",
                "processing_time": time.time() - start_time,
                "error": str(e)
            }
    
    def _extract_with_paddleocr(self, image: np.ndarray) -> Dict[str, Any]:
        """Extract text using PaddleOCR"""
        try:
            # PaddleOCR 3.1.0+ has a different API - removed cls parameter
            result = self.engines['paddleocr'].ocr(image)
            
            # Debug logging
            logger.debug(f"PaddleOCR raw result: {result}")
            
            if not result or not result[0]:
                logger.debug("PaddleOCR returned empty result")
                return {"text": "", "confidence": 0.0, "provider": "paddleocr"}
            
            # Extract text and confidence from PaddleOCR result
            texts = []
            confidences = []
            
            # PaddleOCR 3.1.0+ returns a different structure
            # Check if we have the new format with 'rec_texts' and 'rec_scores'
            if isinstance(result[0], dict) and 'rec_texts' in result[0]:
                # New format: result[0] is a dict with 'rec_texts' and 'rec_scores'
                rec_texts = result[0].get('rec_texts', [])
                rec_scores = result[0].get('rec_scores', [])
                
                logger.debug(f"Found new PaddleOCR format: {len(rec_texts)} text segments")
                
                for i, (text, score) in enumerate(zip(rec_texts, rec_scores)):
                    if text and isinstance(text, str) and text.strip():
                        texts.append(text.strip())
                        confidences.append(float(score))
                        logger.debug(f"Text {i}: '{text}' (confidence: {score})")
                    else:
                        logger.debug(f"Skipping empty/invalid text {i}: '{text}'")
            
            else:
                # Try the old format parsing as fallback
                logger.debug("Trying old format parsing")
                for i, line in enumerate(result[0]):
                    try:
                        logger.debug(f"Processing line {i}: {line}")
                        
                        # PaddleOCR result structure: [[[x1,y1,x2,y2], (text, confidence)], ...]
                        if isinstance(line, list) and len(line) >= 2:
                            # Check if the second element is a tuple with text and confidence
                            if isinstance(line[1], tuple) and len(line[1]) >= 2:
                                text = line[1][0]
                                confidence = line[1][1]
                                
                                if text and isinstance(text, str):
                                    texts.append(text)
                                    confidences.append(float(confidence))
                                    logger.debug(f"Extracted text: '{text}' with confidence: {confidence}")
                                else:
                                    logger.debug(f"Skipping invalid text: {text}")
                            else:
                                logger.debug(f"Line {i} second element is not a tuple: {line[1]}")
                        else:
                            logger.debug(f"Line {i} has unexpected structure: {line}")
                            
                    except Exception as e:
                        logger.warning(f"Error processing line {i}: {e}, line: {line}")
                        continue
            
            if not texts:
                logger.warning("No valid text extracted from PaddleOCR result")
                return {"text": "", "confidence": 0.0, "provider": "paddleocr"}
            
            full_text = " ".join(texts)
            avg_confidence = np.mean(confidences) if confidences else 0.0
            
            logger.info(f"PaddleOCR extracted {len(texts)} text segments, total length: {len(full_text)}")
            logger.info(f"Extracted text: '{full_text}'")
            
            return {
                "text": full_text,
                "confidence": float(avg_confidence),
                "provider": "paddleocr"
            }
            
        except Exception as e:
            logger.error(f"PaddleOCR extraction failed: {e}")
            return {"text": "", "confidence": 0.0, "provider": "paddleocr"}
    
    def _extract_with_easyocr(self, image: np.ndarray, language: str) -> Dict[str, Any]:
        """Extract text using EasyOCR"""
        try:
            result = self.engines['easyocr'].readtext(image)
            
            if not result:
                return {"text": "", "confidence": 0.0, "provider": "easyocr"}
            
            # Extract text and confidence
            texts = []
            confidences = []
            
            for detection in result:
                text = detection[1]
                confidence = detection[2]
                texts.append(text)
                confidences.append(confidence)
            
            full_text = " ".join(texts)
            avg_confidence = np.mean(confidences) if confidences else 0.0
            
            return {
                "text": full_text,
                "confidence": float(avg_confidence),
                "provider": "easyocr"
            }
            
        except Exception as e:
            logger.error(f"EasyOCR extraction failed: {e}")
            return {"text": "", "confidence": 0.0, "provider": "easyocr"}
    
    def _extract_with_tesseract(self, image: np.ndarray, language: str, enhance_handwriting: bool) -> Dict[str, Any]:
        """Extract text using Tesseract with handwriting optimization"""
        try:
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Configure Tesseract parameters
            config = self._get_tesseract_config(enhance_handwriting)
            
            # Extract text
            text = pytesseract.image_to_string(rgb_image, lang=language, config=config)
            
            # Get confidence data
            data = pytesseract.image_to_data(rgb_image, lang=language, config=config, output_type=pytesseract.Output.DICT)
            
            # Calculate average confidence
            confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
            avg_confidence = np.mean(confidences) / 100.0 if confidences else 0.0
            
            return {
                "text": text.strip(),
                "confidence": float(avg_confidence),
                "provider": "tesseract"
            }
            
        except Exception as e:
            logger.error(f"Tesseract extraction failed: {e}")
            return {"text": "", "confidence": 0.0, "provider": "tesseract"}
    
    def _get_tesseract_config(self, enhance_handwriting: bool) -> str:
        """Get Tesseract configuration string"""
        if enhance_handwriting:
            # Configuration optimized for handwritten text
            return (
                '--oem 3 '  # LSTM OCR Engine
                '--psm 6 '  # Assume a uniform block of text
                '-c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?;:()[]{}"\'-_+=/\\|@#$%^&*~`<> '
                '-c textord_heavy_nr=1 '
                '-c textord_min_linesize=2.5 '
                '-c preserve_interword_spaces=1'
            )
        else:
            # Standard configuration for printed text
            return '--oem 3 --psm 6'
    
    def _combine_ocr_results(self, results: list) -> Dict[str, Any]:
        """
        Combine results from multiple OCR engines for better accuracy
        
        Args:
            results: List of OCR results from different engines
            
        Returns:
            Combined result with best text and confidence
        """
        if not results:
            return {"text": "", "confidence": 0.0, "provider": "combined"}
        
        # Sort by confidence
        sorted_results = sorted(results, key=lambda x: x['confidence'], reverse=True)
        
        # Get the best result
        best_result = sorted_results[0]
        
        # If we have multiple results, try to improve accuracy
        if len(results) > 1:
            # Combine text from multiple engines if they're similar
            combined_text = self._merge_similar_texts(results)
            if combined_text:
                best_result['text'] = combined_text
                best_result['provider'] = 'combined'
        
        return best_result
    
    def _merge_similar_texts(self, results: list) -> Optional[str]:
        """
        Merge text from multiple OCR engines if they're similar
        
        Args:
            results: List of OCR results
            
        Returns:
            Merged text or None if texts are too different
        """
        if len(results) < 2:
            return None
        
        texts = [r['text'].strip() for r in results if r['text'].strip()]
        if not texts:
            return None
        
        # If all texts are very similar, return the longest one
        if len(set(texts)) == 1:
            return texts[0]
        
        # If texts are similar enough, combine them
        base_text = texts[0]
        merged_text = base_text
        
        for text in texts[1:]:
            # Simple similarity check (can be improved with more sophisticated algorithms)
            if self._calculate_text_similarity(base_text, text) > 0.7:
                # Merge by taking the longer text or combining unique parts
                if len(text) > len(merged_text):
                    merged_text = text
                else:
                    # Add unique words from the other text
                    unique_words = set(text.split()) - set(merged_text.split())
                    if unique_words:
                        merged_text += " " + " ".join(unique_words)
        
        return merged_text
    
    def _calculate_text_similarity(self, text1: str, text2: str) -> float:
        """
        Calculate similarity between two texts using simple word overlap
        
        Args:
            text1: First text
            text2: Second text
            
        Returns:
            Similarity score between 0 and 1
        """
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        
        if not words1 and not words2:
            return 1.0
        if not words1 or not words2:
            return 0.0
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        return len(intersection) / len(union)
    
    def get_available_engines(self) -> list:
        """Get list of available OCR engines"""
        available = []
        
        if 'paddleocr' in self.engines:
            available.append('paddleocr')
        if 'easyocr' in self.engines:
            available.append('easyocr')
        try:
            if pytesseract.get_tesseract_version():
                available.append('tesseract')
        except:
            pass  # Tesseract not available
        
        return available
    
    def get_engine_status(self) -> Dict[str, Any]:
        """Get status of all OCR engines"""
        status = {}
        
        # Check PaddleOCR
        if 'paddleocr' in self.engines:
            try:
                # Test with a simple operation
                status['paddleocr'] = 'available'
            except:
                status['paddleocr'] = 'error'
        else:
            status['paddleocr'] = 'not_installed'
        
        # Check EasyOCR
        if 'easyocr' in self.engines:
            try:
                status['easyocr'] = 'available'
            except:
                status['easyocr'] = 'error'
        else:
            status['easyocr'] = 'not_installed'
        
        # Check Tesseract
        try:
            version = pytesseract.get_tesseract_version()
            status['tesseract'] = f'available (v{version})'
        except Exception:
            status['tesseract'] = 'not_installed'
        
        return status
