#!/usr/bin/env python3
"""
Debug script to test the question update request
"""

import requests
import json

# Backend URL
BASE_URL = "http://localhost:5000"

def test_question_update():
    """Test the question update endpoint"""
    
    # First, let's login to get a token
    login_data = {
        "email": "test@decigarde.com",
        "password": "test123"
    }
    
    try:
        # Login
        login_response = requests.post(f"{BASE_URL}/api/users/login", json=login_data)
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print(login_response.text)
            
            # Try to register the user
            register_data = {
                "email": "test@decigarde.com",
                "password": "test123",
                "firstName": "Test",
                "lastName": "User",
                "role": "teacher",
                "subjects": ["Physics", "Mathematics"]
            }
            
            print("🔄 Trying to register user...")
            register_response = requests.post(f"{BASE_URL}/api/users/register", json=register_data)
            if register_response.status_code in [200, 201]:
                print("✅ User registered successfully")
                # Extract token from registration response
                register_data = register_response.json()
                token = register_data.get('token')
                if token:
                    print("✅ Got token from registration")
                else:
                    # Try login again
                    login_response = requests.post(f"{BASE_URL}/api/users/login", json=login_data)
                    if login_response.status_code == 200:
                        token = login_response.json().get('token')
                    else:
                        print("❌ Login still failed after registration")
                        return
            else:
                print(f"❌ Registration failed: {register_response.status_code}")
                print(register_response.text)
                return
        else:
            token = login_response.json().get('token')
        
        headers = {'Authorization': f'Bearer {token}'}
        print("✅ Authentication successful")
        
        # Test question update with teacherScore/teacherFeedback
        script_id = "68b5c94238c784995d9d6ed3"  # Use the script ID from the error
        question_number = 1
        
        # Test data that frontend would send
        update_data = {
            "teacherScore": 8,
            "teacherFeedback": "Good answer with some room for improvement"
        }
        
        print(f"📤 Testing question update for script {script_id}, question {question_number}")
        print(f"📤 Sending data: {update_data}")
        
        response = requests.put(
            f"{BASE_URL}/api/marking/{script_id}/questions/{question_number}",
            json=update_data,
            headers=headers
        )
        
        print(f"📥 Response status: {response.status_code}")
        print(f"📥 Response body: {response.text}")
        
        if response.status_code == 200:
            print("✅ Question update successful!")
        else:
            print("❌ Question update failed!")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_question_update()
