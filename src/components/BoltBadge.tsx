import React, { useState, useEffect } from 'react';

export default function BoltBadge() {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  
  // Optional: Hide badge when scrolling down, show when scrolling up
  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY <= lastScrollY || currentScrollY < 100);
      lastScrollY = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <a
      href="https://bolt.new"
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed right-4 transition-all duration-300 ease-in-out z-50 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ bottom: '25vh' }} // Positioned at 3/4 of viewport height
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className={`flex items-center space-x-2 px-3 py-2 bg-gray-900 text-white rounded-full shadow-lg ${
          isHovered ? 'translate-x-0 scale-105' : 'translate-x-2'
        } transition-all duration-300`}
      >
        <div className="relative">
          <img 
            src="/bolt-icon.svg" 
            alt="Bolt" 
            className={`w-5 h-5 ${isHovered ? 'animate-pulse' : ''}`} 
          />
          <div className={`absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full ${
            isHovered ? 'animate-ping' : ''
          }`}></div>
        </div>
        <span className={`text-sm font-medium ${
          isHovered ? 'opacity-100 max-w-40' : 'opacity-0 max-w-0'
        } overflow-hidden transition-all duration-300 whitespace-nowrap`}>
          Built with Bolt.new
        </span>
      </div>
    </a>
  );
}