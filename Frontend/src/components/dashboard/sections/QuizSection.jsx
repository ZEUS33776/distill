import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, 
  Brain, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Trophy, 
  RotateCcw,
  Play,
  ChevronRight,
  Award,
  Target
} from 'lucide-react'

// Sample quiz data - can be replaced with API data later
const sampleQuizzes = [
  {
    id: 1,
    title: "React Fundamentals",
    description: "Test your knowledge of React basics, components, and hooks",
    difficulty: "Beginner",
    estimatedTime: "10 min",
    questions: [
      {
        id: 1,
        question: "What is the correct way to create a functional component in React?",
        options: [
          "function MyComponent() { return <div>Hello</div>; }",
          "const MyComponent = () => { return <div>Hello</div>; }",
          "class MyComponent extends Component { render() { return <div>Hello</div>; } }",
          "Both A and B are correct"
        ],
        correctAnswer: 3,
        explanation: "Both function declarations and arrow functions are valid ways to create functional components in React."
      },
      {
        id: 2,
        question: "Which hook is used to manage state in functional components?",
        options: [
          "useEffect",
          "useState",
          "useContext",
          "useReducer"
        ],
        correctAnswer: 1,
        explanation: "useState is the primary hook for managing local state in functional components."
      },
      {
        id: 3,
        question: "What does the useEffect hook do?",
        options: [
          "Creates state variables",
          "Handles side effects and lifecycle events",
          "Manages component context",
          "Optimizes component performance"
        ],
        correctAnswer: 1,
        explanation: "useEffect handles side effects like API calls, subscriptions, and lifecycle events in functional components."
      },
      {
        id: 4,
        question: "What is JSX?",
        options: [
          "A new programming language",
          "A syntax extension for JavaScript",
          "A CSS framework",
          "A testing library"
        ],
        correctAnswer: 1,
        explanation: "JSX is a syntax extension for JavaScript that allows you to write HTML-like code in your JavaScript files."
      },
      {
        id: 5,
        question: "Which of the following is true about React keys?",
        options: [
          "They are optional for list items",
          "They should be unique among siblings",
          "They can be any random number",
          "They are only needed for forms"
        ],
        correctAnswer: 1,
        explanation: "React keys should be unique among siblings to help React identify which items have changed, added, or removed."
      }
    ]
  },
  {
    id: 2,
    title: "JavaScript ES6+",
    description: "Modern JavaScript features and syntax",
    difficulty: "Intermediate",
    estimatedTime: "15 min",
    questions: [
      {
        id: 1,
        question: "What does the spread operator (...) do?",
        options: [
          "Creates a new array",
          "Expands iterables into individual elements",
          "Merges objects",
          "All of the above"
        ],
        correctAnswer: 3,
        explanation: "The spread operator can expand arrays, merge objects, and create copies of iterables."
      },
      {
        id: 2,
        question: "What is destructuring in JavaScript?",
        options: [
          "Breaking down large functions",
          "Extracting values from arrays or objects",
          "Removing properties from objects",
          "Optimizing code performance"
        ],
        correctAnswer: 1,
        explanation: "Destructuring allows you to extract values from arrays or properties from objects into distinct variables."
      },
      {
        id: 3,
        question: "What is the difference between let and const?",
        options: [
          "let is block-scoped, const is function-scoped",
          "const creates immutable values, let creates mutable values",
          "const cannot be reassigned, let can be reassigned",
          "There is no difference"
        ],
        correctAnswer: 2,
        explanation: "const variables cannot be reassigned after declaration, while let variables can be reassigned within their scope."
      }
    ]
  },
  {
    id: 3,
    title: "CSS Fundamentals",
    description: "Styling, layouts, and responsive design concepts",
    difficulty: "Beginner",
    estimatedTime: "8 min",
    questions: [
      {
        id: 1,
        question: "Which CSS property is used to control the spacing between elements?",
        options: [
          "padding",
          "margin",
          "border",
          "spacing"
        ],
        correctAnswer: 1,
        explanation: "Margin controls the space outside an element's border, creating spacing between elements."
      },
      {
        id: 2,
        question: "What does 'box-sizing: border-box' do?",
        options: [
          "Adds a border to the element",
          "Includes padding and border in the element's total width and height",
          "Creates a box shadow",
          "Changes the element's display type"
        ],
        correctAnswer: 1,
        explanation: "border-box includes padding and border in the element's width and height calculations."
      }
    ]
  }
]

