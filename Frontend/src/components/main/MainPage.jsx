import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'
import ChatSection from './tabs/ChatSection.jsx'
import QuizSection from './tabs/QuizSection.jsx'
import FlashcardsSection from './tabs/FlashcardsSection.jsx'
import { Menu, X, GripVertical } from 'lucide-react'

const MainPage = ({ onSignOut, initialTab = 'chat' }) => {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  
  // Sidebar resize state
  const [sidebarWidth, setSidebarWidth] = useState(320) // Increased default width
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef(null)
  const resizeHandleRef = useRef(null)
  
  // Determine active tab from URL
  const getActiveTabFromPath = () => {
    const path = location.pathname
    if (path.includes('/quiz')) return 'quiz'
    if (path.includes('/flashcards')) return 'flashcards'
    return 'chat'
  }

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath())
  const [currentSession, setCurrentSession] = useState(null)
  const [sessions, setSessions] = useState([])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) {
        setIsMobileSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Sidebar resize functionality
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return
      
      const newWidth = e.clientX
      const minWidth = 240
      const maxWidth = 600
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.cursor = 'default'
      document.body.style.userSelect = 'auto'
    }

    if (isResizing) {
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const handleResizeStart = (e) => {
    e.preventDefault()
    if (!isMobile) {
      setIsResizing(true)
    }
  }

  // Load saved sessions on component mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('distillSessions')
    const savedSidebarWidth = localStorage.getItem('distillSidebarWidth')
    
    if (savedSidebarWidth) {
      setSidebarWidth(parseInt(savedSidebarWidth))
    }
    
    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions)
      setSessions(parsedSessions)
      
      // Set the first session as current if none selected
      if (parsedSessions.length > 0 && !currentSession) {
        setCurrentSession(parsedSessions[0])
      }
    } else {
      // Create a default session if none exist
      const defaultSession = {
        id: 'default',
        title: 'New Chat',
        messages: [],
        lastActivity: new Date().toISOString(),
        messageCount: 0
      }
      setSessions([defaultSession])
      setCurrentSession(defaultSession)
      localStorage.setItem('distillSessions', JSON.stringify([defaultSession]))
    }
  }, [])

  // Save sidebar width to localStorage
  useEffect(() => {
    localStorage.setItem('distillSidebarWidth', sidebarWidth.toString())
  }, [sidebarWidth])

  // Update active tab when URL changes
  useEffect(() => {
    const newTab = getActiveTabFromPath()
    if (newTab !== activeTab) {
      setActiveTab(newTab)
    }
  }, [location.pathname])

  // Update URL when tab changes
  useEffect(() => {
    const currentPath = location.pathname
    const expectedPath = `/${activeTab}`
    if (currentPath !== expectedPath) {
      navigate(expectedPath, { replace: true })
    }
  }, [activeTab, navigate])

  // Update localStorage when sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('distillSessions', JSON.stringify(sessions))
    }
  }, [sessions])

  const handleTabSwitch = (tab) => {
    setActiveTab(tab)
    // Close mobile sidebar when switching tabs
    if (isMobile) {
      setIsMobileSidebarOpen(false)
    }
  }

  const handleSessionSelect = (session) => {
    setCurrentSession(session)
    // Close mobile sidebar when selecting session
    if (isMobile) {
      setIsMobileSidebarOpen(false)
    }
  }

  const handleSessionCreate = (title = 'New Chat') => {
    const newSession = {
      id: Math.random().toString(36).substr(2, 9),
      title: title,
      messages: [],
      lastActivity: new Date().toISOString(),
      messageCount: 0
    }
    
    const updatedSessions = [newSession, ...sessions]
    setSessions(updatedSessions)
    setCurrentSession(newSession)
    
    // Switch to chat tab when creating new session
    if (activeTab !== 'chat') {
      setActiveTab('chat')
    }
    
    // Close mobile sidebar
    if (isMobile) {
      setIsMobileSidebarOpen(false)
    }
    
    return newSession
  }

  const handleSessionUpdate = (sessionId, updates) => {
    setSessions(prevSessions => 
      prevSessions.map(session => 
        session.id === sessionId 
          ? { ...session, ...updates, lastActivity: new Date().toISOString() }
          : session
      )
    )
    
    // Update current session if it's the one being updated
    if (currentSession?.id === sessionId) {
      setCurrentSession(prev => ({ ...prev, ...updates, lastActivity: new Date().toISOString() }))
    }
  }

  const handleClearAllSessions = () => {
    setSessions([])
    setCurrentSession(null)
    localStorage.removeItem('distillSessions')
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'chat':
        return (
          <ChatSection 
            currentSession={currentSession}
            onSessionUpdate={handleSessionUpdate}
            onSessionCreate={handleSessionCreate}
          />
        )
      case 'quiz':
        return <QuizSection />
      case 'flashcards':
        return <FlashcardsSection />
      default:
        return (
          <ChatSection 
            currentSession={currentSession}
            onSessionUpdate={handleSessionUpdate}
            onSessionCreate={handleSessionCreate}
          />
        )
    }
  }

  return (
    <div className="h-screen w-screen flex bg-primary overflow-hidden relative">
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="fixed top-4 left-4 z-50 btn btn-secondary p-3 md:hidden shadow-lg"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div 
        ref={sidebarRef}
        className={`
          ${isMobile 
            ? `fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 ${
                isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'relative'
          }
          flex-shrink-0 bg-bg-secondary border-r border-border-light
        `}
        style={{ 
          width: isMobile ? '320px' : `${sidebarWidth}px`
        }}
      >
        {/* Mobile Close Button */}
        {isMobile && (
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="absolute top-4 right-4 z-10 btn btn-ghost p-2 hover:bg-bg-hover"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        
        <Sidebar 
          sessions={sessions}
          currentSession={currentSession}
          onSessionSelect={handleSessionSelect}
          onSessionCreate={handleSessionCreate}
          onClearAllSessions={handleClearAllSessions}
          activeTab={activeTab}
          isMobile={isMobile}
        />
        
        {/* Resize Handle - Desktop Only */}
        {!isMobile && (
          <div
            ref={resizeHandleRef}
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-accent-primary/30 transition-colors duration-200 group"
            onMouseDown={handleResizeStart}
          >
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2">
              <div className="bg-border-light group-hover:bg-accent-primary rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <GripVertical className="h-4 w-4 text-text-muted group-hover:text-white" />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 bg-bg-glass border-b border-border-light backdrop-blur-lg">
          <Header 
            activeTab={activeTab}
            onTabSwitch={handleTabSwitch}
            onSignOut={onSignOut}
            isMobile={isMobile}
          />
        </div>
        
        {/* Content Area - This is where the scrolling should happen */}
        <div className="flex-1 min-h-0">
          {renderActiveTab()}
        </div>
      </div>
    </div>
  )
}

export default MainPage 