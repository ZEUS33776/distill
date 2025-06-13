import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AppProvider, useApp } from './contexts/AppContext'
import { Toaster } from 'react-hot-toast'

// Import components
import LoadingScreen from './components/common/LoadingScreen'
import SignIn from './components/auth/SignIn'
import SignUp from './components/auth/SignUp'
import Dashboard from './components/dashboard/Dashboard'
import ProtectedRoute from './components/common/ProtectedRoute'

// App content component that uses the context
const AppContent = () => {
  const { isAuthenticated, loading, initializing } = useApp()
  
  console.log('🏗️ AppContent: Render cycle', { isAuthenticated, loading, initializing });
  
  // Show loading screen during app initialization or when loading
  if (initializing) {
    console.log('⏳ AppContent: Showing initialization screen');
    return <LoadingScreen message="Initializing..." />
  }
  
  if (loading) {
    console.log('⏳ AppContent: Showing loading screen');
    return <LoadingScreen />
  }
  
  console.log('✅ AppContent: Rendering router', { isAuthenticated });

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public routes */}
            <Route 
              path="/signin" 
              element={
                !isAuthenticated ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="min-h-screen"
                  >
                    <SignIn />
                  </motion.div>
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              } 
            />
            
            <Route 
              path="/signup" 
              element={
                !isAuthenticated ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="min-h-screen"
                  >
                    <SignUp />
                  </motion.div>
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              } 
            />

            {/* Protected routes */}
            <Route 
              path="/dashboard/*" 
              element={
                <ProtectedRoute>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="min-h-screen"
                  >
                    <Dashboard />
                  </motion.div>
                </ProtectedRoute>
              } 
            />

            {/* Legacy route redirects */}
            <Route path="/chat" element={<Navigate to="/dashboard/chat" replace />} />
            <Route path="/quiz" element={<Navigate to="/dashboard/quiz" replace />} />
            <Route path="/flashcards" element={<Navigate to="/dashboard/flashcards" replace />} />

            {/* Root redirect */}
            <Route 
              path="/" 
              element={
                <Navigate 
                  to={isAuthenticated ? "/dashboard" : "/signin"} 
                  replace 
                />
              } 
            />

            {/* 404 fallback */}
            <Route 
              path="*" 
              element={
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800"
                >
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                    <p className="text-gray-600 text-lg mb-6">Page not found</p>
                    <button
                      onClick={() => window.history.back()}
                      className="btn btn-primary"
                    >
                      Go Back
                    </button>
                  </div>
                </motion.div>
              } 
            />
          </Routes>
        </AnimatePresence>
      </div>
    </Router>
  )
}

// Main App component with providers
function App() {
  console.log('🏛️ App: Starting application');

  return (
    <AppProvider>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <AppContent />
    </AppProvider>
  )
}

export default App
