const mongoose = require('mongoose');
const RubricTemplate = require('../models/RubricTemplate');
require('dotenv').config();

// Sample rubric templates for different question types
const rubricTemplates = [
  // Definition Questions
  {
    name: "Basic Definition Template",
    questionType: "definition",
    subject: "general",
    description: "Standard template for defining terms and concepts",
    scoringMethod: "keyword_matching",
    defaultMaxScore: 5,
    templateStructure: {
      keywords: [
        { word: "definition", weight: 2, required: true },
        { word: "explanation", weight: 1.5, required: false },
        { word: "example", weight: 1, required: false }
      ],
      scoringCriteria: [
        { criterion: "Correct definition", points: 3, description: "Student provides accurate definition" },
        { criterion: "Clear explanation", points: 1.5, description: "Student explains the concept clearly" },
        { criterion: "Relevant example", points: 0.5, description: "Student provides a good example" }
      ],
      bonusCriteria: [
        { criterion: "Additional context", bonusPoints: 0.5, description: "Student provides extra relevant information" }
      ]
    },
    instructions: "Define the term clearly and provide a brief explanation with an example if possible.",
    examples: [
      {
        question: "Define photosynthesis",
        sampleAnswer: "Photosynthesis is the process by which plants convert sunlight into energy. It involves using chlorophyll to capture light and convert carbon dioxide and water into glucose and oxygen.",
        expectedScore: 5,
        explanation: "Student correctly defines photosynthesis, explains the process, and mentions key components (chlorophyll, CO2, glucose, oxygen)."
      }
    ]
  },

  // Explanation Questions
  {
    name: "Process Explanation Template",
    questionType: "explanation",
    subject: "science",
    description: "Template for explaining processes and mechanisms",
    scoringMethod: "semantic_analysis",
    defaultMaxScore: 10,
    templateStructure: {
      keywords: [
        { word: "process", weight: 2, required: true },
        { word: "steps", weight: 1.5, required: true },
        { word: "mechanism", weight: 1.5, required: false },
        { word: "result", weight: 1, required: false }
      ],
      scoringCriteria: [
        { criterion: "Process overview", points: 2, description: "Student provides clear process overview" },
        { criterion: "Key steps", points: 4, description: "Student identifies and explains key steps" },
        { criterion: "Logical flow", points: 2, description: "Student presents information in logical order" },
        { criterion: "Conclusion", points: 2, description: "Student explains the outcome or result" }
      ],
      bonusCriteria: [
        { criterion: "Examples", bonusPoints: 1, description: "Student provides relevant examples" },
        { criterion: "Additional details", bonusPoints: 0.5, description: "Student includes extra relevant information" }
      ]
    },
    instructions: "Explain the process step by step, ensuring logical flow and clear understanding of each stage.",
    examples: [
      {
        question: "Explain how a car engine works",
        sampleAnswer: "A car engine works through a four-stroke cycle: intake, compression, power, and exhaust. First, fuel and air are drawn into the cylinder. Then they're compressed by the piston. Next, a spark ignites the mixture, creating power. Finally, exhaust gases are expelled.",
        expectedScore: 9,
        explanation: "Student clearly explains the four-stroke cycle with good detail on each step."
      }
    ]
  },

  // Calculation Questions
  {
    name: "Mathematical Problem Template",
    questionType: "calculation",
    subject: "mathematics",
    description: "Template for mathematical problem solving",
    scoringMethod: "numerical_verification",
    defaultMaxScore: 8,
    templateStructure: {
      keywords: [
        { word: "calculation", weight: 2, required: true },
        { word: "formula", weight: 1.5, required: true },
        { word: "solution", weight: 2, required: true },
        { word: "units", weight: 1, required: false }
      ],
      scoringCriteria: [
        { criterion: "Correct formula", points: 2, description: "Student uses correct mathematical formula" },
        { criterion: "Calculation steps", points: 3, description: "Student shows clear calculation steps" },
        { criterion: "Correct answer", points: 2, description: "Student arrives at correct numerical answer" },
        { criterion: "Units", points: 1, description: "Student includes correct units" }
      ],
      bonusCriteria: [
        { criterion: "Work shown", bonusPoints: 0.5, description: "Student shows all work clearly" },
        { criterion: "Verification", bonusPoints: 0.5, description: "Student verifies their answer" }
      ]
    },
    instructions: "Show all your work, use the correct formula, and ensure your answer includes proper units.",
    examples: [
      {
        question: "Calculate the area of a circle with radius 5cm",
        sampleAnswer: "Area = πr² = π × 5² = π × 25 = 78.54 cm²",
        expectedScore: 7,
        explanation: "Student uses correct formula, shows calculation, and includes units."
      }
    ]
  },

  // Essay Questions
  {
    name: "Comprehensive Essay Template",
    questionType: "essay",
    subject: "humanities",
    description: "Template for comprehensive essay responses",
    scoringMethod: "content_analysis",
    defaultMaxScore: 15,
    templateStructure: {
      keywords: [
        { word: "introduction", weight: 2, required: true },
        { word: "body", weight: 3, required: true },
        { word: "conclusion", weight: 2, required: true },
        { word: "evidence", weight: 2, required: true },
        { word: "analysis", weight: 2, required: true }
      ],
      scoringCriteria: [
        { criterion: "Introduction", points: 2, description: "Clear introduction with thesis statement" },
        { criterion: "Body paragraphs", points: 6, description: "Well-developed body with evidence and analysis" },
        { criterion: "Conclusion", points: 2, description: "Strong conclusion that ties ideas together" },
        { criterion: "Evidence", points: 3, description: "Relevant evidence and examples provided" },
        { criterion: "Analysis", points: 2, description: "Critical analysis and interpretation" }
      ],
      bonusCriteria: [
        { criterion: "Original insights", bonusPoints: 1, description: "Student provides original thoughts" },
        { criterion: "Counterarguments", bonusPoints: 0.5, description: "Student addresses opposing views" }
      ]
    },
    instructions: "Write a well-structured essay with clear introduction, body paragraphs with evidence, and a strong conclusion.",
    examples: [
      {
        question: "Discuss the impact of technology on modern education",
        sampleAnswer: "Technology has revolutionized modern education in several ways. The introduction of online learning platforms has made education more accessible...",
        expectedScore: 13,
        explanation: "Student provides good structure with introduction, body paragraphs, and conclusion, though could include more specific examples."
      }
    ]
  }
];

