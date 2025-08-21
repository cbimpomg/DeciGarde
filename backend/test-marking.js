const { markQuestionEnhanced } = require('./services/markingService');

async function testMarkingEngine() {
  console.log('🧪 Testing AI Marking Engine...\n');

  // Test questions for different subjects
  const testQuestions = [
    {
      questionText: "Solve the equation: 2x + 5 = 13",
      subject: "mathematics",
      maxScore: 10,
      answerText: "2x + 5 = 13\n2x = 13 - 5\n2x = 8\nx = 4"
    },
    {
      questionText: "Explain the process of photosynthesis",
      subject: "biology",
      maxScore: 15,
      answerText: "Photosynthesis is the process where plants convert sunlight into energy. Chlorophyll captures light energy, which is used to convert carbon dioxide and water into glucose and oxygen. This process occurs in the chloroplasts of plant cells."
    },
    {
      questionText: "Write a short essay on the importance of education",
      subject: "english",
      maxScore: 20,
      answerText: "Education is fundamental to human development and progress. It provides individuals with knowledge, skills, and critical thinking abilities necessary for personal growth and societal advancement. Through education, people can better understand the world around them, make informed decisions, and contribute meaningfully to their communities."
    },
    {
      questionText: "Define the term 'democracy'",
      subject: "history",
      maxScore: 8,
      answerText: "Democracy is a system of government where power comes from the people, typically through voting and representation. It emphasizes equality, freedom, and participation of citizens in decision-making processes."
    }
  ];

  for (let i = 0; i < testQuestions.length; i++) {
    const question = testQuestions[i];
    console.log(`📝 Testing Question ${i + 1}: ${question.questionText}`);
    console.log(`📚 Subject: ${question.subject}`);
    console.log(`📊 Max Score: ${question.maxScore}`);
    console.log(`✍️  Answer: ${question.answerText.substring(0, 100)}...`);
    console.log('');

    try {
      // Create a mock fullText that contains the answer
      const fullText = question.answerText.toLowerCase();
      
      const result = await markQuestionEnhanced(question, fullText);
      
      console.log('✅ Marking Result:');
      console.log(`   Score: ${result.score}/${question.maxScore}`);
      console.log(`   Confidence: ${result.confidence || 0}%`);
      console.log(`   Semantic Score: ${result.semanticScore || 0}`);
      console.log(`   Feedback: ${result.feedback || 'No feedback available'}`);
      console.log(`   Improvements: ${(result.improvements || []).join(', ')}`);
      console.log(`   Matched Keywords: ${(result.matchedKeywords || []).join(', ')}`);
      
    } catch (error) {
      console.error(`❌ Error marking question ${i + 1}:`, error.message);
      
      // Check if it's an OpenAI configuration issue
      if (error.message.includes('OpenAI API not configured')) {
        console.log('💡 To fix this:');
        console.log('   1. Make sure OPENAI_API_KEY is set in your .env file');
        console.log('   2. Restart the backend server');
        console.log('   3. Check that the API key is valid');
      }
    }
    
    console.log('─'.repeat(80));
    console.log('');
  }

  console.log('🎉 AI Marking Engine Test Completed!');
  
  // Additional diagnostic information
  console.log('\n🔍 Diagnostic Information:');
  console.log(`   OpenAI API Key configured: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
  console.log(`   Node Environment: ${process.env.NODE_ENV || 'Not set'}`);
  console.log(`   Current Directory: ${process.cwd()}`);
}

// Run the test
testMarkingEngine().catch(console.error); 