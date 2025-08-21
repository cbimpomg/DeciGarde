# 🤖 AI Marking Engine Configuration Guide

This guide explains how to configure and train the AI marking engine for optimal performance across different subjects and question types.

## 🎯 **Model Options & Recommendations**

### **Option 1: OpenAI GPT-4 (Recommended)**
- **Best for**: High accuracy, no training required
- **Cost**: ~$0.03 per 1K tokens
- **Setup**: Just add API key to `.env`

### **Option 2: OpenAI GPT-3.5-turbo**
- **Best for**: Cost-effective, good accuracy
- **Cost**: ~$0.002 per 1K tokens
- **Setup**: Change model in `markingService.js`

### **Option 3: Fine-tuned Custom Model**
- **Best for**: Subject-specific optimization
- **Cost**: Training + usage costs
- **Setup**: Requires training data and fine-tuning

## 🚀 **Quick Setup (Recommended)**

### **Step 1: Configure OpenAI API**

1. **Get OpenAI API Key**:
   - Visit: https://platform.openai.com/api-keys
   - Create new API key
   - Add to `.env`:
   ```bash
   OPENAI_API_KEY=your-api-key-here
   ```

2. **Test the Setup**:
   ```bash
   cd backend
   node test-marking.js
   ```

### **Step 2: Subject-Specific Configuration**

The system automatically uses different prompts for different subjects:

- **Mathematics**: Focuses on accuracy, steps, notation
- **Physics**: Emphasizes principles, calculations, units
- **Chemistry**: Checks molecular understanding, reactions
- **Biology**: Evaluates concepts, processes, terminology
- **English**: Assesses grammar, vocabulary, structure
- **History**: Reviews facts, analysis, evidence

## 🎓 **Training for Specific Subjects**

### **Mathematics Training**

Create a training dataset with examples:

```javascript
// Example training data for mathematics
const mathExamples = [
  {
    question: "Solve: 2x + 5 = 13",
    answer: "2x + 5 = 13\n2x = 13 - 5\n2x = 8\nx = 4",
    score: 10,
    feedback: "Excellent step-by-step solution with clear algebraic manipulation"
  },
  {
    question: "Find the derivative of f(x) = x² + 3x",
    answer: "f'(x) = 2x + 3",
    score: 8,
    feedback: "Correct derivative, but could show more steps"
  }
];
```

### **Essay Writing Training**

For essay questions, use detailed rubrics:

```javascript
const essayRubric = {
  content: { weight: 0.4, criteria: ["relevance", "depth", "accuracy"] },
  structure: { weight: 0.3, criteria: ["organization", "flow", "coherence"] },
  language: { weight: 0.2, criteria: ["grammar", "vocabulary", "clarity"] },
  evidence: { weight: 0.1, criteria: ["examples", "citations", "support"] }
};
```

## 🔧 **Advanced Configuration**

### **Custom Subject Prompts**

Add new subjects to `markingService.js`:

```javascript
const subjectPrompts = {
  // ... existing subjects ...
  
  computer_science: `You are an expert computer science teacher. Mark this answer based on:
    - Algorithmic thinking and logic
    - Code correctness and efficiency
    - Problem-solving approach
    - Technical terminology and concepts`,
    
  economics: `You are an expert economics teacher. Mark this answer based on:
    - Economic concepts and theories
    - Data analysis and interpretation
    - Critical thinking and reasoning
    - Real-world applications`,
    
  psychology: `You are an expert psychology teacher. Mark this answer based on:
    - Understanding of psychological concepts
    - Research methodology knowledge
    - Critical analysis of theories
    - Application of psychological principles`
};
```

### **Question Type Detection**

The system automatically detects question types:

```javascript
const determineQuestionType = (questionText) => {
  const text = questionText.toLowerCase();
  
  if (text.includes('calculate') || text.includes('solve') || text.includes('=')) {
    return 'mathematical';
  }
  if (text.includes('explain') || text.includes('describe') || text.includes('discuss')) {
    return 'explanatory';
  }
  if (text.includes('compare') || text.includes('contrast')) {
    return 'comparative';
  }
  if (text.includes('define') || text.includes('what is')) {
    return 'definition';
  }
  if (text.includes('essay') || text.length > 100) {
    return 'essay';
  }
  
  return 'general';
};
```

## 📊 **Performance Optimization**

### **Confidence Thresholds**

Set minimum confidence levels for different question types:

```javascript
const confidenceThresholds = {
  mathematical: 0.8,    // High confidence for math
  definition: 0.7,      // Medium confidence for definitions
  essay: 0.6,           // Lower confidence for essays
  general: 0.7          // Default threshold
};
```

### **Scoring Weights**

Configure how different analysis methods contribute to final score:

```javascript
const scoringWeights = {
  keyword: 0.2,         // 20% weight for keyword matching
  semantic: 0.3,        // 30% weight for semantic similarity
  llm: 0.5              // 50% weight for LLM analysis
};
```

## 🧪 **Testing & Validation**

### **Create Test Scripts**

```javascript
// test-marking.js
const { markScript } = require('./services/markingService');

async function testMarking() {
  const testScriptId = 'your-test-script-id';
  
  try {
    const result = await markScript(testScriptId);
    console.log('Marking result:', result);
  } catch (error) {
    console.error('Marking test failed:', error);
  }
}

testMarking();
```

### **Validation Metrics**

Track these metrics for quality assurance:

- **Inter-rater reliability**: Compare AI vs human marking
- **Consistency**: Same answer should get similar scores
- **Accuracy**: Check against known correct answers
- **Feedback quality**: Assess usefulness of feedback

## 💰 **Cost Optimization**

### **Model Selection**

| Model | Cost per 1K tokens | Best Use Case |
|-------|-------------------|---------------|
| GPT-4 | $0.03 | High-stakes exams, complex questions |
| GPT-3.5-turbo | $0.002 | Regular assignments, cost-sensitive |
| Fine-tuned | Variable | Subject-specific optimization |

### **Token Usage Optimization**

1. **Truncate long answers** to essential content
2. **Use concise prompts** without unnecessary detail
3. **Batch similar questions** to reduce API calls
4. **Cache common responses** for repeated patterns

## 🔒 **Security & Privacy**

### **Data Handling**

- **Never send personal data** to external APIs
- **Anonymize student information** before processing
- **Use local processing** for sensitive content
- **Implement data retention policies**

### **API Security**

- **Rotate API keys** regularly
- **Monitor usage** for unusual patterns
- **Set rate limits** to prevent abuse
- **Use environment variables** for secrets

## 📈 **Monitoring & Analytics**

### **Track Key Metrics**

```javascript
const markingMetrics = {
  averageScore: 0,
  confidenceLevel: 0,
  processingTime: 0,
  errorRate: 0,
  costPerScript: 0
};
```

### **Quality Assurance**

1. **Regular human review** of AI-marked scripts
2. **Feedback collection** from teachers
3. **Continuous improvement** based on data
4. **A/B testing** of different prompts

## 🎯 **Next Steps**

1. **Start with GPT-4** for best accuracy
2. **Test with sample scripts** from your subjects
3. **Adjust prompts** based on results
4. **Monitor costs** and optimize as needed
5. **Collect feedback** from teachers and students

## 📞 **Support**

- **OpenAI Documentation**: https://platform.openai.com/docs
- **API Reference**: https://platform.openai.com/docs/api-reference
- **Pricing**: https://openai.com/pricing

---

**Remember**: The system automatically falls back to rule-based marking if AI services are unavailable or fail. 