async function seedRubricTemplates() {
  try {
    console.log('🌱 Starting to seed rubric templates...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/decigrade');
    console.log('✅ Connected to MongoDB');
    
    // Clear existing templates (optional - comment out if you want to keep existing ones)
    // await RubricTemplate.deleteMany({});
    // console.log('🗑️  Cleared existing templates');
    
    // Insert templates
    for (const template of rubricTemplates) {
      // Check if template already exists
      const existing = await RubricTemplate.findOne({
        name: template.name,
        questionType: template.questionType,
        subject: template.subject
      });
      
      if (!existing) {
        // Create a dummy user ID for seeding (you can replace this with actual user ID)
        template.createdBy = new mongoose.Types.ObjectId();
        
        const newTemplate = new RubricTemplate(template);
        await newTemplate.save();
        console.log(`✅ Created template: ${template.name} (${template.questionType})`);
      } else {
        console.log(`⏭️  Template already exists: ${template.name}`);
      }
    }
    
    console.log('🎉 Rubric template seeding completed!');
    console.log(`📊 Total templates in database: ${await RubricTemplate.countDocuments()}`);
    
    // Show summary of created templates
    const allTemplates = await RubricTemplate.find({});
    console.log('\n📋 Template Summary:');
    allTemplates.forEach(template => {
      console.log(`  - ${template.name}: ${template.questionType} (${template.subject}) - ${template.defaultMaxScore} points`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding rubric templates:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the seeding function
if (require.main === module) {
  seedRubricTemplates();
}

module.exports = { seedRubricTemplates };
