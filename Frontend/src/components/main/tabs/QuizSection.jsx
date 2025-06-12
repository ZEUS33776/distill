import { useState } from 'react'
import { Brain, CheckCircle, XCircle, RotateCcw, Play, Trophy, Target, Clock } from 'lucide-react'

const QuizSection = () => {
  const [quizState, setQuizState] = useState('landing') // 'landing', 'active', 'results'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [showExplanation, setShowExplanation] = useState(false)
  const [score, setScore] = useState(0)
  const [timeSpent, setTimeSpent] = useState(0)
  const [startTime, setStartTime] = useState(null)

  const sampleQuestions = [
    {
      id: 1,
      question: "What is the primary purpose of React's useEffect hook?",
      options: [
        "To manage component state",
        "To handle side effects in functional components",
        "To create reusable components",
        "To optimize component rendering"
      ],
      correctAnswer: 1,
      explanation: "useEffect is specifically designed to handle side effects in functional components, such as data fetching, subscriptions, or DOM manipulation. It replaces lifecycle methods like componentDidMount and componentDidUpdate.",
      difficulty: "Medium",
      topic: "React Hooks"
    },
    {
      id: 2,
      question: "Which SQL command is used to retrieve data from a database?",
      options: [
        "INSERT",
        "UPDATE",
        "SELECT",
        "DELETE"
      ],
      correctAnswer: 2,
      explanation: "SELECT is the SQL command used to query and retrieve data from database tables. It can be combined with WHERE clauses, JOINs, and other operators to filter and organize the results.",
      difficulty: "Easy",
      topic: "SQL Basics"
    },
    {
      id: 3,
      question: "What is the time complexity of binary search?",
      options: [
        "O(n)",
        "O(log n)",
        "O(n²)",
        "O(1)"
      ],
      correctAnswer: 1,
      explanation: "Binary search has O(log n) time complexity because it eliminates half of the remaining elements in each step. This makes it much more efficient than linear search for sorted arrays.",
      difficulty: "Medium",
      topic: "Algorithms"
    },
    {
      id: 4,
      question: "Which CSS property is used to create flexible layouts?",
      options: [
        "display: block",
        "display: inline",
        "display: flex",
        "display: none"
      ],
      correctAnswer: 2,
      explanation: "display: flex creates a flexible container that can arrange its children in rows or columns, with powerful alignment and distribution capabilities. It's part of the CSS Flexbox layout model.",
      difficulty: "Easy",
      topic: "CSS Layout"
    },
    {
      id: 5,
      question: "What is machine learning?",
      options: [
        "A type of computer hardware",
        "A programming language",
        "A method for computers to learn patterns from data",
        "A database management system"
      ],
      correctAnswer: 2,
      explanation: "Machine learning is a subset of artificial intelligence where computers learn to recognize patterns and make decisions from data without being explicitly programmed for each specific task.",
      difficulty: "Easy",
      topic: "Machine Learning"
    }
  ]

  const startQuiz = () => {
    setQuizState('active')
    setCurrentQuestionIndex(0)
    setSelectedAnswers({})
    setShowExplanation(false)
    setScore(0)
    setStartTime(Date.now())
  }

  const handleAnswerSelect = (answerIndex) => {
    if (showExplanation) return

    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: answerIndex
    })
    setShowExplanation(true)

    // Update score if correct
    if (answerIndex === sampleQuestions[currentQuestionIndex].correctAnswer) {
      setScore(score + 1)
    }
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < sampleQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setShowExplanation(false)
    } else {
      // Quiz finished
      const endTime = Date.now()
      setTimeSpent(Math.round((endTime - startTime) / 1000))
      setQuizState('results')
    }
  }

  const resetQuiz = () => {
    setQuizState('landing')
    setCurrentQuestionIndex(0)
    setSelectedAnswers({})
    setShowExplanation(false)
    setScore(0)
    setTimeSpent(0)
    setStartTime(null)
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-success'
      case 'Medium': return 'text-warning'
      case 'Hard': return 'text-danger'
      default: return 'text-muted'
    }
  }

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'text-success'
    if (percentage >= 60) return 'text-warning'
    return 'text-danger'
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Landing Page
  if (quizState === 'landing') {
    return (
      <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border-light scrollbar-track-transparent">
        <div className="min-h-full flex items-center justify-center p-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 bg-accent-gradient rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow">
              <Brain className="h-12 w-12 text-white" />
            </div>
            
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
              Knowledge Quiz
            </h1>
            <p className="text-lg text-muted mb-8 leading-relaxed">
              Test your understanding with AI-generated questions based on your study materials and general knowledge.
            </p>

            {/* Quiz Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-bg-glass border border-border-light rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-center mb-3">
                  <Target className="h-8 w-8 text-accent-primary" />
                </div>
                <h3 className="font-semibold text-primary mb-1">{sampleQuestions.length} Questions</h3>
                <p className="text-sm text-muted">Mixed difficulty levels</p>
              </div>
              
              <div className="bg-bg-glass border border-border-light rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-center mb-3">
                  <Clock className="h-8 w-8 text-info" />
                </div>
                <h3 className="font-semibold text-primary mb-1">~5 Minutes</h3>
                <p className="text-sm text-muted">Estimated duration</p>
              </div>
              
              <div className="bg-bg-glass border border-border-light rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-center mb-3">
                  <Trophy className="h-8 w-8 text-warning" />
                </div>
                <h3 className="font-semibold text-primary mb-1">Instant Results</h3>
                <p className="text-sm text-muted">With explanations</p>
              </div>
            </div>

            {/* Topics Covered */}
            <div className="bg-bg-tertiary rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-primary mb-4">Topics Covered</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {['React Hooks', 'SQL Basics', 'Algorithms', 'CSS Layout', 'Machine Learning'].map(topic => (
                  <span key={topic} className="px-3 py-1 bg-accent-primary/10 text-accent-primary rounded-full text-sm border border-accent-primary/20">
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={startQuiz}
              className="btn btn-primary px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl"
            >
              <Play className="h-6 w-6 mr-3" />
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Quiz Active State
  if (quizState === 'active') {
    const currentQuestion = sampleQuestions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / sampleQuestions.length) * 100

    return (
      <div className="h-full flex flex-col bg-primary">
        {/* Header with progress */}
        <div className="border-b border-border-light bg-bg-glass backdrop-blur-lg p-4 md:p-6 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-gradient rounded-xl flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-primary">Question {currentQuestionIndex + 1}</h2>
                  <p className="text-sm text-muted">of {sampleQuestions.length}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted">Score</p>
                <p className="font-semibold text-primary">{score}/{currentQuestionIndex + (showExplanation ? 1 : 0)}</p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-bg-tertiary rounded-full h-2">
              <div 
                className="bg-accent-gradient h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Content - Scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border-light scrollbar-track-transparent">
          <div className="p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-bg-glass border border-border-light rounded-2xl p-6 md:p-8 backdrop-blur-sm">
                {/* Question meta */}
                <div className="flex items-center gap-4 mb-6">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(currentQuestion.difficulty)}`}
                        style={{ 
                          backgroundColor: `var(--${currentQuestion.difficulty.toLowerCase() === 'easy' ? 'success' : currentQuestion.difficulty.toLowerCase() === 'medium' ? 'warning' : 'danger'}-light)`,
                          borderColor: `var(--${currentQuestion.difficulty.toLowerCase() === 'easy' ? 'success' : currentQuestion.difficulty.toLowerCase() === 'medium' ? 'warning' : 'danger'})`
                        }}>
                    {currentQuestion.difficulty}
                  </span>
                  <span className="px-3 py-1 bg-accent-primary/10 text-accent-primary rounded-full text-sm border border-accent-primary/20">
                    {currentQuestion.topic}
                  </span>
                </div>

                {/* Question */}
                <h3 className="text-xl md:text-2xl font-semibold text-primary mb-8 leading-relaxed">
                  {currentQuestion.question}
                </h3>

                {/* Answer options */}
                <div className="space-y-4 mb-8">
                  {currentQuestion.options.map((option, index) => {
                    const isSelected = selectedAnswers[currentQuestionIndex] === index
                    const isCorrect = index === currentQuestion.correctAnswer
                    const showResult = showExplanation

                    let buttonClass = "w-full p-4 text-left border rounded-xl transition-all duration-200 "
                    
                    if (showResult) {
                      if (isCorrect) {
                        buttonClass += "border-success bg-success-light text-success"
                      } else if (isSelected && !isCorrect) {
                        buttonClass += "border-danger bg-danger-light text-danger"
                      } else {
                        buttonClass += "border-border-light bg-bg-tertiary text-muted"
                      }
                    } else {
                      if (isSelected) {
                        buttonClass += "border-accent-primary bg-accent-primary/10 text-accent-primary"
                      } else {
                        buttonClass += "border-border-light bg-bg-tertiary text-primary hover:border-accent-primary hover:bg-accent-primary/5"
                      }
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={showExplanation}
                        className={buttonClass}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                            showResult && isCorrect ? 'bg-success text-white' :
                            showResult && isSelected && !isCorrect ? 'bg-danger text-white' :
                            isSelected ? 'bg-accent-primary text-white' :
                            'bg-bg-hover text-muted'
                          }`}>
                            {showResult && isCorrect ? <CheckCircle className="h-4 w-4" /> :
                             showResult && isSelected && !isCorrect ? <XCircle className="h-4 w-4" /> :
                             String.fromCharCode(65 + index)}
                          </div>
                          <span className="font-medium">{option}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Explanation */}
                {showExplanation && (
                  <div className="bg-accent-primary/5 border border-accent-primary/20 rounded-xl p-6 mb-6">
                    <h4 className="font-semibold text-accent-primary mb-3 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Explanation
                    </h4>
                    <p className="text-primary leading-relaxed">{currentQuestion.explanation}</p>
                  </div>
                )}

                {/* Continue button */}
                {showExplanation && (
                  <div className="flex justify-center">
                    <button
                      onClick={nextQuestion}
                      className="btn btn-primary px-8 py-3 font-semibold"
                    >
                      {currentQuestionIndex < sampleQuestions.length - 1 ? 'Next Question' : 'View Results'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Results State
  if (quizState === 'results') {
    const percentage = Math.round((score / sampleQuestions.length) * 100)
    
    return (
      <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border-light scrollbar-track-transparent">
        <div className="min-h-full flex items-center justify-center p-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 bg-accent-gradient rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow">
              <Trophy className="h-12 w-12 text-white" />
            </div>

            <h1 className="text-4xl font-bold mb-4">Quiz Complete!</h1>
            <p className="text-lg text-muted mb-8">Here are your results</p>

            {/* Score display */}
            <div className="bg-bg-glass border border-border-light rounded-2xl p-8 mb-8 backdrop-blur-sm">
              <div className={`text-6xl font-bold mb-4 ${getScoreColor(percentage)}`}>
                {percentage}%
              </div>
              <p className="text-xl text-primary mb-4">
                {score} out of {sampleQuestions.length} correct
              </p>
              <p className="text-muted">
                Completed in {formatTime(timeSpent)}
              </p>
            </div>

            {/* Performance message */}
            <div className="bg-bg-tertiary rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-primary mb-2">
                {percentage >= 80 ? 'Excellent work! 🎉' :
                 percentage >= 60 ? 'Good job! 👍' :
                 'Keep practicing! 💪'}
              </h3>
              <p className="text-muted">
                {percentage >= 80 ? 'You have a strong understanding of these topics.' :
                 percentage >= 60 ? 'You\'re on the right track. Review the explanations to improve.' :
                 'Focus on studying the topics you missed and try again.'}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={resetQuiz}
                className="btn btn-primary px-6 py-3 font-semibold"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Try Again
              </button>
              <button
                onClick={() => setQuizState('landing')}
                className="btn btn-secondary px-6 py-3 font-semibold"
              >
                Back to Quiz Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default QuizSection 