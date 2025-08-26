import React from "react";

export default function Button({
  children,
  loading = false,
  variant = "primary",
  size = "md",
  onClick,
  type = "button",
  disabled = false,
  className = "",
  ...props
}) {
  const baseClasses = `
    font-semibold rounded-lg transition-all duration-300 ease-out
    flex items-center justify-center relative overflow-hidden
    transform active:scale-95 disabled:cursor-not-allowed
    shadow-lg hover:shadow-xl
  `;

  const variants = {
    primary: `
      bg-gradient-to-r from-blue-600 to-blue-700 
      hover:from-blue-700 hover:to-blue-800 
      text-white border border-blue-500/30
      hover:border-blue-400/50
      disabled:from-blue-800 disabled:to-blue-900
      before:absolute before:inset-0 before:bg-white/20 before:opacity-0 
      hover:before:opacity-100 before:transition-opacity before:duration-300
    `,
    secondary: `
      bg-white/10 backdrop-blur-sm border-2 border-white/30 
      text-white hover:bg-white/20 hover:border-white/50
      hover:backdrop-blur-md
      shadow-lg hover:shadow-white/20
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-red-700
      hover:from-red-700 hover:to-red-800
      text-white border border-red-500/30
      hover:border-red-400/50
      disabled:from-red-800 disabled:to-red-900
    `,
    glass: `
      bg-white/5 backdrop-blur-md border border-white/20
      text-white hover:bg-white/10 hover:border-white/30
      shadow-2xl hover:shadow-white/10
    `,
  };

  const sizes = {
    sm: "px-4 py-2 text-sm min-h-[36px]",
    md: "px-6 py-3 min-h-[48px]",
    lg: "px-8 py-4 text-lg min-h-[56px]",
  };

  const spinnerSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const loadingSpinner = (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className={`animate-spin rounded-full border-2 border-white/30 border-t-white ${spinnerSizes[size]}`}
      ></div>
    </div>
  );

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant] || variants.primary} ${
        sizes[size]
      } ${className}`}
      {...props}
    >
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 -top-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transform -skew-x-12 transition-all duration-700 hover:translate-x-full"></div>

      {/* Loading spinner overlay */}
      {loading && loadingSpinner}

      {/* Button content */}
      <span
        className={`transition-opacity duration-200 ${
          loading ? "opacity-0" : "opacity-100"
        }`}
      >
        {children}
      </span>
    </button>
  );
}
