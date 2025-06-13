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
  Target,
  Sparkles,
  X
} from 'lucide-react'

const QuizSection = () => {
  const [selectedQuiz, setSelectedQuiz] = useState(null)
  const [quizState, setQuizState] = useState('home') // 'home', 'quiz', 'results'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [userAnswers, setUserAnswers] = useState({})
  const [timeStarted, setTimeStarted] = useState(null)
  const [timeFinished, setTimeFinished] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(600) // 10 minutes default
  const [aiQuizData, setAiQuizData] = useState(null) // For AI-generated quiz data
  const [showAiBanner, setShowAiBanner] = useState(false)

  // Check for pending quiz data from chat
  useEffect(() => {
    const pendingQuizData = localStorage.getItem('pendingQuizData')
    if (pendingQuizData) {
      try {
        const parsedQuizData = JSON.parse(pendingQuizData)
        console.log('🧠 Found pending quiz data:', parsedQuizData)
        
        // Transform AI quiz data to match our quiz format
        const transformedQuiz = {
          id: 'ai-generated',
          title: "AI Generated Quiz",
          description: "Quiz generated from your conversation with the AI assistant",
          difficulty: "Mixed",
          estimatedTime: `${Math.ceil(parsedQuizData.length * 1.5)} min`,
          questions: parsedQuizData.map((q, index) => ({
            id: index + 1,
            question: q.question,
            options: q.options || [],
            correctAnswer: typeof q.answer === 'string' ? 
              (q.options || []).findIndex(opt => opt.toLowerCase().includes(q.answer.toLowerCase())) :
              q.answer,
            explanation: q.explanation || "No explanation provided."
          }))
        }
        
        setAiQuizData(transformedQuiz)
        setShowAiBanner(true)
        
        console.log('✅ AI quiz data ready:', transformedQuiz)
      } catch (error) {
        console.error('❌ Error parsing pending quiz data:', error)
        localStorage.removeItem('pendingQuizData')
      }
    }
  }, [])

  // Timer effect for quiz
  useEffect(() => {
    let interval = null
    if (quizState === 'quiz' && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => {
          if (time <= 1) {
            // Time's up - auto-submit quiz
            setTimeFinished(Date.now())
            setQuizState('results')
            return 0
          }
          return time - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [quizState, timeRemaining])

  const startAiQuiz = () => {
    if (aiQuizData) {
      setSelectedQuiz(aiQuizData)
      setQuizState('quiz')
      setTimeStarted(Date.now())
      setCurrentQuestionIndex(0)
      setUserAnswers({})
      setTimeRemaining(600) // Reset timer to 10 minutes
      setShowAiBanner(false)
      // Clear the pending data
      localStorage.removeItem('pendingQuizData')
    }
  }

  const dismissAiBanner = () => {
    setShowAiBanner(false)
    setAiQuizData(null)
    localStorage.removeItem('pendingQuizData')
  }

  const selectAnswer = (answerIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answerIndex
    }))
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // Quiz completed
      setTimeFinished(Date.now())
      setQuizState('results')
    }
  }

  const resetQuiz = () => {
    setQuizState('home')
    setSelectedQuiz(null)
    setCurrentQuestionIndex(0)
    setUserAnswers({})
    setTimeStarted(null)
    setTimeFinished(null)
    setTimeRemaining(600)
  }

  const calculateScore = () => {
    let correct = 0
    selectedQuiz.questions.forEach((question, index) => {
      if (userAnswers[index] === question.correctAnswer) {
        correct++
      }
    })
    return {
      correct,
      total: selectedQuiz.questions.length,
      percentage: Math.round((correct / selectedQuiz.questions.length) * 100)
    }
  }

  const getTimeTaken = () => {
    if (timeStarted && timeFinished) {
      return Math.round((timeFinished - timeStarted) / 1000)
    }
    return 0
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Home screen - show AI banner or empty state
  if (quizState === 'home') {
    return (
      <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* AI Quiz Banner */}
          <AnimatePresence>
            {showAiBanner && aiQuizData && (
              <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -50, scale: 0.95 }}
                className="mb-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl border border-green-400"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 flex items-center">
                        <Brain className="h-5 w-5 mr-2" />
                        AI Generated Quiz Ready!
                      </h3>
                      <p className="text-green-100 mb-4">
                        Your personalized quiz has been generated based on your conversation. 
                        It contains {aiQuizData.questions.length} questions and should take about {aiQuizData.estimatedTime} to complete.
                      </p>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={startAiQuiz}
                          className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center"
                        >
                          <Play className="h-5 w-5 mr-2" />
                          Start AI Quiz
                        </button>
                        <div className="text-green-100 text-sm">
                          {aiQuizData.questions.length} questions • {aiQuizData.difficulty} difficulty
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={dismissAiBanner}
                    className="text-green-200 hover:text-white transition-colors p-1"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State - Only show when no AI quiz */}
          {!showAiBanner && (
            <div className="text-center py-16">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <Brain className="h-12 w-12 text-white" />
              </motion.div>
              
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Smart Quizzes
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
                No quizzes available yet. Ask the AI assistant to generate a quiz for you based on any topic!
              </p>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-200 dark:border-gray-700 max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  How to get started:
                </h3>
                <div className="text-left space-y-3 text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">1</div>
                    <span>Go to the Chat tab</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">2</div>
                    <span>Ask about any topic you want to learn</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">3</div>
                    <span>Request a quiz to test your knowledge</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  // Results screen
  if (quizState === 'results') {
    const score = calculateScore()
    const timeTaken = getTimeTaken()

    return (
      <div className="h-full bg-gradient-to-br from-green-50 to-emerald-50 overflow-y-auto">
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-xl p-8 text-center"
            >
              {/* Results Header */}
              <div className="mb-8">
                <div className="w-20 h-20 mx-auto mb-4">
                  {score.percentage >= 80 ? (
                    <div className="w-full h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <Trophy className="h-10 w-10 text-white" />
                    </div>
                  ) : score.percentage >= 60 ? (
                    <div className="w-full h-full bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                      <Award className="h-10 w-10 text-white" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center">
                      <Target className="h-10 w-10 text-white" />
                    </div>
                  )}
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Quiz Completed!
                </h1>
                <p className="text-gray-600">
                  {score.percentage >= 80 ? 'Excellent work!' : 
                   score.percentage >= 60 ? 'Good job!' : 
                   'Keep practicing!'}
                </p>
              </div>

              {/* Score Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {score.correct}/{score.total}
                  </div>
                  <div className="text-gray-600">Questions Correct</div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {score.percentage}%
                  </div>
                  <div className="text-gray-600">Accuracy</div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {formatTime(timeTaken)}
                  </div>
                  <div className="text-gray-600">Time Taken</div>
                </div>
              </div>

              {/* Question Review */}
              <div className="text-left mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Question Review</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {selectedQuiz.questions.map((question, index) => {
                    const userAnswer = userAnswers[index]
                    const isCorrect = userAnswer === question.correctAnswer
                    
                    return (
                      <div key={question.id} className={`p-4 rounded-lg border-2 ${
                        isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                      }`}>
                        <div className="flex items-start gap-3 mb-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isCorrect ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            {isCorrect ? (
                              <CheckCircle className="h-4 w-4 text-white" />
                            ) : (
                              <XCircle className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-2">
                              Question {index + 1}: {question.question}
                            </h4>
                            <div className="text-sm text-gray-600">
                              <div className="mb-1">
                                <strong>Your answer:</strong> {question.options[userAnswer] || 'No answer'}
                              </div>
                              <div className="mb-1">
                                <strong>Correct answer:</strong> {question.options[question.correctAnswer]}
                              </div>
                              {question.explanation && (
                                <div className="mt-2 text-gray-700">
                                  <strong>Explanation:</strong> {question.explanation}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4">
                <button
                  onClick={resetQuiz}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                >
                  <RotateCcw className="h-4 w-4" />
                  Take Another Quiz
                </button>
              </div>
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
                    onClick={() => selectAnswer(index)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                      userAnswers[currentQuestionIndex] === index
                        ? 'border-green-500 bg-green-50 text-green-800'
                        : 'border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        userAnswers[currentQuestionIndex] === index
                          ? 'border-green-500 bg-green-500'
                          : 'border-gray-300'
                      }`}>
                        {userAnswers[currentQuestionIndex] === index && (
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
              {userAnswers[currentQuestionIndex] !== undefined ? (
                <span className="text-green-600">✓ Answer selected</span>
              ) : (
                <span>Select an answer to continue</span>
              )}
            </div>
            
            <button
              onClick={nextQuestion}
              disabled={userAnswers[currentQuestionIndex] === undefined}
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