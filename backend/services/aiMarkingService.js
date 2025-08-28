const Script = require('../models/Script');
const RubricTemplate = require('../models/RubricTemplate');
const natural = require('natural');

class AIMarkingService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
  }

  /**
   * Main marking function that processes a script using AI
   */
  async markScript(scriptId) {
    try {
      console.log(`🤖 Starting AI marking for script: ${scriptId}`);
      
      const script = await Script.findById(scriptId);
      if (!script) {
        throw new Error('Script not found');
      }

      // Check if script has OCR text
      const hasOCRText = script.pages.some(page => page.ocrText && page.ocrText.trim() !== '');
      if (!hasOCRText) {
        throw new Error('Script has no OCR text available for marking');
      }

      // Check if script has questions and rubrics
      if (!script.questions || script.questions.length === 0) {
        throw new Error('Script has no questions defined for marking');
      }

      // Update script status to processing
      script.status = 'processing';
      await script.save();

      // Mark each question
      for (const question of script.questions) {
        try {
          console.log(`📝 Marking question ${question.questionNumber}: ${question.questionText}`);
          
          const markingResult = await this.markQuestion(question, script.pages);
          
          // Update question with AI marking results
          question.aiScore = markingResult.score;
          question.aiFeedback = markingResult.feedback;
          question.keywords = markingResult.matchedKeywords;
          question.confidence = markingResult.confidence;
          question.semanticScore = markingResult.semanticScore;
          question.markingDetails = markingResult.details;
          
          console.log(`✅ Question ${question.questionNumber} marked: ${markingResult.score}/${question.maxScore}`);
          
        } catch (questionError) {
          console.error(`❌ Error marking question ${question.questionNumber}:`, questionError);
          question.aiScore = 0;
          question.aiFeedback = 'Error in AI marking';
          question.keywords = [];
          question.confidence = 0;
          question.semanticScore = 0;
        }
      }

      // Calculate final scores
      this.calculateFinalScores(script);
      
      // Update script status
      script.status = 'marked';
      script.markedAt = new Date();
      
      await script.save();
      
      console.log(`🎉 AI marking completed for script: ${scriptId}`);
      
      return {
        success: true,
        scriptId: script._id,
        totalScore: script.totalScore,
        maxPossibleScore: script.maxPossibleScore,
        questionsMarked: script.questions.length
      };
      
    } catch (error) {
      console.error(`❌ AI marking failed for script ${scriptId}:`, error);
      
      // Update script status to indicate failure
      if (script) {
        script.status = 'marking_failed';
        script.error = error.message;
        await script.save();
      }
      
      throw error;
    }
  }

  /**
   * Mark a single question using AI algorithms
   */
  async markQuestion(question, scriptPages) {
    try {
      // Get the rubric template for this question type
      const rubricTemplate = await this.getRubricTemplate(question.questionType, question.subject);
      
      // Combine all OCR text for analysis
      const fullText = scriptPages
        .map(page => page.ocrText)
        .join(' ')
        .toLowerCase();
      
      // Extract student answer (this would need to be implemented based on your question structure)
      const studentAnswer = this.extractStudentAnswer(question, fullText);
      
      // Perform marking based on rubric template
      const markingResult = await this.applyRubric(
        studentAnswer, 
        rubricTemplate, 
        question.maxScore || rubricTemplate.defaultMaxScore
      );
      
      return markingResult;
      
    } catch (error) {
      console.error('Error in markQuestion:', error);
      throw error;
    }
  }

  /**
   * Get appropriate rubric template for question type and subject
   */
  async getRubricTemplate(questionType, subject) {
    try {
      // First try to get specific template for subject and question type
      let template = await RubricTemplate.getTemplates(questionType, subject);
      
      if (template && template.length > 0) {
        return template[0]; // Return the most popular/effective template
      }
      
      // Fallback to general template for question type
      template = await RubricTemplate.getTemplates(questionType, 'general');
      
      if (template && template.length > 0) {
        return template[0];
      }
      
      // If no template found, create a basic default
      return this.createDefaultTemplate(questionType);
      
    } catch (error) {
      console.error('Error getting rubric template:', error);
      return this.createDefaultTemplate(questionType);
    }
  }

  /**
   * Create a default template if none exists
   */
  createDefaultTemplate(questionType) {
    const defaultTemplates = {
      'definition': {
        scoringMethod: 'keyword_matching',
        defaultMaxScore: 5,
        templateStructure: {
          keywords: [
            { word: 'definition', weight: 2, required: true },
            { word: 'explanation', weight: 1.5, required: false }
          ],
          scoringCriteria: [
            { criterion: 'Correct definition', points: 3, description: 'Student provides accurate definition' },
            { criterion: 'Clear explanation', points: 2, description: 'Student explains the concept clearly' }
          ]
        }
      },
      'explanation': {
        scoringMethod: 'semantic_analysis',
        defaultMaxScore: 10,
        templateStructure: {
          keywords: [
            { word: 'process', weight: 2, required: true },
            { word: 'steps', weight: 1.5, required: true }
          ],
          scoringCriteria: [
            { criterion: 'Process overview', points: 3, description: 'Student provides clear process overview' },
            { criterion: 'Key steps', points: 4, description: 'Student identifies and explains key steps' },
            { criterion: 'Logical flow', points: 3, description: 'Student presents information in logical order' }
          ]
        }
      },
      'calculation': {
        scoringMethod: 'numerical_verification',
        defaultMaxScore: 8,
        templateStructure: {
          keywords: [
            { word: 'calculation', weight: 2, required: true },
            { word: 'formula', weight: 1.5, required: true }
          ],
          scoringCriteria: [
            { criterion: 'Correct formula', points: 3, description: 'Student uses correct mathematical formula' },
            { criterion: 'Calculation steps', points: 3, description: 'Student shows clear calculation steps' },
            { criterion: 'Correct answer', points: 2, description: 'Student arrives at correct numerical answer' }
          ]
        }
      }
    };
    
    return defaultTemplates[questionType] || defaultTemplates['definition'];
  }

  /**
   * Apply rubric to student answer and calculate score
   */
  async applyRubric(studentAnswer, rubricTemplate, maxScore) {
    try {
      const result = {
        score: 0,
        feedback: '',
        matchedKeywords: [],
        confidence: 0,
        semanticScore: 0,
        details: {}
      };

      // Apply different scoring methods based on rubric template
      switch (rubricTemplate.scoringMethod) {
        case 'keyword_matching':
          result.score = this.calculateKeywordScore(studentAnswer, rubricTemplate, maxScore);
          result.matchedKeywords = this.findMatchedKeywords(studentAnswer, rubricTemplate);
          break;
          
        case 'semantic_analysis':
          result.score = this.calculateSemanticScore(studentAnswer, rubricTemplate, maxScore);
          result.semanticScore = result.score / maxScore;
          break;
          
        case 'numerical_verification':
          result.score = this.calculateNumericalScore(studentAnswer, rubricTemplate, maxScore);
          break;
          
        case 'content_analysis':
          result.score = this.calculateContentScore(studentAnswer, rubricTemplate, maxScore);
          break;
          
        default:
          result.score = this.calculateKeywordScore(studentAnswer, rubricTemplate, maxScore);
      }

      // Generate feedback based on scoring criteria
      result.feedback = this.generateFeedback(result.score, maxScore, rubricTemplate);
      
      // Calculate confidence based on various factors
      result.confidence = this.calculateConfidence(result, rubricTemplate);
      
      return result;
      
    } catch (error) {
      console.error('Error applying rubric:', error);
      throw error;
    }
  }

  /**
   * Calculate score based on keyword matching
   */
  calculateKeywordScore(studentAnswer, rubricTemplate, maxScore) {
    let totalScore = 0;
    const matchedKeywords = this.findMatchedKeywords(studentAnswer, rubricTemplate);
    
    // Calculate score based on matched keywords and their weights
    for (const keyword of matchedKeywords) {
      totalScore += keyword.weight;
    }
    
    // Apply bonus criteria if available
    if (rubricTemplate.templateStructure.bonusCriteria) {
      for (const bonus of rubricTemplate.templateStructure.bonusCriteria) {
        if (this.checkBonusCriteria(studentAnswer, bonus)) {
          totalScore += bonus.bonusPoints;
        }
      }
    }
    
    // Ensure score doesn't exceed maximum
    return Math.min(totalScore, maxScore);
  }

  /**
   * Find keywords that match in student answer
   */
  findMatchedKeywords(studentAnswer, rubricTemplate) {
    const matchedKeywords = [];
    const answerLower = studentAnswer.toLowerCase();
    
    for (const keyword of rubricTemplate.templateStructure.keywords) {
      // Check main keyword
      if (answerLower.includes(keyword.word.toLowerCase())) {
        matchedKeywords.push({
          word: keyword.word,
          weight: keyword.weight,
          required: keyword.required,
          type: 'exact_match'
        });
        continue;
      }
      
      // Check synonyms
      if (keyword.synonyms) {
        for (const synonym of keyword.synonyms) {
          if (answerLower.includes(synonym.toLowerCase())) {
            matchedKeywords.push({
              word: keyword.word,
              weight: keyword.weight * 0.8, // Slight penalty for synonym
              required: keyword.required,
              type: 'synonym_match'
            });
            break;
          }
        }
      }
      
      // Check for partial matches (for longer words)
      if (keyword.word.length > 5) {
        const wordParts = keyword.word.toLowerCase().split(' ');
        for (const part of wordParts) {
          if (part.length > 3 && answerLower.includes(part)) {
            matchedKeywords.push({
              word: keyword.word,
              weight: keyword.weight * 0.6, // Penalty for partial match
              required: keyword.required,
              type: 'partial_match'
            });
            break;
          }
        }
      }
    }
    
    return matchedKeywords;
  }

  /**
   * Calculate semantic similarity score
   */
  calculateSemanticScore(studentAnswer, rubricTemplate, maxScore) {
    // This is a simplified semantic analysis
    // In a production system, you'd use more sophisticated NLP models
    
    const answerTokens = this.tokenizer.tokenize(studentAnswer.toLowerCase());
    const rubricTokens = this.tokenizer.tokenize(rubricTemplate.description.toLowerCase());
    
    // Calculate Jaccard similarity
    const intersection = answerTokens.filter(token => rubricTokens.includes(token));
    const union = [...new Set([...answerTokens, ...rubricTokens])];
    
    const similarity = intersection.length / union.length;
    
    return Math.round(similarity * maxScore);
  }

  /**
   * Calculate numerical verification score
   */
  calculateNumericalScore(studentAnswer, rubricTemplate, maxScore) {
    // Extract numbers from student answer
    const numbers = studentAnswer.match(/\d+(?:\.\d+)?/g);
    
    if (!numbers || numbers.length === 0) {
      return 0;
    }
    
    // For now, give partial credit for showing work
    // In a production system, you'd implement actual mathematical verification
    return Math.round(maxScore * 0.7); // 70% for showing numerical work
  }

  /**
   * Calculate content analysis score
   */
  calculateContentScore(studentAnswer, rubricTemplate, maxScore) {
    // Analyze content length, structure, and quality
    const words = studentAnswer.split(' ').length;
    const sentences = studentAnswer.split(/[.!?]+/).length;
    
    // Basic scoring based on content length and structure
    let score = 0;
    
    if (words >= 50) score += maxScore * 0.3;
    if (words >= 100) score += maxScore * 0.2;
    if (sentences >= 3) score += maxScore * 0.2;
    if (sentences >= 5) score += maxScore * 0.1;
    
    // Add keyword matching score
    const keywordScore = this.calculateKeywordScore(studentAnswer, rubricTemplate, maxScore * 0.2);
    score += keywordScore;
    
    return Math.min(score, maxScore);
  }

  /**
   * Check if bonus criteria are met
   */
  checkBonusCriteria(studentAnswer, bonus) {
    const answerLower = studentAnswer.toLowerCase();
    return answerLower.includes(bonus.criterion.toLowerCase());
  }

  /**
   * Generate feedback based on score and rubric
   */
  generateFeedback(score, maxScore, rubricTemplate) {
    const percentage = (score / maxScore) * 100;
    
    if (percentage >= 90) {
      return "Excellent answer! You've demonstrated comprehensive understanding of the topic.";
    } else if (percentage >= 80) {
      return "Very good answer! You've covered most key points well.";
    } else if (percentage >= 70) {
      return "Good answer! You've addressed the main points with some room for improvement.";
    } else if (percentage >= 60) {
      return "Fair answer. Consider including more specific details and examples.";
    } else if (percentage >= 50) {
      return "Basic answer. Try to expand on your points and provide more context.";
    } else {
      return "Your answer needs significant improvement. Review the question requirements and provide more comprehensive responses.";
    }
  }

  /**
   * Calculate confidence in the marking
   */
  calculateConfidence(result, rubricTemplate) {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on keyword matches
    if (result.matchedKeywords.length > 0) {
      confidence += 0.2;
    }
    
    // Increase confidence for high scores (clear answers)
    if (result.score > 0) {
      confidence += 0.1;
    }
    
    // Decrease confidence for edge cases
    if (result.score === 0) {
      confidence -= 0.2;
    }
    
    // Ensure confidence is between 0 and 1
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Extract student answer from OCR text
   * This is a simplified version - you'll need to implement based on your question structure
   */
  extractStudentAnswer(question, fullText) {
    // For now, return the full text
    // In a production system, you'd implement logic to extract specific answers
    // based on question boundaries, page numbers, etc.
    return fullText;
  }

  /**
   * Calculate final scores for the script
   */
  calculateFinalScores(script) {
    let totalScore = 0;
    let maxPossibleScore = 0;
    
    for (const question of script.questions) {
      totalScore += question.aiScore || 0;
      maxPossibleScore += question.maxScore || 0;
    }
    
    script.totalScore = totalScore;
    script.maxPossibleScore = maxPossibleScore;
    
    // Calculate percentage
    if (maxPossibleScore > 0) {
      script.percentage = (totalScore / maxPossibleScore) * 100;
    }
  }
}

module.exports = new AIMarkingService();
