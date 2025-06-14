import { Routes, Route, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useApp } from '../../contexts/AppContext'
import Sidebar from './Sidebar'
import Header from './Header'
import ChatSection from './sections/ChatSection'
import QuizSection from './sections/QuizSection'
import FlashcardsSection from './sections/FlashcardsSection'
import ProfileSection from './sections/ProfileSection'

const Dashboard = () => {
  const { sidebarCollapsed } = useApp()

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header />
        
        {/* Content */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 overflow-hidden"
        >
          <Routes>
            <Route path="/chat" element={<ChatSection />} />
            <Route path="/quiz" element={<QuizSection />} />
            <Route path="/flashcards" element={<FlashcardsSection />} />
            <Route path="/profile" element={<ProfileSection />} />
            <Route path="/" element={<Navigate to="/chat" replace />} />
          </Routes>
        </motion.main>
      </div>
    </div>
  )
}

export default Dashboard 