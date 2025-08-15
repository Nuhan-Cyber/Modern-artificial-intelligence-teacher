

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`relative bg-slate-900/70 backdrop-blur-xl border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/40 p-6 sm:p-8 w-full transition-all duration-300 ${className}`}
    >
      {/* Optional subtle glow effect on hover can be added back if desired */}
      {/* <div className="absolute -inset-px rounded-2xl border-2 border-transparent group-hover:border-sky-500/30 transition-all duration-300 pointer-events-none 
                   group-hover:[background:radial-gradient(400px_at_50%_50%,rgba(56,189,248,0.1),transparent_40%)]"></div> */}
      {children}
    </div>
  );
};

export default Card;
