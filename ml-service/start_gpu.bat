@echo off
echo 🎯 DeciGarde ML Service - GPU Edition
echo ================================================

echo 🔧 Configuring GPU Support...
set USE_GPU=true
set CUDA_VISIBLE_DEVICES=0
set GPU_MEMORY_FRACTION=0.8
set PADDLEOCR_USE_GPU=true
set EASYOCR_USE_GPU=true

echo ✅ GPU Configuration Complete!
echo    USE_GPU: %USE_GPU%
echo    CUDA_VISIBLE_DEVICES: %CUDA_VISIBLE_DEVICES%
echo    GPU_MEMORY_FRACTION: %GPU_MEMORY_FRACTION%

echo.
echo 🚀 Starting ML Service with GPU Support...
echo ================================================

python start_gpu.py

pause
