import cv2
import numpy as np
from PIL import Image
import io
import logging
from typing import Union, Tuple
import time

logger = logging.getLogger(__name__)

class ImagePreprocessor:
    """
    Advanced image preprocessing service for OCR optimization
    """
    
    def __init__(self):
        self.supported_formats = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']
        
    def preprocess(self, image_data: bytes, enhance_handwriting: bool = True) -> bytes:
        """
        Preprocess image for optimal OCR performance
        
        Args:
            image_data: Raw image bytes
            enhance_handwriting: Whether to use handwriting-optimized preprocessing
            
        Returns:
            Preprocessed image bytes
        """
        try:
            start_time = time.time()
            
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                raise ValueError("Failed to decode image")
            
            logger.info(f"Starting image preprocessing. Original size: {image.shape}")
            
            # Apply preprocessing pipeline
            if enhance_handwriting:
                processed_image = self._preprocess_for_handwriting(image)
            else:
                processed_image = self._preprocess_for_printed_text(image)
            
            # Convert back to bytes
            success, buffer = cv2.imencode('.png', processed_image)
            if not success:
                raise ValueError("Failed to encode processed image")
            
            processing_time = time.time() - start_time
            logger.info(f"Image preprocessing completed in {processing_time:.2f}s")
            
            return buffer.tobytes()
            
        except Exception as e:
            logger.error(f"Image preprocessing failed: {e}")
            # Return original image if preprocessing fails
            return image_data
    
    def _preprocess_for_handwriting(self, image: np.ndarray) -> np.ndarray:
        """
        Advanced preprocessing pipeline optimized for handwritten text
        
        Args:
            image: Input image as numpy array
            
        Returns:
            Preprocessed image
        """
        try:
            # Step 1: Resize if too large (maintain aspect ratio)
            image = self._resize_image(image, max_width=2000, max_height=3000)
            
            # Step 2: Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Step 3: Noise reduction using bilateral filter
            denoised = cv2.bilateralFilter(gray, 9, 75, 75)
            
            # Step 4: Contrast enhancement using CLAHE
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(denoised)
            
            # Step 5: Adaptive thresholding for better text separation
            binary = cv2.adaptiveThreshold(
                enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv2.THRESH_BINARY, 11, 2
            )
            
            # Step 6: Morphological operations to clean up text
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
            cleaned = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
            
            # Step 7: Remove small noise
            cleaned = self._remove_small_noise(cleaned, min_area=50)
            
            # Step 8: Final enhancement
            final = self._enhance_text_edges(cleaned)
            
            return final
            
        except Exception as e:
            logger.error(f"Handwriting preprocessing failed: {e}")
            return image
    
    def _preprocess_for_printed_text(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocessing pipeline for printed text (faster, less aggressive)
        
        Args:
            image: Input image as numpy array
            
        Returns:
            Preprocessed image
        """
        try:
            # Step 1: Resize if too large
            image = self._resize_image(image, max_width=3000, max_height=4000)
            
            # Step 2: Convert to grayscale
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Step 3: Simple noise reduction
            denoised = cv2.medianBlur(gray, 3)
            
            # Step 4: Contrast enhancement
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(denoised)
            
            # Step 5: Binary thresholding
            _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            return binary
            
        except Exception as e:
            logger.error(f"Printed text preprocessing failed: {e}")
            return image
    
    def _resize_image(self, image: np.ndarray, max_width: int, max_height: int) -> np.ndarray:
        """
        Resize image while maintaining aspect ratio
        
        Args:
            image: Input image
            max_width: Maximum allowed width
            max_height: Maximum allowed height
            
        Returns:
            Resized image
        """
        height, width = image.shape[:2]
        
        # Calculate scaling factors
        scale_x = max_width / width if width > max_width else 1.0
        scale_y = max_height / height if height > max_height else 1.0
        
        # Use the smaller scale to maintain aspect ratio
        scale = min(scale_x, scale_y)
        
        if scale < 1.0:
            new_width = int(width * scale)
            new_height = int(height * scale)
            
            # Use INTER_AREA for downsampling (better quality)
            resized = cv2.resize(image, (new_width, new_height), interpolation=cv2.INTER_AREA)
            logger.info(f"Resized image from {width}x{height} to {new_width}x{new_height}")
            return resized
        
        return image
    
    def _remove_small_noise(self, image: np.ndarray, min_area: int) -> np.ndarray:
        """
        Remove small noise components from binary image
        
        Args:
            image: Binary image
            min_area: Minimum area to keep
            
        Returns:
            Cleaned image
        """
        try:
            # Find contours
            contours, _ = cv2.findContours(image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Create mask for valid contours
            mask = np.zeros_like(image)
            
            for contour in contours:
                area = cv2.contourArea(contour)
                if area >= min_area:
                    cv2.fillPoly(mask, [contour], 255)
            
            # Apply mask
            cleaned = cv2.bitwise_and(image, mask)
            
            return cleaned
            
        except Exception as e:
            logger.warning(f"Noise removal failed: {e}")
            return image
    
    def _enhance_text_edges(self, image: np.ndarray) -> np.ndarray:
        """
        Enhance text edges for better OCR recognition
        
        Args:
            image: Binary image
            
        Returns:
            Enhanced image
        """
        try:
            # Apply slight dilation to thicken text
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
            dilated = cv2.dilate(image, kernel, iterations=1)
            
            # Apply slight erosion to clean up
            eroded = cv2.erode(dilated, kernel, iterations=1)
            
            return eroded
            
        except Exception as e:
            logger.warning(f"Edge enhancement failed: {e}")
            return image
    
    def analyze_image_quality(self, image_data: bytes) -> dict:
        """
        Analyze image quality and provide recommendations
        
        Args:
            image_data: Raw image bytes
            
        Returns:
            Quality analysis results
        """
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if image is None:
                return {"error": "Failed to decode image"}
            
            height, width = image.shape[:2]
            
            # Calculate image statistics
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Brightness analysis
            mean_brightness = np.mean(gray)
            std_brightness = np.std(gray)
            
            # Contrast analysis
            contrast = np.std(gray)
            
            # Sharpness analysis (using Laplacian variance)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Quality assessment
            quality_score = 0
            recommendations = []
            
            # Check resolution
            if width < 800 or height < 600:
                quality_score += 20
                recommendations.append("Image resolution is low. Consider using higher resolution images.")
            elif width >= 2000 or height >= 1500:
                quality_score += 30
            else:
                quality_score += 25
            
            # Check brightness
            if mean_brightness < 50:
                quality_score += 15
                recommendations.append("Image is too dark. Consider improving lighting.")
            elif mean_brightness > 200:
                quality_score += 15
                recommendations.append("Image is too bright. Consider reducing exposure.")
            else:
                quality_score += 20
            
            # Check contrast
            if contrast < 30:
                quality_score += 10
                recommendations.append("Image has low contrast. Consider enhancing contrast.")
            else:
                quality_score += 20
            
            # Check sharpness
            if laplacian_var < 100:
                quality_score += 10
                recommendations.append("Image is blurry. Consider using a tripod or improving focus.")
            else:
                quality_score += 20
            
            # Overall quality
            if quality_score >= 80:
                quality_level = "Excellent"
            elif quality_score >= 60:
                quality_level = "Good"
            elif quality_score >= 40:
                quality_level = "Fair"
            else:
                quality_level = "Poor"
            
            return {
                "dimensions": {"width": width, "height": height},
                "brightness": {
                    "mean": float(mean_brightness),
                    "std": float(std_brightness),
                    "assessment": "Good" if 50 <= mean_brightness <= 200 else "Needs improvement"
                },
                "contrast": {
                    "value": float(contrast),
                    "assessment": "Good" if contrast >= 30 else "Low"
                },
                "sharpness": {
                    "laplacian_variance": float(laplacian_var),
                    "assessment": "Sharp" if laplacian_var >= 100 else "Blurry"
                },
                "quality_score": quality_score,
                "quality_level": quality_level,
                "recommendations": recommendations,
                "ocr_readiness": "Ready" if quality_score >= 60 else "Needs preprocessing"
            }
            
        except Exception as e:
            logger.error(f"Image quality analysis failed: {e}")
            return {"error": f"Analysis failed: {str(e)}"}
    
    def get_preprocessing_options(self) -> dict:
        """
        Get available preprocessing options and their descriptions
        
        Returns:
            Dictionary of preprocessing options
        """
        return {
            "handwriting_optimized": {
                "description": "Advanced preprocessing for handwritten text",
                "steps": [
                    "Noise reduction with bilateral filter",
                    "CLAHE contrast enhancement",
                    "Adaptive thresholding",
                    "Morphological cleaning",
                    "Edge enhancement"
                ],
                "best_for": ["Handwritten scripts", "Poor quality images", "Maximum accuracy"]
            },
            "printed_text_optimized": {
                "description": "Fast preprocessing for printed text",
                "steps": [
                    "Simple noise reduction",
                    "CLAHE contrast enhancement",
                    "Otsu thresholding"
                ],
                "best_for": ["Printed documents", "Good quality images", "Speed over accuracy"]
            },
            "custom": {
                "description": "Custom preprocessing pipeline",
                "steps": [
                    "Configurable parameters",
                    "Selective operations",
                    "Quality analysis"
                ],
                "best_for": ["Specific requirements", "Fine-tuning", "Research purposes"]
            }
        }
