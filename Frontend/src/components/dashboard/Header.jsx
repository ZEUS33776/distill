import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  LogOut, 
  Menu,
  ChevronDown,
  Upload,
  FileText,
  Youtube,
  Sun,
  Moon
} from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import ThemeToggle from '../common/ThemeToggle'
import Avatar from '../common/Avatar'

const Header = () => {
  const location = useLocation()
  const { user, signOut, toggleSidebar, sidebarCollapsed, darkMode, toggleDarkMode } = useApp()
  
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname
    if (path.includes('/chat')) return 'AI Chat Assistant'
    if (path.includes('/quiz')) return 'Smart Quizzes'
    if (path.includes('/flashcards')) return 'Flashcards'

    if (path.includes('/profile')) return 'Profile'
    return 'Dashboard'
  }

  const getPageDescription = () => {
    const path = location.pathname
    if (path.includes('/chat')) return 'Have conversations with AI about your study materials'
    if (path.includes('/quiz')) return 'Test your knowledge with adaptive questions'
    if (path.includes('/flashcards')) return 'Study and memorize key concepts'

    if (path.includes('/profile')) return 'Manage your account and preferences'
    return 'Your AI-powered study companion'
  }



  const handleUploadFile = () => {
    // Implementation for file upload
    console.log('Upload file clicked')
  }

  const handleYouTubeUpload = () => {
    // Implementation for YouTube URL
    console.log('YouTube upload clicked')
  }

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 relative z-20 transition-colors duration-300">
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        {/* Mobile menu button */}
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        {/* Page Title */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{getPageTitle()}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">{getPageDescription()}</p>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        {/* Theme Toggle */}
        <ThemeToggle className="mx-2" />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="User menu"
          >
            <Avatar
              user={user}
              size={32}
              className="w-8 h-8 rounded-full"
            />
            <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300 hidden sm:block" />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50"
              >
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      user={user}
                      size={40}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{user?.username}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button 
                    onClick={() => {
                      toggleDarkMode()
                      setUserMenuOpen(false) // Close the dropdown after toggling
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {darkMode ? (
                      <Sun className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <Moon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    )}
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                    </span>
                  </button>
                </div>

                {/* Sign Out */}
                <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                  <button
                    onClick={signOut}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
                  >
                    <LogOut className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-red-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-red-700 dark:group-hover:text-red-400">Sign out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Click outside to close menus */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setUserMenuOpen(false)
          }}
        />
      )}
    </header>
  )
}

export default Header 