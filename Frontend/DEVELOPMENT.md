# Development Guide - Distill Frontend

## Quick Start

```bash
# Start development
npm run dev

# Build for production  
npm run build

# Preview production build
npm run preview
```

## Project Architecture

### Component Structure
- **App.jsx** - Root component with React Router
- **auth/** - Authentication components (SignIn, SignUp)
- **main/** - Main application components
  - **Header.jsx** - Tab navigation
  - **Sidebar.jsx** - Session management
  - **MainPage.jsx** - Layout with tab routing
  - **tabs/** - Tab content components

### State Management
- **Local State** - useState for component-specific state
- **localStorage** - User authentication and session persistence
- **Props** - Data flow between components
- **URL State** - Tab routing via React Router

### Styling Approach
- **CSS Custom Properties** - Theme variables
- **Utility Classes** - Consistent spacing and layout
- **Component-specific** - Scoped styles per component
- **Responsive Design** - Mobile-first approach

## Development Workflow

### Adding New Features
1. Create component in appropriate directory
2. Add routing if needed in App.jsx
3. Update navigation in Header.jsx
4. Add mock data for development
5. Style with existing CSS utilities

### Backend Integration Points
- **Authentication**: SignIn/SignUp form submissions
- **Chat**: Message sending and receiving
- **Quiz**: Question generation and result tracking
- **Flashcards**: Card creation and progress tracking
- **File Uploads**: PDF and YouTube URL processing

### Testing Scenarios
- ✅ Authentication flow (signup → signin → logout)
- ✅ Chat session management (create, select, switch)
- ✅ Quiz flow (start → questions → results → restart)
- ✅ Flashcard study (start → flip → respond → complete)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Route navigation and URL updates

## Code Conventions

### JavaScript Style
- ES6+ features (arrow functions, destructuring, template literals)
- Functional components with hooks
- Props destructuring in component parameters
- Consistent naming (camelCase for variables, PascalCase for components)

### CSS Conventions
- Use CSS custom properties for theme values
- Utility classes for common patterns
- BEM-like naming for specific components
- Mobile-first responsive design

### File Organization
- Components in `/components` with clear directory structure
- Styles in `App.css` for global, component files for specific
- Assets in `/assets` (currently using Lucide icons)

## Common Development Tasks

### Adding a New Tab
1. Create component in `/tabs/`
2. Add tab definition in `Header.jsx`
3. Add route in `App.jsx`
4. Add case in `MainPage.jsx` renderActiveTab

### Styling Components
```css
/* Use existing utilities */
.btn .btn-primary
.form-input
.loading-spinner

/* Add custom properties for theme */
:root {
  --new-color: #value;
}

/* Component-specific styles */
.component-name {
  /* styles */
}
```

### Mock Data Updates
- **Chat messages**: Update in ChatSection.jsx
- **Quiz questions**: Update in QuizSection.jsx  
- **Flashcards**: Update in FlashcardsSection.jsx
- **Sessions**: Update in MainPage.jsx

## Performance Considerations

### Bundle Size
- Tree-shaking enabled by default
- Lucide React provides icon tree-shaking
- No unnecessary dependencies

### Runtime Performance
- React 19 with latest optimizations
- CSS animations over JavaScript
- Efficient re-renders with proper state management

### Build Optimization
- Vite handles code splitting automatically
- Production builds are optimized and minified
- Static assets are hashed for caching

## Browser Support

- Modern browsers (ES6+ support)
- Chrome 60+, Firefox 60+, Safari 12+, Edge 79+
- Mobile browsers on iOS 12+ and Android 8+

## Deployment Notes

### Static Hosting
The built application is a static SPA suitable for:
- Netlify, Vercel, GitHub Pages
- AWS S3 + CloudFront
- Any static file hosting service

### Build Output
- `dist/index.html` - Main HTML file
- `dist/assets/` - CSS and JS bundles
- All assets are hashed for cache busting

### Environment Configuration
No build-time environment variables currently needed. All configuration is runtime-based through the UI.

---

## Troubleshooting

### Common Issues
- **Build errors**: Check for remaining TypeScript syntax
- **Import errors**: Verify file extensions (.jsx not .tsx)
- **Styling issues**: Check CSS custom property definitions
- **Routing problems**: Verify React Router setup

### Development Tools
- React Developer Tools browser extension
- Vite dev server provides hot reload
- Browser dev tools for debugging and performance

---

**Happy coding! 🚀** 