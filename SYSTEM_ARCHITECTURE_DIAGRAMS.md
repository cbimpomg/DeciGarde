# DeciGarde System Architecture Diagrams

## 1. Overall System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DeciGarde System Architecture            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Mobile    │  │    Web      │  │     ML      │          │
│  │    App      │  │ Dashboard   │  │  Service    │          │
│  │(React Native)│  │ (React.js)  │  │ (FastAPI)   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│         │                │                │                  │
│         └────────────────┼────────────────┘                  │
│                          │                                   │
│                ┌─────────────┐                              │
│                │   Backend   │                              │
│                │    API      │                              │
│                │ (Node.js)   │                              │
│                └─────────────┘                              │
│                          │                                   │
│                ┌─────────────┐                              │
│                │   MongoDB   │                              │
│                │  Database   │                              │
│                └─────────────┘                              │
└─────────────────────────────────────────────────────────────┘
```

## 2. Data Flow Architecture

```
Script Upload → Image Preprocessing → OCR Processing → AI Marking → Review → Final Assessment
     │                │                    │              │         │           │
     │                │                    │              │         │           │
     ▼                ▼                    ▼              ▼         ▼           ▼
Mobile App → Backend API → ML Service → Marking Engine → Teacher → Analytics → Student
```

## 3. OCR Processing Pipeline

```
Input Image → Preprocessing → Multi-Engine OCR → Text Combination → Confidence Scoring
     │              │              │                    │                │
     │              │              │                    │                │
     ▼              ▼              ▼                    ▼                ▼
Raw Script → Noise Reduction → Tesseract OCR → Result Fusion → Quality Check
            Contrast Enhancement → PaddleOCR → Best Result → Validation
            Deskewing → EasyOCR → Confidence Score → Final Text
```

## 4. AI Marking Process

```
Extracted Text → Keyword Analysis → Semantic Analysis → LLM Assessment → Score Combination
      │                │                  │                │                │
      │                │                  │                │                │
      ▼                ▼                  ▼                ▼                ▼
Student Answer → Keyword Matching → Context Understanding → Reasoning Analysis → Final Score
                Rule-based Scoring → NLP Processing → GPT Analysis → Hybrid Score
                Weighted Scoring → Sentiment Analysis → Feedback Generation → Teacher Review
```

## 5. User Interface Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Dashboard Layout                     │
├─────────────────────────────────────────────────────────────┤
│ Header: Logo, Navigation, User Profile, Notifications        │
├─────────────────────────────────────────────────────────────┤
│ Sidebar Menu          │ Main Content Area                   │
│ - Dashboard           │ - Script Management                  │
│ - Scripts             │ - Upload Interface                    │
│ - Rubrics             │ - Review Interface                   │
│ - Analytics           │ - Analytics Dashboard                │
│ - Reports             │ - Real-time Updates                  │
│ - Settings            │ - Image Viewer                       │
└─────────────────────────────────────────────────────────────┘
```

## 6. Database Schema

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Users    │    │   Scripts   │    │   Rubrics   │
├─────────────┤    ├─────────────┤    ├─────────────┤
│ _id         │    │ _id         │    │ _id         │
│ email       │    │ studentId   │    │ name        │
│ password    │    │ subject     │    │ subject     │
│ firstName   │    │ examTitle   │    │ questions   │
│ lastName    │    │ pages[]     │    │ criteria    │
│ role        │    │ questions[] │    │ createdAt   │
│ subjects[]  │    │ status      │    │ updatedAt   │
│ createdAt   │    │ totalScore  │    └─────────────┘
└─────────────┘    │ createdAt   │
                   └─────────────┘
```

## 7. API Endpoints Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    RESTful API Design                       │
├─────────────────────────────────────────────────────────────┤
│ Authentication Endpoints:                                   │
│ POST /api/auth/login                                         │
│ POST /api/auth/register                                      │
│ POST /api/auth/logout                                        │
│                                                             │
│ Script Management:                                          │
│ GET    /api/scripts                                          │
│ POST   /api/scripts                                          │
│ GET    /api/scripts/:id                                      │
│ PUT    /api/scripts/:id                                      │
│ DELETE /api/scripts/:id                                      │
│                                                             │
│ OCR Processing:                                             │
│ POST   /api/ocr/process                                      │
│ GET    /api/ocr/status/:id                                   │
│                                                             │
│ Marking Engine:                                             │
│ POST   /api/marking/assess                                  │
│ GET    /api/marking/results/:id                             │
│                                                             │
│ Analytics:                                                  │
│ GET    /api/analytics/performance                           │
│ GET    /api/analytics/reports                               │
└─────────────────────────────────────────────────────────────┘
```

## 8. Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                          │
├─────────────────────────────────────────────────────────────┤
│ Application Layer:                                          │
│ - JWT Authentication                                        │
│ - Role-based Access Control                                 │
│ - Input Validation                                          │
│ - Rate Limiting                                             │
│                                                             │
│ Network Layer:                                              │
│ - HTTPS Encryption                                          │
│ - CORS Configuration                                        │
│ - Firewall Protection                                       │
│                                                             │
│ Data Layer:                                                 │
│ - Data Encryption                                           │
│ - Secure File Storage                                       │
│ - Database Security                                         │
│                                                             │
│ Infrastructure Layer:                                       │
│ - Server Security                                           │
│ - Container Security                                        │
│ - Monitoring & Logging                                      │
└─────────────────────────────────────────────────────────────┘
```

## 9. Performance Optimization

```
┌─────────────────────────────────────────────────────────────┐
│                Performance Optimization Strategy             │
├─────────────────────────────────────────────────────────────┤
│ Frontend Optimization:                                       │
│ - Code Splitting                                            │
│ - Lazy Loading                                              │
│ - Image Compression                                         │
│ - Caching Strategies                                        │
│                                                             │
│ Backend Optimization:                                       │
│ - Database Indexing                                         │
│ - Query Optimization                                        │
│ - Connection Pooling                                        │
│ - Caching Layer                                             │
│                                                             │
│ ML Service Optimization:                                    │
│ - Model Caching                                             │
│ - Batch Processing                                          │
│ - GPU Acceleration                                          │
│ - Async Processing                                          │
└─────────────────────────────────────────────────────────────┘
```

## 10. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Deployment Strategy                       │
├─────────────────────────────────────────────────────────────┤
│ Development Environment:                                    │
│ - Local Development                                         │
│ - Version Control (Git)                                     │
│ - Testing Framework                                         │
│                                                             │
│ Staging Environment:                                        │
│ - Automated Testing                                         │
│ - Performance Testing                                       │
│ - User Acceptance Testing                                   │
│                                                             │
│ Production Environment:                                     │
│ - Load Balancing                                            │
│ - Auto-scaling                                              │
│ - Monitoring & Alerting                                     │
│ - Backup & Recovery                                         │
└─────────────────────────────────────────────────────────────┘
```


