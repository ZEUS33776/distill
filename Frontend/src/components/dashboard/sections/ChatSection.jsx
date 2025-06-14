import React, { useState, useRef, useEffect, useCallback, memo } from 'react'
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

// Function to render markdown-style text with bold formatting (returns JSX)
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

// Function to format text as plain string (no JSX)
const formatTextAsString = (text) => {
  if (typeof text !== 'string') return String(text)
  
  // Remove markdown formatting for plain text
  return text.replace(/\*\*(.*?)\*\*/g, '$1')
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
      if (content.trim().startsWith('{') && content.trim().includes('"type"')) {
        try {
          console.log('Attempting to parse JSON string')
          const parsed = JSON.parse(content)
          console.log('Successfully parsed JSON:', parsed)
          
          // Handle quiz objects
          if (parsed.type === 'quiz') {
            console.log('Detected quiz in JSON string')
            return `Quiz: ${parsed.body?.length || 0} questions`
          }
          // Handle flashnotes objects  
          else if (parsed.type === 'flashnotes') {
            console.log('Detected flashnotes in JSON string')
            return `Flashnotes: ${parsed.body?.flashcards?.length || parsed.body?.notes?.length || parsed.body?.length || 0} notes`
          }
          // Handle other structured responses
          else if (parsed.body) {
            console.log('Extracting body from parsed JSON')
            return formatTextAsString(String(parsed.body))
          }
        } catch (e) {
          console.log('JSON parsing failed, treating as regular string:', e.message)
          // If JSON parsing fails, treat as regular string
        }
      }
      console.log('Returning string content as-is')
      return formatTextAsString(content)
    }
    
    // If it's an object, handle different types
    if (content && typeof content === 'object') {
      console.log('Content is object, checking type:', content.type)
      
      // Handle quiz objects
      if (content.type === 'quiz') {
        console.log('Formatting as quiz')
        return `Quiz: ${content.body?.length || 0} questions`
      } 
      // Handle flashnotes objects
      else if (content.type === 'flashnotes') {
        console.log('Formatting as flashnotes')
        return `Flashnotes: ${content.body?.flashcards?.length || content.body?.notes?.length || 0} notes`
      } 
      // Handle response objects
      else if (content.type === 'response' && content.body) {
        console.log('Formatting as response, returning body:', content.body)
        return formatTextAsString(String(content.body))
      } 
      // Handle objects with body property
      else if (content.body) {
        console.log('Object has body property, returning:', content.body)
        return formatTextAsString(String(content.body))
      }
      // Handle quiz question objects directly (the problematic case)
      else if (content.question && content.options && content.answer) {
        console.log('Detected quiz question object, formatting as text')
        return `Question: ${content.question}\nOptions: ${(content.options || []).join(', ')}\nAnswer: ${content.answer}`
      }
      // Handle any other object
      else {
        console.log('Unknown object type, converting to readable format')
        return `[Object: ${Object.keys(content).join(', ')}]`
      }
    }
    
    console.log('Falling back to string conversion')
    // Ensure we always return a string, never an object
    return String(content || 'Empty content')
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
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
            }`}>
              <div className="whitespace-pre-wrap leading-relaxed">
                {(() => {
                  try {
                    const formatted = formatContent(message.content)
                    // formatContent now returns plain strings, so we can safely render with markdown
                    if (typeof formatted === 'string') {
                      return renderMarkdownText(formatted)
                    } else {
                      // This should not happen anymore, but keep as safety net
                      console.warn('formatContent returned non-string:', typeof formatted, formatted)
                      return 'Error: Invalid content format'
                    }
                  } catch (error) {
                    console.error('Error formatting message content:', error, message.content)
                    return 'Error displaying message content'
                  }
                })()}
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
                  onClick={() => {
                    try {
                      const formatted = formatContent(message.content)
                      if (typeof formatted === 'object') {
                        if (formatted === null) {
                          onCopy('null')
                        } else if (React.isValidElement(formatted)) {
                          onCopy('React component')
                        } else if (formatted.constructor && formatted.constructor.name) {
                          onCopy(`[${formatted.constructor.name} object]`)
                        } else {
                          onCopy('[Object]')
                        }
                      } else {
                        onCopy(formatted)
                      }
                    } catch (error) {
                      console.error('Error copying message content:', error)
                      onCopy('Error copying message content')
                    }
                  }}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Copy message"
                >
                  <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
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
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Welcome to AI Chat
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 text-lg mb-8 leading-relaxed">
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
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200"
            >
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-blue-800 dark:text-blue-300 text-sm">
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
      // Clean up any problematic messages with object content and ensure all have IDs
      const cleanedMessages = currentSession.messages.map((message, index) => {
        let cleanedMessage = { ...message }
        
        // Ensure message has an ID
        if (!cleanedMessage.id) {
          cleanedMessage.id = `session-msg-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }
        
        if (typeof message.content === 'object') {
          console.log('🧹 Cleaning up object content in message:', message.id)
          let cleanContent = 'Message content unavailable'
          
          if (message.content && message.content.question && message.content.options) {
            // Handle quiz question objects
            cleanContent = `Question: ${message.content.question}\nOptions: ${(message.content.options || []).join(', ')}\nAnswer: ${message.content.answer || 'N/A'}`
          } else if (Array.isArray(message.content)) {
            // Handle arrays
            cleanContent = `Generated ${message.content.length} items`
          } else if (message.content && typeof message.content === 'object') {
            // Handle other objects
            cleanContent = `[Generated content: ${Object.keys(message.content).join(', ')}]`
          }
          
          cleanedMessage.content = cleanContent
        }
        
        return cleanedMessage
      })
      setMessages(cleanedMessages)
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

  // Function to store study session in database
  const storeStudySession = async (type, name, content, sessionId, userId) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const url = `${apiUrl}/study-sessions/create`
      
      console.log(`💾 Storing ${type} study session:`, { 
        name, 
        sessionId, 
        userId, 
        url,
        contentLength: Array.isArray(content) ? content.length : Object.keys(content).length
      })
      
      const payload = {
        session_id: sessionId,
        user_id: userId,
        type: type,
        name: name,
        content: content
      }
      
      console.log('📤 Sending payload:', JSON.stringify(payload, null, 2))
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })
      
      console.log(`📥 Response status: ${response.status} ${response.statusText}`)
      
      if (response.ok) {
        const result = await response.json()
        console.log(`✅ ${type} study session stored successfully:`, result)
        return result
      } else {
        const errorText = await response.text()
        console.error(`❌ Failed to store ${type} study session:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error(`❌ Error storing ${type} study session:`, error)
      throw error
    }
  }

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
      
      // Store quiz in database
      const sessionId = currentSession?.id || 'unknown'
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      const userId = userData.user_id || 'test-user-frontend'
      const quizName = response.name || 'AI Generated Quiz'
      
      console.log('🔍 Quiz storage debug:', { sessionId, userData, userId, quizName })
      
      // Store in database (don't await to avoid blocking UI)
      storeStudySession('quiz', quizName, response.body, sessionId, userId).catch(error => {
        console.error('Failed to store quiz in database:', error)
      })
      
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
      
      // Store flashnotes in database
      const sessionId = currentSession?.id || 'unknown'
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      const userId = userData.user_id || 'test-user-frontend'
      const flashnotesName = response.name || 'AI Generated Flashcards'
      
      console.log('🔍 Flashnotes storage debug:', { sessionId, userData, userId, flashnotesName })
      
      // Store in database (don't await to avoid blocking UI)
      storeStudySession('flashnotes', flashnotesName, response.body, sessionId, userId).catch(error => {
        console.error('Failed to store flashnotes in database:', error)
      })
      
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
  }, [navigate, currentSession])

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
        
        // Clean up markdown formatting if present
        let cleanedBody = rawResponse.body
        if (cleanedBody.startsWith('```json') && cleanedBody.endsWith('```')) {
          cleanedBody = cleanedBody.slice(7, -3).trim()
          console.log('6b. Removed markdown formatting, cleaned body:', cleanedBody.substring(0, 200) + '...')
        } else if (cleanedBody.startsWith('```') && cleanedBody.endsWith('```')) {
          // Handle generic code blocks
          const firstNewline = cleanedBody.indexOf('\n')
          if (firstNewline !== -1) {
            cleanedBody = cleanedBody.slice(firstNewline + 1, -3).trim()
            console.log('6c. Removed generic code block formatting, cleaned body:', cleanedBody.substring(0, 200) + '...')
          }
        }
        
        try {
          // First try to parse as a single JSON object
          const parsedBody = JSON.parse(cleanedBody)
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
      console.log('🎯 About to check special response with:', response)
      const isSpecialResponse = handleSpecialResponse(response)
      console.log('🎯 handleSpecialResponse returned:', isSpecialResponse)
      
      // If it's a special response, don't add it to chat - it will be handled by the target tab
      if (isSpecialResponse) {
        console.log('✅ Special response handled, skipping chat message creation')
        return
      }
      
      console.log('❌ Not a special response, continuing with regular chat message creation')



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
      
      // Ensure content is always a string for message storage
      if (typeof content === 'object') {
        console.log('12. Content is object, converting to string representation')
        if (content && content.question && content.options) {
          // Handle quiz question objects
          content = `Question: ${content.question}\nOptions: ${(content.options || []).join(', ')}\nAnswer: ${content.answer || 'N/A'}`
        } else if (Array.isArray(content)) {
          // Handle arrays (like quiz questions)
          content = `Generated ${content.length} items`
        } else {
          // Handle other objects
          content = `[Generated content: ${Object.keys(content).join(', ')}]`
        }
        console.log('12a. Converted content:', content)
      }
      
      console.log('=========================')

      // Create AI response message
      const aiMessage = {
        id: generateId(),
        role: 'assistant',
        content: String(content), // Ensure it's always a string
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
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence>
            {messages.map((message, index) => {
              // Ensure each message has a unique ID
              const messageId = message.id || `fallback-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
              return (
                <div key={messageId} className="group">
                  <MessageBubble 
                    message={message} 
                    index={index}
                    onCopy={handleCopyMessage}
                    onRegenerate={handleRegenerateResponse}
                    aiLoading={aiLoading}
                  />
                </div>
              )
            })}
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
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-sm">
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
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Upload Actions */}
          <div className="flex items-center space-x-2 mb-4">
            <button 
              onClick={() => handleFileUpload('pdf')}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Upload PDF</span>
            </button>
            
            <button 
              onClick={() => handleFileUpload('youtube')}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
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
              className="w-full resize-none px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[50px] max-h-32"
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

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
            Press Enter to send, Shift + Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}

export default ChatSection 