import { Navigate, useLocation } from 'react-router-dom'
import { useApp } from '../../contexts/AppContext'
import LoadingScreen from './LoadingScreen'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useApp()
  const location = useLocation()

  if (loading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    // Save the attempted URL to redirect back after login
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute 