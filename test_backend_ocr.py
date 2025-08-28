import requests
import json
import os
import time

def test_backend_ocr_workflow():
    """Test the complete backend OCR workflow"""
    print("🚀 Testing Backend OCR Workflow...")
    print("=" * 60)
    
    # Test image path
    test_image_path = "test_document.png"
    if not os.path.exists(test_image_path):
        print(f"❌ Test image not found: {test_image_path}")
        return False
    
    # Step 1: Login to get auth token
    print("\n🔐 Step 1: Authentication")
    print("-" * 40)
    
    try:
        login_data = {
            "email": "test@decigrade.com",
            "password": "test123"
        }
        
        response = requests.post("http://localhost:5000/api/users/login", json=login_data)
        if response.status_code == 200:
            token = response.json().get('token')
            print("✅ Login successful")
            print(f"🔑 Token: {token[:20]}...")
        else:
            print("⚠️  Login failed, trying to register...")
            
            # Try to register a new user
            register_data = {
                "firstName": "Test",
                "lastName": "User",
                "email": "test@decigrade.com",
                "password": "test123",
                "role": "teacher",
                "subjects": ["mathematics", "physics", "chemistry"]
            }
            
            register_response = requests.post("http://localhost:5000/api/users/register", json=register_data)
            if register_response.status_code == 201:
                print("✅ User registered successfully!")
                
                # Now try to login
                login_response = requests.post("http://localhost:5000/api/users/login", json=login_data)
                if login_response.status_code == 200:
                    token = login_response.json().get('token')
                    print("✅ Login successful after registration")
                    print(f"🔑 Token: {token[:20]}...")
                else:
                    print(f"❌ Login failed after registration: {login_response.status_code}")
                    return False
            else:
                print(f"❌ Registration failed: {register_response.status_code}")
                print(f"Response: {register_response.text}")
                return False
            
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return False
    
    # Step 2: Upload script with image
    print("\n📤 Step 2: Script Upload")
    print("-" * 40)
    
    try:
        # Create form data
        with open(test_image_path, 'rb') as img_file:
            files = {
                'pages': ('test_document.png', img_file, 'image/png')
            }
            
            data = {
                'studentId': 'TEST001',
                'subject': 'mathematics',
                'examTitle': 'OCR Test Exam',
                'markingRubric': json.dumps({
                    "questions": [
                        {
                            "questionNumber": 1,
                            "questionText": "What is 2 + 2?",
                            "maxScore": 10,
                            "keywords": ["four", "4", "addition"]
                        }
                    ]
                })
            }
            
            headers = {
                'Authorization': f'Bearer {token}'
            }
            
            print("📤 Uploading script to backend...")
            response = requests.post(
                "http://localhost:5000/api/scripts/upload",
                files=files,
                data=data,
                headers=headers,
                timeout=60
            )
            
            if response.status_code == 201:
                script_data = response.json()
                script_id = script_data.get('scriptId')
                print("✅ Script uploaded successfully!")
                print(f"📝 Script ID: {script_id}")
                print(f"📊 Status: {script_data.get('status')}")
            else:
                print(f"❌ Upload failed: {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return False
    
    # Step 3: Wait for OCR processing
    print("\n⏳ Step 3: Waiting for OCR Processing")
    print("-" * 40)
    
    try:
        print("⏳ Waiting 30 seconds for OCR to complete...")
        time.sleep(30)
        
        # Check script status
        headers = {
            'Authorization': f'Bearer {token}'
        }
        
        response = requests.get(
            f"http://localhost:5000/api/scripts/{script_id}",
            headers=headers
        )
        
        if response.status_code == 200:
            script = response.json()
            print("✅ Script retrieved successfully!")
            print(f"📊 Status: {script.get('status')}")
            print(f"📄 Pages: {len(script.get('pages', []))}")
            
            # Check OCR text for each page
            for i, page in enumerate(script.get('pages', [])):
                print(f"\n📖 Page {i + 1}:")
                print(f"   📷 Image: {page.get('imageUrl', 'N/A')}")
                print(f"   📝 OCR Text: {page.get('ocrText', 'No OCR text')[:100]}...")
                print(f"   🎯 Confidence: {page.get('ocrConfidence', 'N/A')}")
                print(f"   🔧 Provider: {page.get('ocrProvider', 'N/A')}")
                print(f"   ⏰ Processed: {page.get('processedAt', 'N/A')}")
                
                if page.get('ocrText'):
                    print(f"   ✅ OCR Text Length: {len(page.get('ocrText'))} characters")
                else:
                    print(f"   ❌ No OCR text extracted")
                    
        else:
            print(f"❌ Failed to retrieve script: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error checking script: {e}")
    
    return True

def main():
    print("🚀 Backend OCR Workflow Test")
    print("=" * 60)
    print("This test will:")
    print("1. Login to the backend")
    print("2. Upload a test script")
    print("3. Wait for OCR processing")
    print("4. Check if OCR text was extracted")
    print("=" * 60)
    
    success = test_backend_ocr_workflow()
    
    print("\n" + "=" * 60)
    if success:
        print("🎉 BACKEND OCR TEST: COMPLETED!")
        print("💡 Check the results above to see if OCR text was extracted")
    else:
        print("❌ BACKEND OCR TEST: FAILED!")
        print("💡 Check the errors above")
    
    print("=" * 60)

if __name__ == "__main__":
    main()
