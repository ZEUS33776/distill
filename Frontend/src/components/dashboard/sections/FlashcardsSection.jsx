import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, 
  Brain, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Star,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Play,
  Shuffle,
  Trophy,
  Target,
  BookOpen,
  Check,
  X,
  Sparkles
} from 'lucide-react'

// Sample flashcard sets - can be replaced with API data later
const sampleFlashcardSets = [
  {
    id: 1,
    title: "React Hooks",
    description: "Essential React hooks and their usage patterns",
    category: "Frontend Development",
    totalCards: 8,
    masteredCards: 3,
    cards: [
      {
        id: 1,
        front: "useState",
        back: "A Hook that lets you add React state to function components. Returns an array with current state value and a function to update it.",
        difficulty: "easy",
        lastReviewed: "2024-06-08",
        reviewCount: 5,
        mastered: true
      },
      {
        id: 2,
        front: "useEffect",
        back: "A Hook that lets you perform side effects in function components. It serves the same purpose as componentDidMount, componentDidUpdate, and componentWillUnmount combined.",
        difficulty: "medium",
        lastReviewed: "2024-06-09",
        reviewCount: 3,
        mastered: true
      },
      {
        id: 3,
        front: "useContext",
        back: "A Hook that lets you subscribe to React context without introducing nesting. It accepts a context object and returns the current context value.",
        difficulty: "medium",
        lastReviewed: "2024-06-07",
        reviewCount: 2,
        mastered: false
      },
      {
        id: 4,
        front: "useReducer",
        back: "A Hook that accepts a reducer function and initial state, returns current state and dispatch function. Alternative to useState for complex state logic.",
        difficulty: "hard",
        lastReviewed: "2024-06-06",
        reviewCount: 1,
        mastered: false
      },
      {
        id: 5,
        front: "useMemo",
        back: "A Hook that returns a memoized value. Only recomputes the memoized value when one of the dependencies has changed. Useful for expensive calculations.",
        difficulty: "medium",
        lastReviewed: "2024-06-08",
        reviewCount: 4,
        mastered: true
      },
      {
        id: 6,
        front: "useCallback",
        back: "A Hook that returns a memoized callback. The callback will only change if one of the dependencies has changed. Useful for optimizing child components.",
        difficulty: "hard",
        lastReviewed: "2024-06-05",
        reviewCount: 2,
        mastered: false
      },
      {
        id: 7,
        front: "useRef",
        back: "A Hook that returns a mutable ref object whose .current property is initialized with the passed argument. The ref object will persist for the full lifetime of the component.",
        difficulty: "easy",
        lastReviewed: "2024-06-09",
        reviewCount: 6,
        mastered: false
      },
      {
        id: 8,
        front: "Custom Hooks",
        back: "JavaScript functions whose names start with 'use' and that may call other Hooks. They let you extract component logic into reusable functions.",
        difficulty: "medium",
        lastReviewed: "2024-06-04",
        reviewCount: 1,
        mastered: false
      }
    ]
  },
  {
    id: 2,
    title: "JavaScript ES6+",
    description: "Modern JavaScript syntax and features",
    category: "Programming Language",
    totalCards: 6,
    masteredCards: 2,
    cards: [
      {
        id: 1,
        front: "Arrow Functions",
        back: "A more concise way to write functions: (param) => expression. They don't have their own 'this' binding and cannot be used as constructors.",
        difficulty: "easy",
        lastReviewed: "2024-06-08",
        reviewCount: 4,
        mastered: true
      },
      {
        id: 2,
        front: "Destructuring",
        back: "A syntax that allows you to extract multiple values from arrays or objects into distinct variables: const {name, age} = person; const [first, second] = array;",
        difficulty: "medium",
        lastReviewed: "2024-06-07",
        reviewCount: 3,
        mastered: false
      },
      {
        id: 3,
        front: "Template Literals",
        back: "String literals allowing embedded expressions using backticks: `Hello ${name}!`. They can span multiple lines and include expressions.",
        difficulty: "easy",
        lastReviewed: "2024-06-09",
        reviewCount: 5,
        mastered: true
      },
      {
        id: 4,
        front: "Spread Operator",
        back: "The syntax (...) that expands iterables into individual elements. Used for copying arrays/objects: [...array], {...object}, or passing arguments.",
        difficulty: "medium",
        lastReviewed: "2024-06-06",
        reviewCount: 2,
        mastered: false
      },
      {
        id: 5,
        front: "Promise",
        back: "An object representing eventual completion or failure of an asynchronous operation. Has states: pending, fulfilled, rejected. Uses .then() and .catch().",
        difficulty: "hard",
        lastReviewed: "2024-06-05",
        reviewCount: 1,
        mastered: false
      },
      {
        id: 6,
        front: "async/await",
        back: "Syntactic sugar for Promises. 'async' declares an asynchronous function, 'await' pauses execution until Promise resolves. Makes async code look synchronous.",
        difficulty: "medium",
        lastReviewed: "2024-06-04",
        reviewCount: 2,
        mastered: false
      }
    ]
  },
  {
    id: 3,
    title: "CSS Flexbox",
    description: "CSS Flexible Box Layout fundamentals",
    category: "Web Design",
    totalCards: 5,
    masteredCards: 1,
    cards: [
      {
        id: 1,
        front: "display: flex",
        back: "Creates a flex container, making direct children flex items. Enables flexible layout with main and cross axes.",
        difficulty: "easy",
        lastReviewed: "2024-06-08",
        reviewCount: 3,
        mastered: true
      },
      {
        id: 2,
        front: "justify-content",
        back: "Controls alignment of flex items along the main axis. Values: flex-start, flex-end, center, space-between, space-around, space-evenly.",
        difficulty: "medium",
        lastReviewed: "2024-06-07",
        reviewCount: 2,
        mastered: false
      },
      {
        id: 3,
        front: "align-items",
        back: "Controls alignment of flex items along the cross axis. Values: stretch, flex-start, flex-end, center, baseline.",
        difficulty: "medium",
        lastReviewed: "2024-06-06",
        reviewCount: 1,
        mastered: false
      },
      {
        id: 4,
        front: "flex-direction",
        back: "Defines the main axis direction. Values: row (default), row-reverse, column, column-reverse.",
        difficulty: "easy",
        lastReviewed: "2024-06-05",
        reviewCount: 2,
        mastered: false
      },
      {
        id: 5,
        front: "flex-wrap",
        back: "Controls whether flex items wrap to new lines. Values: nowrap (default), wrap, wrap-reverse.",
        difficulty: "medium",
        lastReviewed: "2024-06-04",
        reviewCount: 1,
        mastered: false
      }
    ]
  }
]

