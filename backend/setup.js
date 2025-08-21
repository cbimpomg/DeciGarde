const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('./models/User');
const Script = require('./models/Script');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/decigrade', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create default admin user
const createDefaultAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@decigrade.com' });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      return existingAdmin;
    }
    
    // Create admin user
    const adminUser = new User({
      email: 'admin@decigrade.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      subjects: ['All Subjects'],
      department: 'Administration',
      isActive: true,
      isEmailVerified: true
    });
    
    await adminUser.save();
    console.log('✅ Default admin user created');
    console.log('📧 Email: admin@decigrade.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login!');
    
    return adminUser;
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
};

// Create sample teacher user
const createSampleTeacher = async () => {
  try {
    // Check if teacher already exists
    const existingTeacher = await User.findOne({ email: 'teacher@decigrade.com' });
    
    if (existingTeacher) {
      console.log('ℹ️  Sample teacher already exists');
      return existingTeacher;
    }
    
    // Create teacher user
    const teacherUser = new User({
      email: 'teacher@decigrade.com',
      password: 'teacher123',
      firstName: 'Sample',
      lastName: 'Teacher',
      role: 'teacher',
      subjects: ['Mathematics', 'Physics'],
      department: 'Science',
      isActive: true,
      isEmailVerified: true
    });
    
    await teacherUser.save();
    console.log('✅ Sample teacher user created');
    console.log('📧 Email: teacher@decigrade.com');
    console.log('🔑 Password: teacher123');
    
    return teacherUser;
    
  } catch (error) {
    console.error('❌ Error creating sample teacher:', error);
    throw error;
  }
};

// Create sample marking rubric
const createSampleRubric = () => {
  return {
    questions: [
      {
        questionNumber: 1,
        questionText: "Solve the equation: 2x + 5 = 13",
        maxScore: 5,
        keywords: ["x = 4", "x=4", "4", "solution"]
      },
      {
        questionNumber: 2,
        questionText: "Calculate the area of a circle with radius 7cm",
        maxScore: 10,
        keywords: ["154", "153.94", "πr²", "area", "circle"]
      },
      {
        questionNumber: 3,
        questionText: "Explain the concept of gravity in your own words",
        maxScore: 15,
        keywords: ["force", "attraction", "mass", "earth", "pull"]
      }
    ]
  };
};

// Create sample script (for testing)
const createSampleScript = async (teacherId) => {
  try {
    // Check if sample script already exists
    const existingScript = await Script.findOne({ studentId: 'SAMPLE001' });
    
    if (existingScript) {
      console.log('ℹ️  Sample script already exists');
      return existingScript;
    }
    
    const sampleScript = new Script({
      studentId: 'SAMPLE001',
      subject: 'Mathematics',
      examTitle: 'Sample Mathematics Test',
      pages: [
        {
          pageNumber: 1,
          imageUrl: '/uploads/sample/page1.jpg',
          ocrText: 'Sample OCR text for testing purposes.',
          processedAt: new Date()
        }
      ],
      markingRubric: createSampleRubric(),
      maxPossibleScore: 30,
      uploadedBy: teacherId,
      status: 'uploaded'
    });
    
    await sampleScript.save();
    console.log('✅ Sample script created');
    
    return sampleScript;
    
  } catch (error) {
    console.error('❌ Error creating sample script:', error);
    throw error;
  }
};

// Main setup function
const setup = async () => {
  try {
    console.log('🚀 Starting DeciGrade setup...\n');
    
    // Connect to database
    await connectDB();
    
    // Create default users
    const adminUser = await createDefaultAdmin();
    const teacherUser = await createSampleTeacher();
    
    // Create sample script
    await createSampleScript(teacherUser._id);
    
    console.log('\n✅ Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Access the API at: http://localhost:5000');
    console.log('3. Test the health endpoint: GET /health');
    console.log('4. Login with the created users');
    console.log('\n🔐 Default credentials:');
    console.log('Admin: admin@decigrade.com / admin123');
    console.log('Teacher: teacher@decigrade.com / teacher123');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  setup();
}

module.exports = { setup }; 