const Script = require('../models/Script');
const RubricTemplate = require('../models/RubricTemplate');

class AIMarkingService {
    constructor() {
        // Pre-built rubrics for common subjects and question types
        this.preBuiltRubrics = {
            physics: {
                mechanics: {
                    name: "Physics Mechanics Rubric",
                    questions: [
                        {
                            questionNumber: 1,
                            questionText: "Explain Newton's three laws of motion with examples",
                            questionType: "explanation",
                            maxScore: 15,
                            keywords: ["newton", "laws", "motion", "force", "action", "reaction", "inertia", "acceleration", "mass"],
                            scoringCriteria: [
                                { criterion: "Clear explanation of all three laws", points: 8 },
                                { criterion: "Relevant examples for each law", points: 5 },
                                { criterion: "Correct scientific terminology", points: 2 }
                            ]
                        },
                        {
                            questionNumber: 2,
                            questionText: "Calculate the acceleration of a 2kg object when a force of 10N is applied",
                            questionType: "calculation",
                            maxScore: 10,
                            keywords: ["acceleration", "force", "mass", "newton", "f=ma", "formula", "calculation"],
                            scoringCriteria: [
                                { criterion: "Correct formula application (F=ma)", points: 4 },
                                { criterion: "Correct calculation", points: 4 },
                                { criterion: "Proper units", points: 2 }
                            ]
                        }
                    ]
                },
                electricity: {
                    name: "Physics Electricity Rubric",
                    questions: [
                        {
                            questionNumber: 1,
                            questionText: "Explain Ohm's law and its applications",
                            questionType: "explanation",
                            maxScore: 12,
                            keywords: ["ohm", "law", "voltage", "current", "resistance", "v=ir", "circuit"],
                            scoringCriteria: [
                                { criterion: "Clear explanation of Ohm's law", points: 6 },
                                { criterion: "Practical applications", points: 4 },
                                { criterion: "Mathematical relationship", points: 2 }
                            ]
                        }
                    ]
                }
            },
            mathematics: {
                algebra: {
                    name: "Mathematics Algebra Rubric",
                    questions: [
                        {
                            questionNumber: 1,
                            questionText: "Solve the quadratic equation: x² + 5x + 6 = 0",
                            questionType: "calculation",
                            maxScore: 10,
                            keywords: ["quadratic", "equation", "solve", "factor", "formula", "roots"],
                            scoringCriteria: [
                                { criterion: "Correct method application", points: 4 },
                                { criterion: "Accurate calculation", points: 4 },
                                { criterion: "Proper solution format", points: 2 }
                            ]
                        }
                    ]
                },
                calculus: {
                    name: "Mathematics Calculus Rubric",
                    questions: [
                        {
                            questionNumber: 1,
                            questionText: "Find the derivative of f(x) = x³ + 2x² - 5x + 3",
                            questionType: "calculation",
                            maxScore: 8,
                            keywords: ["derivative", "differentiation", "power rule", "polynomial"],
                            scoringCriteria: [
                                { criterion: "Correct application of power rule", points: 4 },
                                { criterion: "Accurate calculation", points: 3 },
                                { criterion: "Proper notation", points: 1 }
                            ]
                        }
                    ]
                }
            },
            chemistry: {
                general: {
                    name: "Chemistry General Rubric",
                    questions: [
                        {
                            questionNumber: 1,
                            questionText: "Explain the periodic table trends and their significance",
                            questionType: "explanation",
                            maxScore: 12,
                            keywords: ["periodic", "table", "trends", "atomic", "radius", "electronegativity"],
                            scoringCriteria: [
                                { criterion: "Clear explanation of trends", points: 6 },
                                { criterion: "Understanding of significance", points: 4 },
                                { criterion: "Correct terminology", points: 2 }
                            ]
                        }
                    ]
                }
            }
        };
    }

