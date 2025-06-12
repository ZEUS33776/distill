import { motion } from 'framer-motion'
import { User, Brain, Mail, Calendar, Award, BookOpen, Target, Zap } from 'lucide-react'
import { useApp } from '../../../contexts/AppContext'
import Avatar from '../../common/Avatar'
import { formatDate } from '../../../utils'

const ProfileSection = () => {
  const { user } = useApp()

  const stats = [
    { label: 'Chats Started', value: '12', icon: Zap, color: 'text-blue-600' },
    { label: 'Quizzes Taken', value: '8', icon: Target, color: 'text-green-600' },
    { label: 'Study Sessions', value: '24', icon: BookOpen, color: 'text-purple-600' },
    { label: 'Achievements', value: '5', icon: Award, color: 'text-yellow-600' },
  ]

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar user={user} size={120} className="shadow-lg" />
            </div>
            
            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {user?.username || 'User'}
              </h1>
              
              <div className="space-y-2 text-gray-600 dark:text-gray-300">
                <div className="flex items-center justify-center md:justify-start space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
                
                <div className="flex items-center justify-center md:justify-start space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {user?.created_at ? formatDate(user.created_at) : 'Recently'}</span>
                </div>
              </div>
              
              <div className="mt-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Active Learner
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Learning Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Brain className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Learning Journey</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">67%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full" style={{ width: '67%' }}></div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300">Completed Physics Quiz</span>
                    <span className="text-gray-400 dark:text-gray-500 ml-auto">2h ago</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300">Started new chat session</span>
                    <span className="text-gray-400 dark:text-gray-500 ml-auto">1d ago</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="text-gray-600 dark:text-gray-300">Created flashcard set</span>
                    <span className="text-gray-400 dark:text-gray-500 ml-auto">3d ago</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Achievements</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">First Quiz Master</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Award className="w-5 h-5 text-blue-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Chat Enthusiast</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Award className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Study Streak</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ProfileSection 