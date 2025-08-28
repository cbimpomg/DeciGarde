const express = require('express');
const RubricTemplate = require('../models/RubricTemplate');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/rubrics - Get all rubrics for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const rubrics = await RubricTemplate.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json(rubrics);
  } catch (error) {
    console.error('Error fetching rubrics:', error);
    res.status(500).json({ error: 'Failed to fetch rubrics' });
  }
});

// GET /api/rubrics/:id - Get a specific rubric by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const rubric = await RubricTemplate.findById(req.params.id);
    
    if (!rubric) {
      return res.status(404).json({ error: 'Rubric not found' });
    }
    
    // Check if user has access to this rubric
    if (rubric.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(rubric);
  } catch (error) {
    console.error('Error fetching rubric:', error);
    res.status(500).json({ error: 'Failed to fetch rubric' });
  }
});

// POST /api/rubrics - Create a new rubric
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      questionType,
      subject,
      description,
      scoringMethod,
      defaultMaxScore,
      templateStructure,
      instructions,
      questions
    } = req.body;
    
    // Validate required fields
    if (!name || !questionType || !subject || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Create new rubric
    const rubric = new RubricTemplate({
      name,
      questionType,
      subject,
      description,
      scoringMethod: scoringMethod || 'keyword_matching',
      defaultMaxScore: defaultMaxScore || 5,
      templateStructure: templateStructure || {
        keywords: [],
        scoringCriteria: [],
        bonusCriteria: []
      },
      instructions: instructions || '',
      createdBy: req.user._id
    });
    
    await rubric.save();
    
    res.status(201).json(rubric);
  } catch (error) {
    console.error('Error creating rubric:', error);
    res.status(500).json({ error: 'Failed to create rubric' });
  }
});

// PUT /api/rubrics/:id - Update an existing rubric
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const rubric = await RubricTemplate.findById(req.params.id);
    
    if (!rubric) {
      return res.status(404).json({ error: 'Rubric not found' });
    }
    
    // Check if user has access to this rubric
    if (rubric.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const {
      name,
      questionType,
      subject,
      description,
      scoringMethod,
      defaultMaxScore,
      templateStructure,
      instructions
    } = req.body;
    
    // Update fields
    if (name) rubric.name = name;
    if (questionType) rubric.questionType = questionType;
    if (subject) rubric.subject = subject;
    if (description) rubric.description = description;
    if (scoringMethod) rubric.scoringMethod = scoringMethod;
    if (defaultMaxScore) rubric.defaultMaxScore = defaultMaxScore;
    if (templateStructure) rubric.templateStructure = templateStructure;
    if (instructions) rubric.instructions = instructions;
    
    await rubric.save();
    
    res.json(rubric);
  } catch (error) {
    console.error('Error updating rubric:', error);
    res.status(500).json({ error: 'Failed to update rubric' });
  }
});

// DELETE /api/rubrics/:id - Delete a rubric
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const rubric = await RubricTemplate.findById(req.params.id);
    
    if (!rubric) {
      return res.status(404).json({ error: 'Rubric not found' });
    }
    
    // Check if user has access to this rubric
    if (rubric.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await RubricTemplate.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Rubric deleted successfully' });
  } catch (error) {
    console.error('Error deleting rubric:', error);
    res.status(500).json({ error: 'Failed to delete rubric' });
  }
});

