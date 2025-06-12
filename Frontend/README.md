# Distill Frontend

A modern, responsive React application for the Distill AI-powered knowledge base system. Built with JavaScript, React, and Vite.

## 🚀 Features

### Authentication System
- **Sign In/Sign Up** - Complete authentication flow with form validation
- **Session Management** - Persistent authentication using localStorage
- **Auto-redirect** - Smart routing based on authentication status

### Main Application
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Dark Theme** - Modern dark UI with custom CSS variables
- **Navigation** - Tab-based interface with URL routing

### Chat Interface
- **Real-time Chat** - ChatGPT-style conversation interface
- **Session Management** - Create, select, and manage multiple chat sessions
- **File Upload Simulation** - PDF and YouTube URL upload buttons (UI ready for backend integration)
- **Message History** - Persistent conversation history per session
- **Smart Titles** - Auto-generated session titles based on first user message

### Quiz System
- **Interactive Quizzes** - Multiple choice questions with instant feedback
- **Progress Tracking** - Visual progress bars and completion statistics
- **Detailed Results** - Score breakdown with explanations for incorrect answers
- **Landing Page** - Quiz overview with estimated time and question count
- **Restart/Retry** - Options to retake quizzes or generate new ones

### Flashcard Study
- **3D Flip Animations** - Smooth card flip animations using CSS transforms
- **Study Sessions** - Complete study flow with session statistics
- **Response Tracking** - Track correct, incorrect, and skipped responses
- **Difficulty Indicators** - Visual difficulty levels (easy, medium, hard)
- **Accuracy Tracking** - Individual card and session accuracy percentages
- **Session Management** - Landing page, study interface, and results summary

### Sidebar Navigation
- **Collapsible Sidebar** - Space-efficient navigation with expand/collapse
- **Session History** - Visual list of all chat sessions with timestamps
- **Quick Actions** - New chat creation and session selection
- **Visual Indicators** - Active session highlighting and message counts

## 🛠️ Technology Stack

- **React 19** - Latest React with hooks and functional components
- **JavaScript (ES6+)** - Modern JavaScript, converted from TypeScript
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing with URL management
- **Lucide React** - Modern icon library
- **CSS Custom Properties** - Theming and consistent design system

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── SignIn.jsx          # Sign in form with validation
│   │   └── SignUp.jsx          # Sign up form with validation
│   └── main/
│       ├── Header.jsx          # Tab navigation and user menu
│       ├── Sidebar.jsx         # Session management sidebar
│       ├── MainPage.jsx        # Main layout with tab routing
│       └── tabs/
│           ├── ChatSection.jsx      # Chat interface
│           ├── QuizSection.jsx      # Quiz system
│           └── FlashcardsSection.jsx # Flashcard study
├── App.jsx                     # Root component with routing
├── App.css                     # Global styles and theme
├── index.css                   # Base styles
└── main.jsx                    # Application entry point
```

## 🎨 Design System

### Color Variables
- `--bg-primary` - Main background
- `--bg-secondary` - Secondary backgrounds
- `--bg-tertiary` - Tertiary surfaces
- `--text-primary` - Primary text
- `--text-secondary` - Secondary text
- `--accent-primary` - Brand accent color
- `--success/danger/warning` - Status colors

### Component Classes
- `.btn` - Base button styles with variants (primary, secondary, ghost)
- `.form-input` - Styled form inputs with focus states
- `.loading-spinner` - Animated loading indicator
- Utility classes for layout, spacing, and typography

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development Server
The app will be available at `http://localhost:5173` (or next available port)

## 🔧 Configuration

### Environment Setup
No environment variables required for frontend-only operation. All API integration points are marked for future backend connection.

### Routing
- `/signin` - Sign in page
- `/signup` - Sign up page  
- `/chat` - Main chat interface
- `/quiz` - Quiz section
- `/flashcards` - Flashcard study
- `/` - Redirects based on authentication

## 📱 Features in Detail

### Authentication Flow
1. Users can sign up with email validation
2. Sign in accepts any email/password (demo mode)
3. Session persists in localStorage
4. Automatic redirects based on auth status

### Chat System
1. **Session Management**: Create new sessions, switch between existing ones
2. **Message Interface**: Send messages with Enter key support
3. **File Upload**: UI ready for PDF and YouTube integration
4. **Smart Naming**: Sessions auto-title based on first user message

### Quiz Experience
1. **Landing Page**: Overview of quiz details and estimated time
2. **Question Flow**: One question at a time with multiple choice
3. **Instant Feedback**: Show correct answers and explanations
4. **Results Summary**: Detailed breakdown of performance

### Flashcard Study
1. **Study Session**: Complete flow from start to finish
2. **Card Interaction**: Click to flip, respond with correct/incorrect/skip
3. **Visual Feedback**: 3D animations and progress tracking
4. **Session Statistics**: Track accuracy and completion

## 🎯 Mock Data & Simulation

The app includes comprehensive mock data for demonstration:
- **Sample Messages**: AI responses with varied content
- **Quiz Questions**: 5 sample questions across different topics
- **Flashcards**: Educational content with difficulty levels
- **Sessions**: Pre-populated chat sessions with timestamps

## 🔮 Backend Integration Ready

All components are structured for easy backend integration:
- **API Endpoints**: Placeholder functions for all CRUD operations
- **State Management**: Prepared for real-time data updates
- **Error Handling**: Framework for backend error responses
- **Loading States**: UI components for async operations

## 🎨 Customization

### Theming
Update CSS custom properties in `App.css` to customize colors, spacing, and typography.

### Components
All components are modular and can be easily extended or modified for additional features.

### Icons
Using Lucide React for consistent, modern icons throughout the application.

## 📊 Performance

- **Fast Build**: Vite provides sub-second hot reload
- **Optimized Bundle**: Tree-shaking and code splitting
- **Responsive**: Mobile-first design with smooth animations
- **Accessible**: Semantic HTML and keyboard navigation support

## 🚀 Deployment

```bash
# Build for production
npm run build

# The dist/ folder contains the built application
# Deploy dist/ folder to any static hosting service
```

## 💡 Future Enhancements

- Real-time messaging with WebSocket integration
- Drag-and-drop file uploads
- Advanced quiz question types
- Spaced repetition algorithm for flashcards
- Dark/light theme toggle
- Keyboard shortcuts
- Mobile app version

---

**Built with ❤️ for enhanced learning through AI-powered knowledge management.**
