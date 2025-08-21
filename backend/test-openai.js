require('dotenv').config();
const OpenAI = require('openai');

async function testOpenAI() {
  console.log('🧪 Testing OpenAI API Configuration...\n');
  
  console.log('🔍 Environment Check:');
  console.log(`   LLM_API_KEY exists: ${process.env.LLM_API_KEY ? 'Yes' : 'No'}`);
  console.log(`   LLM_API_KEY length: ${process.env.LLM_API_KEY ? process.env.LLM_API_KEY.length : 0}`);
  console.log(`   LLM_API_KEY starts with 'sk-': ${process.env.LLM_API_KEY ? process.env.LLM_API_KEY.startsWith('sk-') : false}`);
  
  if (!process.env.LLM_API_KEY) {
    console.log('\n❌ LLM_API_KEY not found in environment variables');
    console.log('💡 Make sure the .env file is in the backend directory');
    return;
  }
  
  try {
    console.log('\n🔧 Initializing OpenAI client...');
    const openai = new OpenAI({
      apiKey: process.env.LLM_API_KEY,
    });
    
    console.log('✅ OpenAI client initialized successfully');
    
    console.log('\n🧪 Testing API connection...');
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "user", content: "Hello! Please respond with 'API test successful' if you can see this message." }
      ],
      max_tokens: 50
    });
    
    console.log('✅ API test successful!');
    console.log(`📝 Response: ${completion.choices[0].message.content}`);
    
    console.log('\n🎉 OpenAI API is working correctly!');
    console.log('💡 You can now use the full AI marking system');
    
  } catch (error) {
    console.error('\n❌ OpenAI API test failed:', error.message);
    
    if (error.code === 'invalid_api_key') {
      console.log('💡 The API key appears to be invalid. Please check:');
      console.log('   1. The key is correct and complete');
      console.log('   2. The key has the necessary permissions');
      console.log('   3. Your OpenAI account has sufficient credits');
    } else if (error.code === 'rate_limit_exceeded') {
      console.log('💡 Rate limit exceeded. Please wait a moment and try again.');
    } else if (error.message.includes('quota') || error.message.includes('billing')) {
      console.log('💡 You have exceeded your OpenAI quota. Please:');
      console.log('   1. Check your OpenAI billing at: https://platform.openai.com/account/billing');
      console.log('   2. Add payment method if needed');
      console.log('   3. Wait a few minutes for rate limits to reset');
    } else {
      console.log('💡 Check your internet connection and try again.');
    }
  }
}

// Run the test
testOpenAI().catch(console.error); 