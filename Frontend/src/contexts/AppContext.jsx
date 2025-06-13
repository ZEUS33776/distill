import { createContext, useContext, useReducer, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import apiService from '../services/api'

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  sessions: [],
  currentSession: null,
  loading: false,
  error: null,
  activeTab: 'chat',
  sidebarCollapsed: false,
  darkMode: false,
  initializing: true,
}

// Action types
export const ACTION_TYPES = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_USER: 'SET_USER',
  SET_AUTHENTICATED: 'SET_AUTHENTICATED',
  LOGOUT: 'LOGOUT',
  SET_SESSIONS: 'SET_SESSIONS',
  ADD_SESSION: 'ADD_SESSION',
  UPDATE_SESSION: 'UPDATE_SESSION',
  DELETE_SESSION: 'DELETE_SESSION',
  SET_CURRENT_SESSION: 'SET_CURRENT_SESSION',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  TOGGLE_SIDEBAR: 'TOGGLE_SIDEBAR',
  TOGGLE_DARK_MODE: 'TOGGLE_DARK_MODE',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_INITIALIZING: 'SET_INITIALIZING',
}

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_LOADING:
      return { ...state, loading: action.payload }
    
    case ACTION_TYPES.SET_ERROR:
      return { ...state, error: action.payload, loading: false }
    
    case ACTION_TYPES.CLEAR_ERROR:
      return { ...state, error: null }
    
    case ACTION_TYPES.SET_USER:
      return { ...state, user: action.payload }
    
    case ACTION_TYPES.SET_AUTHENTICATED:
      return { ...state, isAuthenticated: action.payload }
    
    case ACTION_TYPES.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        sessions: [],
        currentSession: null,
        activeTab: 'chat',
      }
    
    case ACTION_TYPES.SET_SESSIONS:
      return { ...state, sessions: action.payload }
    
    case ACTION_TYPES.ADD_SESSION:
      return { 
        ...state, 
        sessions: [action.payload, ...state.sessions],
        currentSession: action.payload
      }
    
    case ACTION_TYPES.UPDATE_SESSION:
      return {
        ...state,
        sessions: state.sessions.map(session =>
          session.id === action.payload.id ? action.payload : session
        ),
        currentSession: state.currentSession?.id === action.payload.id 
          ? action.payload 
          : state.currentSession
      }
    
    case ACTION_TYPES.DELETE_SESSION:
      const filteredSessions = state.sessions.filter(session => session.id !== action.payload)
      const newCurrentSession = state.currentSession?.id === action.payload 
        ? (filteredSessions.length > 0 ? filteredSessions[0] : null)
        : state.currentSession
      
      return {
        ...state,
        sessions: filteredSessions,
        currentSession: newCurrentSession
      }
    
    case ACTION_TYPES.SET_CURRENT_SESSION:
      return { ...state, currentSession: action.payload }
    
    case ACTION_TYPES.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload }
    
    case ACTION_TYPES.TOGGLE_SIDEBAR:
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }
    
    case ACTION_TYPES.TOGGLE_DARK_MODE:
      return { ...state, darkMode: !state.darkMode }
    
    case ACTION_TYPES.SET_INITIALIZING:
      return { ...state, initializing: action.payload }
    
    default:
      return state
  }
}

// Create context
const AppContext = createContext()

// Context provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState)

  // Action creators
  const actions = {
    setLoading: (loading) => dispatch({ type: ACTION_TYPES.SET_LOADING, payload: loading }),
    
    setError: (error) => {
      dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error })
      if (error) toast.error(error)
    },
    
    clearError: () => dispatch({ type: ACTION_TYPES.CLEAR_ERROR }),
    
    setInitializing: (initializing) => dispatch({ type: ACTION_TYPES.SET_INITIALIZING, payload: initializing }),
    
    signIn: async (credentials) => {
      console.log('🔐 AppContext: signIn started', { email: credentials.email });
      try {
        dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true })
        console.log('⏳ AppContext: Loading state set to true for signIn');
        
        console.log('📞 AppContext: Calling apiService.login...');
        const response = await apiService.login(credentials)
        console.log('✅ AppContext: Login API response received', response);
        
        // Store token
        console.log('🔑 AppContext: Storing login token...');
        apiService.setToken(response.access_token)
        
        // Update state
        console.log('📝 AppContext: Updating user state after login...');
        dispatch({ type: ACTION_TYPES.SET_USER, payload: response.user })
        dispatch({ type: ACTION_TYPES.SET_AUTHENTICATED, payload: true })
        localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userData', JSON.stringify(response.user))
        
        console.log('🎉 AppContext: SignIn completed successfully');
        toast.success('Welcome back!')
        return response
      } catch (error) {
        console.error('💥 AppContext: SignIn failed', error);
        dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message })
        throw error
      } finally {
        console.log('🏁 AppContext: Setting signIn loading to false');
        dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false })
      }
    },

    signUp: async (userData) => {
      console.log('🎯 AppContext: signUp started', userData);
      try {
        dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true })
        console.log('⏳ AppContext: Loading state set to true');
        
        console.log('📞 AppContext: Calling apiService.signup...');
        const response = await apiService.signup(userData)
        console.log('✅ AppContext: Signup API response received', response);
        
        // Store token
        console.log('🔑 AppContext: Storing token...');
        apiService.setToken(response.access_token)
        
        // Update state
        console.log('📝 AppContext: Updating user state...');
        dispatch({ type: ACTION_TYPES.SET_USER, payload: response.user })
      dispatch({ type: ACTION_TYPES.SET_AUTHENTICATED, payload: true })
      localStorage.setItem('isAuthenticated', 'true')
        localStorage.setItem('userData', JSON.stringify(response.user))
        
        console.log('🎉 AppContext: Signup completed successfully');
        toast.success('Account created successfully!')
        return response
      } catch (error) {
        console.error('💥 AppContext: Signup failed', error);
        dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message })
        throw error
      } finally {
        console.log('🏁 AppContext: Setting loading to false');
        dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false })
      }
    },
    
    signOut: async () => {
      try {
        await apiService.logout()
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        // Clear local state regardless of API call result
      dispatch({ type: ACTION_TYPES.LOGOUT })
        apiService.removeToken()
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('userData')
      localStorage.removeItem('chatSessions')
      localStorage.removeItem('currentSession')
      localStorage.removeItem('activeTab')
      toast.success('Successfully signed out!')
      }
    },

    checkAuth: async () => {
      console.log('🔍 AppContext: checkAuth started');
      try {
        const token = apiService.getToken()
        console.log('🔑 AppContext: Token retrieved:', token ? 'Present' : 'None');
        
        if (token && apiService.isAuthenticated()) {
          console.log('✅ AppContext: Token is valid, getting user data...');
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Auth check timeout')), 5000)
          )
          
          const authPromise = apiService.getCurrentUser()
          
          console.log('⏳ AppContext: Waiting for user data (max 5 seconds)...');
          const userData = await Promise.race([authPromise, timeoutPromise])
          
          console.log('👤 AppContext: User data received, updating state...');
          dispatch({ type: ACTION_TYPES.SET_USER, payload: userData })
          dispatch({ type: ACTION_TYPES.SET_AUTHENTICATED, payload: true })
          localStorage.setItem('isAuthenticated', 'true')
          localStorage.setItem('userData', JSON.stringify(userData))
          console.log('✅ AppContext: Auth state updated successfully');
        } else {
          console.log('❌ AppContext: No valid token, clearing auth state...');
          // No token or expired token, clear auth state
          dispatch({ type: ACTION_TYPES.LOGOUT })
          apiService.removeToken()
          localStorage.removeItem('isAuthenticated')
          localStorage.removeItem('userData')
          console.log('🧹 AppContext: Auth state cleared');
        }
      } catch (error) {
        console.log('⚠️ AppContext: Auth check failed (this is normal for new users):', error.message)
        // Clear auth state on any error (network, timeout, etc.)
        dispatch({ type: ACTION_TYPES.LOGOUT })
        apiService.removeToken()
        localStorage.removeItem('isAuthenticated')
        localStorage.removeItem('userData')
        console.log('🧹 AppContext: Auth state cleared due to error');
      }
    },
    
    createSession: async (title = 'New Chat') => {
      try {
        if (!state.user?.user_id) {
          throw new Error('User must be authenticated to create a session');
        }

        dispatch({ type: ACTION_TYPES.SET_LOADING, payload: true });
        
        // Create session in backend with the provided title as topic
        const response = await apiService.createSession(state.user.user_id, title);
        
        const newSession = {
          id: response.session_id,
          title,
          messages: [],
          messageCount: 0,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          type: 'chat'
        };
        
        dispatch({ type: ACTION_TYPES.ADD_SESSION, payload: newSession });
        
        // Save to localStorage
        const updatedSessions = [newSession, ...state.sessions];
        localStorage.setItem('chatSessions', JSON.stringify(updatedSessions));
        localStorage.setItem('currentSession', JSON.stringify(newSession));
        
        return newSession;
      } catch (error) {
        console.error('Failed to create session:', error);
        dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message });
        toast.error('Failed to create new chat session');
        throw error;
      } finally {
        dispatch({ type: ACTION_TYPES.SET_LOADING, payload: false });
      }
    },
    
    updateSession: async (sessionId, updatedData) => {
      const session = state.sessions.find(s => s.id === sessionId)
      if (!session) return

      try {
        // If title is being updated, call the backend API
        if (updatedData.title) {
          await apiService.updateSessionTopic(sessionId, updatedData.title)
        }

        const updatedSession = { ...session, ...updatedData }
        dispatch({ type: ACTION_TYPES.UPDATE_SESSION, payload: updatedSession })
        
        // Save to localStorage
        const updatedSessions = state.sessions.map(s => 
          s.id === sessionId ? updatedSession : s
        )
        localStorage.setItem('chatSessions', JSON.stringify(updatedSessions))
        
        if (state.currentSession?.id === sessionId) {
          localStorage.setItem('currentSession', JSON.stringify(updatedSession))
        }

        return updatedSession
      } catch (error) {
        console.error('Failed to update session:', error)
        dispatch({ type: ACTION_TYPES.SET_ERROR, payload: error.message })
        toast.error('Failed to update session')
        throw error
      }
    },
    
    deleteSession: (sessionId) => {
      dispatch({ type: ACTION_TYPES.DELETE_SESSION, payload: sessionId })
      
      // Update localStorage
      const filteredSessions = state.sessions.filter(s => s.id !== sessionId)
      localStorage.setItem('chatSessions', JSON.stringify(filteredSessions))
      
      if (state.currentSession?.id === sessionId) {
        const newCurrentSession = filteredSessions.length > 0 ? filteredSessions[0] : null
        localStorage.setItem('currentSession', JSON.stringify(newCurrentSession))
      }
      
      toast.success('Session deleted')
    },
    
    setCurrentSession: (session) => {
      dispatch({ type: ACTION_TYPES.SET_CURRENT_SESSION, payload: session })
      localStorage.setItem('currentSession', JSON.stringify(session))
    },
    
    setActiveTab: (tab) => {
      dispatch({ type: ACTION_TYPES.SET_ACTIVE_TAB, payload: tab })
      localStorage.setItem('activeTab', tab)
    },
    
    toggleSidebar: () => {
      const newState = !state.sidebarCollapsed
      dispatch({ type: ACTION_TYPES.TOGGLE_SIDEBAR })
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newState))
    },

    toggleDarkMode: () => {
      const newDarkMode = !state.darkMode
      dispatch({ type: ACTION_TYPES.TOGGLE_DARK_MODE })
      localStorage.setItem('darkMode', JSON.stringify(newDarkMode))
      
      // Apply/remove dark class to document
      if (newDarkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
  }

  // Initialize auth state on app start
  useEffect(() => {
    console.log('🚀 AppContext: App initialization started');
    const initializeAuth = async () => {
      console.log('🔄 AppContext: Setting initializing state to true');
      dispatch({ type: ACTION_TYPES.SET_INITIALIZING, payload: true })
      
      console.log('🔍 AppContext: Calling checkAuth...');
      await actions.checkAuth()
      
      // Small delay to ensure smooth loading transition
      console.log('⏱️ AppContext: Adding 100ms delay for smooth transition...');
      setTimeout(() => {
        console.log('✅ AppContext: Initialization complete, setting initializing to false');
        dispatch({ type: ACTION_TYPES.SET_INITIALIZING, payload: false })
      }, 100)
    }

    initializeAuth()
  }, [])

  // Load data from localStorage on mount and check authentication
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check authentication first (with timeout)
        await actions.checkAuth()
        
        // Load other data from localStorage
        const savedSessions = localStorage.getItem('chatSessions')
        const savedCurrentSession = localStorage.getItem('currentSession')
        const savedActiveTab = localStorage.getItem('activeTab')
        const savedSidebarState = localStorage.getItem('sidebarCollapsed')
        const savedDarkMode = localStorage.getItem('darkMode')

        if (savedSessions) {
          dispatch({ type: ACTION_TYPES.SET_SESSIONS, payload: JSON.parse(savedSessions) })
        }

        if (savedCurrentSession) {
          dispatch({ type: ACTION_TYPES.SET_CURRENT_SESSION, payload: JSON.parse(savedCurrentSession) })
        }

        if (savedActiveTab) {
          dispatch({ type: ACTION_TYPES.SET_ACTIVE_TAB, payload: savedActiveTab })
        }

        if (savedSidebarState) {
          dispatch({ type: ACTION_TYPES.TOGGLE_SIDEBAR, payload: JSON.parse(savedSidebarState) })
        }

        if (savedDarkMode !== null) {
          const isDark = JSON.parse(savedDarkMode)
          // Set the initial state directly since we're loading from storage
          if (isDark) {
            dispatch({ type: ACTION_TYPES.TOGGLE_DARK_MODE })
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      } catch (error) {
        console.error('Error initializing app:', error)
        // Don't show error toast for initialization failures
      } finally {
        // Always set initializing to false, even if auth check fails
        dispatch({ type: ACTION_TYPES.SET_INITIALIZING, payload: false })
      }
    }

    initializeApp()
  }, [])

  const value = {
    ...state,
    ...actions,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

export default AppContext 