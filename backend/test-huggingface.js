require('dotenv').config();
const axios = require('axios');

async function testHuggingFace() {
  console.log('🧪 Testing Hugging Face API Configuration...\n');
  
  console.log('🔍 Environment Check:');
  console.log(`   HUGGING_FACE_API_KEY exists: ${process.env.HUGGING_FACE_API_KEY ? 'Yes' : 'No'}`);
  console.log(`   HUGGING_FACE_API_KEY length: ${process.env.HUGGING_FACE_API_KEY ? process.env.HUGGING_FACE_API_KEY.length : 0}`);
  
  if (!process.env.HUGGING_FACE_API_KEY) {
    console.log('\n❌ HUGGING_FACE_API_KEY not found in environment variables');
    console.log('💡 To get a free API key:');
    console.log('   1. Go to: https://huggingface.co/settings/tokens');
    console.log('   2. Create a new token (free)');
    console.log('   3. Add it to your .env file as HUGGING_FACE_API_KEY');
    return;
  }
  
  try {
    console.log('\n🔧 Initializing Hugging Face client...');
    const client = axios.create({
      headers: {
        'Authorization': `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Hugging Face client initialized successfully');
    
    // Test with a simple text generation model
    console.log('\n🧪 Testing text generation...');
    const response = await client.post('https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium', {
      inputs: 'Hello, how are you?',
      parameters: {
        max_length: 50,
        temperature: 0.7
      }
    });
    
    console.log('✅ API test successful!');
    console.log(`📝 Response: ${response.data[0].generated_text}`);
    
    console.log('\n🎉 Hugging Face API is working correctly!');
    console.log('💡 You can now use the free AI marking system');
    
  } catch (error) {
    console.error('\n❌ Hugging Face API test failed:', error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Invalid API key. Please check:');
      console.log('   1. The key is correct and complete');
      console.log('   2. The key has the necessary permissions');
    } else if (error.response?.status === 429) {
      console.log('💡 Rate limit exceeded. Please wait a moment and try again.');
    } else {
      console.log('💡 Check your internet connection and try again.');
    }
  }
}

// Run the test
testHuggingFace().catch(console.error); 