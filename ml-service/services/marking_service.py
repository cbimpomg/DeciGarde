import re
import logging
import time
import os
from typing import Dict, Any, List, Optional
import json
from difflib import SequenceMatcher
import numpy as np

# Try to import optional ML libraries
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

logger = logging.getLogger(__name__)

class MarkingService:
    """
    Advanced AI marking service with multiple algorithms
    """
    
    def __init__(self):
        self.sentence_model = None
        self.openai_client = None
        self.initialize_models()
        
    def initialize_models(self):
        """Initialize available ML models"""
        try:
            # Initialize sentence transformers for semantic similarity
            if SENTENCE_TRANSFORMERS_AVAILABLE:
                self.sentence_model = SentenceTransformer('all-MiniLM-L6-v2')
                logger.info("✅ Sentence Transformers initialized successfully")
            else:
                logger.warning("⚠️  Sentence Transformers not available")
            
            # Initialize OpenAI if available
            if OPENAI_AVAILABLE:
                api_key = os.getenv('OPENAI_API_KEY')
                if api_key and api_key != 'your_actual_openai_api_key_here':
                    self.openai_client = openai.OpenAI(api_key=api_key)
                    logger.info("✅ OpenAI client initialized successfully")
                else:
                    if not api_key:
                        logger.warning("⚠️  OpenAI API key not found in environment variables")
                    else:
                        logger.warning("⚠️  OpenAI API key not properly configured (still using placeholder)")
                    logger.info("ℹ️  LLM evaluation will be disabled. Create a .env file with your OpenAI API key to enable it.")
                    self.openai_client = None
            else:
                logger.warning("⚠️  OpenAI not available")
                
        except Exception as e:
            logger.error(f"Error initializing ML models: {e}")
    
    def mark_answer(self, question: str, answer: str, rubric: dict, max_score: int, subject: str = "general") -> Dict[str, Any]:
        """
        Mark a student answer using multiple AI algorithms
        
        Args:
            question: The question text
            answer: The student's answer text
            rubric: Marking criteria dictionary
            max_score: Maximum possible score
            subject: Subject area for specialized marking
            
        Returns:
            Dictionary with marking results
        """
        try:
            start_time = time.time()
            logger.info(f"Starting AI marking for {subject} question")
            
            # Clean and normalize text
            clean_question = self._normalize_text(question)
            clean_answer = self._normalize_text(answer)
            
            if not clean_answer.strip():
                return {
                    "score": 0,
                    "feedback": "No answer provided",
                    "confidence": 0.0,
                    "matched_keywords": [],
                    "semantic_score": 0.0,
                    "improvements": ["Provide a written answer"],
                    "processing_time": time.time() - start_time
                }
            
            # Apply multiple marking approaches
            results = {}
            
            # 1. Keyword-based marking
            keyword_result = self._mark_by_keywords(clean_answer, rubric, max_score)
            results['keyword'] = keyword_result
            
            # 2. Semantic similarity marking
            semantic_result = self._mark_by_semantic_similarity(clean_question, clean_answer, max_score)
            results['semantic'] = semantic_result
            
            # 3. Content analysis marking
            content_result = self._mark_by_content_analysis(clean_answer, rubric, max_score, subject)
            results['content'] = content_result
            
            # 4. LLM-based marking (if available)
            if self.openai_client:
                try:
                    llm_result = self._mark_by_llm(clean_question, clean_answer, rubric, max_score, subject)
                    results['llm'] = llm_result
                except Exception as e:
                    logger.warning(f"LLM marking failed: {e}")
                    results['llm'] = {"score": 0, "confidence": 0.0, "feedback": "LLM evaluation failed"}
            else:
                results['llm'] = {"score": 0, "confidence": 0.0, "feedback": "LLM not available"}
            
            # Combine results using weighted scoring
            final_result = self._combine_marking_results(results, max_score)
            final_result['processing_time'] = time.time() - start_time
            
            logger.info(f"Marking completed. Final score: {final_result['score']}/{max_score}")
            
            return final_result
            
        except Exception as e:
            logger.error(f"AI marking failed: {e}")
            return {
                "score": 0,
                "feedback": f"Marking error: {str(e)}",
                "confidence": 0.0,
                "matched_keywords": [],
                "semantic_score": 0.0,
                "improvements": ["Contact administrator for assistance"],
                "processing_time": time.time() - start_time
            }
    
    def _mark_by_keywords(self, answer: str, rubric: dict, max_score: int) -> Dict[str, Any]:
        """Mark answer based on keyword matching"""
        try:
            keywords = rubric.get('keywords', [])
            if not keywords:
                return {"score": 0, "confidence": 0.0, "matched_keywords": []}
            
            # Convert to lowercase for matching
            answer_lower = answer.lower()
            keywords_lower = [kw.lower() for kw in keywords]
            
            # Find matched keywords
            matched_keywords = []
            for keyword in keywords_lower:
                if keyword in answer_lower:
                    matched_keywords.append(keyword)
            
            # Calculate score based on keyword coverage
            keyword_coverage = len(matched_keywords) / len(keywords_lower)
            score = int(keyword_coverage * max_score)
            
            # Calculate confidence based on keyword density
            total_words = len(answer.split())
            keyword_density = len(matched_keywords) / max(total_words, 1)
            confidence = min(keyword_density * 2, 1.0)  # Normalize to 0-1
            
            return {
                "score": score,
                "confidence": confidence,
                "matched_keywords": matched_keywords,
                "coverage": keyword_coverage
            }
            
        except Exception as e:
            logger.error(f"Keyword marking failed: {e}")
            return {"score": 0, "confidence": 0.0, "matched_keywords": []}
    
    def _mark_by_semantic_similarity(self, question: str, answer: str, max_score: int) -> Dict[str, Any]:
        """Mark answer based on semantic similarity to question"""
        try:
            if not self.sentence_model:
                # Fallback to simple text similarity
                similarity = self._calculate_text_similarity(question, answer)
                score = int(similarity * max_score)
                return {
                    "score": score,
                    "confidence": similarity,
                    "similarity": similarity
                }
            
            # Use sentence transformers for semantic similarity
            question_embedding = self.sentence_model.encode(question)
            answer_embedding = self.sentence_model.encode(answer)
            
            # Calculate cosine similarity
            similarity = self._cosine_similarity(question_embedding, answer_embedding)
            
            # Calculate score
            score = int(similarity * max_score)
            
            return {
                "score": score,
                "confidence": similarity,
                "similarity": similarity
            }
            
        except Exception as e:
            logger.error(f"Semantic similarity marking failed: {e}")
            return {"score": 0, "confidence": 0.0, "similarity": 0.0}
    
    def _mark_by_content_analysis(self, answer: str, rubric: dict, max_score: int, subject: str) -> Dict[str, Any]:
        """Mark answer based on content analysis and subject-specific criteria"""
        try:
            score = 0
            confidence = 0.0
            feedback_points = []
            
            # Analyze answer length
            word_count = len(answer.split())
            char_count = len(answer)
            
            # Subject-specific analysis
            if subject.lower() in ['mathematics', 'math', 'physics', 'chemistry']:
                # Check for mathematical expressions and formulas
                math_patterns = r'(\d+[\+\-\*/]\d+|\d+[=<>]\d+|\d+[xyz]\d*|\b(sin|cos|tan|log|sqrt)\b)'
                math_matches = len(re.findall(math_patterns, answer, re.IGNORECASE))
                
                if math_matches > 0:
                    score += min(math_matches * 2, max_score // 3)
                    feedback_points.append(f"Contains {math_matches} mathematical expressions")
                
                # Check for units
                unit_patterns = r'\b(kg|m|s|N|J|W|V|A|Ω|°C|°F)\b'
                unit_matches = len(re.findall(unit_patterns, answer, re.IGNORECASE))
                
                if unit_matches > 0:
                    score += min(unit_matches, max_score // 6)
                    feedback_points.append(f"Uses appropriate units ({unit_matches} instances)")
            
            elif subject.lower() in ['english', 'literature', 'history', 'geography']:
                # Check for structured writing
                if len(answer.split('.')) > 2:
                    score += max_score // 4
                    feedback_points.append("Well-structured with multiple sentences")
                
                # Check for descriptive language
                descriptive_words = len(re.findall(r'\b(very|extremely|quite|rather|somewhat|clearly|obviously)\b', answer, re.IGNORECASE))
                if descriptive_words > 0:
                    score += min(descriptive_words, max_score // 6)
                    feedback_points.append("Uses descriptive language")
            
            # General content analysis
            if word_count >= 20:
                score += max_score // 6
                feedback_points.append("Sufficient answer length")
            elif word_count < 10:
                score -= max_score // 6
                feedback_points.append("Answer too short")
            
            # Check for key phrases from rubric
            key_phrases = rubric.get('key_phrases', [])
            for phrase in key_phrases:
                if phrase.lower() in answer.lower():
                    score += max_score // len(key_phrases)
                    feedback_points.append(f"Contains key phrase: '{phrase}'")
            
            # Ensure score is within bounds
            score = max(0, min(score, max_score))
            
            # Calculate confidence based on analysis depth
            confidence = min(len(feedback_points) / 5, 1.0)
            
            return {
                "score": score,
                "confidence": confidence,
                "feedback_points": feedback_points,
                "word_count": word_count,
                "char_count": char_count
            }
            
        except Exception as e:
            logger.error(f"Content analysis marking failed: {e}")
            return {"score": 0, "confidence": 0.0, "feedback_points": []}
    
    def _mark_by_llm(self, question: str, answer: str, rubric: dict, max_score: int, subject: str) -> Dict[str, Any]:
        """Mark answer using OpenAI LLM"""
        try:
            if not self.openai_client:
                return {"score": 0, "confidence": 0.0, "feedback": "LLM not available"}
            
            # Create prompt for LLM
            prompt = self._create_llm_prompt(question, answer, rubric, max_score, subject)
            
            # Call OpenAI API
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert teacher marking student answers. Provide fair and constructive feedback."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.3
            )
            
            # Parse LLM response
            llm_feedback = response.choices[0].message.content
            
            # Extract score from feedback (LLM provides reasoning, we calculate score)
            # For now, use a simple approach - can be enhanced
            score = self._extract_score_from_llm_feedback(llm_feedback, max_score)
            
            return {
                "score": score,
                "confidence": 0.8,  # LLM confidence
                "feedback": llm_feedback,
                "raw_response": llm_feedback
            }
            
        except Exception as e:
            logger.error(f"LLM marking failed: {e}")
            return {"score": 0, "confidence": 0.0, "feedback": f"LLM error: {str(e)}"}
    
    def _create_llm_prompt(self, question: str, answer: str, rubric: dict, max_score: int, subject: str) -> str:
        """Create prompt for LLM evaluation"""
        prompt = f"""
        Subject: {subject}
        Question: {question}
        Student Answer: {answer}
        Maximum Score: {max_score}
        
        Marking Criteria:
        {json.dumps(rubric, indent=2)}
        
        Please evaluate this answer and provide:
        1. A score out of {max_score}
        2. Detailed feedback explaining the score
        3. Specific suggestions for improvement
        4. Areas where the student did well
        
        Format your response as:
        Score: [number]/{max_score}
        Feedback: [detailed feedback]
        Improvements: [list of specific improvements]
        Strengths: [what the student did well]
        """
        return prompt
    
    def _extract_score_from_llm_feedback(self, feedback: str, max_score: int) -> int:
        """Extract numerical score from LLM feedback"""
        try:
            # Look for score pattern
            score_match = re.search(r'Score:\s*(\d+)', feedback, re.IGNORECASE)
            if score_match:
                score = int(score_match.group(1))
                return max(0, min(score, max_score))
            
            # Fallback: analyze feedback sentiment
            positive_words = ['excellent', 'good', 'well', 'correct', 'accurate', 'comprehensive']
            negative_words = ['poor', 'incorrect', 'wrong', 'missing', 'incomplete', 'unclear']
            
            feedback_lower = feedback.lower()
            positive_count = sum(1 for word in positive_words if word in feedback_lower)
            negative_count = sum(1 for word in negative_words if word in feedback_lower)
            
            if positive_count > negative_count:
                return int(max_score * 0.7)
            elif negative_count > positive_count:
                return int(max_score * 0.3)
            else:
                return int(max_score * 0.5)
                
        except Exception as e:
            logger.warning(f"Failed to extract score from LLM feedback: {e}")
            return int(max_score * 0.5)
    
    def _combine_marking_results(self, results: dict, max_score: int) -> Dict[str, Any]:
        """Combine results from multiple marking approaches"""
        try:
            # Calculate weighted scores
            weights = {
                'keyword': 0.3,
                'semantic': 0.25,
                'content': 0.25,
                'llm': 0.2
            }
            
            total_score = 0
            total_confidence = 0
            total_weight = 0
            
            for approach, result in results.items():
                if approach in weights and 'score' in result:
                    weight = weights[approach]
                    total_score += result['score'] * weight
                    total_confidence += result.get('confidence', 0) * weight
                    total_weight += weight
            
            # Normalize scores
            if total_weight > 0:
                final_score = int(total_score / total_weight)
                final_confidence = total_confidence / total_weight
            else:
                final_score = 0
                final_confidence = 0
            
            # Generate comprehensive feedback
            feedback = self._generate_comprehensive_feedback(results, final_score, max_score)
            
            # Generate improvement suggestions
            improvements = self._generate_improvement_suggestions(results, final_score, max_score)
            
            return {
                "score": final_score,
                "max_score": max_score,
                "feedback": feedback,
                "confidence": final_confidence,
                "matched_keywords": results.get('keyword', {}).get('matched_keywords', []),
                "semantic_score": results.get('semantic', {}).get('similarity', 0.0),
                "improvements": improvements,
                "approach_scores": {
                    approach: result.get('score', 0) 
                    for approach, result in results.items() 
                    if 'score' in result
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to combine marking results: {e}")
            return {
                "score": 0,
                "max_score": max_score,
                "feedback": "Error in marking evaluation",
                "confidence": 0.0,
                "matched_keywords": [],
                "semantic_score": 0.0,
                "improvements": ["Contact administrator for assistance"]
            }
    
    def _generate_comprehensive_feedback(self, results: dict, final_score: int, max_score: int) -> str:
        """Generate comprehensive feedback from all marking approaches"""
        feedback_parts = []
        
        # Add keyword feedback
        if 'keyword' in results:
            keyword_result = results['keyword']
            if keyword_result.get('matched_keywords'):
                feedback_parts.append(f"Good coverage of key concepts: {', '.join(keyword_result['matched_keywords'])}")
            else:
                feedback_parts.append("Consider including more key concepts from the marking criteria")
        
        # Add semantic feedback
        if 'semantic' in results:
            semantic_result = results['semantic']
            similarity = semantic_result.get('similarity', 0)
            if similarity > 0.7:
                feedback_parts.append("Answer shows good understanding of the question")
            elif similarity > 0.4:
                feedback_parts.append("Answer partially addresses the question")
            else:
                feedback_parts.append("Answer may not fully address the question asked")
        
        # Add content feedback
        if 'content' in results:
            content_result = results['content']
            feedback_points = content_result.get('feedback_points', [])
            feedback_parts.extend(feedback_points)
        
        # Add LLM feedback if available
        if 'llm' in results and results['llm'].get('feedback'):
            llm_feedback = results['llm']['feedback']
            # Extract the main feedback part (avoid the structured format)
            if 'Feedback:' in llm_feedback:
                feedback_text = llm_feedback.split('Feedback:')[1].split('\n')[0].strip()
                feedback_parts.append(feedback_text)
        
        # Add overall score feedback
        percentage = (final_score / max_score) * 100
        if percentage >= 80:
            feedback_parts.append("Excellent work! This is a high-quality answer.")
        elif percentage >= 60:
            feedback_parts.append("Good work with room for improvement.")
        elif percentage >= 40:
            feedback_parts.append("Some understanding shown but needs significant improvement.")
        else:
            feedback_parts.append("This answer needs substantial improvement to meet the requirements.")
        
        return " ".join(feedback_parts)
    
    def _generate_improvement_suggestions(self, results: dict, final_score: int, max_score: int) -> List[str]:
        """Generate specific improvement suggestions"""
        suggestions = []
        
        # Keyword-based suggestions
        if 'keyword' in results:
            keyword_result = results['keyword']
            if keyword_result.get('coverage', 0) < 0.5:
                suggestions.append("Include more key terms and concepts from the marking criteria")
        
        # Content-based suggestions
        if 'content' in results:
            content_result = results['content']
            word_count = content_result.get('word_count', 0)
            if word_count < 20:
                suggestions.append("Provide more detailed explanations and examples")
        
        # General suggestions based on score
        percentage = (final_score / max_score) * 100
        if percentage < 60:
            suggestions.append("Review the question requirements carefully")
            suggestions.append("Ensure your answer directly addresses what was asked")
        
        if not suggestions:
            suggestions.append("Continue with current approach - good work!")
        
        return suggestions
    
    def _normalize_text(self, text: str) -> str:
        """Normalize text for consistent processing"""
        if not text:
            return ""
        
        # Remove extra whitespace
        normalized = re.sub(r'\s+', ' ', text.strip())
        
        # Remove special characters that might interfere with analysis
        normalized = re.sub(r'[^\w\s\.\,\!\?\;\:\-\(\)\[\]\{\}]', '', normalized)
        
        return normalized
    
    def _calculate_text_similarity(self, text1: str, text2: str) -> float:
        """Calculate simple text similarity using SequenceMatcher"""
        return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()
    
    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors"""
        try:
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            return dot_product / (norm1 * norm2)
        except Exception as e:
            logger.error(f"Cosine similarity calculation failed: {e}")
            return 0.0
    
    def get_marking_capabilities(self) -> dict:
        """Get information about available marking capabilities"""
        return {
            "available_approaches": {
                "keyword_matching": True,
                "semantic_similarity": SENTENCE_TRANSFORMERS_AVAILABLE,
                "content_analysis": True,
                "llm_evaluation": OPENAI_AVAILABLE and self.openai_client is not None
            },
            "supported_subjects": [
                "mathematics", "physics", "chemistry", "biology",
                "english", "literature", "history", "geography",
                "general"
            ],
            "scoring_range": "0 to max_score (configurable)",
            "confidence_scoring": True,
            "feedback_generation": True,
            "improvement_suggestions": True
        }
