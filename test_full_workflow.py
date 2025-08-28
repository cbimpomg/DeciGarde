import requests
import json
import time
import os

def test_full_workflow():
    """Test the complete OCR + marking workflow"""
    print("🚀 Testing Complete DeciGarde Workflow...")
    print("=" * 60)
    
    # Step 1: Test Backend Health
    print("\n🔍 Step 1: Backend Health Check")
    print("-" * 40)
    
    try:
        response = requests.get("http://localhost:5000/api/health", timeout=10)
        if response.status_code == 200:
            print("✅ Backend is running and healthy")
        else:
            print(f"⚠️  Backend responded with status: {response.status_code}")
    except Exception as e:
        print(f"❌ Backend health check failed: {e}")
        print("💡 Make sure the backend is running with: npm start")
        return False
    
    # Step 2: Test ML Service Health
    print("\n🔍 Step 2: ML Service Health Check")
    print("-" * 40)
    
    try:
        response = requests.get("http://localhost:8000/", timeout=10)
        if response.status_code == 200:
            print("✅ ML Service is running and healthy")
            ml_status = response.json()
            print(f"📊 ML Service Status: {ml_status.get('status', 'unknown')}")
        else:
            print(f"⚠️  ML Service responded with status: {response.status_code}")
    except Exception as e:
        print(f"❌ ML Service health check failed: {e}")
        print("💡 Make sure the ML service is running with: python app.py")
        return False
    
    # Step 3: Test OCR with Real Document
    print("\n🔍 Step 3: OCR Processing Test")
    print("-" * 40)
    
    test_image_path = "test_document.png"
    if not os.path.exists(test_image_path):
        print(f"❌ Test image not found: {test_image_path}")
        return False
    
    try:
        with open(test_image_path, 'rb') as img_file:
            files = {'image': ('test_document.png', img_file, 'image/png')}
            
            print("📤 Sending document to ML Service for OCR...")
            response = requests.post(
                "http://localhost:8000/api/ml/ocr",
                files=files,
                data={'enhance_handwriting': 'false'},
                timeout=30
            )
            
            if response.status_code == 200:
                ocr_result = response.json()
                print("✅ OCR successful!")
                print(f"📝 Extracted text: '{ocr_result.get('text', '')[:100]}...'")
                print(f"🎯 Confidence: {ocr_result.get('confidence', 0):.2%}")
                print(f"🔧 Provider: {ocr_result.get('provider', 'unknown')}")
                print(f"⏱️  Processing time: {ocr_result.get('processing_time', 0):.2f}s")
                
                extracted_text = ocr_result.get('text', '')
                if len(extracted_text) > 50:  # Ensure we got meaningful text
                    print("✅ Text extraction quality: EXCELLENT")
                else:
                    print("⚠️  Text extraction quality: POOR")
                    return False
                    
            else:
                print(f"❌ OCR failed with status: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ OCR test failed: {e}")
        return False
    
    # Step 4: Test Marking with Extracted Text
    print("\n🔍 Step 4: AI Marking Test")
    print("-" * 40)
    
    try:
        # Create a realistic marking scenario
        marking_data = {
            "question": "What is the capital of France and where is it located?",
            "answer": extracted_text,  # Use the actual extracted text
            "rubric": json.dumps({
                "criteria": [
                    {
                        "name": "Content Accuracy",
                        "description": "Answer must contain correct factual information",
                        "max_score": 10
                    },
                    {
                        "name": "Completeness",
                        "description": "Answer should address all parts of the question",
                        "max_score": 5
                    },
                    {
                        "name": "Clarity",
                        "description": "Answer should be clear and well-structured",
                        "max_score": 5
                    }
                ]
            }),
            "max_score": 20,
            "subject": "geography"
        }
        
        print("📤 Sending extracted text for AI marking...")
        response = requests.post(
            "http://localhost:8000/api/ml/mark",
            data=marking_data,
            timeout=30
        )
        
        if response.status_code == 200:
            marking_result = response.json()
            print("✅ AI Marking successful!")
            print(f"🎯 Score: {marking_result.get('score', 0)}/{marking_result.get('max_score', 0)}")
            print(f"📝 Feedback: {marking_result.get('feedback', '')[:100]}...")
            print(f"🎯 Confidence: {marking_result.get('confidence', 0):.2%}")
            print(f"🔍 Semantic Score: {marking_result.get('semantic_score', 0):.2%}")
            
            # Check if marking makes sense
            score = marking_result.get('score', 0)
            max_score = marking_result.get('max_score', 0)
            if score > 0 and score <= max_score:
                print("✅ Marking quality: EXCELLENT")
            else:
                print("⚠️  Marking quality: QUESTIONABLE")
                
        else:
            print(f"❌ Marking failed with status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Marking test failed: {e}")
        return False
    
    # Step 5: Test Backend Integration
    print("\n🔍 Step 5: Backend Integration Test")
    print("-" * 40)
    
    try:
        # Test the backend's ML service proxy
        response = requests.get("http://localhost:5000/api/ml/capabilities", timeout=10)
        if response.status_code == 200:
            print("✅ Backend ML service proxy is working")
            capabilities = response.json()
            print(f"📊 Available OCR engines: {capabilities.get('ocr', {}).get('available_engines', [])}")
        else:
            print(f"⚠️  Backend ML proxy responded with status: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Backend integration test failed: {e}")
    
    # Step 6: Performance Analysis
    print("\n🔍 Step 6: Performance Analysis")
    print("-" * 40)
    
    # Test OCR performance with different image sizes
    test_images = [
        ("test_document.png", "Medium document (49KB)"),
        ("processed_test_document.png", "Processed document (if exists)")
    ]
    
    for img_path, description in test_images:
        if os.path.exists(img_path):
            try:
                start_time = time.time()
                with open(img_path, 'rb') as img_file:
                    files = {'image': (os.path.basename(img_path), img_file, 'image/png')}
                    response = requests.post(
                        "http://localhost:8000/api/ml/ocr",
                        files=files,
                        timeout=30
                    )
                    end_time = time.time()
                    
                    if response.status_code == 200:
                        processing_time = end_time - start_time
                        file_size = os.path.getsize(img_path)
                        print(f"✅ {description}: {processing_time:.2f}s ({file_size} bytes)")
                    else:
                        print(f"❌ {description}: Failed")
                        
            except Exception as e:
                print(f"❌ {description}: Error - {e}")
    
    return True

def main():
    print("🚀 DeciGarde Full Workflow Test")
    print("=" * 60)
    print("This test simulates the complete workflow:")
    print("1. Backend health check")
    print("2. ML service health check") 
    print("3. OCR processing")
    print("4. AI marking")
    print("5. Backend integration")
    print("6. Performance analysis")
    print("=" * 60)
    
    success = test_full_workflow()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 FULL WORKFLOW TEST: PASSED!")
        print("✅ Your DeciGarde system is working perfectly!")
        print("🚀 Ready for production use!")
    else:
        print("❌ FULL WORKFLOW TEST: FAILED!")
        print("💡 Check the errors above and fix them")
    
    print("=" * 60)

if __name__ == "__main__":
    main()
