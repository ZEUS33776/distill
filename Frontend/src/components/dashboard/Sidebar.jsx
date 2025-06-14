import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  MessageCircle, 
  BookOpen, 
  Zap, 
  User,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  Edit3,
  MoreHorizontal,
  Pencil
} from 'lucide-react'
import { useApp } from '../../contexts/AppContext'
import { formatRelativeTime, truncateText } from '../../utils'
import SessionNameDialog from './SessionNameDialog'
import EditSessionDialog from './EditSessionDialog'

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const {
    sidebarCollapsed,
    toggleSidebar,
    sessions,
    currentSession,
    createSession,
    setCurrentSession,
    deleteSession,
    user,
    updateSession
  } = useApp()

  const [searchQuery, setSearchQuery] = useState('')
  const [editingSession, setEditingSession] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const navigation = [
    {
      name: 'Chat',
      path: '/dashboard/chat',
      icon: MessageCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'AI conversations'
    },
    {
      name: 'Quiz',
      path: '/dashboard/quiz',
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Test your knowledge'
    },
    {
      name: 'Flashcards',
      path: '/dashboard/flashcards',
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Study and memorize'
    },
  ]

  const bottomNavigation = [
    {
      name: 'Profile',
      path: '/dashboard/profile',
      icon: User,
    },
  ]

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateSession = () => {
    setIsDialogOpen(true)
  }

  const handleSessionCreate = (title) => {
    const newSession = createSession(title)
    setCurrentSession(newSession)
    navigate('/dashboard/chat')
  }

  const handleSessionClick = (session) => {
    setCurrentSession(session)
    if (!location.pathname.includes('/chat')) {
      navigate('/dashboard/chat')
    }
  }

  const handleEditClick = (e, session) => {
    e.stopPropagation() // Prevent session selection when clicking edit
    setEditingSession(session)
    setIsEditDialogOpen(true)
  }

  const handleSessionRename = async (newTitle) => {
    if (editingSession) {
      try {
        await updateSession(editingSession.id, { title: newTitle })
        setEditingSession(null)
      } catch (error) {
        // Error is already handled in the AppContext
        console.error('Failed to rename session:', error)
      }
    }
  }

  const handleDeleteClick = async (e, session) => {
    e.stopPropagation() // Prevent session selection when clicking delete
    
    if (window.confirm(`Are you sure you want to delete "${session.title}"? This action cannot be undone.`)) {
      try {
        await deleteSession(session.id)
      } catch (error) {
        // Error is already handled in the AppContext
        console.error('Failed to delete session:', error)
      }
    }
  }

  const isActive = (path) => location.pathname === path

  return (
    <>
      <motion.div
        initial={false}
        animate={{
          width: sidebarCollapsed ? 80 : 320
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shadow-lg relative z-10 transition-colors duration-300"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center space-x-3"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold gradient-text">Distill</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">AI Study Assistant</p>
                </div>
              </motion.div>
            )}
            
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            
            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                  active
                    ? `${item.bgColor} dark:bg-gray-700 ${item.color} shadow-sm`
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? item.color : 'text-gray-500 dark:text-gray-400'}`} />
                {!sidebarCollapsed && (
                  <div className="flex-1 text-left">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* Chat Sessions */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex-1 flex flex-col min-h-0 px-4"
            >
              {/* Sessions Header */}
              <div className="flex items-center justify-between py-3">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Chat Sessions</h2>
                <button
                  onClick={handleCreateSession}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="New chat"
                  aria-label="Create new chat session"
                >
                  <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto space-y-1">
                <AnimatePresence>
                  {filteredSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        currentSession?.id === session.id
                          ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                      onClick={() => handleSessionClick(session)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1 truncate">
                            {truncateText(session.title, 30)}
                          </h3>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{session.messageCount} messages</span>
                            <span>•</span>
                            <span>{formatRelativeTime(session.lastActivity)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <button
                            onClick={(e) => handleEditClick(e, session)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                            title="Rename session"
                            aria-label={`Rename session: ${session.title}`}
                          >
                            <Pencil className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(e, session)}
                            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200"
                            title="Delete session"
                            aria-label={`Delete session: ${session.title}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {filteredSessions.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <MessageCircle className="w-8 h-8 mx-auto" />
                    </div>
                    <p className="text-sm text-gray-500">
                      {searchQuery ? 'No sessions found' : 'No chat sessions yet'}
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={handleCreateSession}
                        className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Start your first chat
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Navigation */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          {bottomNavigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            
            return (
              <motion.button
                key={item.path}
                onClick={() => navigate(item.path)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {!sidebarCollapsed && (
                  <span className="font-medium">{item.name}</span>
                )}
              </motion.button>
            )
          })}

          {/* User Profile Preview */}
          {!sidebarCollapsed && user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-3 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl"
            >
              <div className="flex items-center space-x-3">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 text-sm truncate">
                    {user.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      <SessionNameDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCreate={handleSessionCreate}
      />

      <EditSessionDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          setEditingSession(null)
        }}
        onSave={handleSessionRename}
        currentTitle={editingSession?.title}
      />
    </>
  )
}

export default Sidebar 