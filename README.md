# DeciGrade 📝

A teacher-facing mobile and web platform designed to digitize and automate the marking of handwritten student scripts using OCR and AI.

## 🎯 Purpose

DeciGrade improves marking speed, consistency, feedback quality, and data management by:
- 🔍 Fast scanning of multi-page scripts
- 🧠 AI-powered marking using OCR and intelligent scoring
- ✅ Manual review and override capabilities
- 📊 Comprehensive data storage and reporting

## 🏗️ Project Structure

```
DeciGrade/
├── mobile/                 # React Native mobile app ✅
├── backend/                # Node.js/Express API ✅
├── web-dashboard/          # React.js web interface ✅
├── ai-engine/              # OCR and AI marking logic
└── docs/                   # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- React Native CLI
- MongoDB
- Python (for OCR processing)

### Installation

1. **Backend Setup**
```bash
cd backend
npm install
npm run dev
```

2. **Mobile App Setup**
```bash
cd mobile
npm install
npm start
# Press 'i' for iOS simulator or 'a' for Android emulator
# Or scan QR code with Expo Go app on your phone
```

3. **Web Dashboard Setup**
```bash
cd web-dashboard
npm install
npm start
```

## 📱 Features

- **Mobile Scanning**: Multi-page script scanning with camera
- **OCR Processing**: Text extraction from handwritten scripts
- **AI Marking**: Intelligent scoring based on rubrics
- **Manual Review**: Teacher override and approval system
- **Data Management**: Persistent storage and reporting
- **Real-time Sync**: Live updates between mobile and web dashboard
- **Push Notifications**: Instant alerts for script processing status

## 🛠️ Tech Stack

- **Mobile**: React Native (Expo)
- **Backend**: Node.js + Express
- **OCR**: Tesseract.js
- **AI**: Rule-based + LLM integration
- **Web**: React.js
- **Database**: MongoDB
- **Storage**: AWS S3 / Firebase
- **Real-time**: Socket.io WebSocket

## 📋 Development Milestones

- [ ] Day 1: Setup repos, build scanning UI
- [ ] Day 2: Upload script to backend
- [ ] Day 3: Run OCR & return dummy text
- [ ] Day 4: Score answers via keyword AI
- [ ] Day 5: Build teacher dashboard
- [ ] Day 6: Enable manual editing & DB
- [ ] Day 7: Test end-to-end system
- [ ] Day 8: Pilot run with real scripts

## 🤝 Contributing

This project follows a structured development approach. See individual component READMEs for specific setup instructions.

## 📄 License

MIT License - see LICENSE file for details. 