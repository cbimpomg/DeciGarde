import requests
from PIL import Image, ImageDraw, ImageFont
import io

def create_test_image():
    """Create a simple test image with text"""
    # Create a larger image with better contrast
    img = Image.new('RGB', (800, 400), color='white')
    draw = ImageDraw.Draw(img)
    
    # Add some text with better positioning and size
    try:
        # Try to use a default font
        font = ImageFont.load_default()
    except:
        font = None
    
    # Draw text with better spacing and positioning
    draw.text((100, 100), "Hello World", fill='black', font=font)
    draw.text((100, 150), "This is a test image for OCR", fill='black', font=font)
    draw.text((100, 200), "testing with multiple lines", fill='black', font=font)
    draw.text((100, 250), "to ensure proper extraction", fill='black', font=font)
    
    # Add a simple shape to make it more interesting
    draw.rectangle([(50, 50), (750, 350)], outline='black', width=2)
    
    # Save to bytes
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG', quality=95)
    img_bytes.seek(0)
    
    return img_bytes

def test_ocr():
    """Test the OCR endpoint"""
    print("🔍 Testing OCR endpoint...")
    
    # Create test image
    img_bytes = create_test_image()
    
    # Test OCR endpoint - use the correct path
    url = "http://localhost:8000/api/ml/ocr"
    
    try:
        files = {'image': ('test.png', img_bytes, 'image/png')}
        print(f"Sending request to: {url}")
        print(f"Image size: {len(img_bytes.getvalue())} bytes")
        
        response = requests.post(url, files=files, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ OCR successful!")
            print(f"Extracted text: {result.get('text', 'No text found')}")
            print(f"Confidence: {result.get('confidence', 'N/A')}")
            print(f"Engine used: {result.get('engine', 'N/A')}")
        else:
            print(f"❌ OCR failed with status {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing OCR: {e}")
        import traceback
        traceback.print_exc()

def test_marking():
    """Test the marking endpoint"""
    print("\n🔍 Testing marking endpoint...")
    
    # Test data - use the correct schema
    test_data = {
        "question": "What is the capital of France and where is it located?",
        "answer": "The capital of France is Paris. It is located in Europe.",
        "rubric": {
            "criteria": [
                {
                    "name": "Correctness",
                    "description": "Answer must be factually correct",
                    "max_score": 10
                },
                {
                    "name": "Completeness", 
                    "description": "Answer should be complete",
                    "max_score": 5
                }
            ]
        },
        "max_score": 15
    }
    
    url = "http://localhost:8000/api/ml/mark"
    
    try:
        print(f"Sending request to: {url}")
        print(f"Test data: {test_data}")
        
        response = requests.post(url, json=test_data, timeout=30)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Marking successful!")
            print(f"Score: {result.get('score', 'N/A')}")
            print(f"Details: {result.get('details', 'N/A')}")
        else:
            print(f"❌ Marking failed with status {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing marking: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🚀 Starting ML Service Tests...")
    print("=" * 50)
    
    test_ocr()
    test_marking()
    
    print("\n" + "=" * 50)
    print("🏁 Tests completed!")
