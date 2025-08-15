import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}

const FuturisticButton: React.FC<ButtonProps> = ({ children, variant = 'primary', className = '', ...props }) => {
  const baseClasses = 'group relative px-6 py-3 font-bold rounded-lg text-lg transition-all duration-300 transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 overflow-hidden';
  
  const variantClasses = {
    primary: 'bg-sky-500/80 hover:bg-sky-600/90 text-white shadow-lg shadow-sky-500/20 hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] focus:ring-sky-500/50 border border-sky-400/50',
    secondary: 'bg-slate-700/80 hover:bg-slate-600/90 text-slate-100 shadow-lg shadow-slate-900/20 focus:ring-slate-500/50 border border-slate-600/50',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      <span className="relative z-10">{children}</span>
       <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
    </button>
  );
};

export default FuturisticButton;