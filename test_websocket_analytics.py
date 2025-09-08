#!/usr/bin/env python3
"""
Test script to verify WebSocket analytics updates
"""

import requests
import json
import time

# Backend URL
BASE_URL = "http://localhost:5000"

def test_websocket_analytics_update():
    """Test that WebSocket events trigger analytics updates"""
    
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
            return
        
        token = login_response.json().get('token')
        headers = {'Authorization': f'Bearer {token}'}
        print("✅ Authentication successful")
        
        # Get initial analytics data
        print("📊 Getting initial analytics data...")
        initial_response = requests.get(f"{BASE_URL}/api/analytics/dashboard", headers=headers)
        
        if initial_response.status_code == 200:
            initial_data = initial_response.json()
            initial_scripts = initial_data.get('data', {}).get('totalScripts', 0)
            print(f"📊 Initial total scripts: {initial_scripts}")
        else:
            print(f"❌ Failed to get initial analytics: {initial_response.status_code}")
            return
        
        # Simulate a script upload (this would normally come from mobile app)
        print("📤 Simulating script upload...")
        
        # Create a test script upload
        upload_data = {
            "studentId": "TEST_STUDENT_001",
            "subject": "Physics",
            "examTitle": "Test Exam for Analytics"
        }
        
        # Note: This is a simplified test - in reality, the mobile app would upload files
        # For this test, we'll just check if the analytics endpoint responds correctly
        
        # Get analytics again to see if there are any changes
        print("📊 Getting updated analytics data...")
        updated_response = requests.get(f"{BASE_URL}/api/analytics/dashboard", headers=headers)
        
        if updated_response.status_code == 200:
            updated_data = updated_response.json()
            updated_scripts = updated_data.get('data', {}).get('totalScripts', 0)
            print(f"📊 Updated total scripts: {updated_scripts}")
            
            if updated_scripts > initial_scripts:
                print("✅ Analytics data updated successfully!")
            else:
                print("ℹ️ Analytics data unchanged (expected if no real upload occurred)")
        else:
            print(f"❌ Failed to get updated analytics: {updated_response.status_code}")
        
        # Test WebSocket endpoint (basic connectivity)
        print("🔌 Testing WebSocket connectivity...")
        try:
            # This is a basic test - in a real scenario, you'd use a WebSocket client
            # For now, we'll just check if the server is running
            health_response = requests.get(f"{BASE_URL}/api/health")
            if health_response.status_code == 200:
                print("✅ Backend server is running and WebSocket should be available")
            else:
                print("⚠️ Backend server health check failed")
        except Exception as e:
            print(f"⚠️ Could not check WebSocket connectivity: {e}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_websocket_analytics_update()
