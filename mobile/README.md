# DeciGrade Mobile App 📱

A React Native (Expo) mobile application for scanning and uploading student scripts to the DeciGrade AI marking system.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. **Navigate to mobile directory**
```bash
cd mobile
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm start
```

4. **Run on device/simulator**
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## 📱 Features

### 🔐 Authentication
- Secure login with email/password
- JWT token management
- Automatic session persistence
- Role-based access (Teacher/Admin)

### 📷 Script Scanning
- **Camera Integration**: Real-time script capture
- **Image Processing**: Automatic enhancement for better OCR
- **Multi-page Support**: Capture multiple script pages
- **Flash Control**: Adjustable flash for better image quality
- **Camera Switching**: Front/back camera toggle

### 📁 Gallery Upload
- **Image Selection**: Choose from device gallery
- **Multiple Selection**: Select multiple images at once
- **Image Preview**: Thumbnail preview of selected images
- **Batch Upload**: Upload multiple pages simultaneously

### 📊 Dashboard
- **Statistics Overview**: Total scripts, pending reviews, completion rates
- **Quick Actions**: Easy access to scanning and upload features
- **User Profile**: Display teacher information and subjects
- **Recent Activity**: View uploaded scripts and their status

### 🔄 History & Management
- **Script History**: View all uploaded scripts
- **Status Tracking**: Monitor processing and marking status
- **Script Details**: View script metadata and page count

## 🛠️ Technical Stack

- **Framework**: React Native with Expo
- **UI Library**: React Native Paper
- **Navigation**: React Navigation v6
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Image Processing**: Expo Image Manipulator
- **Camera**: Expo Camera
- **Storage**: Expo Secure Store + AsyncStorage
- **Notifications**: React Native Toast Message

## 📁 Project Structure

```
mobile/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx          # Authentication state management
│   ├── screens/
│   │   ├── LoginScreen.tsx          # User login interface
│   │   ├── HomeScreen.tsx           # Main dashboard
│   │   ├── ScanScreen.tsx           # Camera scanning interface
│   │   ├── UploadScreen.tsx         # Gallery upload interface
│   │   ├── ProfileScreen.tsx        # User profile management
│   │   └── HistoryScreen.tsx        # Script history view
│   ├── services/
│   │   └── api.ts                   # API client and endpoints
│   └── theme/
│       └── theme.ts                 # App theme configuration
├── App.tsx                          # Main app component
├── app.json                         # Expo configuration
└── package.json                     # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the mobile directory:

```env
# Backend API URL
BACKEND_URL=http://localhost:5000

# Development settings
DEBUG=true
```

### Backend Connection
The app connects to the DeciGrade backend API. Make sure the backend is running and accessible at the configured URL.

## 📱 App Flow

1. **Login**: Teachers authenticate with email/password
2. **Dashboard**: View statistics and quick actions
3. **Scan Scripts**: Use camera to capture script pages
4. **Upload Scripts**: Select images from gallery
5. **Review History**: Check uploaded scripts and their status
6. **Profile Management**: View and manage account settings

## 🎯 Key Features

### Camera Scanning
- High-quality image capture with automatic processing
- Multi-page script support
- Real-time image enhancement for OCR
- Automatic saving to device gallery

### Image Upload
- Gallery selection with multiple image support
- Automatic image processing and compression
- Progress tracking during upload
- Error handling and retry mechanisms

### User Experience
- Modern Material Design interface
- Intuitive navigation and gestures
- Real-time feedback and notifications
- Offline capability for basic functions

## 🔒 Security Features

- **Secure Storage**: JWT tokens stored in secure storage
- **Input Validation**: Client-side form validation
- **Error Handling**: Comprehensive error management
- **Permission Management**: Camera and gallery permissions

## 📊 API Integration

The mobile app integrates with the DeciGrade backend API:

- **Authentication**: Login/logout with JWT tokens
- **Script Upload**: Multi-part form data upload
- **Script Management**: View and manage uploaded scripts
- **User Management**: Profile and account settings

## 🚀 Deployment

### Development
```bash
npm start
```

### Production Build
```bash
# For iOS
expo build:ios

# For Android
expo build:android
```

### EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for production
eas build --platform all
```

## 🧪 Testing

### Manual Testing
1. Test camera functionality on physical device
2. Verify image upload to backend
3. Check authentication flow
4. Test error handling scenarios

### Automated Testing
```bash
npm test
```

## 📝 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow React Native best practices
- Implement proper error handling
- Add loading states for async operations

### Performance
- Optimize image processing
- Implement proper memory management
- Use lazy loading for large lists
- Minimize bundle size

## 🐛 Troubleshooting

### Common Issues

1. **Camera not working**
   - Check device permissions
   - Ensure camera is not in use by other apps
   - Test on physical device (simulator has limited camera support)

2. **Upload failures**
   - Verify backend is running
   - Check network connectivity
   - Ensure proper image format and size

3. **Authentication issues**
   - Clear app storage and restart
   - Verify backend JWT configuration
   - Check token expiration

### Debug Mode
Enable debug mode in development:
```bash
npm start -- --dev-client
```

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review backend API documentation
3. Check Expo documentation for platform-specific issues

## 🔄 Updates

Keep the app updated with:
```bash
npm update
expo upgrade
```

---

**Note**: This mobile app is part of the DeciGrade system. Make sure the backend API is running and properly configured before testing the mobile app. 