const QuizSection = () => {
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [showResults, setShowResults] = useState(false)
  const [quizStarted, setQuizStarted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)

  // Timer effect
  useEffect(() => {
    if (quizStarted && timeRemaining > 0 && !quizCompleted) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (timeRemaining === 0 && quizStarted) {
      handleQuizComplete()
    }
  }, [timeRemaining, quizStarted, quizCompleted])

  const startQuiz = (quiz) => {
    setSelectedQuiz(quiz)
    setCurrentQuestionIndex(0)
    setSelectedAnswers({})
    setShowResults(false)
    setQuizStarted(true)
    setQuizCompleted(false)
    // Set timer based on estimated time (convert to seconds)
    const minutes = parseInt(quiz.estimatedTime)
    setTimeRemaining(minutes * 60)
  }

  const selectAnswer = (questionId, answerIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }))
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      handleQuizComplete()
    }
  }

  const handleQuizComplete = () => {
    setQuizCompleted(true)
    setShowResults(true)
  }

  const resetQuiz = () => {
    setSelectedQuiz(null)
    setCurrentQuestionIndex(0)
    setSelectedAnswers({})
    setShowResults(false)
    setQuizStarted(false)
    setQuizCompleted(false)
    setTimeRemaining(0)
  }

  const calculateScore = () => {
    if (!selectedQuiz) return { correct: 0, total: 0, percentage: 0 }
    
    const correct = selectedQuiz.questions.reduce((acc, question) => {
      return selectedAnswers[question.id] === question.correctAnswer ? acc + 1 : acc
    }, 0)
    
    const total = selectedQuiz.questions.length
    const percentage = Math.round((correct / total) * 100)
    
    return { correct, total, percentage }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'text-green-600 bg-green-100'
      case 'intermediate': return 'text-yellow-600 bg-yellow-100'
      case 'advanced': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Quiz Selection Screen
  if (!selectedQuiz) {
    return (
      <div className="h-full bg-gradient-to-br from-green-50 to-emerald-50 overflow-y-auto">
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Quizzes</h1>
              <p className="text-gray-600">Test your knowledge with AI-generated quizzes</p>
            </motion.div>

            {/* Quiz Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sampleQuizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer"
                  onClick={() => startQuiz(quiz)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <Brain className="h-6 w-6 text-white" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                      {quiz.difficulty}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{quiz.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{quiz.description}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {quiz.estimatedTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      {quiz.questions.length} questions
                    </div>
                  </div>
                  
                  <button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center gap-2">
                    <Play className="h-4 w-4" />
                    Start Quiz
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Results Screen
  if (showResults) {
    const score = calculateScore()
    const isPassingGrade = score.percentage >= 70

    return (
      <div className="h-full bg-gradient-to-br from-green-50 to-emerald-50 overflow-y-auto">
        <div className="p-6">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center mb-8"
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg ${
                isPassingGrade 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                  : 'bg-gradient-to-r from-orange-500 to-red-500'
              }`}>
                {isPassingGrade ? (
                  <Trophy className="h-10 w-10 text-white" />
                ) : (
                  <Target className="h-10 w-10 text-white" />
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {isPassingGrade ? 'Congratulations!' : 'Keep Studying!'}
              </h1>
              <p className="text-gray-600">You've completed: {selectedQuiz.title}</p>
            </motion.div>

            {/* Score Display */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-8 mb-6"
            >
              <div className="text-center mb-6">
                <div className={`text-6xl font-bold mb-2 ${
                  isPassingGrade ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {score.percentage}%
                </div>
                <p className="text-gray-600">
                  {score.correct} out of {score.total} questions correct
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">{score.correct}</div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="text-2xl font-bold text-red-600">{score.total - score.correct}</div>
                  <div className="text-sm text-gray-600">Incorrect</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Award className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{score.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </motion.div>

            {/* Question Review */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4 mb-8"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Question Review</h2>
              {selectedQuiz.questions.map((question, index) => {
                const userAnswer = selectedAnswers[question.id]
                const isCorrect = userAnswer === question.correctAnswer
                
                return (
                  <div key={question.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                        isCorrect ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-3">{question.question}</p>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className={`p-3 rounded-lg border text-sm ${
                                optionIndex === question.correctAnswer
                                  ? 'border-green-500 bg-green-50 text-green-800'
                                  : optionIndex === userAnswer && !isCorrect
                                  ? 'border-red-500 bg-red-50 text-red-800'
                                  : 'border-gray-200 bg-gray-50 text-gray-700'
                              }`}
                            >
                              {option}
                              {optionIndex === question.correctAnswer && (
                                <CheckCircle className="h-4 w-4 text-green-600 inline ml-2" />
                              )}
                              {optionIndex === userAnswer && !isCorrect && (
                                <XCircle className="h-4 w-4 text-red-600 inline ml-2" />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-blue-800 text-sm">
                            <strong>Explanation:</strong> {question.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex gap-4 justify-center"
            >
              <button
                onClick={() => startQuiz(selectedQuiz)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
              >
                <RotateCcw className="h-4 w-4" />
                Retake Quiz
              </button>
              <button
                onClick={resetQuiz}
                className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Back to Quizzes
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    )
  }

  // Quiz Taking Screen
  const currentQuestion = selectedQuiz.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100

  return (
    <div className="h-full bg-gradient-to-br from-green-50 to-emerald-50 overflow-y-auto">
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          {/* Quiz Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{selectedQuiz.title}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span className={`font-medium ${timeRemaining < 60 ? 'text-red-600' : ''}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <button
                  onClick={resetQuiz}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full"
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-xl shadow-lg p-8 mb-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6 leading-relaxed">
                {currentQuestion.question}
              </h2>
              
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectAnswer(currentQuestion.id, index)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                      selectedAnswers[currentQuestion.id] === index
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : 'border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedAnswers[currentQuestion.id] === index
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedAnswers[currentQuestion.id] === index && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      <span className="flex-1">{option}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between"
          >
            <div className="text-sm text-gray-500">
              {selectedAnswers[currentQuestion.id] !== undefined ? (
                <span className="text-green-600">✓ Answer selected</span>
              ) : (
                <span>Select an answer to continue</span>
              )}
            </div>
            
            <button
              onClick={nextQuestion}
              disabled={selectedAnswers[currentQuestion.id] === undefined}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {currentQuestionIndex === selectedQuiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
              <ChevronRight className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default QuizSection 