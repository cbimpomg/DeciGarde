const { markQuestionEnhanced } = require('./services/markingService');

async function testSimpleMarking() {
  console.log('🧪 Testing Simple Marking (No OpenAI Required)...\n');

  // Test with a simple question that should work with keyword matching
  const testQuestion = {
    questionText: "What is photosynthesis?",
    subject: "biology",
    maxScore: 10,
    keywords: ["photosynthesis", "plants", "sunlight", "energy", "chlorophyll"],
    answerText: "Photosynthesis is the process where plants convert sunlight into energy using chlorophyll."
  };

  console.log(`📝 Testing Question: ${testQuestion.questionText}`);
  console.log(`📚 Subject: ${testQuestion.subject}`);
  console.log(`📊 Max Score: ${testQuestion.maxScore}`);
  console.log(`✍️  Answer: ${testQuestion.answerText}`);
  console.log(`🔑 Keywords: ${testQuestion.keywords.join(', ')}`);
  console.log('');

  try {
    const fullText = testQuestion.answerText.toLowerCase();
    const result = await markQuestionEnhanced(testQuestion, fullText);
    
    console.log('✅ Marking Result:');
    console.log(`   Score: ${result.score}/${testQuestion.maxScore}`);
    console.log(`   Confidence: ${result.confidence || 0}%`);
    console.log(`   Semantic Score: ${result.semanticScore || 0}`);
    console.log(`   Feedback: ${result.feedback || 'No feedback available'}`);
    console.log(`   Improvements: ${(result.improvements || []).join(', ')}`);
    console.log(`   Matched Keywords: ${(result.matchedKeywords || []).join(', ')}`);
    
  } catch (error) {
    console.error(`❌ Error marking question:`, error.message);
  }

  console.log('\n🔍 System Status:');
  console.log(`   OpenAI API Key: ${process.env.LLM_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`   Fallback Mode: ${!process.env.LLM_API_KEY ? 'Active' : 'Inactive'}`);
  
  if (!process.env.LLM_API_KEY || process.env.LLM_API_KEY === 'your-openai-api-key-here') {
    console.log('\n💡 To enable full AI marking:');
    console.log('   1. Get your OpenAI API key from: https://platform.openai.com/api-keys');
    console.log('   2. Update LLM_API_KEY in your .env file');
    console.log('   3. Restart the backend server');
  }
}

// Run the test
testSimpleMarking().catch(console.error); 