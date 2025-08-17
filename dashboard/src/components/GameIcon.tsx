'use client';

import { useState } from 'react';
import { getGameIconWithFallback, getGameIconStyles, type GameIconProps } from '@/utils/discordGameIcons';

export default function GameIcon({ 
  gameId, 
  size = 32, 
  className = '', 
  showName = false 
}: GameIconProps) {
  const [imageError, setImageError] = useState(false);
  const iconData = getGameIconWithFallback(gameId, size);
  const styles = getGameIconStyles(size);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {!imageError && iconData.hasDiscordIcon ? (
        <img
          src={iconData.discordIcon}
          alt={`${iconData.name} icon`}
          style={styles}
          onError={handleImageError}
          onLoad={handleImageLoad}
          className="transition-all duration-200 hover:scale-105"
        />
      ) : (
        <div
          style={{
            ...styles,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${size * 0.6}px`,
            background: 'linear-gradient(135deg, rgba(111, 98, 157, 0.2), rgba(60, 69, 128, 0.2))'
          }}
          className="transition-all duration-200 hover:scale-105"
          title={iconData.name}
        >
          {iconData.fallbackEmoji}
        </div>
      )}
      
      {showName && (
        <span className="text-sm font-medium text-vietnamese-purple-200">
          {iconData.name}
        </span>
      )}
    </div>
  );
}