const FlashcardsSection = () => {
  // Simple state management
  const [isStudying, setIsStudying] = useState(false)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [cards, setCards] = useState([])
  const [sessionTitle, setSessionTitle] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const [aiFlashnotesData, setAiFlashnotesData] = useState(null)
  const [showAiBanner, setShowAiBanner] = useState(false)
  const [cardRatings, setCardRatings] = useState({}) // Track ratings for each card

  // Check for pending flashnotes data from chat
  useEffect(() => {
    const pendingFlashnotesData = localStorage.getItem('pendingFlashnotesData')
    if (pendingFlashnotesData) {
      try {
        const parsedFlashnotesData = JSON.parse(pendingFlashnotesData)
        console.log('📚 Found pending flashnotes data:', parsedFlashnotesData)
        
        // Transform AI flashnotes data to match our flashcard format
        let transformedFlashcards = []
        
        // Handle new flashcards structure
        if (parsedFlashnotesData.flashcards) {
          transformedFlashcards = parsedFlashnotesData.flashcards.map((card, index) => ({
            id: `ai-${index + 1}`,
            front: card.front,
            back: card.back,
            difficulty: "Mixed",
            topic: "AI Generated",
            tags: ["AI Generated", "Study Cards"],
            reviewCount: 0,
            lastReviewed: new Date().toISOString(),
            mastered: false,
            createdAt: new Date().toISOString()
          }))
        } 
        // Handle legacy notes structure for backward compatibility
        else if (parsedFlashnotesData.notes) {
          transformedFlashcards = parsedFlashnotesData.notes.map((note, index) => ({
            id: `ai-${index + 1}`,
            front: `Study Note ${index + 1}`,
            back: note.note,
            difficulty: "Mixed",
            topic: "AI Generated",
            tags: ["AI Generated", "Study Notes"],
            reviewCount: 0,
            lastReviewed: new Date().toISOString(),
            mastered: false,
            createdAt: new Date().toISOString()
          }))
        }
        
        setAiFlashnotesData(transformedFlashcards)
        setShowAiBanner(true)
        
        console.log('✅ AI flashnotes data ready:', transformedFlashcards)
      } catch (error) {
        console.error('❌ Error parsing pending flashnotes data:', error)
        localStorage.removeItem('pendingFlashnotesData')
      }
    }
  }, [])

  // Simple functions
  const startAiFlashcards = () => {
    if (aiFlashnotesData && aiFlashnotesData.length > 0) {
      setCards(aiFlashnotesData)
      setSessionTitle('AI Generated Flashcards')
      setCurrentCardIndex(0)
      setIsFlipped(false)
      setIsStudying(true)
      setIsComplete(false)
      setCardRatings({})
      setShowAiBanner(false)
      localStorage.removeItem('pendingFlashnotesData')
    }
  }

  const startTestSession = () => {
    const testCards = [
      {
        id: 'test-1',
        front: 'Test Question 1',
        back: 'Test Answer 1',
        difficulty: 'easy',
        reviewCount: 0,
        lastReviewed: new Date().toISOString(),
        mastered: false
      },
      {
        id: 'test-2',
        front: 'Test Question 2', 
        back: 'Test Answer 2',
        difficulty: 'medium',
        reviewCount: 0,
        lastReviewed: new Date().toISOString(),
        mastered: false
      }
    ]
    setCards(testCards)
    setSessionTitle('Test Flashcards')
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setIsStudying(true)
    setIsComplete(false)
    setCardRatings({})
  }

  const dismissAiBanner = () => {
    setShowAiBanner(false)
    setAiFlashnotesData(null)
    localStorage.removeItem('pendingFlashnotesData')
  }

  const flipCard = () => {
    setIsFlipped(!isFlipped)
  }

  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setIsFlipped(false)
    } else {
      setIsComplete(true)
    }
  }

  const previousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
      setIsFlipped(false)
    }
  }

  const markCard = (difficulty) => {
    const currentCard = cards[currentCardIndex]
    // Save the rating for this card
    setCardRatings(prev => ({
      ...prev,
      [currentCard.id]: {
        card: currentCard,
        rating: difficulty,
        timestamp: new Date()
      }
    }))
    // Move to next card
    nextCard()
  }

  const resetSession = () => {
    setIsStudying(false)
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setCards([])
    setSessionTitle('')
    setIsComplete(false)
    setCardRatings({})
  }

  // Simple render logic
  if (isComplete) {
    // Calculate rating statistics
    const ratingEntries = Object.values(cardRatings)
    const easyCards = ratingEntries.filter(entry => entry.rating === 'easy')
    const mediumCards = ratingEntries.filter(entry => entry.rating === 'medium') 
    const hardCards = ratingEntries.filter(entry => entry.rating === 'hard')
    const unratedCards = cards.filter(card => !cardRatings[card.id])

    return (
      <div className="h-full bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6"
            >
              <Trophy className="h-10 w-10 text-white" />
            </motion.div>
            
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Session Complete!
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              You've finished studying {cards.length} flashcards!
            </p>
          </div>

          {/* Rating Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-green-600 text-center mb-1">{easyCards.length}</h3>
              <p className="text-sm text-green-700 dark:text-green-300 text-center">Easy Cards</p>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border border-yellow-200 dark:border-yellow-800">
              <Star className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-yellow-600 text-center mb-1">{mediumCards.length}</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 text-center">Medium Cards</p>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
              <XCircle className="h-8 w-8 text-red-600 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-red-600 text-center mb-1">{hardCards.length}</h3>
              <p className="text-sm text-red-700 dark:text-red-300 text-center">Hard Cards</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <Clock className="h-8 w-8 text-gray-600 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-gray-600 text-center mb-1">{unratedCards.length}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 text-center">Skipped</p>
            </div>
          </div>

          {/* Detailed Card Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Easy Cards */}
            {easyCards.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-green-600 mb-4 flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Easy Cards ({easyCards.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {easyCards.map((entry, index) => (
                    <div key={index} className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm">
                      <strong className="text-green-800 dark:text-green-200">{entry.card.front}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medium Cards */}
            {mediumCards.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-yellow-600 mb-4 flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Medium Cards ({mediumCards.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {mediumCards.map((entry, index) => (
                    <div key={index} className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                      <strong className="text-yellow-800 dark:text-yellow-200">{entry.card.front}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hard Cards */}
            {hardCards.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center">
                  <XCircle className="h-5 w-5 mr-2" />
                  Hard Cards ({hardCards.length})
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {hardCards.map((entry, index) => (
                    <div key={index} className="p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm">
                      <strong className="text-red-800 dark:text-red-200">{entry.card.front}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setCurrentCardIndex(0)
                setIsFlipped(false)
                setIsComplete(false)
                setCardRatings({})
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-200"
            >
              Study Again
            </button>
            <button
              onClick={resetSession}
              className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isStudying && cards.length > 0) {
    const currentCard = cards[currentCardIndex]
    const progress = ((currentCardIndex + 1) / cards.length) * 100

    return (
      <div className="h-full bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 overflow-y-auto">
        <div className="p-6">
          <div className="max-w-3xl mx-auto">
            {/* Session Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{sessionTitle}</h1>
                <button
                  onClick={resetSession}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  aria-label="Close session"
                >
                  ✕
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Card {currentCardIndex + 1} of {cards.length}</span>
                  <span>{Math.round(progress)}% Complete</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Flashcard */}
            <div className="relative mb-6" style={{ height: '400px', perspective: '1000px' }}>
              <div
                className="w-full h-full relative cursor-pointer"
                onClick={flipCard}
                style={{ 
                  transform: `rotateY(${isFlipped ? 180 : 0}deg)`,
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.6s'
                }}
              >
                {/* Front of card */}
                <div 
                  className="absolute inset-0 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-8 flex flex-col items-center justify-center"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="text-center">
                    <div className="text-sm text-purple-600 font-medium mb-2">FRONT</div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{currentCard.front}</h2>
                    <p className="text-gray-500 text-sm dark:text-gray-400">Click to reveal answer</p>
                  </div>
                </div>

                {/* Back of card */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl shadow-lg p-8 flex flex-col justify-center"
                  style={{ 
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                  <div className="text-center">
                    <div className="text-sm text-purple-200 font-medium mb-2">BACK</div>
                    <p className="text-lg leading-relaxed">{currentCard.back}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Controls - ALWAYS VISIBLE */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={previousCard}
                  disabled={currentCardIndex === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                >
                  <ChevronLeft className="h-5 w-5" />
                  Previous
                </button>

                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {isFlipped ? 'Rate your understanding' : 'Click card to reveal answer'}
                  </div>
                </div>

                <button
                  onClick={nextCard}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 font-medium"
                >
                  {currentCardIndex === cards.length - 1 ? 'Finish' : 'Next'}
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              {/* Difficulty Rating - ALWAYS VISIBLE when flipped */}
              {isFlipped && (
                <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                  <p className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                    How well did you know this?
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => markCard('easy')}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all duration-200 font-medium"
                    >
                      <CheckCircle className="h-5 w-5" />
                      Easy
                    </button>
                    <button
                      onClick={() => markCard('medium')}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-all duration-200 font-medium"
                    >
                      <Star className="h-5 w-5" />
                      Medium
                    </button>
                    <button
                      onClick={() => markCard('hard')}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200 font-medium"
                    >
                      <XCircle className="h-5 w-5" />
                      Hard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Home screen
  return (
    <div className="h-full bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center"
        >
          {/* AI Flashnotes Banner */}
          <AnimatePresence>
            {showAiBanner && aiFlashnotesData && (
              <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.95 }}
                className="mb-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl border border-purple-400"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 flex items-center">
                        <Brain className="h-5 w-5 mr-2" />
                        AI Generated Flashcards Ready!
                      </h3>
                      <p className="text-purple-100 mb-4">
                        Your personalized flashcards have been generated based on your conversation. 
                        Study {aiFlashnotesData.length} cards to reinforce your learning.
                      </p>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={startAiFlashcards}
                          className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center"
                        >
                          <Play className="h-5 w-5 mr-2" />
                          Start AI Study Session
                        </button>
                        <div className="text-purple-100 text-sm">
                          {aiFlashnotesData.length} cards • AI Generated
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={dismissAiBanner}
                    className="text-purple-200 hover:text-white transition-colors p-1"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <BookOpen className="h-10 w-10 text-white" />
          </motion.div>
          
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Study Flashcards
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            Review and memorize key concepts with our interactive flashcard system.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <Target className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {aiFlashnotesData ? aiFlashnotesData.length : 0} Cards
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {aiFlashnotesData ? 'AI Generated Notes' : 'No cards available'}
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                ~{aiFlashnotesData ? Math.ceil(aiFlashnotesData.length * 0.5) : 0} Minutes
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Estimated study time</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
              <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Self-Paced</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Study at your own speed</p>
            </div>
          </div>



          <button
            onClick={() => {
              if (aiFlashnotesData && aiFlashnotesData.length > 0) {
                startAiFlashcards()
              } else {
                console.log('No flashcards available to study')
              }
            }}
            disabled={!aiFlashnotesData || aiFlashnotesData.length === 0}
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-pink-700 transition-all duration-200 flex items-center mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="h-6 w-6 mr-3" />
            {aiFlashnotesData && aiFlashnotesData.length > 0 ? 'Start Study Session' : 'No Cards Available'}
          </button>



          {/* Empty State when no flashcards */}
          {(!aiFlashnotesData || aiFlashnotesData.length === 0) && !showAiBanner && (
            <div className="mt-12 text-center py-16">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Flashcards Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Ask the AI assistant to create flashcards for you in the chat!
              </p>
            </div>
          )}
        </motion.div>
      </div>
    )
  }



export default FlashcardsSection 