import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import apiService from '../../../services/api'
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
  X,
  Trash2
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
  const [userQuizzes, setUserQuizzes] = useState([]) // Store user's quiz history
  const [loadingQuizzes, setLoadingQuizzes] = useState(false)
  const [sessionResults, setSessionResults] = useState(null) // Store session results with comparison
  const [loadingResults, setLoadingResults] = useState(false)

  // Function to fetch user quizzes from backend
  const fetchUserQuizzes = async () => {
    setLoadingQuizzes(true)
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      const userId = userData.user_id || 'test-user-frontend'
      
      console.log('🔍 Fetching quizzes for user:', userId)
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/study-sessions/user/${userId}/quiz`)
      
      if (response.ok) {
        const quizzes = await response.json()
        console.log('✅ Fetched user quizzes:', quizzes)
        setUserQuizzes(quizzes)
      } else {
        console.error('❌ Failed to fetch user quizzes:', response.status)
      }
    } catch (error) {
      console.error('❌ Error fetching user quizzes:', error)
    } finally {
      setLoadingQuizzes(false)
    }
  }

  // Check for pending quiz data from chat and fetch user quizzes
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
          questions: parsedQuizData.map((q, index) => {
            console.log(`🔍 Processing question ${index + 1}:`, q)
            
            // Handle different possible data structures
            let question = q.question || q.text || q.prompt || `Question ${index + 1}`
            let options = q.options || q.choices || []
            let correctAnswer = q.correctAnswer || q.answer || q.correct || 0
            let explanation = q.explanation || q.reason || "No explanation provided."
            
            // If answer is a string and we have options, find the index
            if (typeof correctAnswer === 'string' && options.length > 0) {
              const answerIndex = options.findIndex(opt => 
                opt.toLowerCase().includes(correctAnswer.toLowerCase()) ||
                correctAnswer.toLowerCase().includes(opt.toLowerCase())
              )
              correctAnswer = answerIndex >= 0 ? answerIndex : 0
            }
            
            // Ensure correctAnswer is a valid index
            if (typeof correctAnswer !== 'number' || correctAnswer < 0 || correctAnswer >= options.length) {
              correctAnswer = 0
            }
            
            return {
              id: index + 1,
              question: question,
              options: options,
              correctAnswer: correctAnswer,
              explanation: explanation
            }
          })
        }
        
        // Validate the transformed quiz data
        if (transformedQuiz.questions && transformedQuiz.questions.length > 0) {
          setAiQuizData(transformedQuiz)
          setShowAiBanner(true)
          console.log('✅ AI quiz data ready:', transformedQuiz)
        } else {
          console.error('❌ Invalid quiz data - no questions found')
          localStorage.removeItem('pendingQuizData')
        }
      } catch (error) {
        console.error('❌ Error parsing pending quiz data:', error)
        localStorage.removeItem('pendingQuizData')
      }
    }
    
    // Fetch user's quiz history
    fetchUserQuizzes()
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

  const startSavedQuiz = (savedQuiz) => {
    console.log('🔍 Starting saved quiz:', savedQuiz)
    
    // Handle content - it should already be parsed by the backend
    let quizContent = savedQuiz.content
    
    // If for some reason it's still a string, parse it
    if (typeof quizContent === 'string') {
      try {
        quizContent = JSON.parse(quizContent)
      } catch (error) {
        console.error('Failed to parse quiz content:', error)
        return
      }
    }
    
    // Ensure quizContent is an array
    if (!Array.isArray(quizContent)) {
      console.error('Quiz content is not an array:', quizContent)
      return
    }
    
    console.log('🔍 Quiz content:', quizContent)
    
    // Transform saved quiz data to match our quiz format
    const transformedQuiz = {
      id: savedQuiz.id,
      title: savedQuiz.name,
      description: "Previously generated quiz",
      difficulty: "Mixed",
      estimatedTime: `${Math.ceil(quizContent.length * 1.5)} min`,
      questions: quizContent.map((q, index) => {
        console.log(`🔍 Processing saved question ${index + 1}:`, q)
        
        // Handle different possible data structures
        let question = q.question || q.text || q.prompt || `Question ${index + 1}`
        let options = q.options || q.choices || []
        let correctAnswer = q.correctAnswer || q.answer || q.correct || 0
        let explanation = q.explanation || q.reason || "No explanation provided."
        
        // If answer is a string and we have options, find the index
        if (typeof correctAnswer === 'string' && options.length > 0) {
          const answerIndex = options.findIndex(opt => 
            opt.toLowerCase().includes(correctAnswer.toLowerCase()) ||
            correctAnswer.toLowerCase().includes(opt.toLowerCase())
          )
          correctAnswer = answerIndex >= 0 ? answerIndex : 0
        }
        
        // Ensure correctAnswer is a valid index
        if (typeof correctAnswer !== 'number' || correctAnswer < 0 || correctAnswer >= options.length) {
          correctAnswer = 0
        }
        
        return {
          id: index + 1,
          question: question,
          options: options,
          correctAnswer: correctAnswer,
          explanation: explanation
        }
      })
    }
    
    console.log('🔍 Transformed quiz:', transformedQuiz)
    
    // Validate the transformed quiz data
    if (transformedQuiz.questions && transformedQuiz.questions.length > 0) {
      setSelectedQuiz(transformedQuiz)
      setQuizState('quiz')
    setCurrentQuestionIndex(0)
      setUserAnswers({})
      setTimeStarted(Date.now())
      setTimeRemaining(600) // 10 minutes
    } else {
      console.error('❌ Invalid saved quiz data - no questions found')
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

  const nextQuestion = async () => {
    if (currentQuestionIndex < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      // Quiz completed
      const finishTime = Date.now()
      setTimeFinished(finishTime)
      
      // Calculate results and store them
      const score = calculateScore()
      const timeTaken = Math.round((finishTime - timeStarted) / 1000)
      
      // Store session results
      await storeSessionResult(score, timeTaken)
      
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

  // Function to store session results
  const storeSessionResult = async (score, timeTaken) => {
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}')
      const userId = userData.user_id || 'test-user-frontend'
      
      // Find the study session ID for this quiz
      let studySessionId = null
      if (selectedQuiz.id !== 'ai-generated') {
        studySessionId = String(selectedQuiz.id) // Convert to string to match backend expectation
      } else {
        // For AI-generated quizzes, create a consistent session ID based on quiz content
        // This ensures the same quiz content always gets the same ID for proper comparison
        try {
          // Create a more stable hash by sorting questions and using consistent formatting
          const sortedQuestions = selectedQuiz.questions
            .map(q => ({
              question: (q.question || '').trim(),
              options: (q.options || []).map(opt => opt.trim()).sort(),
              correctAnswer: q.correctAnswer || 0
            }))
            .sort((a, b) => a.question.localeCompare(b.question))
          
          const contentString = JSON.stringify(sortedQuestions)
          // Use a more reliable hash function
          let hash = 0
          for (let i = 0; i < contentString.length; i++) {
            const char = contentString.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash // Convert to 32-bit integer
          }
          const quizContentHash = Math.abs(hash).toString(36).slice(0, 10)
          studySessionId = `ai-quiz-${quizContentHash}`
        } catch (error) {
          console.error('Error creating quiz hash:', error)
          // Fallback to timestamp-based ID if hashing fails
          studySessionId = `ai-quiz-${Date.now()}`
        }
      }

      // Calculate detailed results
      const detailedResults = selectedQuiz.questions.map((question, index) => ({
        question_id: question.id || index + 1, // Use index + 1 as fallback if no ID
        question: question.question || 'Question not available',
        user_answer: userAnswers[index] !== undefined ? userAnswers[index] : -1,
        correct_answer: question.correctAnswer !== undefined ? question.correctAnswer : -1,
        is_correct: userAnswers[index] === question.correctAnswer,
        time_spent: Math.round(timeTaken / selectedQuiz.questions.length) // Approximate time per question
      }))

      // Calculate difficulty breakdown (simplified)
      const difficultyBreakdown = {
        easy: { correct: 0, total: 0 },
        medium: { correct: 0, total: 0 },
        hard: { correct: 0, total: 0 }
      }

      selectedQuiz.questions.forEach((question, index) => {
        const difficulty = 'medium' // Default since we don't have difficulty info
        difficultyBreakdown[difficulty].total++
        if (userAnswers[index] === question.correctAnswer) {
          difficultyBreakdown[difficulty].correct++
        }
      })

      const payload = {
        study_session_id: studySessionId,
        user_id: userId,
        session_type: 'quiz',
        session_name: selectedQuiz.title,
        total_questions: selectedQuiz.questions.length,
        correct_answers: score.correct,
        incorrect_answers: selectedQuiz.questions.length - score.correct,
        skipped_answers: 0,
        accuracy_percentage: score.percentage,
        time_spent_seconds: timeTaken,
        difficulty_breakdown: difficultyBreakdown,
        detailed_results: detailedResults
      }

      console.log('💾 Storing quiz session result:', payload)
      console.log(`🔍 Quiz tracking: "${selectedQuiz.title}" with session ID: ${studySessionId}`)

      // Validate payload before sending
      if (!payload.study_session_id || !payload.user_id || !payload.session_name) {
        console.error('❌ Invalid payload - missing required fields:', {
          study_session_id: payload.study_session_id,
          user_id: payload.user_id,
          session_name: payload.session_name
        })
        return
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/session-results/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Session result stored successfully:', result)
        
        // Fetch comparison data
        await fetchSessionComparison(userId, studySessionId)
      } else {
        console.error('❌ Failed to store session result:', response.status)
        try {
          const errorDetail = await response.json()
          console.error('❌ Detailed error:', errorDetail)
        } catch (e) {
          console.error('❌ Error response text:', await response.text())
        }
      }
    } catch (error) {
      console.error('❌ Error storing session result:', error)
    }
  }

  // Function to fetch session comparison data
  const fetchSessionComparison = async (userId, studySessionId) => {
    setLoadingResults(true)
    try {
      console.log(`🔍 Fetching comparison for quiz session: ${studySessionId}`)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/session-results/user/${userId}/session/${studySessionId}/comparison`)
      
      if (response.ok) {
        const comparisonData = await response.json()
        console.log('✅ Fetched session comparison:', comparisonData)
        console.log(`📊 Comparison shows ${comparisonData.previous_results.length} previous attempts of this same quiz`)
        setSessionResults(comparisonData)
      } else {
        console.error('❌ Failed to fetch session comparison:', response.status)
      }
    } catch (error) {
      console.error('❌ Error fetching session comparison:', error)
    } finally {
      setLoadingResults(false)
    }
  }

  // Function to delete a quiz
  const deleteQuiz = async (quizId, quizName) => {
    if (window.confirm(`Are you sure you want to delete "${quizName}"? This action cannot be undone.`)) {
      try {
        await apiService.deleteStudySession(quizId)
        // Refresh the quiz list
        await fetchUserQuizzes()
        console.log('✅ Quiz deleted successfully')
      } catch (error) {
        console.error('❌ Error deleting quiz:', error)
        alert('Failed to delete quiz. Please try again.')
      }
    }
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

          {/* Quiz Library - Show saved quizzes */}
          {!showAiBanner && (
            <div>
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <Brain className="h-12 w-12 text-white" />
            </motion.div>

                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Quiz Library
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  {userQuizzes.length > 0 ? 
                    'Choose from your previously generated quizzes or ask the AI to create a new one!' :
                    'No quizzes available yet. Ask the AI assistant to generate a quiz for you based on any topic!'
                  }
                </p>
              </div>

              {/* Loading State */}
              {loadingQuizzes && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">Loading your quizzes...</p>
                </div>
              )}

              {/* User Quizzes Grid */}
              {!loadingQuizzes && userQuizzes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {userQuizzes.map((quiz) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                      className="group bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200 cursor-pointer relative"
                      onClick={() => startSavedQuiz(quiz)}
                >
                  <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(quiz.created_at).toLocaleDateString()}
                    </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteQuiz(quiz.id, quiz.name)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200"
                        title="Delete quiz"
                        aria-label={`Delete quiz: ${quiz.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                  
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {quiz.name}
                      </h3>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                        {Array.isArray(quiz.content) ? quiz.content.length : 'Unknown'} questions • Mixed difficulty
                  </div>
                  
                      <button 
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation()
                          startSavedQuiz(quiz)
                        }}
                      >
                        <Play className="h-4 w-4 mr-2" />
                    Start Quiz
                  </button>
                </motion.div>
              ))}
                </div>
              )}

              {/* Empty State - Show when no quizzes */}
              {!loadingQuizzes && userQuizzes.length === 0 && (
                <div className="text-center py-8">
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
      <div className="h-full bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 overflow-y-auto">
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
            >
              {/* Results Header */}
              <div className="text-center mb-8">
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
                
                {/* Performance Improvement Indicator */}
                {sessionResults?.improvement_stats && !sessionResults.improvement_stats.is_first_attempt && (
                  <div className="mt-4">
                    {sessionResults.improvement_stats.is_personal_best && (
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
                        <Trophy className="h-4 w-4" />
                        Personal Best!
                      </div>
                    )}
                    {sessionResults.improvement_stats.accuracy_improvement > 0 && (
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium ml-2">
                        <ChevronRight className="h-4 w-4 rotate-90" />
                        +{sessionResults.improvement_stats.accuracy_improvement}% improvement
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Score Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {score.correct}/{score.total}
                  </div>
                  <div className="text-gray-600">Questions Correct</div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {score.percentage}%
                  </div>
                  <div className="text-gray-600">Accuracy</div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {formatTime(timeTaken)}
                  </div>
                  <div className="text-gray-600">Time Taken</div>
                </div>
              </div>

              {/* Previous Results Comparison */}
              {sessionResults && !loadingResults && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Performance Comparison</h3>
                  <p className="text-sm text-gray-600 text-center mb-4">
                    Comparing with your previous attempts of "{selectedQuiz.title}"
                  </p>
                  
                  {sessionResults.improvement_stats.is_first_attempt ? (
                    <div className="bg-blue-50 rounded-xl p-6 text-center">
                      <div className="text-blue-600 font-medium">🎉 First attempt at this specific quiz!</div>
                      <div className="text-gray-600 text-sm mt-1">Take this quiz again to track your improvement</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                        <div className="text-sm text-gray-600 mb-1">Accuracy Change</div>
                        <div className={`text-2xl font-bold ${
                          sessionResults.improvement_stats.accuracy_improvement > 0 ? 'text-green-600' : 
                          sessionResults.improvement_stats.accuracy_improvement < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {sessionResults.improvement_stats.accuracy_improvement > 0 ? '+' : ''}
                          {sessionResults.improvement_stats.accuracy_improvement}%
                        </div>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                        <div className="text-sm text-gray-600 mb-1">Performance Trend</div>
                        <div className={`text-lg font-semibold capitalize ${
                          sessionResults.improvement_stats.performance_trend === 'improving' ? 'text-green-600' : 
                          sessionResults.improvement_stats.performance_trend === 'declining' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {sessionResults.improvement_stats.performance_trend}
                        </div>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                        <div className="text-sm text-gray-600 mb-1">Previous Best</div>
                        <div className="text-2xl font-bold text-purple-600">
                          {sessionResults.improvement_stats.best_previous_accuracy}%
                        </div>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                        <div className="text-sm text-gray-600 mb-1">Total Attempts</div>
                        <div className="text-2xl font-bold text-indigo-600">
                          {sessionResults.improvement_stats.total_previous_attempts + 1}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Previous Results History */}
                  {sessionResults.previous_results.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-3">
                        Previous Attempts of This Quiz ({sessionResults.previous_results.length})
                      </h4>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {sessionResults.previous_results.slice(0, 6).map((result, index) => (
                            <div key={result.id} className="bg-white rounded-lg p-3 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600">
                                  {new Date(result.completed_at).toLocaleDateString()}
                                </span>
                                <span className={`font-semibold ${
                                  result.accuracy_percentage >= 80 ? 'text-green-600' : 
                                  result.accuracy_percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {result.accuracy_percentage}%
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {result.correct_answers}/{result.total_questions} correct • {formatTime(result.time_spent_seconds)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {loadingResults && (
                <div className="mb-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">Loading performance comparison...</p>
                </div>
              )}

            {/* Question Review */}
              <div className="text-left mb-8">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Question Review</h3>
                <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedQuiz.questions.map((question, index) => {
                    const userAnswer = userAnswers[index]
                const isCorrect = userAnswer === question.correctAnswer
                
                return (
                      <div key={question.id} className={`p-4 rounded-lg border-2 ${
                        isCorrect ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30' : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30'
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
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                              Question {index + 1}: {typeof question.question === 'string' ? question.question : 'Question unavailable'}
                            </h4>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              <div className="mb-1">
                                <strong>Your answer:</strong> {(question.options && question.options[userAnswer]) || 'No answer'}
                              </div>
                              <div className="mb-1">
                                <strong>Correct answer:</strong> {(question.options && question.options[question.correctAnswer]) || 'Answer unavailable'}
                              </div>
                              {question.explanation && typeof question.explanation === 'string' && (
                                <div className="mt-2 text-gray-700 dark:text-gray-300">
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
  const currentQuestion = selectedQuiz?.questions?.[currentQuestionIndex]
  const progress = selectedQuiz?.questions?.length ? ((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100 : 0
  
  // Safety check - if no current question, return to home
  if (!currentQuestion) {
    console.error('❌ No current question found, returning to home')
    setQuizState('home')
    return null
  }

  return (
    <div className="h-full bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 overflow-y-auto">
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          {/* Quiz Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedQuiz.title}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <Clock className="h-4 w-4" />
                  <span className={`font-medium ${timeRemaining < 60 ? 'text-red-600' : ''}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <button
                  onClick={resetQuiz}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                <span>Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
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
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 leading-relaxed">
                {typeof currentQuestion.question === 'string' ? currentQuestion.question : 'Question text unavailable'}
              </h2>
              
              <div className="space-y-3">
                {(currentQuestion.options || []).map((option, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => selectAnswer(index)}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                      userAnswers[currentQuestionIndex] === index
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                        : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-700 dark:text-gray-300'
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
                      <span className="flex-1">{typeof option === 'string' ? option : 'Option unavailable'}</span>
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
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {userAnswers[currentQuestionIndex] !== undefined ? (
                <span className="text-green-600 dark:text-green-400">✓ Answer selected</span>
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