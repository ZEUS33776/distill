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
  BookOpen
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
  const [selectedSet, setSelectedSet] = useState(null)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [studySession, setStudySession] = useState(null)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [cardResults, setCardResults] = useState({})
  const [shuffledCards, setShuffledCards] = useState([])
  const [studyMode, setStudyMode] = useState('all') // 'all', 'review', 'unmastered'

  const startStudySession = (flashcardSet, mode = 'all') => {
    setSelectedSet(flashcardSet)
    setStudyMode(mode)
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setSessionComplete(false)
    setCardResults({})
    
    // Filter cards based on study mode
    let cardsToStudy = [...flashcardSet.cards]
    if (mode === 'review') {
      cardsToStudy = cardsToStudy.filter(card => 
        new Date() - new Date(card.lastReviewed) > 24 * 60 * 60 * 1000 // Cards not reviewed in 24h
      )
    } else if (mode === 'unmastered') {
      cardsToStudy = cardsToStudy.filter(card => !card.mastered)
    }
    
    // Shuffle cards for variety
    const shuffled = [...cardsToStudy].sort(() => Math.random() - 0.5)
    setShuffledCards(shuffled)
    
    setStudySession({
      id: Date.now(),
      setId: flashcardSet.id,
      setTitle: flashcardSet.title,
      mode: mode,
      totalCards: shuffled.length,
      startTime: new Date(),
      currentCard: 0
    })
  }

  const flipCard = () => {
    setIsFlipped(!isFlipped)
  }

  const markCard = (difficulty) => {
    const currentCard = shuffledCards[currentCardIndex]
    setCardResults(prev => ({
      ...prev,
      [currentCard.id]: {
        ...currentCard,
        sessionDifficulty: difficulty,
        reviewedAt: new Date()
      }
    }))
    
    nextCard()
  }

  const nextCard = () => {
    if (currentCardIndex < shuffledCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setIsFlipped(false)
    } else {
      completeSession()
    }
  }

  const previousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
      setIsFlipped(false)
    }
  }

  const completeSession = () => {
    setSessionComplete(true)
  }

  const resetSession = () => {
    setSelectedSet(null)
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setStudySession(null)
    setSessionComplete(false)
    setCardResults({})
    setShuffledCards([])
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'hard': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getProgressPercentage = (set) => {
    return Math.round((set.masteredCards / set.totalCards) * 100)
  }

  const getStudyModeCards = (set, mode) => {
    switch (mode) {
      case 'review':
        return set.cards.filter(card => 
          new Date() - new Date(card.lastReviewed) > 24 * 60 * 60 * 1000
        ).length
      case 'unmastered':
        return set.cards.filter(card => !card.mastered).length
      default:
        return set.totalCards
    }
  }

  // Flashcard Set Selection Screen
  if (!selectedSet || !studySession) {
    return (
      <div className="h-full bg-gradient-to-br from-purple-50 to-violet-50 overflow-y-auto">
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Flashcards</h1>
              <p className="text-gray-600">Memorize concepts with spaced repetition</p>
            </motion.div>

            {/* Flashcard Set Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sampleFlashcardSets.map((set, index) => (
                <motion.div
                  key={set.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
                      {set.category}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{set.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{set.description}</p>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{getProgressPercentage(set)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-violet-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${getProgressPercentage(set)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>{set.masteredCards} mastered</span>
                      <span>{set.totalCards} total</span>
                    </div>
                  </div>
                  
                  {/* Study Mode Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={() => startStudySession(set, 'all')}
                      className="w-full bg-gradient-to-r from-purple-500 to-violet-600 text-white py-2 px-4 rounded-lg hover:from-purple-600 hover:to-violet-700 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <Play className="h-4 w-4" />
                      Study All ({set.totalCards})
                    </button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => startStudySession(set, 'review')}
                        disabled={getStudyModeCards(set, 'review') === 0}
                        className="bg-orange-100 text-orange-700 py-2 px-3 rounded-lg hover:bg-orange-200 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Review ({getStudyModeCards(set, 'review')})
                      </button>
                      <button
                        onClick={() => startStudySession(set, 'unmastered')}
                        disabled={getStudyModeCards(set, 'unmastered') === 0}
                        className="bg-red-100 text-red-700 py-2 px-3 rounded-lg hover:bg-red-200 transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Practice ({getStudyModeCards(set, 'unmastered')})
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Session Complete Screen
  if (sessionComplete) {
    const totalCards = shuffledCards.length
    const reviewedCards = Object.keys(cardResults).length
    const easyCards = Object.values(cardResults).filter(card => card.sessionDifficulty === 'easy').length
    const mediumCards = Object.values(cardResults).filter(card => card.sessionDifficulty === 'medium').length
    const hardCards = Object.values(cardResults).filter(card => card.sessionDifficulty === 'hard').length

    return (
      <div className="h-full bg-gradient-to-br from-purple-50 to-violet-50 overflow-y-auto">
        <div className="p-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center mb-8"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-violet-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Complete!</h1>
              <p className="text-gray-600">You've finished studying: {selectedSet.title}</p>
            </motion.div>

            {/* Session Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-8 mb-6"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{totalCards}</div>
                  <div className="text-sm text-gray-600">Cards Studied</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{easyCards}</div>
                  <div className="text-sm text-gray-600">Easy</div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{mediumCards}</div>
                  <div className="text-sm text-gray-600">Medium</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{hardCards}</div>
                  <div className="text-sm text-gray-600">Hard</div>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex gap-4 justify-center"
            >
              <button
                onClick={() => startStudySession(selectedSet, studyMode)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-lg hover:from-purple-600 hover:to-violet-700 transition-all duration-200"
              >
                <RotateCcw className="h-4 w-4" />
                Study Again
              </button>
              <button
                onClick={resetSession}
                className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Back to Sets
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // Study Session Screen
  const currentCard = shuffledCards[currentCardIndex]
  const progress = ((currentCardIndex + 1) / shuffledCards.length) * 100

  return (
    <div className="h-full bg-gradient-to-br from-purple-50 to-violet-50 overflow-y-auto">
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          {/* Session Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{selectedSet.title}</h1>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentCard.difficulty)}`}>
                  {currentCard.difficulty}
                </span>
                <button
                  onClick={resetSession}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Card {currentCardIndex + 1} of {shuffledCards.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="bg-gradient-to-r from-purple-500 to-violet-600 h-2 rounded-full"
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>

          {/* Flashcard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-6"
            style={{ height: '400px', perspective: '1000px' }}
          >
            <motion.div
              className="w-full h-full relative cursor-pointer"
              onClick={flipCard}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front of card */}
              <div 
                className="absolute inset-0 bg-white rounded-xl shadow-lg border border-gray-100 p-8 flex flex-col items-center justify-center"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="text-center">
                  <div className="text-sm text-purple-600 font-medium mb-2">FRONT</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{currentCard.front}</h2>
                  <p className="text-gray-500 text-sm">Click to reveal answer</p>
                </div>
              </div>

              {/* Back of card */}
              <div 
                className="absolute inset-0 bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-xl shadow-lg p-8 flex flex-col justify-center"
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
            </motion.div>
          </motion.div>

          {/* Card Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-4 mb-6"
          >
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span>Reviews: {currentCard.reviewCount}</span>
                <span>Last: {new Date(currentCard.lastReviewed).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                {currentCard.mastered ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Mastered</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="text-orange-600">Learning</span>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Navigation */}
            <div className="flex justify-between items-center">
              <button
                onClick={previousCard}
                disabled={currentCardIndex === 0}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="text-sm text-gray-500">
                {isFlipped ? 'Rate your understanding' : 'Click card to reveal'}
              </div>

              <button
                onClick={nextCard}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                {currentCardIndex === shuffledCards.length - 1 ? 'Finish' : 'Skip'}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Difficulty Rating (only show when flipped) */}
            <AnimatePresence>
              {isFlipped && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-3 gap-3"
                >
                  <button
                    onClick={() => markCard('easy')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all duration-200"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Easy
                  </button>
                  <button
                    onClick={() => markCard('medium')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-all duration-200"
                  >
                    <Star className="h-4 w-4" />
                    Medium
                  </button>
                  <button
                    onClick={() => markCard('hard')}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200"
                  >
                    <XCircle className="h-4 w-4" />
                    Hard
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default FlashcardsSection 