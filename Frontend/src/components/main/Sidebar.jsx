import { Plus, MessageSquare, Clock, Hash, Sparkles, Brain, BookOpen, Trash2 } from 'lucide-react'
import { useState } from 'react'

const Sidebar = ({ sessions, currentSession, onSessionSelect, onSessionCreate, onClearAllSessions, activeTab, isMobile }) => {
  const [isCreating, setIsCreating] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const handleNewSession = async () => {
    setIsCreating(true)
    await new Promise(resolve => setTimeout(resolve, 300)) // Small delay for better UX
    onSessionCreate()
    setIsCreating(false)
  }

  const handleClearAllSessions = () => {
    onClearAllSessions()
    setShowClearConfirm(false)
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 48) return 'Yesterday'
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return date.toLocaleDateString()
  }

  const getSessionIcon = (session) => {
    if (session.messageCount === 0) return Hash
    return MessageSquare
  }

  const getTabIcon = () => {
    switch (activeTab) {
      case 'quiz': return Brain
      case 'flashcards': return BookOpen
      default: return MessageSquare
    }
  }

  const getTabDescription = () => {
    switch (activeTab) {
      case 'chat': return 'AI-powered conversations'
      case 'quiz': return 'Test your knowledge'
      case 'flashcards': return 'Interactive study cards'
      default: return 'AI-powered conversations'
    }
  }

  return (
    <div className="h-full flex flex-col bg-bg-secondary w-full border-r border-border-light">
      {/* Header */}
      <div className={`border-b border-border-light bg-bg-glass backdrop-blur-sm ${isMobile ? 'p-4 pt-16' : 'p-6'}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-accent-gradient rounded-2xl flex items-center justify-center shadow-glow">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
              Distill
            </h1>
            <p className="text-xs text-muted uppercase tracking-wider font-medium">
              Study Sessions
            </p>
          </div>
        </div>
        
        <button
          onClick={handleNewSession}
          disabled={isCreating}
          className="btn btn-primary w-full py-4 font-semibold text-base shadow-lg hover:shadow-xl"
        >
          {isCreating ? (
            <div className="flex items-center justify-center gap-2">
              <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
              <span>Creating...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Plus className="h-5 w-5" />
              <span>New Chat</span>
            </div>
          )}
        </button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border-light scrollbar-track-transparent">
        <div className="p-4">
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-bg-tertiary rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-10 w-10 text-muted" />
                </div>
                <h3 className={`font-semibold mb-3 text-primary ${isMobile ? 'text-lg' : 'text-xl'}`}>
                  No sessions yet
                </h3>
                <p className={`text-muted mb-6 leading-relaxed ${isMobile ? 'text-sm' : 'text-base'}`}>
                  Start a new conversation to begin learning with AI assistance
                </p>
                <button
                  onClick={handleNewSession}
                  className="btn btn-secondary px-6 py-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start First Chat
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-secondary uppercase tracking-wider">
                    Recent Sessions
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted bg-bg-tertiary px-2 py-1 rounded-full">
                      {sessions.length}
                    </span>
                    {sessions.length > 0 && (
                      <button
                        onClick={() => setShowClearConfirm(true)}
                        className="text-xs text-muted hover:text-danger transition-colors p-1 rounded hover:bg-danger/10"
                        title="Clear all sessions"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Clear All Confirmation */}
                {showClearConfirm && (
                  <div className="bg-danger/10 border border-danger/20 rounded-xl p-4 mb-4">
                    <p className="text-sm font-medium text-danger mb-3">
                      Clear all {sessions.length} session{sessions.length !== 1 ? 's' : ''}?
                    </p>
                    <p className="text-xs text-muted mb-3">
                      This action cannot be undone. All chat history will be permanently deleted.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleClearAllSessions}
                        className="flex-1 bg-danger text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-danger/90 transition-colors"
                      >
                        Clear All
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="flex-1 bg-bg-tertiary text-primary py-2 px-3 rounded-lg text-sm font-medium hover:bg-bg-hover transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
                {sessions.map((session) => {
                  const isActive = currentSession?.id === session.id
                  const SessionIcon = getSessionIcon(session)
                  
                  return (
                    <button
                      key={session.id}
                      onClick={() => onSessionSelect(session)}
                      className={`
                        w-full rounded-xl text-left transition-all duration-200 group relative
                        ${isMobile ? 'p-3' : 'p-4'}
                        ${isActive 
                          ? 'bg-accent-gradient text-white shadow-lg transform scale-[1.02]' 
                          : 'bg-bg-tertiary hover:bg-bg-hover border border-transparent hover:border-border-light'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`
                          rounded-xl flex items-center justify-center flex-shrink-0 mt-1 transition-all duration-200
                          ${isMobile ? 'w-8 h-8' : 'w-10 h-10'}
                          ${isActive 
                            ? 'bg-white/20 shadow-sm' 
                            : 'bg-accent-primary/10 group-hover:bg-accent-primary/20 group-hover:scale-110'
                          }
                        `}>
                          <SessionIcon className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} ${
                            isActive ? 'text-white' : 'text-accent-primary'
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className={`font-semibold truncate ${
                              isMobile ? 'text-sm' : 'text-base'
                            } ${
                              isActive ? 'text-white' : 'text-primary'
                            }`}>
                              {session.title}
                            </h3>
                            {session.messageCount > 0 && (
                              <div className={`
                                px-2 py-1 rounded-full font-medium flex-shrink-0 ml-2
                                ${isMobile ? 'text-xs' : 'text-xs'}
                                ${isActive 
                                  ? 'bg-white/20 text-white' 
                                  : 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20'
                                }
                              `}>
                                {session.messageCount} msg{session.messageCount !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className={`${isMobile ? 'h-3 w-3' : 'h-3.5 w-3.5'} ${
                              isActive ? 'text-white/70' : 'text-muted'
                            }`} />
                            <span className={`${isMobile ? 'text-xs' : 'text-sm'} ${
                              isActive ? 'text-white/80' : 'text-muted'
                            }`}>
                              {formatTimestamp(session.lastActivity)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-white rounded-r-full shadow-sm" />
                      )}
                      
                      {/* Hover effect for non-active items */}
                      {!isActive && (
                        <div className="absolute inset-0 rounded-xl bg-accent-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      )}
                    </button>
                  )
                })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Current Mode Indicator */}
      <div className="flex-shrink-0 p-4 border-t border-border-light bg-bg-glass backdrop-blur-sm">
        <div className="bg-bg-tertiary rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-8 h-8 bg-accent-gradient rounded-lg flex items-center justify-center ${
              isMobile ? 'w-7 h-7' : 'w-8 h-8'
            }`}>
              {(() => {
                const TabIcon = getTabIcon()
                return <TabIcon className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-white`} />
              })()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className={`font-medium text-secondary uppercase tracking-wider ${
                  isMobile ? 'text-xs' : 'text-xs'
                }`}>
                  Active Mode
                </span>
              </div>
              <p className={`font-semibold text-primary ${
                isMobile ? 'text-sm' : 'text-sm'
              }`}>
                {activeTab === 'chat' ? 'AI Chat' : 
                 activeTab === 'quiz' ? 'Knowledge Quiz' : 
                 'Study Flashcards'}
              </p>
              <p className={`text-muted ${isMobile ? 'text-xs' : 'text-xs'} mt-1`}>
                {getTabDescription()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar 