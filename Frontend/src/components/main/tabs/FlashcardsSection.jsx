import { useState } from 'react'
import { BookOpen, RotateCcw, ChevronLeft, ChevronRight, Play, Trophy, Target, Clock, Check, X } from 'lucide-react'

const FlashcardsSection = () => {
  const [studyState, setStudyState] = useState('landing') // 'landing', 'studying', 'completed'
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [flippedCards, setFlippedCards] = useState(new Set())
  const [cardResults, setCardResults] = useState({}) // 'correct' or 'incorrect'
  const [startTime, setStartTime] = useState(null)
  const [studyTime, setStudyTime] = useState(0)

  const flashcards = [
    {
      id: 1,
      question: "What is React?",
      answer: "React is a JavaScript library for building user interfaces, especially web applications. It allows developers to create reusable UI components and manage application state efficiently.",
      difficulty: "Easy",
      topic: "React Basics",
      tags: ["JavaScript", "Frontend", "Library"]
    },
    {
      id: 2,
      question: "Explain the concept of Virtual DOM",
      answer: "Virtual DOM is a JavaScript representation of the actual DOM kept in memory. React uses it to optimize rendering by comparing the virtual DOM with the real DOM and updating only the parts that have changed, making updates faster and more efficient.",
      difficulty: "Medium",
      topic: "React Concepts",
      tags: ["React", "Performance", "DOM"]
    },
    {
      id: 3,
      question: "What is the difference between SQL and NoSQL databases?",
      answer: "SQL databases are relational, use structured schemas, and support ACID transactions (like MySQL, PostgreSQL). NoSQL databases are non-relational, have flexible schemas, and are designed for scalability (like MongoDB, Redis). Choose SQL for complex relationships and NoSQL for flexibility and scale.",
      difficulty: "Medium",
      topic: "Databases",
      tags: ["SQL", "NoSQL", "Database Design"]
    },
    {
      id: 4,
      question: "What is machine learning?",
      answer: "Machine learning is a subset of artificial intelligence where algorithms learn patterns from data to make predictions or decisions without being explicitly programmed for each task. It includes supervised learning (with labeled data), unsupervised learning (finding patterns), and reinforcement learning (learning through rewards).",
      difficulty: "Easy",
      topic: "AI/ML",
      tags: ["Machine Learning", "AI", "Data Science"]
    },
    {
      id: 5,
      question: "Explain Big O notation",
      answer: "Big O notation describes the worst-case time or space complexity of an algorithm as input size grows. Common complexities: O(1) constant, O(log n) logarithmic, O(n) linear, O(n²) quadratic. It helps compare algorithm efficiency and choose the best approach for large datasets.",
      difficulty: "Hard",
      topic: "Algorithms",
      tags: ["Algorithms", "Complexity", "Computer Science"]
    },
    {
      id: 6,
      question: "What is CSS Flexbox?",
      answer: "CSS Flexbox is a layout method that allows elements to flex and align within a container. It provides powerful alignment, distribution, and ordering capabilities for responsive design. Key properties include justify-content (main axis), align-items (cross axis), and flex-direction.",
      difficulty: "Easy",
      topic: "CSS",
      tags: ["CSS", "Layout", "Flexbox"]
    },
    {
      id: 7,
      question: "What is RESTful API design?",
      answer: "REST (Representational State Transfer) is an architectural style for web APIs. Key principles: stateless communication, resource-based URLs, HTTP methods (GET, POST, PUT, DELETE), standard status codes, and JSON format. It provides scalable, maintainable web services.",
      difficulty: "Medium",
      topic: "Web Development",
      tags: ["API", "REST", "HTTP"]
    },
    {
      id: 8,
      question: "Explain the concept of closures in JavaScript",
      answer: "A closure is a function that has access to variables in its outer scope even after the outer function returns. It 'closes over' the variables, keeping them alive. Closures enable data privacy, callbacks, and functional programming patterns in JavaScript.",
      difficulty: "Hard",
      topic: "JavaScript",
      tags: ["JavaScript", "Functions", "Scope"]
    }
  ]

  const startStudySession = () => {
    setStudyState('studying')
    setCurrentCardIndex(0)
    setFlippedCards(new Set())
    setCardResults({})
    setStartTime(Date.now())
  }

  const handleCardFlip = () => {
    const newFlippedCards = new Set(flippedCards)
    const cardKey = `${currentCardIndex}`
    
    if (newFlippedCards.has(cardKey)) {
      newFlippedCards.delete(cardKey)
    } else {
      newFlippedCards.add(cardKey)
    }
    
    setFlippedCards(newFlippedCards)
  }

  const handleCardResult = (result) => {
    setCardResults({
      ...cardResults,
      [currentCardIndex]: result
    })
  }

  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
    } else {
      // Study session completed
      const endTime = Date.now()
      setStudyTime(Math.round((endTime - startTime) / 1000))
      setStudyState('completed')
    }
  }

  const previousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
    }
  }

  const resetStudySession = () => {
    setStudyState('landing')
    setCurrentCardIndex(0)
    setFlippedCards(new Set())
    setCardResults({})
    setStartTime(null)
    setStudyTime(0)
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'text-success'
      case 'Medium': return 'text-warning'
      case 'Hard': return 'text-danger'
      default: return 'text-muted'
    }
  }

  const getDifficultyBg = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-success-light border-success'
      case 'Medium': return 'bg-warning-light border-warning'
      case 'Hard': return 'bg-danger-light border-danger'
      default: return 'bg-bg-tertiary border-border-light'
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStudyStats = () => {
    const totalAnswered = Object.keys(cardResults).length
    const correctAnswers = Object.values(cardResults).filter(result => result === 'correct').length
    const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0
    
    return { totalAnswered, correctAnswers, accuracy }
  }

  // Landing Page
  if (studyState === 'landing') {
    return (
      <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border-light scrollbar-track-transparent">
        <div className="min-h-full flex items-center justify-center p-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 bg-accent-gradient rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow">
              <BookOpen className="h-12 w-12 text-white" />
            </div>
            
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
              Flashcard Study
            </h1>
            <p className="text-lg text-muted mb-8 leading-relaxed">
              Review key concepts with interactive flashcards. Test your knowledge and track your progress.
            </p>

            {/* Study Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-bg-glass border border-border-light rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-center mb-3">
                  <Target className="h-8 w-8 text-accent-primary" />
                </div>
                <h3 className="font-semibold text-primary mb-1">{flashcards.length} Cards</h3>
                <p className="text-sm text-muted">Mixed difficulty levels</p>
              </div>
              
              <div className="bg-bg-glass border border-border-light rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-center mb-3">
                  <Clock className="h-8 w-8 text-info" />
                </div>
                <h3 className="font-semibold text-primary mb-1">~10 Minutes</h3>
                <p className="text-sm text-muted">Estimated study time</p>
              </div>
              
              <div className="bg-bg-glass border border-border-light rounded-xl p-6 backdrop-blur-sm">
                <div className="flex items-center justify-center mb-3">
                  <Trophy className="h-8 w-8 text-warning" />
                </div>
                <h3 className="font-semibold text-primary mb-1">Self-Paced</h3>
                <p className="text-sm text-muted">Study at your own speed</p>
              </div>
            </div>

            {/* Topics Covered */}
            <div className="bg-bg-tertiary rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-primary mb-4">Topics Covered</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {['React', 'Databases', 'Algorithms', 'CSS', 'JavaScript', 'APIs', 'Machine Learning'].map(topic => (
                  <span key={topic} className="px-3 py-1 bg-accent-primary/10 text-accent-primary rounded-full text-sm border border-accent-primary/20">
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={startStudySession}
              className="btn btn-primary px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl"
            >
              <Play className="h-6 w-6 mr-3" />
              Start Study Session
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Study Session Active
  if (studyState === 'studying') {
    const currentCard = flashcards[currentCardIndex]
    const isFlipped = flippedCards.has(`${currentCardIndex}`)
    const cardResult = cardResults[currentCardIndex]
    const progress = ((currentCardIndex + 1) / flashcards.length) * 100

    return (
      <div className="h-full flex flex-col bg-primary">
        {/* Header with progress */}
        <div className="border-b border-border-light bg-bg-glass backdrop-blur-lg p-4 md:p-6 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-gradient rounded-xl flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-primary">Card {currentCardIndex + 1}</h2>
                  <p className="text-sm text-muted">of {flashcards.length}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted">Progress</p>
                <p className="font-semibold text-primary">{Math.round(progress)}%</p>
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

        {/* Flashcard Content - Scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border-light scrollbar-track-transparent">
          <div className="p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
              {/* Card meta info */}
              <div className="flex items-center gap-4 mb-6 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(currentCard.difficulty)} ${getDifficultyBg(currentCard.difficulty)}`}>
                  {currentCard.difficulty}
                </span>
                <span className="px-3 py-1 bg-accent-primary/10 text-accent-primary rounded-full text-sm border border-accent-primary/20">
                  {currentCard.topic}
                </span>
                <div className="flex items-center gap-1 ml-auto">
                  {currentCard.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-bg-tertiary text-muted rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Flashcard */}
              <div className="relative mb-8">
                <div 
                  className="flashcard-container mx-auto"
                  style={{ 
                    perspective: '1000px',
                    maxWidth: '600px',
                    height: '400px'
                  }}
                >
                  <div 
                    className={`flashcard ${isFlipped ? 'flipped' : ''}`}
                    onClick={handleCardFlip}
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '100%',
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.6s',
                      cursor: 'pointer'
                    }}
                  >
                    {/* Front of card (Question) */}
                    <div 
                      className="flashcard-front"
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(0deg)'
                      }}
                    >
                      <div className="bg-bg-glass border border-border-light rounded-2xl p-8 h-full flex flex-col justify-center backdrop-blur-sm shadow-lg">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-accent-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-accent-primary font-semibold">Q</span>
                          </div>
                          <h3 className="text-xl md:text-2xl font-semibold text-primary mb-4 leading-relaxed">
                            {currentCard.question}
                          </h3>
                          <p className="text-sm text-muted">Click to reveal answer</p>
                        </div>
                      </div>
                    </div>

                    {/* Back of card (Answer) */}
                    <div 
                      className="flashcard-back"
                      style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                      }}
                    >
                      <div className="bg-accent-gradient rounded-2xl p-8 h-full flex flex-col justify-center text-white shadow-lg">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-white font-semibold">A</span>
                          </div>
                          <div className="text-base md:text-lg leading-relaxed">
                            {currentCard.answer}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-6">
                {/* Self-assessment buttons (shown when card is flipped) */}
                {isFlipped && !cardResult && (
                  <div className="text-center">
                    <p className="text-sm text-muted mb-4">How well did you know this?</p>
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={() => handleCardResult('incorrect')}
                        className="btn bg-danger text-white hover:bg-danger-dark px-6 py-3 font-semibold"
                      >
                        <X className="h-5 w-5 mr-2" />
                        Didn't Know
                      </button>
                      <button
                        onClick={() => handleCardResult('correct')}
                        className="btn bg-success text-white hover:bg-success-dark px-6 py-3 font-semibold"
                      >
                        <Check className="h-5 w-5 mr-2" />
                        Knew It
                      </button>
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={previousCard}
                    disabled={currentCardIndex === 0}
                    className="btn btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5 mr-1" />
                    Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {flashcards.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentCardIndex 
                            ? 'bg-accent-primary w-6' 
                            : cardResults[index]
                            ? cardResults[index] === 'correct'
                              ? 'bg-success'
                              : 'bg-danger'
                            : 'bg-bg-tertiary'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={nextCard}
                    className="btn btn-primary px-4 py-2"
                  >
                    {currentCardIndex === flashcards.length - 1 ? 'Complete' : 'Next'}
                    <ChevronRight className="h-5 w-5 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Study Session Complete
  if (studyState === 'completed') {
    const stats = getStudyStats()
    
    return (
      <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border-light scrollbar-track-transparent">
        <div className="min-h-full flex items-center justify-center p-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 bg-accent-gradient rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow">
              <Trophy className="h-12 w-12 text-white" />
            </div>

            <h1 className="text-4xl font-bold mb-4">Study Session Complete!</h1>
            <p className="text-lg text-muted mb-8">Great job reviewing your flashcards</p>

            {/* Study results */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-bg-glass border border-border-light rounded-xl p-6 backdrop-blur-sm">
                <div className="text-3xl font-bold text-accent-primary mb-2">
                  {flashcards.length}
                </div>
                <p className="text-sm text-muted">Cards Reviewed</p>
              </div>
              
              <div className="bg-bg-glass border border-border-light rounded-xl p-6 backdrop-blur-sm">
                <div className={`text-3xl font-bold mb-2 ${
                  stats.accuracy >= 80 ? 'text-success' : 
                  stats.accuracy >= 60 ? 'text-warning' : 'text-danger'
                }`}>
                  {stats.accuracy}%
                </div>
                <p className="text-sm text-muted">Accuracy</p>
              </div>
              
              <div className="bg-bg-glass border border-border-light rounded-xl p-6 backdrop-blur-sm">
                <div className="text-3xl font-bold text-info mb-2">
                  {formatTime(studyTime)}
                </div>
                <p className="text-sm text-muted">Study Time</p>
              </div>
            </div>

            {/* Performance message */}
            <div className="bg-bg-tertiary rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-primary mb-2">
                {stats.accuracy >= 80 ? 'Outstanding! 🌟' :
                 stats.accuracy >= 60 ? 'Good work! 👍' :
                 'Keep practicing! 💪'}
              </h3>
              <p className="text-muted">
                You answered {stats.correctAnswers} out of {stats.totalAnswered} cards correctly.
                {stats.accuracy < 80 && ' Review the cards you missed and try again to improve your retention.'}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={resetStudySession}
                className="btn btn-primary px-6 py-3 font-semibold"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Study Again
              </button>
              <button
                onClick={() => setStudyState('landing')}
                className="btn btn-secondary px-6 py-3 font-semibold"
              >
                Back to Study Home
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default FlashcardsSection 