import { useState, useRef, useEffect } from 'react'
import { Send, Upload, FileText, Plus } from 'lucide-react'

const ChatSection = ({ currentSession, onSessionUpdate, onSessionCreate }) => {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Initialize messages based on current session
  useEffect(() => {
    if (currentSession) {
      setMessages(currentSession.messages || [])
    } else {
      setMessages([])
    }
  }, [currentSession])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      })
    }
  }

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timer)
  }, [messages])

  const updateSession = (newMessages) => {
    if (currentSession && onSessionUpdate) {
      const messageCount = newMessages.filter(m => m.role === 'user').length
      const updatedSession = {
        ...currentSession,
        messages: newMessages,
        messageCount: messageCount,
        title: currentSession.title === 'New Chat' && newMessages.length > 1 
          ? generateSessionTitle(newMessages.find(m => m.role === 'user')?.content || 'Chat Session')
          : currentSession.title,
        lastActivity: new Date().toISOString()
      }
      onSessionUpdate(currentSession.id, updatedSession)
    }
  }

  const generateSessionTitle = (firstUserMessage) => {
    const words = firstUserMessage.split(' ').slice(0, 4).join(' ')
    return words.length > 30 ? words.substring(0, 30) + '...' : words || 'New Chat'
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    let sessionToUpdate = currentSession
    if (!currentSession) {
      sessionToUpdate = onSessionCreate('New Chat')
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputValue('')
    setIsLoading(true)

    updateSession(newMessages)

    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateAIResponse(inputValue.trim()),
        timestamp: new Date().toISOString()
      }
      const finalMessages = [...newMessages, aiMessage]
      setMessages(finalMessages)
      setIsLoading(false)
      
      updateSession(finalMessages)
    }, 1200)
  }

  const generateAIResponse = (userInput) => {
    const responses = [
      `I understand you're asking about "${userInput}". This is where I would provide a detailed response based on your knowledge base and uploaded documents.\n\nIn a fully integrated system, I would:\n• Search through all your uploaded PDFs and documents\n• Analyze video transcripts from YouTube content\n• Cross-reference information across multiple sources\n• Provide citations and specific references\n• Generate follow-up questions to deepen understanding\n\nThis comprehensive approach ensures you get accurate, well-sourced information tailored to your specific learning materials and goals.`,
      `That's an interesting question about "${userInput}"! Based on your study materials, I would provide relevant insights.\n\nHere's how I would approach this:\n\n1. **Content Analysis**: I'd scan through your uploaded documents to find relevant sections\n2. **Contextual Understanding**: I'd consider the broader context of your studies\n3. **Practical Applications**: I'd provide real-world examples and use cases\n4. **Learning Connections**: I'd help you connect this topic to related concepts\n5. **Study Recommendations**: I'd suggest additional materials or practice exercises\n\nThis systematic approach helps ensure comprehensive understanding and retention.`,
      `Great question! Regarding "${userInput}", I would analyze the relevant content from your documents.\n\nMy analysis would include:\n\n**Key Concepts**: Breaking down the fundamental principles\n**Historical Context**: Understanding how these ideas developed\n**Current Applications**: Seeing how they're used today\n**Future Implications**: Considering where this field is heading\n**Practice Opportunities**: Identifying ways to apply this knowledge\n\nI'd also generate custom study materials like flashcards, quiz questions, and summary notes to help reinforce your learning and track your progress over time.`,
      `I see you're interested in "${userInput}". I would cross-reference this topic across your materials.\n\nThis involves:\n\n• **Multi-source Integration**: Combining information from all your study materials\n• **Pattern Recognition**: Identifying common themes and connections\n• **Gap Analysis**: Finding areas that might need additional study\n• **Personalized Learning Path**: Creating a custom study sequence\n• **Progress Tracking**: Monitoring your understanding over time\n\nThe goal is to create a comprehensive understanding that builds on everything you've learned, making connections that might not be immediately obvious but are crucial for mastery.`,
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const handleFileUpload = (type) => {
    if (!currentSession) {
      onSessionCreate('Document Upload')
    }

    const uploadMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `${type === 'pdf' ? '📄 PDF Upload' : '🎥 YouTube Video'} feature would be integrated here.`,
      timestamp: new Date().toISOString()
    }
    const newMessages = [...messages, uploadMessage]
    setMessages(newMessages)
    updateSession(newMessages)
  }

  // Empty state when no session is selected
  if (!currentSession && messages.length === 0) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="h-full flex items-center justify-center overflow-y-auto">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Plus className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-800">Start a New Conversation</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Create a new chat session to begin asking questions about your documents or explore any topic with AI assistance.
            </p>
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 text-left border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-3">You can:</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Ask questions about any topic
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Upload PDFs for analysis
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Add YouTube videos to knowledge base
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Generate quizzes and flashcards
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="w-full bg-gradient-to-br from-slate-50 to-slate-100" 
      style={{ 
        height: 'calc(100vh - 120px)', // Subtract approximate header height
        display: 'grid', 
        gridTemplateRows: '1fr 180px',
        minHeight: 0,
        maxHeight: 'calc(100vh - 120px)'
      }}
    >
      {/* SECTION 1: SCROLLABLE CHAT AREA */}
      <div 
        className="overflow-y-auto overflow-x-hidden" 
        style={{ 
          minHeight: 0,
          maxHeight: 'calc(100vh - 300px)' // Subtract header + input heights
        }}
      >
        <div className="p-6 pb-4">
          <div className="max-w-4xl mx-auto">
            
            {/* Welcome Message */}
            {messages.length === 0 && (
              <div className="mb-6">
                <div className="flex justify-start">
                  <div className="bg-white shadow-md rounded-2xl p-5 max-w-2xl border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">AI</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-700">AI Assistant</span>
                          <span className="text-xs text-gray-500">{formatTime(new Date().toISOString())}</span>
                        </div>
                        <p className="text-gray-700 leading-relaxed">
                          Hello! I'm your AI study assistant. Ask me questions about any topic, upload documents for analysis, or let me help you create study materials. What would you like to explore today?
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id}>
                  <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-2xl rounded-2xl p-4 shadow-md ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-xs">AI</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-semibold text-gray-700">AI Assistant</span>
                              <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                            </div>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                              {message.content}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {message.role === 'user' && (
                        <div>
                          <div className="flex items-center justify-end gap-2 mb-2">
                            <span className="text-xs text-white/70">{formatTime(message.timestamp)}</span>
                            <span className="text-sm font-semibold text-white/90">You</span>
                          </div>
                          <p className="text-white leading-relaxed whitespace-pre-wrap text-right">
                            {message.content}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div>
                  <div className="flex justify-start">
                    <div className="bg-white shadow-md rounded-2xl p-4 max-w-2xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">AI</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm text-gray-600">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Scroll Anchor */}
            <div ref={messagesEndRef} className="h-8" />
            
          </div>
        </div>
      </div>

      {/* SECTION 2: FIXED INPUT AREA */}
      <div 
        className="bg-white border-t border-gray-200 shadow-lg" 
        style={{ 
          height: '180px',
          minHeight: '180px',
          maxHeight: '180px'
        }}
      >
        <div className="p-4 h-full">
          <div className="max-w-4xl mx-auto h-full flex flex-col">
            
            {/* Upload Buttons */}
            <div className="flex gap-2 mb-3 flex-shrink-0">
              <button
                onClick={() => handleFileUpload('pdf')}
                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
              >
                <FileText className="h-4 w-4" />
                Upload PDF
              </button>
              <button
                onClick={() => handleFileUpload('youtube')}
                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
              >
                <Upload className="h-4 w-4" />
                YouTube URL
              </button>
            </div>

            {/* Input Box */}
            <div className="flex-1 relative min-h-0">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question or start a conversation..."
                className="w-full h-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-xl resize-none focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-gray-900 placeholder-gray-500"
                style={{ minHeight: '60px', maxHeight: '100px' }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="absolute bottom-3 right-3 p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-gray-500 text-center mt-2 flex-shrink-0">
              Press Enter to send, Shift + Enter for new line
            </p>
            
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatSection