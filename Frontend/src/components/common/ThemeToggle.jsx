import { Sun, Moon } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'

const ThemeToggle = ({ className = '' }) => {
  const { darkMode, toggleDarkMode } = useApp()

  return (
    <button
      onClick={toggleDarkMode}
      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${className}`}
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      )}
    </button>
  )
}

export default ThemeToggle 