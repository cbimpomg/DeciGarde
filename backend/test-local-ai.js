const { markQuestionEnhanced } = require('./services/localAIMarkingService');

async function testLocalAI() {
  console.log('🧪 Testing Local AI Marking (No API Keys Needed)...\n');

  // Test questions for different subjects
  const testQuestions = [
    {
      questionText: "Solve the equation: 2x + 5 = 13",
      subject: "mathematics",
      maxScore: 10,
      keywords: ["equation", "solve", "x", "algebra"],
      answerText: "2x + 5 = 13\n2x = 13 - 5\n2x = 8\nx = 4"
    },
    {
      questionText: "Explain the process of photosynthesis",
      subject: "biology",
      maxScore: 15,
      keywords: ["photosynthesis", "plants", "sunlight", "energy", "chlorophyll"],
      answerText: "Photosynthesis is the process where plants convert sunlight into energy. Chlorophyll captures light energy, which is used to convert carbon dioxide and water into glucose and oxygen. This process occurs in the chloroplasts of plant cells."
    },
    {
      questionText: "Write a short essay on the importance of education",
      subject: "english",
      maxScore: 20,
      keywords: ["education", "importance", "development", "knowledge"],
      answerText: "Education is fundamental to human development and progress. It provides individuals with knowledge, skills, and critical thinking abilities necessary for personal growth and societal advancement. Through education, people can better understand the world around them, make informed decisions, and contribute meaningfully to their communities."
    },
    {
      questionText: "Define the term 'democracy'",
      subject: "history",
      maxScore: 8,
      keywords: ["democracy", "government", "people", "voting"],
      answerText: "Democracy is a system of government where power comes from the people, typically through voting and representation. It emphasizes equality, freedom, and participation of citizens in decision-making processes."
    }
  ];

  for (let i = 0; i < testQuestions.length; i++) {
    const question = testQuestions[i];
    console.log(`📝 Testing Question ${i + 1}: ${question.questionText}`);
    console.log(`📚 Subject: ${question.subject}`);
    console.log(`📊 Max Score: ${question.maxScore}`);
    console.log(`✍️  Answer: ${question.answerText.substring(0, 100)}...`);
    console.log(`🔑 Keywords: ${question.keywords.join(', ')}`);
    console.log('');

    try {
      const fullText = question.answerText.toLowerCase();
      const result = await markQuestionEnhanced(question, fullText);
      
      console.log('✅ Marking Result:');
      console.log(`   Score: ${result.score}/${question.maxScore}`);
      console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`   Semantic Score: ${result.semanticScore || 0}`);
      console.log(`   Feedback: ${result.feedback || 'No feedback available'}`);
      console.log(`   Matched Keywords: ${(result.matchedKeywords || []).join(', ')}`);
      
    } catch (error) {
      console.error(`❌ Error marking question ${i + 1}:`, error.message);
    }
    
    console.log('─'.repeat(80));
    console.log('');
  }

  console.log('🎉 Local AI Marking Test Completed!');
  console.log('\n💡 Benefits of Local AI:');
  console.log('   ✅ No API keys required');
  console.log('   ✅ Works offline');
  console.log('   ✅ Completely free');
  console.log('   ✅ Privacy-focused');
  console.log('   ✅ No rate limits');
  console.log('   ✅ Instant processing');
}

// Run the test
testLocalAI().catch(console.error); 