#!/usr/bin/env python3
"""
GPU-Enabled ML Service Startup Script
This script configures GPU support and starts the ML service
"""

import os
import sys
import subprocess
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def configure_gpu():
    """Configure GPU environment variables"""
    print("🔧 Configuring GPU Support...")
    
    # GPU Configuration
    os.environ['USE_GPU'] = 'true'
    os.environ['CUDA_VISIBLE_DEVICES'] = '0'
    os.environ['GPU_MEMORY_FRACTION'] = '0.8'
    
    # OCR Engine GPU Settings
    os.environ['PADDLEOCR_USE_GPU'] = 'true'
    os.environ['EASYOCR_USE_GPU'] = 'true'
    
    # Performance Settings
    os.environ['BATCH_SIZE'] = '4'
    os.environ['MAX_WORKERS'] = '2'
    
    print("✅ GPU Configuration Complete!")
    print(f"   USE_GPU: {os.environ.get('USE_GPU')}")
    print(f"   CUDA_VISIBLE_DEVICES: {os.environ.get('CUDA_VISIBLE_DEVICES')}")
    print(f"   GPU_MEMORY_FRACTION: {os.environ.get('GPU_MEMORY_FRACTION')}")

def check_gpu_availability():
    """Check if GPU is available"""
    try:
        import torch
        if torch.cuda.is_available():
            gpu_count = torch.cuda.device_count()
            gpu_name = torch.cuda.get_device_name(0)
            print(f"🎯 GPU Detected: {gpu_name}")
            print(f"   Available GPUs: {gpu_count}")
            return True
        else:
            print("⚠️  No CUDA GPU detected")
            return False
    except ImportError:
        print("⚠️  PyTorch not installed - cannot check GPU")
        return False

def start_service():
    """Start the ML service"""
    print("🚀 Starting ML Service with GPU Support...")
    
    try:
        # Import and run the app
        from app import app
        import uvicorn
        
        uvicorn.run(
            "app:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info"
        )
    except Exception as e:
        print(f"❌ Failed to start service: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("🎯 DeciGarde ML Service - GPU Edition")
    print("=" * 50)
    
    # Configure GPU
    configure_gpu()
    
    # Check GPU availability
    gpu_available = check_gpu_availability()
    
    if gpu_available:
        print("✅ GPU Support Enabled - Starting Service...")
    else:
        print("⚠️  GPU Not Available - Service will run in CPU mode")
    
    print("=" * 50)
    
    # Start the service
    start_service()