// GET /api/rubric-templates - Get all available rubric templates
router.get('/templates/all', authenticateToken, async (req, res) => {
  try {
    const templates = await RubricTemplate.find({ isActive: true })
      .sort({ usageCount: -1, averageEffectiveness: -1 });
    
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// GET /api/rubric-templates/:type/:subject - Get templates by type and subject
router.get('/templates/:type/:subject', authenticateToken, async (req, res) => {
  try {
    const { type, subject } = req.params;
    
    const templates = await RubricTemplate.getTemplates(type, subject);
    
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// GET /api/rubric-templates/popular - Get popular templates
router.get('/templates/popular', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const templates = await RubricTemplate.getPopularTemplates(limit);
    
    res.json(templates);
  } catch (error) {
    console.error('Error fetching popular templates:', error);
    res.status(500).json({ error: 'Failed to fetch popular templates' });
  }
});

// POST /api/ai/rubric-suggestion - Get AI suggestion for rubric keywords
router.post('/ai/suggestion', authenticateToken, async (req, res) => {
  try {
    const { questionText, questionType } = req.body;
    
    if (!questionText || !questionType) {
      return res.status(400).json({ error: 'Question text and type are required' });
    }
    
    // Simple AI suggestion logic (can be enhanced with more sophisticated NLP)
    let suggestion = '';
    
    switch (questionType) {
      case 'definition':
        suggestion = `Based on the question "${questionText}", here are suggested keywords:\n\n` +
                   `🔑 **Key Terms**: Extract the main concept being defined\n` +
                   `📝 **Required Elements**: Definition, explanation, context\n` +
                   `💡 **Bonus Points**: Examples, applications, related concepts\n\n` +
                   `**Suggested Keywords**:\n` +
                   `- Main concept (weight: 3, required: true)\n` +
                   `- Clear explanation (weight: 2, required: true)\n` +
                   `- Relevant examples (weight: 1, required: false)\n` +
                   `- Additional context (weight: 1, required: false)`;
        break;
        
      case 'explanation':
        suggestion = `For the explanation question "${questionText}", consider these elements:\n\n` +
                   `🔑 **Process Elements**: Steps, sequence, logical flow\n` +
                   `📊 **Content Structure**: Overview, details, conclusion\n` +
                   `🎯 **Scoring Focus**: Clarity, completeness, accuracy\n\n` +
                   `**Suggested Keywords**:\n` +
                   `- Process overview (weight: 2, required: true)\n` +
                   `- Key steps (weight: 3, required: true)\n` +
                   `- Logical flow (weight: 2, required: true)\n` +
                   `- Examples (weight: 1, required: false)\n` +
                   `- Conclusion (weight: 1, required: false)`;
        break;
        
      case 'calculation':
        suggestion = `For the calculation question "${questionText}", focus on:\n\n` +
                   `🔢 **Mathematical Elements**: Formula, steps, solution\n` +
                   `📐 **Work Shown**: Process, calculations, verification\n` +
                   `✅ **Accuracy**: Correct answer, units, precision\n\n` +
                   `**Suggested Keywords**:\n` +
                   `- Correct formula (weight: 3, required: true)\n` +
                   `- Calculation steps (weight: 3, required: true)\n` +
                   `- Correct answer (weight: 2, required: true)\n` +
                   `- Units included (weight: 1, required: false)\n` +
                   `- Work verification (weight: 1, required: false)`;
        break;
        
      case 'essay':
        suggestion = `For the essay question "${questionText}", evaluate:\n\n` +
                   `📝 **Structure**: Introduction, body, conclusion\n` +
                   `💭 **Content**: Evidence, analysis, insights\n` +
                   `🎨 **Quality**: Originality, depth, clarity\n\n` +
                   `**Suggested Keywords**:\n` +
                   `- Clear introduction (weight: 2, required: true)\n` +
                   `- Well-developed body (weight: 4, required: true)\n` +
                   `- Strong conclusion (weight: 2, required: true)\n` +
                   `- Relevant evidence (weight: 3, required: true)\n` +
                   `- Critical analysis (weight: 2, required: true)\n` +
                   `- Original insights (weight: 1, required: false)`;
        break;
        
      default:
        suggestion = `For the ${questionType} question "${questionText}":\n\n` +
                   `🔍 **Analyze the question** to identify key concepts\n` +
                   `📋 **Consider the expected response format**\n` +
                   `🎯 **Focus on essential elements** that demonstrate understanding\n` +
                   `💡 **Include bonus criteria** for exceptional answers`;
    }
    
    res.json({ suggestion });
  } catch (error) {
    console.error('Error generating AI suggestion:', error);
    res.status(500).json({ error: 'Failed to generate AI suggestion' });
  }
});

// POST /api/rubrics/:id/duplicate - Duplicate a rubric
router.post('/:id/duplicate', authenticateToken, async (req, res) => {
  try {
    const originalRubric = await RubricTemplate.findById(req.params.id);
    
    if (!originalRubric) {
      return res.status(404).json({ error: 'Rubric not found' });
    }
    
    // Create duplicate
    const duplicatedRubric = new RubricTemplate({
      ...originalRubric.toObject(),
      _id: undefined,
      name: `${originalRubric.name} (Copy)`,
      createdBy: req.user._id,
      usageCount: 0,
      averageEffectiveness: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await duplicatedRubric.save();
    
    res.status(201).json(duplicatedRubric);
  } catch (error) {
    console.error('Error duplicating rubric:', error);
    res.status(500).json({ error: 'Failed to duplicate rubric' });
  }
});

// POST /api/rubrics/:id/rate - Rate rubric effectiveness
router.post('/:id/rate', authenticateToken, async (req, res) => {
  try {
    const { rating, feedback } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const rubric = await RubricTemplate.findById(req.params.id);
    
    if (!rubric) {
      return res.status(404).json({ error: 'Rubric not found' });
    }
    
    // Update effectiveness rating
    await rubric.updateEffectiveness(rating);
    
    res.json({ message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Error rating rubric:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

module.exports = router;
