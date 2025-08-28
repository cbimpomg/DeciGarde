import requests
import os
import glob
from pathlib import Path
import json

def find_test_images():
    """Find available test images in the project"""
    # Look for common image formats in the project
    image_extensions = ['*.jpg', '*.jpeg', '*.png', '*.bmp', '*.tiff']
    test_images = []
    
    # Check current directory and common subdirectories
    search_paths = [
        '.',
        'mobile/assets',
        'web-dashboard/public',
        'backend/uploads',
        'ml-service/test_images'
    ]
    
    for path in search_paths:
        if os.path.exists(path):
            for ext in image_extensions:
                images = glob.glob(os.path.join(path, ext))
                test_images.extend(images)
    
    return test_images

def test_ocr_with_real_image(image_path):
    """Test OCR with a real image file"""
    print(f"🔍 Testing OCR with real image: {image_path}")
    
    if not os.path.exists(image_path):
        print(f"❌ Image file not found: {image_path}")
        return False
    
    # Get file info
    file_size = os.path.getsize(image_path)
    print(f"📁 File size: {file_size} bytes")
    
    # Test OCR endpoint
    url = "http://localhost:8000/api/ml/ocr"
    
    try:
        with open(image_path, 'rb') as img_file:
            files = {'image': (os.path.basename(image_path), img_file, 'image/png')}
            print(f"📤 Sending request to: {url}")
            
            response = requests.post(url, files=files, timeout=30)
            
            print(f"📊 Status Code: {response.status_code}")
            print(f"📋 Response Headers: {dict(response.headers)}")
            print(f"📄 Response: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ OCR successful!")
                print(f"📝 Extracted text: '{result.get('text', 'No text found')}'")
                print(f"🎯 Confidence: {result.get('confidence', 'N/A')}")
                print(f"🔧 Provider: {result.get('provider', 'N/A')}")
                print(f"⏱️  Processing time: {result.get('processing_time', 'N/A')}s")
                return True
            else:
                print(f"❌ OCR failed with status {response.status_code}")
                return False
                
    except Exception as e:
        print(f"❌ Error testing OCR: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_marking():
    """Test the marking endpoint"""
    print("\n🔍 Testing marking endpoint...")
    
    # Test data - use Form data as required by the API
    test_data = {
        "question": "What is the capital of France and where is it located?",
        "answer": "The capital of France is Paris. It is located in Europe.",
        "rubric": json.dumps({
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
        }),
        "max_score": 15,
        "subject": "geography"
    }
    
    url = "http://localhost:8000/api/ml/mark"
    
    try:
        print(f"📤 Sending request to: {url}")
        print(f"📋 Test data: {test_data}")
        
        response = requests.post(url, data=test_data, timeout=30)
        
        print(f"📊 Status Code: {response.status_code}")
        print(f"📋 Response Headers: {dict(response.headers)}")
        print(f"📄 Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Marking successful!")
            print(f"🎯 Score: {result.get('score', 'N/A')}")
            print(f"📝 Details: {result.get('details', 'N/A')}")
            return True
        else:
            print(f"❌ Marking failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing marking: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("🚀 Starting Real Image OCR Tests...")
    print("=" * 60)
    
    # Find available test images
    test_images = find_test_images()
    
    if not test_images:
        print("❌ No test images found!")
        print("💡 Please add some image files to test with:")
        print("   - mobile/assets/")
        print("   - web-dashboard/public/")
        print("   - backend/uploads/")
        print("   - Or create a ml-service/test_images/ directory")
        return
    
    print(f"📁 Found {len(test_images)} test images:")
    for img in test_images:
        print(f"   - {img}")
    
    print("\n" + "=" * 60)
    
    # Test OCR with each image
    ocr_success = False
    for i, image_path in enumerate(test_images, 1):
        print(f"\n🖼️  Test {i}/{len(test_images)}: {os.path.basename(image_path)}")
        print("-" * 40)
        
        if test_ocr_with_real_image(image_path):
            ocr_success = True
            print(f"✅ Successfully processed: {os.path.basename(image_path)}")
        else:
            print(f"❌ Failed to process: {os.path.basename(image_path)}")
    
    print("\n" + "=" * 60)
    
    # Test marking
    marking_success = test_marking()
    
    print("\n" + "=" * 60)
    print("🏁 Test Summary:")
    print(f"   OCR Tests: {'✅ PASSED' if ocr_success else '❌ FAILED'}")
    print(f"   Marking Tests: {'✅ PASSED' if marking_success else '❌ FAILED'}")
    
    if not ocr_success:
        print("\n💡 OCR Troubleshooting Tips:")
        print("   1. Check if the ML service is running: python app.py in ml-service/")
        print("   2. Verify OCR engines are installed: Tesseract, PaddleOCR, EasyOCR")
        print("   3. Check ML service logs for errors")
        print("   4. Ensure images are clear and have good contrast")

if __name__ == "__main__":
    main()
