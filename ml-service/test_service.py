#!/usr/bin/env python3
"""
Comprehensive ML Service Testing Script
Tests all components: OCR, Marking, Image Preprocessing
"""

import os
import requests
import json
import time
from pathlib import Path

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_IMAGE_PATH = "test_image.jpg"

def test_health():
    """Test basic health endpoint"""
    print("🏥 Testing Health Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Health: {data['status']}")
            print(f"   ✅ Services: {data['services']}")
            return True
        else:
            print(f"   ❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Health check error: {e}")
        return False

def test_capabilities():
    """Test capabilities endpoint"""
    print("\n🔍 Testing Capabilities Endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/ml/capabilities")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ OCR Engines: {data['ocr']['available_engines']}")
            print(f"   ✅ Marking Approaches: {data['marking']['ai_approaches']}")
            print(f"   ✅ GPU Support: {data['gpu_support']['enabled']}")
            return True
        else:
            print(f"   ❌ Capabilities failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Capabilities error: {e}")
        return False

def test_ocr_single():
    """Test single image OCR"""
    print("\n📸 Testing Single Image OCR...")
    
    # Check if test image exists
    if not Path(TEST_IMAGE_PATH).exists():
        print(f"   ⚠️  Test image not found: {TEST_IMAGE_PATH}")
        print("   ℹ️  Create a test image or use an existing one")
        return False
    
    try:
        with open(TEST_IMAGE_PATH, 'rb') as f:
            files = {'image': f}
            data = {
                'language': 'eng',
                'enhance_handwriting': 'true'
            }
            
            response = requests.post(f"{BASE_URL}/api/ml/ocr", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ OCR Success!")
                print(f"   📝 Text: {result['text'][:100]}...")
                print(f"   🎯 Confidence: {result['confidence']:.2f}")
                print(f"   🔧 Provider: {result['provider']}")
                print(f"   ⏱️  Time: {result['processing_time']:.2f}s")
                return True
            else:
                print(f"   ❌ OCR failed: {response.status_code}")
                print(f"   📄 Response: {response.text}")
                return False
                
    except Exception as e:
        print(f"   ❌ OCR error: {e}")
        return False

def test_marking():
    """Test script marking service"""
    print("\n✍️ Testing Script Marking...")
    
    test_data = {
        'question': 'Explain the concept of photosynthesis',
        'answer': 'Photosynthesis is the process where plants use sunlight to convert carbon dioxide and water into glucose and oxygen. This happens in the chloroplasts using chlorophyll.',
        'rubric': json.dumps({
            'keywords': ['photosynthesis', 'sunlight', 'carbon dioxide', 'water', 'glucose', 'oxygen', 'chloroplasts', 'chlorophyll'],
            'required_concepts': ['energy conversion', 'plant process', 'chemical reaction']
        }),
        'max_score': 10,
        'subject': 'biology'
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/ml/mark", data=test_data)
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Marking Success!")
            print(f"   📊 Score: {result['score']}/{result['max_score']}")
            print(f"   🎯 Confidence: {result['confidence']:.2f}")
            print(f"   💬 Feedback: {result['feedback'][:100]}...")
            print(f"   🔑 Keywords: {result['matched_keywords']}")
            return True
        else:
            print(f"   ❌ Marking failed: {response.status_code}")
            print(f"   📄 Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ Marking error: {e}")
        return False

def test_batch_ocr():
    """Test batch OCR processing"""
    print("\n📚 Testing Batch OCR...")
    
    # Check if test image exists
    if not Path(TEST_IMAGE_PATH).exists():
        print(f"   ⚠️  Test image not found: {TEST_IMAGE_PATH}")
        return False
    
    try:
        with open(TEST_IMAGE_PATH, 'rb') as f:
            files = [('images', f)]
            data = {
                'language': 'eng',
                'enhance_handwriting': 'true'
            }
            
            response = requests.post(f"{BASE_URL}/api/ml/batch-ocr", files=files, data=data)
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ Batch OCR Success!")
                print(f"   📊 Total: {result['total_images']}")
                print(f"   ✅ Processed: {result['processed_images']}")
                print(f"   ❌ Failed: {result['failed_images']}")
                return True
            else:
                print(f"   ❌ Batch OCR failed: {response.status_code}")
                return False
                
    except Exception as e:
        print(f"   ❌ Batch OCR error: {e}")
        return False

def create_test_image():
    """Create a simple test image for testing"""
    print("\n🎨 Creating Test Image...")
    
    try:
        from PIL import Image, ImageDraw, ImageFont
        import numpy as np
        
        # Create a simple image with text
        img = Image.new('RGB', (400, 200), color='white')
        draw = ImageDraw.Draw(img)
        
        # Add some text
        text = "This is a test image\nfor OCR testing\nDeciGarde ML Service"
        draw.text((20, 20), text, fill='black')
        
        # Save the image
        img.save(TEST_IMAGE_PATH)
        print(f"   ✅ Test image created: {TEST_IMAGE_PATH}")
        return True
        
    except ImportError:
        print("   ⚠️  PIL not available, cannot create test image")
        return False
    except Exception as e:
        print(f"   ❌ Error creating test image: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 DeciGarde ML Service - Comprehensive Testing")
    print("=" * 60)
    
    # Check if service is running
    print("🔍 Checking if service is running...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("   ✅ Service is running!")
        else:
            print("   ❌ Service is not responding properly")
            return
    except:
        print("   ❌ Service is not running. Start it with: python app.py")
        return
    
    # Run tests
    tests = [
        ("Health Check", test_health),
        ("Capabilities", test_capabilities),
        ("Create Test Image", create_test_image),
        ("Single OCR", test_ocr_single),
        ("Script Marking", test_marking),
        ("Batch OCR", test_batch_ocr)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"   ❌ {test_name} crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Results Summary:")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status} {test_name}")
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Your ML service is working perfectly!")
    else:
        print("⚠️  Some tests failed. Check the logs above for details.")

if __name__ == "__main__":
    main()
