import { motion } from 'framer-motion'
import { Brain, Sparkles } from 'lucide-react'

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-blue-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center"
      >
        {/* Logo and Brand */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative mb-8"
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center shadow-2xl">
            <Brain className="w-12 h-12 text-white" />
          </div>
          
          {/* Floating sparkles */}
          <motion.div
            animate={{ 
              y: [-5, -15, -5],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              delay: 0.2
            }}
            className="absolute -top-2 -right-2"
          >
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </motion.div>
          
          <motion.div
            animate={{ 
              y: [-3, -12, -3],
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{ 
              duration: 1.8,
              repeat: Infinity,
              delay: 0.8
            }}
            className="absolute -bottom-1 -left-3"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
          </motion.div>
        </motion.div>

        {/* Brand Name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-4xl font-bold gradient-text mb-4"
        >
          Distill
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-gray-600 text-lg mb-8 max-w-md mx-auto"
        >
          Your AI-powered study companion is loading...
        </motion.p>

        {/* Loading Animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="flex justify-center items-center space-x-2 mb-6"
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              animate={{
                scale: [1, 1.2, 1],
                backgroundColor: [
                  'rgb(59, 130, 246)',
                  'rgb(147, 51, 234)',
                  'rgb(59, 130, 246)'
                ]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut"
              }}
              className="w-3 h-3 rounded-full bg-primary-500"
            />
          ))}
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: '100%' }}
          transition={{ delay: 1, duration: 1.5 }}
          className="w-64 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden"
        >
          <motion.div
            animate={{
              x: [-256, 256],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-32 h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
          />
        </motion.div>

        {/* Features Preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto"
        >
          {[
            { icon: '🤖', label: 'AI Chat' },
            { icon: '📚', label: 'Smart Quizzes' },
            { icon: '🎯', label: 'Flashcards' }
          ].map((feature, index) => (
            <motion.div
              key={index}
              animate={{
                y: [0, -5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: index * 0.3,
                ease: "easeInOut"
              }}
              className="text-center"
            >
              <div className="text-2xl mb-2">{feature.icon}</div>
              <p className="text-sm text-gray-500 font-medium">{feature.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}

export default LoadingScreen 