    async markScript(scriptId) {
        try {
            console.log(`🤖 Starting simulated AI marking for script: ${scriptId}`);
            
            const script = await Script.findById(scriptId);
            if (!script) {
                throw new Error('Script not found');
            }

            // Get pre-built rubric based on subject
            const rubric = this.getPreBuiltRubric(script.subject);
            if (!rubric) {
                throw new Error(`No pre-built rubric found for subject: ${script.subject}`);
            }

            // Simulate AI marking for each question
            const markingResults = [];
            let totalScore = 0;
            let totalMaxScore = 0;

            for (const question of rubric.questions) {
                const studentAnswer = this.extractStudentAnswer(script, question.questionNumber);
                const markingResult = this.simulateAIMarking(question, studentAnswer);
                
                markingResults.push({
                    questionNumber: question.questionNumber,
                    questionText: question.questionText,
                    questionType: question.questionType,
                    maxScore: question.maxScore,
                    aiScore: markingResult.score,
                    aiFeedback: markingResult.feedback,
                    keywords: markingResult.matchedKeywords,
                    confidence: markingResult.confidence,
                    semanticScore: markingResult.semanticScore,
                    markingDetails: markingResult.details
                });

                totalScore += markingResult.score;
                totalMaxScore += question.maxScore;
            }

            // Update script with marking results
            await Script.findByIdAndUpdate(scriptId, {
                $set: {
                    'questions': markingResults,
                    'totalScore': totalScore,
                    'maxPossibleScore': totalMaxScore,
                    'status': 'marked',
                    'markedAt': new Date(),
                    'markingMethod': 'simulated_ai'
                }
            });

            console.log(`✅ Simulated AI marking completed for script: ${scriptId}`);
            console.log(`📊 Total Score: ${totalScore}/${totalMaxScore} (${((totalScore/totalMaxScore)*100).toFixed(1)}%)`);

            return {
                success: true,
                scriptId: scriptId,
                totalScore: totalScore,
                maxPossibleScore: totalMaxScore,
                percentage: ((totalScore/totalMaxScore)*100).toFixed(1),
                questions: markingResults
            };

        } catch (error) {
            console.error(`❌ Error in simulated AI marking: ${error.message}`);
            throw error;
        }
    }

    getPreBuiltRubric(subject) {
        // Return appropriate rubric based on subject
        if (this.preBuiltRubrics[subject]) {
            // Return the first available rubric for the subject
            const subjectRubrics = this.preBuiltRubrics[subject];
            const firstKey = Object.keys(subjectRubrics)[0];
            return subjectRubrics[firstKey];
        }
        
        // Default to physics if subject not found
        return this.preBuiltRubrics.physics.mechanics;
    }

    extractStudentAnswer(script, questionNumber) {
        // Extract student answer from OCR text
        const pageText = script.pages?.[0]?.ocrText || '';
        
        // Simple extraction - look for question number and extract following text
        const questionPattern = new RegExp(`${questionNumber}[\\).]\\s*(.*?)(?=\\d+[\\).]|$)`, 'is');
        const match = pageText.match(questionPattern);
        
        return match ? match[1].trim() : pageText;
    }

    simulateAIMarking(question, studentAnswer) {
        // Simulate AI marking with realistic scoring
        const answer = studentAnswer.toLowerCase();
        const keywords = question.keywords.map(k => k.toLowerCase());
        
        // Keyword matching
        const matchedKeywords = keywords.filter(keyword => 
            answer.includes(keyword)
        );
        
        const keywordScore = (matchedKeywords.length / keywords.length) * question.maxScore * 0.6;
        
        // Content length analysis
        const contentScore = Math.min(answer.length / 100, 1) * question.maxScore * 0.2;
        
        // Random variation for realistic scoring (simulate AI uncertainty)
        const variation = (Math.random() - 0.5) * 2; // ±1 point variation
        
        const baseScore = keywordScore + contentScore;
        const finalScore = Math.max(0, Math.min(question.maxScore, Math.round(baseScore + variation)));
        
        // Generate realistic feedback
        const feedback = this.generateFeedback(question, matchedKeywords, finalScore, question.maxScore);
        
        // Calculate confidence based on keyword matches
        const confidence = Math.min(0.95, (matchedKeywords.length / keywords.length) * 0.8 + 0.15);
        
        return {
            score: finalScore,
            feedback: feedback,
            matchedKeywords: matchedKeywords,
            confidence: confidence,
            semanticScore: keywordScore / question.maxScore,
            details: {
                keywordMatches: matchedKeywords.length,
                totalKeywords: keywords.length,
                contentLength: answer.length,
                scoringBreakdown: {
                    keywordScore: keywordScore,
                    contentScore: contentScore,
                    variation: variation
                }
            }
        };
    }

    generateFeedback(question, matchedKeywords, score, maxScore) {
        const percentage = (score / maxScore) * 100;
        
        if (percentage >= 80) {
            return `Excellent work! You demonstrated strong understanding of ${question.questionText.toLowerCase()}. You covered key concepts well and provided good explanations.`;
        } else if (percentage >= 60) {
            return `Good effort! You showed understanding of the main concepts. Consider providing more detailed explanations and examples to improve your score.`;
        } else if (percentage >= 40) {
            return `Fair attempt. You have some understanding of the topic, but need to provide more comprehensive answers and include key terminology.`;
        } else {
            return `This answer needs improvement. Please review the topic and ensure you include key concepts and proper explanations.`;
        }
    }

    async getRubricTemplate(questionType, subject) {
        // Return pre-built template
        const rubric = this.getPreBuiltRubric(subject);
        return {
            name: rubric.name,
            questionType: questionType,
            subject: subject,
            templateStructure: rubric.questions[0]
        };
    }

    async createDefaultTemplate(questionType, subject) {
        // Return default template
        return this.getRubricTemplate(questionType, subject);
    }
}

module.exports = new AIMarkingService();
