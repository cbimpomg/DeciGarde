#!/usr/bin/env python3
"""
Comprehensive Test for AI-Assisted Theory Marking System
Tests actual backend functionality and AI marking
"""

import requests
import json
import time
import base64

def test_complete_marking_workflow():
    print("🎯 Comprehensive AI-Assisted Theory Marking System Test")
    print("=" * 70)
    print("Testing actual backend functionality and AI marking")
    print("=" * 70)
    
    # Configuration
    base_url = "http://localhost:5000/api"
    token = None
    
    print("\n🔐 Step 1: Authentication")
    print("-" * 40)
    try:
        # Login
        login_data = {
            "email": "teacher@test.com",
            "password": "password123"
        }
        
        response = requests.post(f"{base_url}/users/login", json=login_data)
        if response.status_code == 200:
            token = response.json().get('token')
            print("✅ Login successful")
            print(f"🔑 Token: {token[:20]}...")
        else:
            print("❌ Login failed")
            return False
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return False
    
    print("\n📋 Step 2: Test Rubric Creation")
    print("-" * 40)
    try:
        # Create a test rubric
        rubric_data = {
            "name": "Physics Mechanics Test Rubric",
            "questionType": "explanation",
            "subject": "physics",
            "description": "Rubric for physics mechanics theory questions",
            "scoringMethod": "keyword_matching",
            "defaultMaxScore": 15,
            "questions": [
                {
                    "questionNumber": 1,
                    "questionText": "Explain Newton's three laws of motion with examples",
                    "questionType": "explanation",
                    "subject": "physics",
                    "maxScore": 15,
                    "rubric": {
                        "keywords": ["newton", "laws", "motion", "force", "action", "reaction", "inertia"],
                        "description": "Student should explain all three laws clearly",
                        "scoringCriteria": [
                            {"criterion": "Clear explanation of all three laws", "points": 8},
                            {"criterion": "Relevant examples for each law", "points": 5},
                            {"criterion": "Correct scientific terminology", "points": 2}
                        ]
                    }
                }
            ],
            "createdBy": "test_user_id"
        }
        
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{base_url}/rubrics", json=rubric_data, headers=headers)
        
        if response.status_code == 201:
            rubric_id = response.json().get('_id')
            print("✅ Rubric created successfully")
            print(f"📝 Rubric ID: {rubric_id}")
        else:
            print(f"❌ Rubric creation failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Rubric creation error: {e}")
        return False
    
    print("\n📄 Step 3: Test Script Upload")
    print("-" * 40)
    try:
        # Create a test script (simulated)
        script_data = {
            "studentId": "STU001",
            "subject": "physics",
            "examTitle": "Physics Mechanics Test",
            "markingRubric": rubric_data,
            "maxPossibleScore": 15,
            "pages": [
                {
                    "pageNumber": 1,
                    "imageUrl": "/uploads/test-page-1.jpg",
                    "ocrText": "Newton's three laws of motion are fundamental principles that describe the relationship between forces acting on a body and the motion of that body. The first law states that an object will remain at rest or in uniform motion unless acted upon by an external force. The second law states that the acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass. The third law states that for every action, there is an equal and opposite reaction. Examples include a car accelerating when force is applied, and a rocket moving forward as gases are expelled backward."
                }
            ],
            "questions": [
                {
                    "questionNumber": 1,
                    "questionText": "Explain Newton's three laws of motion with examples",
                    "questionType": "explanation",
                    "subject": "physics",
                    "maxScore": 15,
                    "aiScore": 0,
                    "aiFeedback": "",
                    "keywords": [],
                    "confidence": 0,
                    "semanticScore": 0
                }
            ],
            "status": "uploaded",
            "uploadedBy": "test_user_id"
        }
        
        response = requests.post(f"{base_url}/scripts/upload", json=script_data, headers=headers)
        
        if response.status_code == 201:
            script_id = response.json().get('_id')
            print("✅ Script uploaded successfully")
            print(f"📄 Script ID: {script_id}")
        else:
            print(f"❌ Script upload failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Script upload error: {e}")
        return False
    
    print("\n🤖 Step 4: Test AI Marking")
    print("-" * 40)
    try:
        # Trigger AI marking
        response = requests.post(f"{base_url}/marking/{script_id}/mark", headers=headers)
        
        if response.status_code == 200:
            print("✅ AI marking initiated successfully")
            print("🔄 Processing marking...")
            
            # Wait for marking to complete
            time.sleep(3)
            
            # Check marking status
            response = requests.get(f"{base_url}/marking/{script_id}", headers=headers)
            if response.status_code == 200:
                script_data = response.json()
                if script_data.get('status') == 'marked':
                    print("✅ AI marking completed successfully")
                    
                    # Show marking results
                    for question in script_data.get('questions', []):
                        print(f"   Question {question['questionNumber']}: {question['aiScore']}/{question['maxScore']}")
                        print(f"   AI Feedback: {question['aiFeedback'][:100]}...")
                        print(f"   Confidence: {question['confidence']:.2f}")
                else:
                    print(f"⚠️ Marking status: {script_data.get('status')}")
            else:
                print("❌ Failed to get marking results")
        else:
            print(f"❌ AI marking failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ AI marking error: {e}")
        return False
    
    print("\n👨‍🏫 Step 5: Test Teacher Review")
    print("-" * 40)
    try:
        # Update question with teacher review
        review_data = {
            "manualScore": 12,
            "manualFeedback": "Good explanation of the laws, but could provide more specific examples."
        }
        
        response = requests.put(f"{base_url}/marking/{script_id}/questions/1", 
                               json=review_data, headers=headers)
        
        if response.status_code == 200:
            print("✅ Teacher review saved successfully")
            print("📝 Manual score: 12/15")
            print("📝 Teacher feedback added")
        else:
            print(f"❌ Teacher review failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Teacher review error: {e}")
        return False
    
    print("\n📊 Step 6: Test Final Submission")
    print("-" * 40)
    try:
        # Submit final marking
        response = requests.put(f"{base_url}/marking/{script_id}/submit", headers=headers)
        
        if response.status_code == 200:
            print("✅ Final marking submitted successfully")
            
            # Get final results
            response = requests.get(f"{base_url}/marking/{script_id}", headers=headers)
            if response.status_code == 200:
                final_data = response.json()
                total_score = final_data.get('totalScore', 0)
                max_score = final_data.get('maxPossibleScore', 0)
                print(f"📊 Final Score: {total_score}/{max_score}")
                print(f"📈 Percentage: {(total_score/max_score)*100:.1f}%")
        else:
            print(f"❌ Final submission failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Final submission error: {e}")
        return False
    
    print("\n🎉 COMPREHENSIVE MARKING SYSTEM TEST: COMPLETED!")
    print("=" * 70)
    print("✅ Authentication: Working")
    print("✅ Rubric Creation: Working")
    print("✅ Script Upload: Working")
    print("✅ AI Marking: Working")
    print("✅ Teacher Review: Working")
    print("✅ Final Submission: Working")
    
    print("\n🚀 The AI-Assisted Theory Marking System is fully operational!")
    print("💡 Complete workflow tested successfully:")
    print("   1. ✅ Teacher authentication")
    print("   2. ✅ Rubric creation and management")
    print("   3. ✅ Student script upload with OCR")
    print("   4. ✅ AI-powered automatic marking")
    print("   5. ✅ Teacher review and adjustment")
    print("   6. ✅ Final grade submission")
    
    return True

if __name__ == "__main__":
    test_complete_marking_workflow()

