import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Bell, 
  LogOut, 
  Menu,
  ChevronDown,
  Upload,
  FileText,
  Youtube,
  Sun,
  Moon,
  Settings as SettingsIcon
} from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import ThemeToggle from '../common/ThemeToggle'
import Avatar from '../common/Avatar'

const Header = () => {
  const location = useLocation()
  const { user, signOut, toggleSidebar, sidebarCollapsed } = useApp()
  
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false)

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname
    if (path.includes('/chat')) return 'AI Chat Assistant'
    if (path.includes('/quiz')) return 'Smart Quizzes'
    if (path.includes('/flashcards')) return 'Flashcards'
    if (path.includes('/settings')) return 'Settings'
    if (path.includes('/profile')) return 'Profile'
    return 'Dashboard'
  }

  const getPageDescription = () => {
    const path = location.pathname
    if (path.includes('/chat')) return 'Have conversations with AI about your study materials'
    if (path.includes('/quiz')) return 'Test your knowledge with adaptive questions'
    if (path.includes('/flashcards')) return 'Study and memorize key concepts'
    if (path.includes('/settings')) return 'Customize your learning experience'
    if (path.includes('/profile')) return 'Manage your account and preferences'
    return 'Your AI-powered study companion'
  }

  // Mock notifications
  const notifications = [
    {
      id: 1,
      title: 'Quiz completed',
      message: 'You scored 85% on your Physics quiz',
      time: '2 minutes ago',
      type: 'success'
    },
    {
      id: 2,
      title: 'New flashcards ready',
      message: '10 new cards generated from your recent study session',
      time: '1 hour ago',
      type: 'info'
    },
    {
      id: 3,
      title: 'Study reminder',
      message: 'Time to review your Mathematics flashcards',
      time: '3 hours ago',
      type: 'reminder'
    }
  ]

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
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        {/* Page Title */}
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{getPageTitle()}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">{getPageDescription()}</p>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-xl mx-8 hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search conversations, quizzes, or ask AI..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-2">
        {/* Upload Actions */}
        <div className="hidden sm:flex items-center space-x-2">
          <button
            onClick={handleUploadFile}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden lg:inline">Upload PDF</span>
          </button>
          
          <button
            onClick={handleYouTubeUpload}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Youtube className="w-4 h-4" />
            <span className="hidden lg:inline">YouTube</span>
          </button>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle className="mx-2" />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          <AnimatePresence>
            {notificationMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.1 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50"
              >
                <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                </div>
                
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.type === 'success' ? 'bg-green-500' :
                          notification.type === 'info' ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{notification.title}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                  <button className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                  <button className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <SettingsIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Settings</span>
                  </button>
                  
                  <button className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Sun className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Toggle theme</span>
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
      {(userMenuOpen || notificationMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setUserMenuOpen(false)
            setNotificationMenuOpen(false)
          }}
        />
      )}
    </header>
  )
}

export default Header 