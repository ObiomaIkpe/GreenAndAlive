import React, { useState } from 'react';

export default function BoltBadge() {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <a
      href="https://bolt.new"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 z-50 bolt-badge-animate"
      style={{ bottom: '25vh' }} // Positioned at 3/4 of viewport height
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`flex items-center space-x-2 px-3 py-2 bg-gray-900 text-white rounded-full shadow-lg ${
          isHovered ? 'scale-105' : ''
        } transition-all duration-300`}
      >
        <div className="relative">
          <img 
            src="/bolt-icon.svg" 
            alt="Bolt" 
            className={`w-5 h-5 ${isHovered ? 'animate-pulse' : ''}`} 
          />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
        </div>
        <span className={`text-sm font-medium whitespace-nowrap`}>
          Built with Bolt.new
        </span>
      </div>
    </a>
  );
}