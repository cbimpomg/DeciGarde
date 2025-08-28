import pytesseract
import cv2
import numpy as np
from PIL import Image
import os

def test_tesseract_direct():
    """Test Tesseract directly to see if it's working properly"""
    print("🔍 Testing Tesseract Directly...")
    print("=" * 50)
    
    # Check Tesseract version
    try:
        version = pytesseract.get_tesseract_version()
        print(f"✅ Tesseract Version: {version}")
    except Exception as e:
        print(f"❌ Tesseract not accessible: {e}")
        return False
    
    # Check Tesseract path
    try:
        tesseract_path = pytesseract.get_tesseract_path()
        print(f"✅ Tesseract Path: {tesseract_path}")
    except Exception as e:
        print(f"❌ Could not get Tesseract path: {e}")
    
    # Test with our test document
    test_image_path = "test_document.png"
    if not os.path.exists(test_image_path):
        print(f"❌ Test image not found: {test_image_path}")
        return False
    
    print(f"\n📖 Testing with image: {test_image_path}")
    
    # Method 1: Test with PIL Image
    print("\n🖼️  Method 1: PIL Image + pytesseract")
    try:
        pil_image = Image.open(test_image_path)
        text_pil = pytesseract.image_to_string(pil_image, lang='eng')
        print(f"✅ PIL Result: '{text_pil.strip()}'")
    except Exception as e:
        print(f"❌ PIL method failed: {e}")
    
    # Method 2: Test with OpenCV
    print("\n🖼️  Method 2: OpenCV + pytesseract")
    try:
        cv_image = cv2.imread(test_image_path)
        if cv_image is not None:
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB)
            text_cv = pytesseract.image_to_string(rgb_image, lang='eng')
            print(f"✅ OpenCV Result: '{text_cv.strip()}'")
        else:
            print("❌ OpenCV could not read image")
    except Exception as e:
        print(f"❌ OpenCV method failed: {e}")
    
    # Method 3: Test with different Tesseract configurations
    print("\n🖼️  Method 3: Tesseract with custom config")
    try:
        custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789\s\-\.,!?'
        text_custom = pytesseract.image_to_string(pil_image, config=custom_config, lang='eng')
        print(f"✅ Custom Config Result: '{text_custom.strip()}'")
    except Exception as e:
        print(f"❌ Custom config method failed: {e}")
    
    # Method 4: Test with different PSM modes
    print("\n🖼️  Method 4: Different PSM modes")
    psm_modes = {
        6: "Uniform block of text",
        7: "Single text line",
        8: "Single word",
        9: "Single word in a circle",
        10: "Single character"
    }
    
    for psm, description in psm_modes.items():
        try:
            config = f'--oem 3 --psm {psm}'
            text_psm = pytesseract.image_to_string(pil_image, config=config, lang='eng')
            print(f"✅ PSM {psm} ({description}): '{text_psm.strip()}'")
        except Exception as e:
            print(f"❌ PSM {psm} failed: {e}")
    
    # Method 5: Test with image preprocessing
    print("\n🖼️  Method 5: Image preprocessing")
    try:
        # Convert to grayscale
        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
        
        # Apply thresholding
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Apply morphological operations
        kernel = np.ones((1, 1), np.uint8)
        processed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
        
        # Test with processed image
        text_processed = pytesseract.image_to_string(processed, lang='eng')
        print(f"✅ Preprocessed Result: '{text_processed.strip()}'")
        
        # Save processed image for inspection
        cv2.imwrite("processed_test_document.png", processed)
        print("💾 Saved processed image as 'processed_test_document.png'")
        
    except Exception as e:
        print(f"❌ Preprocessing method failed: {e}")
    
    return True

def test_tesseract_languages():
    """Test available Tesseract languages"""
    print("\n🌍 Testing Tesseract Languages...")
    print("=" * 50)
    
    try:
        # Get available languages
        langs = pytesseract.get_languages()
        print(f"✅ Available languages: {langs}")
        
        # Check if English is available
        if 'eng' in langs:
            print("✅ English language pack is available")
        else:
            print("❌ English language pack is NOT available")
            
    except Exception as e:
        print(f"❌ Could not get languages: {e}")

if __name__ == "__main__":
    print("🚀 Tesseract Direct Testing...")
    print("=" * 60)
    
    test_tesseract_direct()
    test_tesseract_languages()
    
    print("\n" + "=" * 60)
    print("🏁 Tesseract testing completed!")
