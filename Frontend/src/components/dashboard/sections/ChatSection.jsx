import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Upload, 
  FileText, 
  Youtube,
  Plus,
  Loader2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useApp } from '../../../contexts/AppContext'
import { useAI } from '../../../hooks/useAI'
import { formatTime, copyToClipboard, generateId } from '../../../utils'

const ChatSection = () => {
  const { 
    currentSession, 
    createSession, 
    updateSession, 
    setCurrentSession
  } = useApp()

  const { generateResponse, isLoading: aiLoading } = useAI()
  
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Initialize messages from current session
  useEffect(() => {
    if (currentSession?.messages) {
      setMessages(currentSession.messages)
    } else {
      setMessages([])
    }
  }, [currentSession])

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isTyping])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [inputValue])

  const updateSessionWithMessages = (newMessages) => {
    if (currentSession) {
      const messageCount = newMessages.filter(m => m.role === 'user').length
      const updatedSession = {
        ...currentSession,
        messages: newMessages,
        messageCount,
        title: currentSession.title === 'New Chat' && newMessages.length > 0
          ? generateSessionTitle(newMessages.find(m => m.role === 'user')?.content)
          : currentSession.title,
        lastActivity: new Date().toISOString()
      }
      updateSession(currentSession.id, updatedSession)
      setCurrentSession(updatedSession)
    }
  }

  const generateSessionTitle = (firstMessage) => {
    if (!firstMessage) return 'New Chat'
    const words = firstMessage.split(' ').slice(0, 4).join(' ')
    return words.length > 30 ? words.substring(0, 30) + '...' : words
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || aiLoading) return

    let sessionToUse = currentSession
    if (!sessionToUse) {
      sessionToUse = createSession('New Chat')
      setCurrentSession(sessionToUse)
    }

    const userMessage = {
      id: generateId(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString()
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputValue('')
    setIsTyping(true)

    updateSessionWithMessages(newMessages)

    try {
      const aiResponse = await generateResponse(userMessage.content)
      const finalMessages = [...newMessages, aiResponse]
      setMessages(finalMessages)
      updateSessionWithMessages(finalMessages)
    } catch (error) {
      toast.error('Failed to get AI response. Please try again.')
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleCopyMessage = async (content) => {
    const success = await copyToClipboard(content)
    if (success) {
      toast.success('Message copied to clipboard')
    } else {
      toast.error('Failed to copy message')
    }
  }

  const handleRegenerateResponse = async (messageIndex) => {
    if (messageIndex < 1 || aiLoading) return

    const userMessage = messages[messageIndex - 1]
    if (!userMessage || userMessage.role !== 'user') return

    setIsTyping(true)
    try {
      const newResponse = await generateResponse(userMessage.content)
      const updatedMessages = [...messages]
      updatedMessages[messageIndex] = newResponse
      setMessages(updatedMessages)
      updateSessionWithMessages(updatedMessages)
      toast.success('Response regenerated')
    } catch (error) {
      toast.error('Failed to regenerate response')
    } finally {
      setIsTyping(false)
    }
  }

  const WelcomeScreen = () => (
    <div className="flex-1 flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-2xl mx-auto"
      >
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Plus className="h-10 w-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to AI Chat
        </h1>
        
        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          Start a conversation with your AI study assistant. Ask questions about any topic,
          upload documents for analysis, or get help with your studies.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            {
              icon: '💬',
              title: 'Ask Questions',
              description: 'Get instant answers and explanations on any topic'
            },
            {
              icon: '📄',
              title: 'Upload Documents',
              description: 'Analyze PDFs and extract key insights'
            },
            {
              icon: '🎥',
              title: 'YouTube Videos',
              description: 'Add video content to your knowledge base'
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>Tip:</strong> Try asking "Explain quantum physics" or "Help me study for my exam"
          </p>
        </div>
      </motion.div>
    </div>
  )

  const MessageBubble = ({ message, index }) => {
    const isUser = message.role === 'user'
    const isLast = index === messages.length - 1

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
      >
        <div className={`max-w-4xl ${isUser ? 'order-2' : 'order-1'}`}>
          <div className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              isUser 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-semibold'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold'
            }`}>
              {isUser ? 'U' : 'AI'}
            </div>

            {/* Message Content */}
            <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block p-4 rounded-2xl shadow-sm ${
                isUser
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>
                
                {/* Message metadata */}
                <div className={`text-xs mt-2 opacity-70 ${
                  isUser ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {formatTime(message.timestamp)}
                  {message.metadata && (
                    <span className="ml-2">
                      • {Math.round(message.metadata.confidence * 100)}% confidence
                    </span>
                  )}
                </div>
              </div>

              {/* Message Actions */}
              {!isUser && (
                <div className="flex items-center space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleCopyMessage(message.content)}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                    title="Copy message"
                  >
                    <Copy className="w-4 h-4 text-gray-500" />
                  </button>
                  
                  <button
                    onClick={() => handleRegenerateResponse(index)}
                    className="p-1 rounded hover:bg-gray-100 transition-colors"
                    title="Regenerate response"
                    disabled={aiLoading}
                  >
                    <RotateCcw className="w-4 h-4 text-gray-500" />
                  </button>
                  
                  <button className="p-1 rounded hover:bg-gray-100 transition-colors" title="Good response">
                    <ThumbsUp className="w-4 h-4 text-gray-500" />
                  </button>
                  
                  <button className="p-1 rounded hover:bg-gray-100 transition-colors" title="Bad response">
                    <ThumbsDown className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  if (messages.length === 0 && !currentSession) {
    return <WelcomeScreen />
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence>
            {messages.map((message, index) => (
              <div key={message.id} className="group">
                <MessageBubble message={message} index={index} />
              </div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start mb-6"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">AI</span>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-6">
        <div className="max-w-4xl mx-auto">
          {/* Upload Actions */}
          <div className="flex items-center space-x-2 mb-4">
            <button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <FileText className="w-4 h-4" />
              <span>Upload PDF</span>
            </button>
            
            <button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
              <Youtube className="w-4 h-4" />
              <span>YouTube URL</span>
            </button>
          </div>

          {/* Message Input */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question or start a conversation..."
              className="w-full resize-none px-4 py-3 pr-12 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[50px] max-h-32"
              rows={1}
            />
            
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || aiLoading}
              className="absolute bottom-3 right-3 p-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {aiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-2">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChatSection 