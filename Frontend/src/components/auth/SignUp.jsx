import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, Brain, ArrowRight, Check, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useApp } from '../../contexts/AppContext'
import { isValidEmail, validatePassword } from '../../utils'

const SignUp = () => {
  const navigate = useNavigate()
  const { signUp, loading } = useApp()
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [passwordValidation, setPasswordValidation] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    } else if (formData.username.trim().length < 2) {
      newErrors.username = 'Username must be at least 2 characters'
    }

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    const passwordCheck = validatePassword(formData.password)
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (!passwordCheck.isValid) {
      newErrors.password = 'Password must meet all requirements'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('📝 SignUp: Form submission started');
    console.log('📋 SignUp: Form data:', { 
      username: formData.username, 
      email: formData.email,
      passwordLength: formData.password.length 
    });
    
    if (!validateForm()) {
      console.log('❌ SignUp: Form validation failed');
      return
    }

    console.log('✅ SignUp: Form validation passed, preparing data...');
    const userData = {
      email: formData.email.trim(),
      username: formData.username.trim(),
      password: formData.password
    }
    console.log('📦 SignUp: User data prepared:', { 
      email: userData.email, 
      username: userData.username,
      passwordLength: userData.password.length 
    });

    try {
      console.log('🚀 SignUp: Calling signUp from context...');
      await signUp(userData)
      console.log('✅ SignUp: Context signUp call completed');
      
      console.log('🧹 SignUp: Clearing form...');
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      })
      
      console.log('🏠 SignUp: Navigating to dashboard...');
      navigate('/dashboard', { replace: true })
    } catch (error) {
      console.error('💥 SignUp: Form submission failed:', error)
      // Error toast is handled by the context
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }

    // Validate password in real-time
    if (name === 'password') {
      setPasswordValidation(validatePassword(value))
    }
  }

  const PasswordStrengthIndicator = ({ validation }) => {
    const requirements = [
      { key: 'minLength', label: 'At least 8 characters', valid: validation.minLength },
      { key: 'hasUpperCase', label: 'One uppercase letter', valid: validation.hasUpperCase },
      { key: 'hasLowerCase', label: 'One lowercase letter', valid: validation.hasLowerCase },
      { key: 'hasNumbers', label: 'One number', valid: validation.hasNumbers },
    ]

    return (
      <div className="mt-2 space-y-1">
        {requirements.map(req => (
          <div key={req.key} className="flex items-center space-x-2 text-sm">
            {req.valid ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <X className="w-4 h-4 text-gray-300" />
            )}
            <span className={req.valid ? 'text-green-600' : 'text-gray-500'}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50 flex">
      {/* Left side - Features showcase */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
        className="hidden lg:flex flex-1 bg-gradient-to-br from-secondary-500 to-primary-600 text-white p-12 items-center justify-center"
      >
        <div className="max-w-md">
          <h2 className="text-4xl font-bold mb-6">Start Your Learning Journey</h2>
          <p className="text-xl text-secondary-100 mb-8 leading-relaxed">
            Join thousands of learners who are already using AI to accelerate their education and achieve their goals.
          </p>
          
          <div className="space-y-6">
            {[
              { icon: '📈', title: 'Personalized Learning', desc: 'AI adapts to your learning style and pace' },
              { icon: '💡', title: 'Instant Insights', desc: 'Get explanations and answers immediately' },
              { icon: '🎓', title: 'Track Progress', desc: 'Monitor your improvement over time' }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex items-center space-x-4"
              >
                <div className="text-2xl">{feature.icon}</div>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-secondary-200 text-sm">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-secondary-500 to-primary-500 rounded-2xl mb-4"
            >
              <Brain className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold gradient-text">Create account</h1>
            <p className="text-gray-600 mt-2">Join Distill and start learning smarter</p>
          </div>

          {/* Sign Up Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className={`input pl-10 ${errors.username ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter your username"
                />
              </div>
              {errors.username && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 text-sm mt-1"
                >
                  {errors.username}
                </motion.p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input pl-10 ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 text-sm mt-1"
                >
                  {errors.email}
                </motion.p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`input pl-10 pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.password && (
                <PasswordStrengthIndicator validation={passwordValidation} />
              )}
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 text-sm mt-1"
                >
                  {errors.password}
                </motion.p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`input pl-10 pr-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-600 text-sm mt-1"
                >
                  {errors.confirmPassword}
                </motion.p>
              )}
            </div>

            {/* Terms and Privacy */}
            <div className="flex items-start space-x-2">
              <input 
                type="checkbox" 
                required
                className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
              />
              <p className="text-sm text-gray-600 leading-relaxed">
                I agree to the{' '}
                <Link to="/terms" className="text-primary-600 hover:text-primary-700 transition-colors">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-primary-600 hover:text-primary-700 transition-colors">
                  Privacy Policy
                </Link>
              </p>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full btn btn-primary h-12 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="loading-spinner" />
              ) : (
                <>
                  <span>Create account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Sign In Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-8"
          >
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/signin" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default SignUp 