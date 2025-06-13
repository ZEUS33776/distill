import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
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
import apiService from '../../../services/api'

// Function to render markdown-style text with bold formatting
const renderMarkdownText = (text) => {
  if (typeof text !== 'string') return text
  
  // Split by **text** pattern and process each part
  const parts = text.split(/(\*\*.*?\*\*)/g)
  
  return parts.map((part, index) => {
    // Check if this part is wrapped in **
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      // Remove the ** and make it bold
      const boldText = part.slice(2, -2)
      return <strong key={index}>{boldText}</strong>
    }
    // Regular text - preserve newlines
    return part.split('\n').map((line, lineIndex, array) => (
      <span key={`${index}-${lineIndex}`}>
        {line}
        {lineIndex < array.length - 1 && <br />}
      </span>
    ))
  })
}

// Memoized MessageBubble component
const MessageBubble = memo(({ message, index, onCopy, onRegenerate, aiLoading }) => {
  const isUser = message.role === 'user'

  // Format the content based on its type
  const formatContent = (content) => {
    console.log('=== FORMATTING CONTENT ===')
    console.log('Input content:', content)
    console.log('Input content type:', typeof content)
    
    // If it's a string, check if it's JSON that needs parsing
    if (typeof content === 'string') {
      // Try to parse if it looks like JSON
      if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
        try {
          // Use a more robust approach to extract the body from malformed JSON
          console.log('Attempting to extract body from JSON-like string')
          
          // Look for the "body": " pattern and extract everything until the closing quote
          // Use a more robust regex that properly handles escaped quotes
          const bodyMatch = content.match(/"body":\s*"((?:[^"\\]|\\.)*)"/s)
          if (bodyMatch && bodyMatch[1]) {
            console.log('Successfully extracted body using regex:', bodyMatch[1].substring(0, 100) + '...')
            // Unescape the extracted content
            const unescapedContent = bodyMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\r/g, '\r')
              .replace(/\\t/g, '\t')
              .replace(/\\"/g, '"')
              .replace(/\\\\/g, '\\')
            return renderMarkdownText(unescapedContent)
          }
          
          // Fallback to standard JSON parsing
          const parsed = JSON.parse(content)
          console.log('Parsed JSON from string:', parsed)
          if (parsed && typeof parsed === 'object' && parsed.type && parsed.body) {
            console.log('Extracting body from parsed JSON:', parsed.body)
            return renderMarkdownText(parsed.body)
          }
        } catch (e) {
          console.log('JSON parsing failed, treating as regular string:', e.message)
        }
      }
      console.log('Returning string content as-is')
      return renderMarkdownText(content)
    }
    
    // If it's an object, handle different types
    if (content && typeof content === 'object') {
      console.log('Content is object, checking type:', content.type)
      if (content.type === 'quiz') {
        console.log('Formatting as quiz')
        return `Quiz: ${content.body?.length || 0} questions`
      } else if (content.type === 'flashnotes') {
        console.log('Formatting as flashnotes')
        return `Flashnotes: ${content.body?.notes?.length || 0} notes`
              } else if (content.type === 'response' && content.body) {
          console.log('Formatting as response, returning body:', content.body)
          return renderMarkdownText(content.body)
        } else if (content.body) {
          console.log('Object has body property, returning:', content.body)
          return renderMarkdownText(content.body)
      }
    }
    
    console.log('Falling back to JSON string')
    // Fallback to JSON string for unknown formats
    return JSON.stringify(content, null, 2)
  }

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
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                : 'bg-white border border-gray-200 text-gray-900'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">
                {formatContent(message.content)}
              </div>
              
              {/* Message metadata */}
              <div className={`text-xs mt-2 opacity-70 ${
                isUser ? 'text-gray-500 dark:text-gray-400' : 'text-gray-500'
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
                  onClick={() => onCopy(formatContent(message.content))}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  title="Copy message"
                >
                  <Copy className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
})

// Memoized WelcomeScreen component
const WelcomeScreen = memo(() => (
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
))

const ChatSection = () => {
  const navigate = useNavigate()
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

  const updateSessionWithMessages = useCallback((newMessages) => {
    if (currentSession) {
      const messageCount = newMessages.filter(m => m.role === 'user').length
      const updatedSession = {
        ...currentSession,
        messages: newMessages,
        messageCount,
        title: currentSession.title === 'New Chat' && newMessages.length > 0
          ? newMessages[0].content.slice(0, 50) + (newMessages[0].content.length > 50 ? '...' : '')
          : currentSession.title
      }
      updateSession(currentSession.id, updatedSession)
    }
  }, [currentSession, updateSession])

  // Function to handle quiz/flashnotes responses and switch tabs
  const handleSpecialResponse = useCallback((response) => {
    console.log('🔍 handleSpecialResponse called with:', response)
    console.log('🔍 navigate function:', navigate)
    
    if (response.type === 'quiz') {
      console.log('🧠 Quiz response detected, switching to quiz tab')
      console.log('🧠 Quiz data to store:', response.body)
      
      // Store quiz data in localStorage for the quiz component to use
      localStorage.setItem('pendingQuizData', JSON.stringify(response.body))
      console.log('💾 Quiz data stored in localStorage')
      
      // Show notification and switch to quiz tab
      toast.success('🧠 Quiz generated! Taking you to the Quiz tab...', {
        duration: 3000,
        style: {
          background: '#10B981',
          color: 'white',
        },
      })
      console.log('🎯 Toast shown, now navigating to /dashboard/quiz')
      
      // Navigate to quiz route
      navigate('/dashboard/quiz')
      console.log('✅ navigate("/dashboard/quiz") called')
      
      return true
    } else if (response.type === 'flashnotes') {
      console.log('📚 Flashnotes response detected, switching to flashcards tab')
      console.log('📚 Flashnotes data to store:', response.body)
      
      // Store flashnotes data in localStorage for the flashcards component to use
      localStorage.setItem('pendingFlashnotesData', JSON.stringify(response.body))
      console.log('💾 Flashnotes data stored in localStorage')
      
      // Show notification and switch to flashcards tab
      toast.success('📚 Flashcards generated! Taking you to the Flashcards tab...', {
        duration: 3000,
        style: {
          background: '#8B5CF6',
          color: 'white',
        },
      })
      console.log('🎯 Toast shown, now navigating to /dashboard/flashcards')
      
      // Navigate to flashcards route
      navigate('/dashboard/flashcards')
      console.log('✅ navigate("/dashboard/flashcards") called')
      
      return true
    }
    console.log('❌ Not a special response, returning false')
    return false
  }, [navigate])

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || aiLoading) return

    // Get user ID from localStorage
    const userData = JSON.parse(localStorage.getItem('userData'))
    if (!userData || !userData.user_id) {
      throw new Error('No user ID found in localStorage')
    }
    const userId = userData.user_id

    let sessionToUse = currentSession
    if (!sessionToUse) {
      sessionToUse = await createSession('New Chat')
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
      console.log('Sending query to LLM:', {
        userId,
        sessionId: sessionToUse.id,
        query: userMessage.content
      })

      // Query LLM with the user's message
      const rawResponse = await apiService.queryLLM(userId, sessionToUse.id, userMessage.content)
      console.log('=== DEBUGGING RESPONSE ===')
      console.log('1. Raw response from apiService:', rawResponse)
      console.log('2. Response type:', typeof rawResponse)
      console.log('3. Response.type:', rawResponse?.type)
      console.log('4. Response.body:', rawResponse?.body)
      console.log('5. Response.body type:', typeof rawResponse?.body)
      
      if (!rawResponse || !rawResponse.type || !rawResponse.body) {
        console.error('Invalid response:', rawResponse)
        throw new Error('Invalid response from LLM')
      }

      // Parse the response body if it's a JSON string
      let response = rawResponse
      if (typeof rawResponse.body === 'string') {
        console.log('6. Response body is string, attempting to parse...')
        console.log('6a. Raw body content:', rawResponse.body.substring(0, 200) + '...')
        
        try {
          // First try to parse as a single JSON object
          const parsedBody = JSON.parse(rawResponse.body)
          console.log('7. Successfully parsed as single JSON:', parsedBody)
          console.log('7a. Parsed body type:', parsedBody.type)
          
          // If the parsed body has type and body properties, use it as the main response
          if (parsedBody && typeof parsedBody === 'object' && parsedBody.type && parsedBody.body) {
            response = parsedBody
            console.log('8. Using parsed body as main response:', response.type)
          } else {
            console.log('8. Parsed body missing type or body property, keeping original')
          }
        } catch (singleParseError) {
          console.log('7. Single JSON parsing failed:', singleParseError.message)
          
          // Try to handle incomplete or malformed JSON by looking for quiz pattern
          const quizMatch = rawResponse.body.match(/"type":\s*"quiz"/)
          const flashnotesMatch = rawResponse.body.match(/"type":\s*"flashnotes"/)
          
          if (quizMatch || flashnotesMatch) {
            console.log('8. Found quiz/flashnotes pattern, attempting to extract JSON')
            
            // Try to find the complete JSON object starting from the type
            const typeIndex = rawResponse.body.indexOf('"type":')
            if (typeIndex !== -1) {
              let jsonStart = rawResponse.body.lastIndexOf('{', typeIndex)
              if (jsonStart !== -1) {
                // Find the matching closing brace
                let braceCount = 0
                let jsonEnd = -1
                
                for (let i = jsonStart; i < rawResponse.body.length; i++) {
                  if (rawResponse.body[i] === '{') braceCount++
                  else if (rawResponse.body[i] === '}') {
                    braceCount--
                    if (braceCount === 0) {
                      jsonEnd = i
                      break
                    }
                  }
                }
                
                if (jsonEnd !== -1) {
                  const extractedJson = rawResponse.body.substring(jsonStart, jsonEnd + 1)
                  console.log('9. Extracted JSON:', extractedJson.substring(0, 200) + '...')
                  
                  try {
                    const parsed = JSON.parse(extractedJson)
                    if (parsed && parsed.type && parsed.body) {
                      response = parsed
                      console.log('10. Successfully extracted and parsed special response:', parsed.type)
                    }
                  } catch (extractParseError) {
                    console.log('10. Failed to parse extracted JSON:', extractParseError.message)
                  }
                }
              }
            }
          }
          
          // Fallback: try multiple JSON objects
          if (response === rawResponse) {
            console.log('8. Trying multiple JSON objects fallback')
            try {
              const jsonParts = rawResponse.body.split(/\}\s*\{/)
              
              if (jsonParts.length > 1) {
                const jsonObjects = jsonParts.map((part, index) => {
                  if (index === 0) return part + '}'
                  if (index === jsonParts.length - 1) return '{' + part
                  return '{' + part + '}'
                })
                
                const parsedObjects = jsonObjects.map(jsonStr => {
                  try {
                    return JSON.parse(jsonStr.trim())
                  } catch (err) {
                    return null
                  }
                }).filter(obj => obj !== null)
                
                const specialResponse = parsedObjects.find(obj => 
                  obj && obj.type && (obj.type === 'quiz' || obj.type === 'flashnotes')
                )
                
                if (specialResponse) {
                  response = specialResponse
                  console.log('9. Found special response in multiple objects:', specialResponse.type)
                }
              }
            } catch (multiParseError) {
              console.log('9. Multiple JSON parsing also failed:', multiParseError.message)
            }
          }
        }
        
        console.log('Final response type:', response.type)
      }

      // Check if this is a special response (quiz or flashnotes) that requires tab switching
      const isSpecialResponse = handleSpecialResponse(response)
      
      // If it's a special response, don't add it to chat - it will be handled by the target tab
      if (isSpecialResponse) {
        console.log('Special response handled, skipping chat message creation')
        return
      }



      // Use the response body directly as content
      let content = response.body
      console.log('6. Initial content:', content)
      console.log('7. Initial content type:', typeof content)
      
      // Handle any remaining nested JSON strings in the body
      if (typeof content === 'string') {
        try {
          const parsed = JSON.parse(content)
          console.log('8. Parsed nested JSON:', parsed)
          // If it's a nested response object, extract the inner body
          if (parsed && typeof parsed === 'object' && parsed.type && parsed.body) {
            content = parsed.body
            console.log('9. Extracted inner body:', content)
          }
        } catch (e) {
          console.log('8. Content is not JSON, using as-is')
        }
      }

      console.log('10. Final content for message:', content)
      console.log('11. Final content type:', typeof content)
      console.log('=========================')

      // Create AI response message
      const aiMessage = {
        id: generateId(),
        role: 'assistant',
        content: content,
        type: response.type,
        timestamp: new Date().toISOString()
      }

      const finalMessages = [...newMessages, aiMessage]
      setMessages(finalMessages)
      updateSessionWithMessages(finalMessages)
    } catch (error) {
      console.error('Error getting AI response:', error)
      // Add error message to chat with more details
      const errorMessage = {
        id: generateId(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please check the console for more details and try again.`,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }, [inputValue, aiLoading, currentSession, messages, createSession, setCurrentSession, updateSessionWithMessages, handleSpecialResponse])

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  const handleCopyMessage = useCallback(async (content) => {
    const success = await copyToClipboard(content)
    if (success) {
      toast.success('Message copied to clipboard')
    } else {
      toast.error('Failed to copy message')
    }
  }, [])

  const handleRegenerateResponse = useCallback(async (messageIndex) => {
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
  }, [messages, aiLoading, generateResponse, updateSessionWithMessages])

  const handleFileUpload = async (type) => {
    try {
      // Get user ID from localStorage
      const userData = JSON.parse(localStorage.getItem('userData'))
      if (!userData || !userData.user_id) {
        throw new Error('No user ID found in localStorage')
      }
      const userId = userData.user_id

      // Get current session or create new one
      let sessionToUse = currentSession
      if (!sessionToUse) {
        // Create new session for document uploads
        const newSession = await createSession('Document Upload')
        sessionToUse = newSession
        setCurrentSession(newSession)
      }

      if (type === 'pdf') {
        // Create file input for PDF
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.pdf'
        
        input.onchange = async (e) => {
          const file = e.target.files[0]
          if (!file) return

          // Create user message
          const userMessage = {
            id: generateId(),
            role: 'user',
            content: `Uploaded PDF: ${file.name}`,
            timestamp: new Date().toISOString()
          }

          // Add user message to chat
          setMessages(prev => [...prev, userMessage])

          try {
            // Process PDF through backend
            await apiService.processPDF(file, userId, sessionToUse.id)
            
            // Process content to embeddings
            console.log('Processing embeddings for session:', sessionToUse.id, 'user:', userId)
            await apiService.processContentToEmbeddings(userId, sessionToUse.id)

            // Create AI response message
            const aiMessage = {
              id: generateId(),
              role: 'assistant',
              content: `I've processed your PDF "${file.name}" and added it to your knowledge base. You can now ask questions about its contents.`,
              timestamp: new Date().toISOString()
            }

            // Add AI message to chat
            setMessages(prev => [...prev, aiMessage])

            // Update session with new messages
            updateSession(sessionToUse.id, {
              messages: [...messages, userMessage, aiMessage]
            })

          } catch (error) {
            console.error('Error processing PDF:', error)
            // Add error message to chat
            const errorMessage = {
              id: generateId(),
              role: 'assistant',
              content: `Sorry, I encountered an error while processing your PDF: ${error.message}`,
              timestamp: new Date().toISOString()
            }
            setMessages(prev => [...prev, errorMessage])
          }
        }

        input.click()
      } else if (type === 'youtube') {
        const url = prompt('Enter YouTube URL:')
        if (!url) return

        // Create user message
        const userMessage = {
          id: generateId(),
          role: 'user',
          content: `Uploaded YouTube URL: ${url}`,
          timestamp: new Date().toISOString()
        }

        // Add user message to chat
        setMessages(prev => [...prev, userMessage])

        try {
          // Process YouTube video through backend
          await apiService.processYouTubeVideo(url, userId, sessionToUse.id)
          
          // Process content to embeddings
          console.log('Processing embeddings for session:', sessionToUse.id, 'user:', userId)
          await apiService.processContentToEmbeddings(userId, sessionToUse.id)

          // Create AI response message
          const aiMessage = {
            id: generateId(),
            role: 'assistant',
            content: `I've processed your YouTube video and added it to your knowledge base. You can now ask questions about its contents.`,
            timestamp: new Date().toISOString()
          }

          // Add AI message to chat
          setMessages(prev => [...prev, aiMessage])

          // Update session with new messages
          updateSession(sessionToUse.id, {
            messages: [...messages, userMessage, aiMessage]
          })

        } catch (error) {
          console.error('Error processing YouTube URL:', error)
          // Add error message to chat
          const errorMessage = {
            id: generateId(),
            role: 'assistant',
            content: `Sorry, I encountered an error while processing your YouTube URL: ${error.message}`,
            timestamp: new Date().toISOString()
          }
          setMessages(prev => [...prev, errorMessage])
        }
      }
    } catch (error) {
      console.error('Error in handleFileUpload:', error)
      // Add error message to chat
      const errorMessage = {
        id: generateId(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    }
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
                <MessageBubble 
                  message={message} 
                  index={index}
                  onCopy={handleCopyMessage}
                  onRegenerate={handleRegenerateResponse}
                  aiLoading={aiLoading}
                />
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
            <button 
              onClick={() => handleFileUpload('pdf')}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Upload PDF</span>
            </button>
            
            <button 
              onClick={() => handleFileUpload('youtube')}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
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