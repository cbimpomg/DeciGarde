#!/usr/bin/env python3
"""
Complete OCR → Marking Pipeline Test
====================================
This test verifies the complete workflow:
1. Login to backend
2. Upload script with questions and rubrics
3. Wait for OCR processing
4. Wait for AI marking
5. Verify results
"""

import requests
import time
import json

# Configuration
BACKEND_URL = "http://localhost:5000"
ML_SERVICE_URL = "http://localhost:8000"

def test_complete_workflow():
    """Test the complete OCR → Marking pipeline"""
    
    print("🚀 Complete OCR → Marking Pipeline Test")
    print("=" * 60)
    print("This test will verify the complete workflow:")
    print("1. Login to backend")
    print("2. Upload script with questions and rubrics")
    print("3. Wait for OCR processing")
    print("4. Wait for AI marking")
    print("5. Verify results")
    print("=" * 60)
    
    # Step 1: Authentication
    print("\n🔐 Step 1: Authentication")
    print("-" * 40)
    
    try:
        login_data = {
            "email": "test@decigrade.com",
            "password": "test123"
        }
        
        response = requests.post(f"{BACKEND_URL}/api/users/login", json=login_data)
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
            
            register_response = requests.post(f"{BACKEND_URL}/api/users/register", json=register_data)
            if register_response.status_code == 201:
                print("✅ User registered successfully!")
                
                # Now try to login
                login_response = requests.post(f"{BACKEND_URL}/api/users/login", json=login_data)
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
    
    # Step 2: Script Upload with Questions and Rubrics
    print("\n📤 Step 2: Script Upload with Questions and Rubrics")
    print("-" * 40)
    
    try:
        # Create a sample marking rubric with questions
        marking_rubric = {
            "questions": [
                {
                    "questionNumber": 1,
                    "questionText": "Define energy",
                    "maxScore": 5,
                    "questionType": "definition",
                    "subject": "physics",
                    "rubric": {
                        "keywords": ["energy", "work", "power", "joule", "kinetic"],
                        "description": "Student should define energy and mention key concepts",
                        "scoringCriteria": [
                            {"criterion": "Correct definition", "points": 3},
                            {"criterion": "Key concepts", "points": 2}
                        ]
                    }
                },
                {
                    "questionNumber": 2,
                    "questionText": "Explain the process of energy conversion step by step",
                    "maxScore": 10,
                    "questionType": "explanation",
                    "subject": "physics",
                    "rubric": {
                        "keywords": ["process", "steps", "conversion", "energy", "work"],
                        "description": "Student should explain the process clearly with steps",
                        "scoringCriteria": [
                            {"criterion": "Process overview", "points": 2},
                            {"criterion": "Key steps", "points": 4},
                            {"criterion": "Logical flow", "points": 2},
                            {"criterion": "Conclusion", "points": 2}
                        ]
                    }
                }
            ]
        }
        
        # Prepare form data for upload
        files = {
            'pages': ('test_document.png', open('ml-service/test_image.jpg', 'rb'), 'image/jpeg')
        }
        
        data = {
            'studentId': 'TEST_STUDENT_001',
            'subject': 'physics',
            'examTitle': 'Physics Test',
            'markingRubric': json.dumps(marking_rubric)
        }
        
        headers = {
            'Authorization': f'Bearer {token}'
        }
        
        print("📤 Uploading script with questions and rubrics...")
        response = requests.post(
            f"{BACKEND_URL}/api/scripts/upload",
            files=files,
            data=data,
            headers=headers
        )
        
        if response.status_code == 201:
            result = response.json()
            script_id = result.get('scriptId')
            print("✅ Script uploaded successfully!")
            print(f"📝 Script ID: {script_id}")
            print(f"📊 Status: {result.get('status')}")
            print(f"📚 Questions: {len(marking_rubric['questions'])}")
        else:
            print(f"❌ Script upload failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Script upload error: {e}")
        return False
    
    # Step 3: Wait for OCR Processing
    print("\n⏳ Step 3: Waiting for OCR Processing")
    print("-" * 40)
    
    try:
        print("⏳ Waiting 45 seconds for OCR to complete...")
        time.sleep(45)
        
        # Check script status
        headers = {
            'Authorization': f'Bearer {token}'
        }
        
        response = requests.get(
            f"{BACKEND_URL}/api/scripts/{script_id}",
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
    
    # Step 4: Wait for AI Marking
    print("\n⏳ Step 4: Waiting for AI Marking")
    print("-" * 40)
    
    try:
        print("⏳ Waiting 30 seconds for AI marking to complete...")
        time.sleep(30)
        
        # Check script status again
        response = requests.get(
            f"{BACKEND_URL}/api/scripts/{script_id}",
            headers=headers
        )
        
        if response.status_code == 200:
            script = response.json()
            print("✅ Script retrieved after marking!")
            print(f"📊 Status: {script.get('status')}")
            print(f"🎯 Total Score: {script.get('totalScore', 'N/A')}")
            print(f"📊 Max Possible Score: {script.get('maxPossibleScore', 'N/A')}")
            
            # Check marking results for each question
            for question in script.get('questions', []):
                print(f"\n❓ Question {question.get('questionNumber')}:")
                print(f"   📝 Question: {question.get('questionText', 'N/A')[:50]}...")
                print(f"   🎯 AI Score: {question.get('aiScore', 'N/A')}/{question.get('maxScore', 'N/A')}")
                print(f"   💬 AI Feedback: {question.get('aiFeedback', 'N/A')[:100]}...")
                print(f"   🔑 Keywords: {question.get('keywords', [])}")
                print(f"   🎯 Confidence: {question.get('confidence', 'N/A')}")
                
                if question.get('aiScore') is not None:
                    print(f"   ✅ Question marked successfully!")
                else:
                    print(f"   ❌ Question not marked")
                    
        else:
            print(f"❌ Failed to retrieve script after marking: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error checking marking results: {e}")
    
    # Step 5: Summary
    print("\n🏁 Step 5: Test Summary")
    print("-" * 40)
    
    try:
        response = requests.get(
            f"{BACKEND_URL}/api/scripts/{script_id}",
            headers=headers
        )
        
        if response.status_code == 200:
            script = response.json()
            
            print("📊 FINAL RESULTS:")
            print(f"   📝 Script ID: {script.get('_id')}")
            print(f"   👤 Student: {script.get('studentId')}")
            print(f"   📚 Subject: {script.get('subject')}")
            print(f"   📖 Exam: {script.get('examTitle')}")
            print(f"   📊 Status: {script.get('status')}")
            print(f"   🎯 Total Score: {script.get('totalScore', 'N/A')}/{script.get('maxPossibleScore', 'N/A')}")
            print(f"   📄 Pages: {len(script.get('pages', []))}")
            print(f"   ❓ Questions: {len(script.get('questions', []))}")
            
            # Check if OCR and marking are complete
            ocr_complete = all(page.get('ocrText') for page in script.get('pages', []))
            marking_complete = all(q.get('aiScore') is not None for q in script.get('questions', []))
            
            if ocr_complete and marking_complete:
                print("\n🎉 SUCCESS: Complete OCR → Marking pipeline working!")
                print("✅ OCR: Text extracted from all pages")
                print("✅ AI Marking: All questions scored automatically")
                print("✅ Status: Script fully processed")
            elif ocr_complete:
                print("\n⚠️  PARTIAL SUCCESS: OCR working, marking incomplete")
                print("✅ OCR: Text extracted from all pages")
                print("❌ AI Marking: Some questions not scored")
            else:
                print("\n❌ FAILURE: OCR incomplete")
                print("❌ OCR: Text not extracted from all pages")
                print("❌ AI Marking: Cannot proceed without OCR")
                
        else:
            print("❌ Could not retrieve final script status")
            
    except Exception as e:
        print(f"❌ Error in final summary: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 COMPLETE OCR → MARKING PIPELINE TEST: COMPLETED!")
    print("💡 Check the results above to see if the complete workflow is working")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    test_complete_workflow()
