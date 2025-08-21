# DeciGrade Backend API 🚀

The backend API for DeciGrade - an AI-powered script marking system that uses OCR and intelligent scoring to digitize handwritten student scripts.

## 🏗️ Architecture

- **Framework**: Node.js + Express
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens
- **File Upload**: Multer with image processing
- **OCR**: Tesseract.js for text extraction
- **AI Marking**: Keyword-based scoring with content analysis
- **Validation**: Joi schema validation
- **Security**: Helmet, CORS, rate limiting

## 📋 Features

### Core Functionality
- ✅ User authentication and authorization
- ✅ Script upload and management
- ✅ OCR text extraction from images
- ✅ AI-powered answer marking
- ✅ Manual review and override system
- ✅ Comprehensive data storage and retrieval

### API Endpoints
- **Authentication**: Register, login, password reset
- **Scripts**: Upload, list, view, delete
- **Marking**: AI marking, manual review, submission
- **Users**: Profile management, admin functions

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone and navigate to backend**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB** (if running locally)
```bash
# Make sure MongoDB is running on localhost:27017
```

5. **Start the development server**
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env` and configure:

```env
# Required
PORT=5000
MONGODB_URI=mongodb://localhost:27017/decigrade
JWT_SECRET=your-super-secret-jwt-key

# Optional
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### Database Setup

The API will automatically create the necessary collections when it starts. No manual database setup is required.

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/users/register
Register a new user (teacher or admin)

```json
{
  "email": "teacher@school.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "teacher",
  "subjects": ["Mathematics", "Physics"],
  "department": "Science"
}
```

#### POST /api/users/login
Login user

```json
{
  "email": "teacher@school.com",
  "password": "password123"
}
```

### Script Management Endpoints

#### POST /api/scripts/upload
Upload a new script with images

**Form Data:**
- `studentId`: Student identifier
- `subject`: Subject name
- `examTitle`: Exam title
- `markingRubric`: JSON string of marking criteria
- `pages`: Array of image files

#### GET /api/scripts
Get all scripts for the authenticated user

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status
- `subject`: Filter by subject

#### GET /api/scripts/:id
Get specific script details

### Marking Endpoints

#### PUT /api/marking/:scriptId/process
Trigger AI marking for a script

#### PUT /api/marking/:scriptId/questions/:questionNumber
Update manual score and feedback

```json
{
  "manualScore": 8,
  "manualFeedback": "Good answer, but missing key concept"
}
```

#### PUT /api/marking/:scriptId/submit
Submit final marking results

## 🔍 OCR Processing

The system automatically processes uploaded images using Tesseract.js:

1. **Image Preprocessing**: Sharp library enhances image quality
2. **Text Extraction**: OCR extracts text from handwritten content
3. **Confidence Scoring**: Each extraction includes confidence level
4. **Error Handling**: Graceful fallback for failed extractions

## 🤖 AI Marking Engine

The marking system uses multiple strategies:

### Keyword-Based Marking
- Matches expected keywords in student answers
- Calculates score based on keyword presence
- Provides detailed feedback on matches

### Content Analysis
- **Mathematical Questions**: Detects numbers and symbols
- **Essay Questions**: Analyzes length and structure
- **Definition Questions**: Checks for definition indicators
- **General Questions**: Basic content relevance scoring

### Scoring Algorithm
```javascript
score = (matchedKeywords / totalKeywords) * maxScore
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with 12 rounds
- **Rate Limiting**: 100 requests per 15 minutes
- **Input Validation**: Joi schema validation
- **CORS Protection**: Configurable cross-origin requests
- **Helmet Security**: HTTP headers protection

## 📊 Data Models

### Script Schema
```javascript
{
  studentId: String,
  subject: String,
  examTitle: String,
  pages: [{
    pageNumber: Number,
    imageUrl: String,
    ocrText: String,
    processedAt: Date
  }],
  questions: [{
    questionNumber: Number,
    questionText: String,
    maxScore: Number,
    aiScore: Number,
    manualScore: Number,
    finalScore: Number,
    aiFeedback: String,
    manualFeedback: String,
    keywords: [String],
    isManuallyReviewed: Boolean
  }],
  status: String, // uploaded, processing, marked, reviewed, submitted
  totalScore: Number,
  maxPossibleScore: Number
}
```

### User Schema
```javascript
{
  email: String,
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: String, // teacher, admin
  subjects: [String],
  department: String,
  isActive: Boolean
}
```

## 🧪 Testing

Run tests with:
```bash
npm test
```

## 📈 Monitoring

### Health Check
```bash
GET /health
```

### Statistics Endpoints
- `GET /api/scripts/stats/overview` - Script statistics
- `GET /api/marking/stats/overview` - Marking statistics

## 🚀 Deployment

### Production Setup

1. **Environment Variables**
```bash
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
```

2. **Build and Start**
```bash
npm install --production
npm start
```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔧 Development

### Project Structure
```
backend/
├── models/          # Database schemas
├── routes/          # API endpoints
├── middleware/      # Auth, validation, error handling
├── services/        # Business logic (OCR, marking)
├── uploads/         # File storage
└── server.js        # Main application file
```

### Adding New Features

1. **Create Model** (if needed)
2. **Add Routes** in appropriate route file
3. **Implement Services** for business logic
4. **Add Validation** schemas
5. **Update Documentation**

### Code Style
- Use ES6+ features
- Follow Express.js conventions
- Implement proper error handling
- Add JSDoc comments for complex functions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions:
- Check the API documentation
- Review error logs
- Open an issue on GitHub

---

**DeciGrade Backend** - Making script marking faster, more accurate, and more consistent! 📝✨ 