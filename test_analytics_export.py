#!/usr/bin/env python3
"""
Test script to verify analytics export functionality
"""

import requests
import json

# Backend URL
BASE_URL = "http://localhost:5000"

def test_analytics_export():
    """Test the analytics export endpoint"""
    
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
        
        # Test analytics export
        print("📤 Testing analytics export...")
        
        # Test CSV export
        csv_response = requests.get(
            f"{BASE_URL}/api/analytics/export?format=csv&dateRange=30&subject=all",
            headers=headers
        )
        
        print(f"📥 CSV Export Response status: {csv_response.status_code}")
        print(f"📥 CSV Export Response headers: {dict(csv_response.headers)}")
        
        if csv_response.status_code == 200:
            print("✅ CSV Export successful!")
            print(f"📄 Content length: {len(csv_response.content)} bytes")
            print(f"📄 Content type: {csv_response.headers.get('content-type')}")
            
            # Save the CSV file
            with open('test_analytics_export.csv', 'wb') as f:
                f.write(csv_response.content)
            print("💾 CSV file saved as 'test_analytics_export.csv'")
        else:
            print("❌ CSV Export failed!")
            print(f"📥 Response body: {csv_response.text}")
        
        # Test Excel export
        excel_response = requests.get(
            f"{BASE_URL}/api/analytics/export?format=excel&dateRange=30&subject=all",
            headers=headers
        )
        
        print(f"📥 Excel Export Response status: {excel_response.status_code}")
        print(f"📥 Excel Export Response headers: {dict(excel_response.headers)}")
        
        if excel_response.status_code == 200:
            print("✅ Excel Export successful!")
            print(f"📄 Content length: {len(excel_response.content)} bytes")
            print(f"📄 Content type: {excel_response.headers.get('content-type')}")
            print(f"📄 Filename: {excel_response.headers.get('content-disposition')}")
            
            # Save the Excel file
            with open('test_analytics_export.xlsx', 'wb') as f:
                f.write(excel_response.content)
            print("💾 Excel file saved as 'test_analytics_export.xlsx'")
        else:
            print("❌ Excel Export failed!")
            print(f"📥 Response body: {excel_response.text}")
        
        # Test JSON export
        json_response = requests.get(
            f"{BASE_URL}/api/analytics/export?format=json&dateRange=30&subject=all",
            headers=headers
        )
        
        print(f"📥 JSON Export Response status: {json_response.status_code}")
        
        if json_response.status_code == 200:
            print("✅ JSON Export successful!")
            data = json_response.json()
            print(f"📄 Export date: {data.get('exportDate')}")
            print(f"📄 Data count: {len(data.get('data', []))}")
        else:
            print("❌ JSON Export failed!")
            print(f"📥 Response body: {json_response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_analytics_export()
