import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Brain, Mail, Calendar, Award, BookOpen, Target, Zap, 
  Clock, Trophy, AlertCircle, RefreshCw, CheckCircle, X,
  TrendingUp, Activity, Star, Users, MessageSquare
} from 'lucide-react'
import { useApp } from '../../../contexts/AppContext'
import Avatar from '../../common/Avatar'
import { formatDate, formatDuration } from '../../../utils'

const ProfileSection = () => {
  const { user } = useApp()
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [cacheInfo, setCacheInfo] = useState(null)
  const mountedRef = useRef(true)

  // Enhanced getUserId function with better fallback logic
  const getUserId = useCallback(() => {
    // Priority 1: User from context
    if (user?.user_id) {
      return user.user_id
    }
    
    // Priority 2: User from localStorage
    const userData = JSON.parse(localStorage.getItem('userData') || '{}')
    if (userData.user_id && userData.user_id !== 'test-user-frontend') {
      return userData.user_id
    }
    
    // Priority 3: Test user for development
    return '02d55edc-75c9-41bb-83f9-35907a0c4fa6'
  }, [user])

  // Enhanced fetch function with robust error handling
  const fetchProfileData = useCallback(async (isRefresh = false) => {
    if (!mountedRef.current) return

    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const userId = getUserId()
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      
      console.log(`🔍 [PROFILE] ${isRefresh ? 'Refreshing' : 'Fetching'} profile data for user:`, userId)

      // Use the optimized profile endpoint that fetches everything in parallel
      const response = await fetch(`${apiUrl}/user-profile/profile/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = 'Failed to load profile data'
        
        // Enhanced error handling based on status codes
        switch (response.status) {
          case 400:
            errorMessage = 'Invalid user ID format'
            break
          case 404:
            errorMessage = 'User not found. Please check your account status.'
            break
          case 500:
            errorMessage = 'Server error. Please try again in a moment.'
            break
          case 503:
            errorMessage = 'Service temporarily unavailable. Please try again later.'
            break
          default:
            errorMessage = `Error ${response.status}: ${errorText || 'Unknown error'}`
        }
        
        console.error(`❌ [PROFILE] Failed to fetch profile data:`, response.status, errorText)
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('✅ [PROFILE] Successfully fetched profile data:', data)

      if (!mountedRef.current) return

      setProfileData(data)
      setCacheInfo(data.cache_info)
      setLastUpdated(new Date())
      setRetryCount(0) // Reset retry count on success
      
    } catch (error) {
      console.error('❌ [PROFILE] Error fetching profile data:', error)
      
      if (!mountedRef.current) return
      
      // Increment retry count for automatic retry logic
      setRetryCount(prev => prev + 1)
      setError(error.message || 'Failed to load profile data')
    } finally {
      if (mountedRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [getUserId])

  // Auto-retry logic with exponential backoff
  useEffect(() => {
    if (error && retryCount < 3) {
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000) // Max 10 seconds
      console.log(`🔄 [PROFILE] Auto-retry ${retryCount + 1}/3 in ${retryDelay}ms`)
      
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          fetchProfileData()
        }
      }, retryDelay)
      
      return () => clearTimeout(timer)
    }
  }, [error, retryCount, fetchProfileData])

  // Initial data fetch
  useEffect(() => {
    fetchProfileData()
    
    return () => {
      mountedRef.current = false
    }
  }, [fetchProfileData])

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    fetchProfileData(true)
  }, [fetchProfileData])

  // Clear cache function (for admin/debugging)
  const handleClearCache = useCallback(async () => {
    try {
      const userId = getUserId()
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      
      console.log('🗑️ [CACHE] Clearing cache for user:', userId)
      
      const response = await fetch(`${apiUrl}/user-profile/cache/${userId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ [CACHE] Cache cleared:', result)
        // Refresh data after clearing cache
        setTimeout(() => fetchProfileData(true), 500)
      }
    } catch (error) {
      console.error('❌ [CACHE] Error clearing cache:', error)
    }
  }, [getUserId, fetchProfileData])

  // Enhanced stats with additional metrics
  const getEnhancedStats = (data) => {
    if (!data?.stats) return []
    
    const stats = data.stats
    return [
      { 
        label: 'Chats Started', 
        value: stats.chats_started, 
        icon: MessageSquare, 
        color: 'text-blue-600',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20'
      },
      { 
        label: 'Quizzes Taken', 
        value: stats.quizzes_taken, 
        icon: Target, 
        color: 'text-green-600',
        bgColor: 'bg-green-50 dark:bg-green-900/20'
      },
      { 
        label: 'Study Sessions', 
        value: stats.study_sessions, 
        icon: BookOpen, 
        color: 'text-purple-600',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20'
      },
      { 
        label: 'Achievements', 
        value: stats.achievements, 
        icon: Award, 
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20'
      },
      { 
        label: 'Study Time', 
        value: formatDuration(stats.total_study_time), 
        icon: Clock, 
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
        isTime: true
      },
      { 
        label: 'Best Score', 
        value: `${Math.round(stats.best_quiz_score)}%`, 
        icon: Trophy, 
        color: 'text-orange-600',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        isPercentage: true
      }
    ]
  }

  // Loading state with skeleton
  if (loading && !profileData) {
    return (
      <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            {/* Header Skeleton */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1 text-center md:text-left">
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-48"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-32"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                </div>
              </div>
            </div>
            
            {/* Stats Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                  <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading your profile...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state with retry options
  if (error && !profileData) {
    return (
      <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-center h-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Unable to Load Profile
              </h3>
              <p className="text-red-600 dark:text-red-400 mb-6 max-w-md">
                {error}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>{refreshing ? 'Retrying...' : 'Try Again'}</span>
                </button>
                
                {retryCount >= 3 && (
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Reload Page
                  </button>
                )}
              </div>
              
              {retryCount > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  Retry attempt: {retryCount}/3
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  const stats = getEnhancedStats(profileData)

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header with cache info and refresh */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Profile Dashboard
            </h1>
            {lastUpdated && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {cacheInfo && (
              <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                Cache: {cacheInfo.ttl_seconds}s TTL
              </div>
            )}
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
              title="Refresh profile data"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={handleClearCache}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors text-xs"
                title="Clear cache (dev only)"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar user={user} size={120} className="shadow-lg ring-4 ring-white dark:ring-gray-700" />
            </div>
            
            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {user?.username || 'User'}
              </h2>
              
              <div className="space-y-2 text-gray-600 dark:text-gray-300">
                <div className="flex items-center justify-center md:justify-start space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>{user?.email || 'user@example.com'}</span>
                </div>
                
                <div className="flex items-center justify-center md:justify-start space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {user?.created_at ? formatDate(user.created_at) : 'Recently'}</span>
                </div>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Active Learner
                </span>
                
                {profileData?.stats?.overall_progress >= 50 && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    <Star className="w-3 h-3 mr-1" />
                    Making Progress
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${stat.bgColor} mb-3`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Learning Progress & Analytics */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Overall Progress */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Brain className="w-6 h-6 text-indigo-600" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Learning Progress</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {profileData ? `${Math.round(profileData.stats.overall_progress)}%` : '0%'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${profileData ? Math.round(profileData.stats.overall_progress) : 0}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full"
                  />
                </div>
              </div>
              
              {profileData?.stats && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Average Quiz Accuracy</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Math.round(profileData.stats.avg_quiz_accuracy)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Flashcards Studied</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {profileData.stats.total_flashcards_studied.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Performance Insights</h3>
            </div>
            
            <div className="space-y-3">
              {profileData?.stats?.best_quiz_score > 0 && (
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700 dark:text-green-300">Best Quiz Score</span>
                  </div>
                  <span className="font-bold text-green-800 dark:text-green-200">
                    {Math.round(profileData.stats.best_quiz_score)}%
                  </span>
                </div>
              )}
              
              {profileData?.stats?.total_study_time > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-700 dark:text-blue-300">Total Study Time</span>
                  </div>
                  <span className="font-bold text-blue-800 dark:text-blue-200">
                    {formatDuration(profileData.stats.total_study_time)}
                  </span>
                </div>
              )}
              
              {profileData?.achievements?.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-700 dark:text-yellow-300">Achievements Earned</span>
                  </div>
                  <span className="font-bold text-yellow-800 dark:text-yellow-200">
                    {profileData.achievements.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity & Achievements */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Activity className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h3>
              </div>
              {profileData?.recent_activity?.length > 5 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Showing latest 5
                </span>
              )}
            </div>
            
            <div className="space-y-3">
              {profileData?.recent_activity?.length > 0 ? (
                profileData.recent_activity.slice(0, 5).map((activity, index) => {
                  const getActivityIcon = (type) => {
                    switch (type) {
                      case 'quiz': return Target
                      case 'flashnotes': return BookOpen
                      case 'chat': return MessageSquare
                      default: return Activity
                    }
                  }
                  
                  const getActivityColor = (type) => {
                    switch (type) {
                      case 'quiz': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
                      case 'flashnotes': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
                      case 'chat': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
                      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
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
                  
                  const ActivityIcon = getActivityIcon(activity.activity_type)
                  const colorClasses = getActivityColor(activity.activity_type)
                  
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${colorClasses}`}>
                        <ActivityIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                          {activity.description}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                        {getTimeAgo(activity.timestamp)}
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No recent activity yet.
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Start studying to see your progress here!
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Achievements */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Award className="w-6 h-6 text-yellow-600" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Achievements</h3>
              </div>
              {profileData?.achievements?.length > 5 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Showing latest 5
                </span>
              )}
            </div>
            
            <div className="space-y-3">
              {profileData?.achievements?.length > 0 ? (
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
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border border-yellow-200 dark:border-yellow-800"
                    >
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                        <IconComponent className={`w-5 h-5 ${achievement.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {achievement.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {achievement.description}
                        </p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    </motion.div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No achievements yet.
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Complete activities to earn your first achievement!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error banner for partial failures */}
        <AnimatePresence>
          {error && profileData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm text-yellow-800 dark:text-yellow-200">
                    Some data may be outdated. {error}
                  </span>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default ProfileSection 