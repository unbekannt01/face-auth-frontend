# Face Authentication System - Frontend

A modern, secure face authentication system built with React that enables password-less login using AI-powered facial recognition and QR code verification.

## 🌟 Features

- **AI-Powered Face Recognition** - Real-time face detection using face-api.js
- **QR Code Authentication** - Secure mobile verification workflow
- **Modern UI/UX** - Beautiful gradient design with smooth animations
- **Multi-Device Support** - Seamless desktop-to-mobile authentication flow
- **Real-time Detection** - Live face landmark visualization with green indicators
- **Camera Controls** - Front/back camera switching for mobile devices
- **Session Management** - Secure temporary session handling
- **Socket.io Integration** - Real-time communication between devices

## 🎯 Tech Stack

- **React 19.2.4** - Modern UI framework
- **React Router 7.13.0** - Client-side routing
- **face-api.js 0.22.2** - Face detection and recognition
- **Socket.io Client 4.8.3** - Real-time bidirectional communication
- **QRCode.react 4.2.0** - QR code generation
- **jsQR 1.4.0** - QR code scanning
- **Axios 1.13.4** - HTTP client
- **CRACO 7.1.0** - Custom webpack configuration

## 📋 Prerequisites

- Node.js >= 18.x
- npm or yarn
- Modern web browser with camera access
- Backend server running (see Backend README)

## 🚀 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd face-auth-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_APP_URL=http://localhost:3000
```

For production:
```env
REACT_APP_API_URL=https://your-backend-url.com
REACT_APP_APP_URL=https://your-frontend-url.com
```

4. **Start development server**
```bash
npm start
```

The app will open at `http://localhost:3000`

## 🏗️ Project Structure

```
src/
├── components/
│   ├── AppLoader.js           # App loading screen
│   ├── Dashboard.js           # User dashboard
│   ├── FaceCapture.js         # Face capture component
│   ├── Home.js                # Landing page
│   ├── Login.js               # Login page with QR
│   ├── MobileScanner.js       # QR scanner for mobile
│   ├── MobileVerify.js        # Mobile face verification
│   ├── Register.js            # Registration flow
│   ├── RouteLoader.js         # Route transition loader
│   ├── VerificationSuccess.js # Success page
│   └── loader.css             # Loader animations
├── services/
│   └── api.js                 # API service layer
├── utils/
│   └── faceDetection.js       # Face detection utilities
├── config.js                  # Configuration management
├── App.js                     # Main app component
├── App.css                    # Global styles
└── index.js                   # Entry point
```

## 🔐 Authentication Flow

### Registration Flow
1. User enters email, password, and name on desktop
2. System generates QR code with session ID
3. User scans QR code with mobile camera
4. Mobile captures and verifies face with AI
5. Face descriptor sent to backend
6. Account created and user redirected to login

### Login Flow
1. User enters email and password on desktop
2. System generates QR code with session ID
3. User scans QR code with mobile device
4. Mobile captures face and sends to backend
5. Backend compares face with stored descriptor
6. On match, user is logged in automatically
7. JWT token stored in localStorage

## 🎨 Key Components

### FaceCapture Component
- Real-time face detection with bounding boxes
- 68-point facial landmark detection
- Green visual indicators for detected landmarks
- Face validation (size, position, confidence)
- Descriptor extraction for authentication

### MobileVerify Component
- Camera stream initialization
- Face detection with visual feedback
- Corner bracket UI for face framing
- Front/back camera switching
- Real-time confidence display
- Socket.io communication with desktop

### QR Code System
- Unique session ID generation using UUID
- QRCodeSVG for high-quality codes
- Manual link fallback option
- Session expiration (10 minutes)
- Real-time status updates

## 🛠️ Configuration

### Face Detection Settings
Located in `src/utils/faceDetection.js`:

```javascript
// Detection confidence threshold
minConfidence: 0.5

// Face comparison threshold
threshold: 0.6

// Minimum face size (pixels)
minSize: 80

// Maximum face size (pixels)
maxSize: 500
```

### Camera Settings
```javascript
// Video constraints
video: {
  facingMode: 'user', // or 'environment'
  width: { ideal: 640 },
  height: { ideal: 480 }
}
```

## 📱 Mobile Optimization

- Responsive design for all screen sizes
- Touch-optimized controls
- Camera permission handling
- Auto-redirect after verification
- Mobile-specific QR scanner
- Portrait/landscape support

## 🔒 Security Features

- JWT token-based authentication
- Secure face descriptor transmission
- Session expiration handling
- HTTPS recommended for production
- CORS protection
- Input validation

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

The `vercel.json` configuration is already included.

### Environment Variables on Vercel
Set these in your Vercel project settings:
- `REACT_APP_API_URL` - Your backend URL
- `REACT_APP_APP_URL` - Your frontend URL

## 🐛 Troubleshooting

### Camera Not Working
- Check browser permissions (chrome://settings/content/camera)
- Ensure HTTPS in production (HTTP only works on localhost)
- Try different browsers (Chrome recommended)

### Face Detection Not Working
- Ensure good lighting conditions
- Position face 2-3 feet from camera
- Wait 2-3 seconds for models to load
- Check browser console for errors

### QR Code Not Scanning
- Ensure good lighting on QR code
- Try manual link option
- Check mobile camera permissions
- Verify backend is running

### Socket Connection Issues
- Check CORS configuration
- Verify backend URL in .env
- Ensure Socket.io server is running
- Check browser console for errors

## 📊 Performance

- Initial bundle size: ~2MB (including face-api models)
- Face detection: 20 FPS (50ms interval)
- Model load time: 2-3 seconds
- QR code generation: <100ms

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## 📝 Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## 🤝 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with camera support

## 🙏 Acknowledgments

- [face-api.js](https://github.com/justadudewhohacks/face-api.js) - Face detection library
- [Create React App](https://create-react-app.dev/) - React starter
- [QRCode.react](https://github.com/zpao/qrcode.react) - QR code generation
- [Socket.io](https://socket.io/) - Real-time communication

## 📞 Support

For issues and questions, please open a GitHub issue.

---

**Note**: This is a demo project for educational purposes. For production use, implement additional security measures and conduct thorough security audits.