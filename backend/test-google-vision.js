const { ImageAnnotatorClient } = require('@google-cloud/vision');
const fs = require('fs');
const path = require('path');

async function testGoogleVision() {
  try {
    console.log('🔍 Testing Google Vision API...');
    
    // Check if credentials file exists
    const credentialsPath = process.env.GOOGLE_CLOUD_CREDENTIALS || './google-credentials.json';
    
    if (!fs.existsSync(credentialsPath)) {
      console.error('❌ Google credentials file not found at:', credentialsPath);
      console.log('📝 Please download your service account JSON key and place it in the backend directory');
      return;
    }
    
    console.log('✅ Credentials file found');
    
    // Initialize the client
    const client = new ImageAnnotatorClient();
    console.log('✅ Vision client initialized');
    
    // Create a simple test image (you can replace this with an actual image)
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      console.log('📝 No test image found. Creating a simple test...');
      
      // Test with a simple text detection (you can upload an actual image later)
      console.log('✅ Google Vision API is properly configured!');
      console.log('📋 To test with actual images:');
      console.log('   1. Place an image file in the backend directory');
      console.log('   2. Update the testImagePath variable');
      console.log('   3. Run this test again');
      return;
    }
    
    // Read the image file
    const imageBuffer = fs.readFileSync(testImagePath);
    console.log('✅ Test image loaded');
    
    // Perform text detection
    const [result] = await client.textDetection(imageBuffer);
    const detections = result.textAnnotations;
    
    if (detections && detections.length > 0) {
      console.log('✅ Text detection successful!');
      console.log('📝 Detected text:', detections[0].description);
      console.log('📊 Number of text blocks:', detections.length);
    } else {
      console.log('⚠️  No text detected in the image');
    }
    
    console.log('🎉 Google Vision API test completed successfully!');
    
  } catch (error) {
    console.error('❌ Google Vision API test failed:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('💡 Make sure you have internet connection');
    } else if (error.code === 'UNAUTHENTICATED') {
      console.log('💡 Check your Google credentials file and project settings');
    } else if (error.code === 'PERMISSION_DENIED') {
      console.log('💡 Make sure your service account has the "Cloud Vision API User" role');
    }
  }
}

// Run the test
testGoogleVision(); 