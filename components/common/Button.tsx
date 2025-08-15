
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', ...props }) => {
  const baseClasses = 'px-6 py-3 font-bold rounded-lg text-lg transition-all duration-300 transform hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4';
  
  const variantClasses = {
    primary: 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 hover:shadow-[0_0_15px_rgba(56,189,248,0.4)] focus:ring-sky-500/50',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100 shadow-lg shadow-slate-900/20 focus:ring-slate-500/50',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>
      {children}
    </button>
  );
};

export default Button;