import { motion } from 'framer-motion'
import { Settings, Brain } from 'lucide-react'

const SettingsSection = () => {
  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-slate-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto text-center py-20"
      >
        <div className="w-20 h-20 bg-gradient-to-r from-gray-500 to-slate-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Settings className="h-10 w-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Settings
        </h1>
        
        <p className="text-gray-600 text-lg mb-8 leading-relaxed max-w-2xl mx-auto">
          Customize your learning experience with personalized settings and preferences.
          Configure AI behavior, study reminders, and more.
        </p>
        
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 inline-block">
          <p className="text-gray-800 text-sm">
            <Brain className="w-4 h-4 inline mr-2" />
            Feature in development - Comprehensive settings panel
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default SettingsSection 