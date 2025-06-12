import { useState } from 'react'
import { getUserAvatar, generateRandomAvatarUrl } from '../../utils/avatarUtils'

const Avatar = ({ 
  user, 
  size = 40, 
  className = '', 
  showFallback = true,
  onClick = null
}) => {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const avatarUrl = getUserAvatar(user)
  
  const handleImageError = () => {
    setImageError(true)
    setIsLoading(false)
  }

  const handleImageLoad = () => {
    setIsLoading(false)
    setImageError(false)
  }

  const getInitials = () => {
    if (!user?.username && !user?.email) return '?'
    const name = user?.username || user?.email
    return name.substring(0, 2).toUpperCase()
  }

  const baseClasses = `
    relative inline-flex items-center justify-center
    rounded-full bg-gradient-to-br from-indigo-400 to-purple-500
    text-white font-semibold select-none overflow-hidden
    ${onClick ? 'cursor-pointer hover:scale-105 transition-transform duration-200' : ''}
    ${className}
  `.trim()

  const imageStyle = {
    width: size,
    height: size,
  }

  const textStyle = {
    fontSize: size * 0.4,
    lineHeight: 1,
  }

  if (imageError && showFallback) {
    return (
      <div 
        className={baseClasses}
        style={imageStyle}
        onClick={onClick}
        title={user?.username || user?.email || 'User'}
      >
        <span style={textStyle}>
          {getInitials()}
        </span>
      </div>
    )
  }

  return (
    <div 
      className={baseClasses}
      style={imageStyle}
      onClick={onClick}
      title={user?.username || user?.email || 'User'}
    >
      {isLoading && showFallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
          <span style={textStyle} className="text-gray-400">
            {getInitials()}
          </span>
        </div>
      )}
      <img
        src={avatarUrl}
        alt={user?.username || 'User Avatar'}
        className="w-full h-full object-cover"
        onError={handleImageError}
        onLoad={handleImageLoad}
        style={{ 
          display: isLoading ? 'none' : 'block',
          borderRadius: '50%'
        }}
      />
    </div>
  )
}

export default Avatar 