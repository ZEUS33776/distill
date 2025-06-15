import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Brain, Mail, Calendar, Award, BookOpen, Target, Zap, Star } from 'lucide-react'
import { useApp } from '../../../contexts/AppContext'
import Avatar from '../../common/Avatar'
import { formatDate } from '../../../utils'

const ProfileSection = () => {
  const { user } = useApp()
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true)
        const userData = JSON.parse(localStorage.getItem('userData') || '{}')
        let userId = userData.user_id || 'test-user-frontend'
        
        // If we have a real UUID from the database, use it for testing
        // In production, this would come from the actual user authentication
        if (userId === 'test-user-frontend') {
          // Use a real user ID from the database for testing
          userId = '02d55edc-75c9-41bb-83f9-35907a0c4fa6'
        }
        
        console.log('🔍 Fetching profile data for user:', userId)
        
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        const response = await fetch(`${apiUrl}/user-profile/stats/${userId}`)
        
        if (response.ok) {
          const stats = await response.json()
          console.log('✅ Fetched user stats:', stats)
          
          // Fetch recent activity
          const activityResponse = await fetch(`${apiUrl}/user-profile/recent-activity/${userId}`)
          const recentActivity = activityResponse.ok ? await activityResponse.json() : []
          
          // Fetch achievements
          const achievementsResponse = await fetch(`${apiUrl}/user-profile/achievements/${userId}`)
          const achievements = achievementsResponse.ok ? await achievementsResponse.json() : []
          
          setProfileData({
            stats,
            recentActivity,
            achievements
          })
        } else {
          console.error('❌ Failed to fetch profile data:', response.status)
          const errorText = await response.text()
          console.error('Error details:', errorText)
          setError('Failed to load profile data')
        }
      } catch (error) {
        console.error('❌ Error fetching profile data:', error)
        setError('Error loading profile data')
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [])

  // Create stats array from fetched data
  const stats = profileData ? [
    { label: 'Chats Started', value: profileData.stats.chats_started.toString(), icon: Zap, color: 'text-blue-600' },
    { label: 'Quizzes Taken', value: profileData.stats.quizzes_taken.toString(), icon: Target, color: 'text-green-600' },
    { label: 'Flashcards Studied', value: profileData.stats.total_flashcards_studied.toString(), icon: Brain, color: 'text-purple-600' },
    { label: 'Study Sessions', value: profileData.stats.study_sessions.toString(), icon: BookOpen, color: 'text-indigo-600' },
    { label: 'Best Score', value: `${Math.round(profileData.stats.best_quiz_score)}%`, icon: Award, color: 'text-yellow-600' },
    { label: 'Achievements', value: profileData.stats.achievements.toString(), icon: Star, color: 'text-pink-600' },
  ] : [
    { label: 'Chats Started', value: '0', icon: Zap, color: 'text-blue-600' },
    { label: 'Quizzes Taken', value: '0', icon: Target, color: 'text-green-600' },
    { label: 'Flashcards Studied', value: '0', icon: Brain, color: 'text-purple-600' },
    { label: 'Study Sessions', value: '0', icon: BookOpen, color: 'text-indigo-600' },
    { label: 'Best Score', value: '0%', icon: Award, color: 'text-yellow-600' },
    { label: 'Achievements', value: '0', icon: Star, color: 'text-pink-600' },
  ]

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading your profile...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-y-auto">
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 lg:p-6 shadow-lg"
            >
              <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-2 lg:space-y-0 lg:space-x-3">
                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0`}>
                  <stat.icon className={`w-4 h-4 lg:w-5 lg:h-5 ${stat.color}`} />
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs lg:text-sm text-gray-600 dark:text-gray-300">{stat.label}</p>
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
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {profileData ? `${Math.round(profileData.stats.overall_progress)}%` : '0%'}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${profileData ? Math.round(profileData.stats.overall_progress) : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {profileData && profileData.recentActivity.length > 0 ? (
                    profileData.recentActivity.slice(0, 5).map((activity, index) => {
                      const getActivityColor = (type) => {
                        switch (type) {
                          case 'quiz': return 'bg-blue-500'
                          case 'flashnotes': return 'bg-purple-500'
                          case 'chat': return 'bg-green-500'
                          default: return 'bg-gray-500'
                        }
                      }
                      
                      const getTimeAgo = (timestamp) => {
                        const now = new Date()
                        const activityTime = new Date(timestamp)
                        const diffInHours = Math.floor((now - activityTime) / (1000 * 60 * 60))
                        
                        if (diffInHours < 1) return 'Just now'
                        if (diffInHours < 24) return `${diffInHours}h ago`
                        const diffInDays = Math.floor(diffInHours / 24)
                        return `${diffInDays}d ago`
                      }
                      
                      return (
                        <div key={activity.id} className="flex items-center space-x-3 text-sm">
                          <div className={`w-2 h-2 ${getActivityColor(activity.activity_type)} rounded-full`}></div>
                          <span className="text-gray-600 dark:text-gray-300">{activity.description}</span>
                          <span className="text-gray-400 dark:text-gray-500 ml-auto">
                            {getTimeAgo(activity.timestamp)}
                          </span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      No recent activity yet. Start studying to see your progress here!
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Achievements</h3>
                <div className="space-y-2">
                  {profileData && profileData.achievements.length > 0 ? (
                    profileData.achievements.slice(0, 5).map((achievement, index) => {
                      const getIconComponent = (iconName) => {
                        switch (iconName) {
                          case 'Target': return Target
                          case 'Zap': return Zap
                          case 'BookOpen': return BookOpen
                          case 'Brain': return Brain
                          default: return Award
                        }
                      }
                      
                      const IconComponent = getIconComponent(achievement.icon)
                      
                      return (
                        <div key={achievement.id} className="flex items-center space-x-3">
                          <IconComponent className={`w-5 h-5 ${achievement.color}`} />
                          <span className="text-sm text-gray-600 dark:text-gray-300">{achievement.name}</span>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Complete activities to earn achievements!
                    </div>
                  )}
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