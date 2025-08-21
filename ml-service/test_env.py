#!/usr/bin/env python3
"""
Environment Variable Test Script
Tests if .env file is being loaded correctly
"""

import os
from dotenv import load_dotenv

def test_environment():
    """Test environment variable loading"""
    print("🔍 Testing Environment Variables")
    print("=" * 50)
    
    # Load .env file
    print("📁 Loading .env file...")
    load_dotenv()
    
    # Test key environment variables
    key_vars = [
        'OPENAI_API_KEY',
        'USE_GPU',
        'PADDLEOCR_USE_GPU',
        'EASYOCR_USE_GPU',
        'LOG_LEVEL',
        'HOST',
        'PORT'
    ]
    
    print("\n📋 Environment Variables Status:")
    for var in key_vars:
        value = os.getenv(var)
        if value:
            # Mask API keys for security
            if 'API_KEY' in var:
                masked_value = value[:8] + "..." + value[-4:] if len(value) > 12 else "***"
                print(f"   ✅ {var}: {masked_value}")
            else:
                print(f"   ✅ {var}: {value}")
        else:
            print(f"   ❌ {var}: Not set")
    
    # Test OpenAI API key specifically
    openai_key = os.getenv('OPENAI_API_KEY')
    if openai_key and openai_key != 'your_actual_openai_api_key_here':
        print(f"\n🎯 OpenAI API Key: ✅ Loaded successfully")
        print(f"   Length: {len(openai_key)} characters")
        print(f"   Starts with: {openai_key[:8]}...")
    else:
        print(f"\n⚠️  OpenAI API Key: ❌ Not properly configured")
        print(f"   Please check your .env file")
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    test_environment()
