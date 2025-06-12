import { LogOut, MessageSquare, Brain, BookOpen, User, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const Header = ({ activeTab, onTabSwitch, onSignOut, isMobile }) => {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem('userData') || '{}')
  const userName = userData.name || 'User'
  const userEmail = userData.email || 'user@example.com'

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const tabs = [
    {
      id: 'chat',
      label: 'Chat',
      icon: MessageSquare,
      description: 'AI-powered conversations'
    },
    {
      id: 'quiz',
      label: 'Quiz',
      icon: Brain,
      description: 'Test your knowledge'
    },
    {
      id: 'flashcards',
      label: 'Flashcards',
      icon: BookOpen,
      description: 'Study with spaced repetition'
    }
  ]

  const handleSignOut = () => {
    setShowUserMenu(false)
    onSignOut()
  }

  return (
    <header className="px-4 md:px-6 py-3 md:py-4">
      <div className="flex items-center justify-between">
        {/* Navigation Tabs */}
        <div className="flex items-center flex-1">
          <div className={`flex bg-bg-tertiary rounded-xl p-1 border border-border-light ${
            isMobile ? 'overflow-x-auto' : ''
          }`}>
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabSwitch(tab.id)}
                  className={`
                    relative flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200 justify-center flex-shrink-0
                    ${isMobile ? 'min-w-[100px]' : 'min-w-[120px]'}
                    ${isActive
                      ? 'bg-accent-gradient text-white shadow-md shadow-accent-glow/20'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className={isMobile ? 'text-xs' : ''}>{tab.label}</span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-white rounded-full" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* User Menu */}
        <div className="relative ml-4" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2 md:py-2.5 rounded-xl bg-bg-tertiary border border-border-light hover:bg-bg-hover transition-all duration-200 group"
          >
            <div className="w-7 h-7 md:w-8 md:h-8 bg-accent-gradient rounded-full flex items-center justify-center text-white font-semibold text-sm">
              <User className="h-3 w-3 md:h-4 md:w-4" />
            </div>
            {!isMobile && (
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-text-primary">
                  {userName}
                </div>
                <div className="text-xs text-text-muted">
                  {userEmail}
                </div>
              </div>
            )}
            <ChevronDown className={`h-3 w-3 md:h-4 md:w-4 text-text-muted transition-transform duration-200 ${
              showUserMenu ? 'rotate-180' : ''
            }`} />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <div className={`absolute right-0 top-full mt-2 bg-bg-secondary border border-border-light rounded-xl shadow-xl backdrop-blur-lg z-50 scale-in ${
              isMobile ? 'w-56' : 'w-64'
            }`}>
              <div className="p-3 md:p-4 border-b border-border-light">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-accent-gradient rounded-full flex items-center justify-center text-white font-semibold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-text-primary truncate">
                      {userName}
                    </div>
                    <div className="text-xs md:text-sm text-text-muted truncate">
                      {userEmail}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-2">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-bg-tertiary transition-colors text-text-muted hover:text-text-primary group"
                >
                  <LogOut className="h-4 w-4 group-hover:text-danger transition-colors" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header 