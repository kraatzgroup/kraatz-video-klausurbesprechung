import React from 'react'
import { User } from 'lucide-react'

interface ProfileImageProps {
  imageUrl?: string | null
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showBorder?: boolean
}

const ProfileImage: React.FC<ProfileImageProps> = ({
  imageUrl,
  name,
  size = 'md',
  className = '',
  showBorder = true
}) => {
  // Size configurations
  const sizeConfig = {
    xs: {
      container: 'w-6 h-6',
      icon: 'w-3 h-3',
      text: 'text-xs'
    },
    sm: {
      container: 'w-8 h-8',
      icon: 'w-4 h-4',
      text: 'text-xs'
    },
    md: {
      container: 'w-10 h-10',
      icon: 'w-5 h-5',
      text: 'text-sm'
    },
    lg: {
      container: 'w-12 h-12',
      icon: 'w-6 h-6',
      text: 'text-base'
    },
    xl: {
      container: 'w-16 h-16',
      icon: 'w-8 h-8',
      text: 'text-lg'
    }
  }

  const config = sizeConfig[size]
  const borderClass = showBorder ? 'border-2 border-gray-200' : ''

  return (
    <div 
      className={`${config.container} relative rounded-full overflow-hidden bg-gray-100 ${borderClass} flex items-center justify-center ${className}`}
      title={name ? `Profilbild von ${name}` : 'Profilbild'}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name ? `Profilbild von ${name}` : 'Profilbild'}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to default icon if image fails to load
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            const parent = target.parentElement
            if (parent) {
              const icon = document.createElement('div')
              icon.innerHTML = '<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>'
              parent.appendChild(icon)
            }
          }}
        />
      ) : (
        <User className={`${config.icon} text-gray-400`} />
      )}
    </div>
  )
}

export default ProfileImage
