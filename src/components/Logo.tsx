import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showTagline = false, light = false }) => {
  const iconSize = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const titleSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';

  return (
    <div className="flex items-center gap-3">
      {/* SVG number 5 integrated with speech bubble */}
      <div className={`relative flex items-center justify-center ${iconSize} flex-shrink-0`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Speech bubble base */}
          <path
            d="M8 8C5.79086 8 4 9.79086 4 12V32C4 34.2091 5.79086 36 8 36H16L22 42V36H40C42.2091 36 44 34.2091 44 32V12C44 9.79086 42.2091 8 40 8H8Z"
            fill={light ? '#FFFFFF' : '#0B1F3A'}
          />
          {/* Integrated number 5 styled within bubble */}
          <path
            d="M31 16H20V23.5C21.2 22.8 22.6 22.4 24.2 22.4C28 22.4 31 25 31 28.5C31 32 28 34.5 24 34.5C21 34.5 18.8 33.2 17.5 31.8L19.5 29.5C20.5 30.6 22 31.6 24 31.6C26 31.6 27.8 30.4 27.8 28.5C27.8 26.6 26 25.3 23.5 25.3C21.5 25.3 20 26.2 19 27L17 26.5L18 13.5H31V16Z"
            fill={light ? '#0B1F3A' : '#FFFFFF'}
          />
          {/* Red accent dot signaling policy precision */}
          <circle cx="37" cy="14" r="3" fill="#D32F2F" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5">
          <span className={`font-extrabold tracking-tight ${titleSize} ${light ? 'text-white' : 'text-[#0B1F3A]'}`}>
            O-FIVE
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#D32F2F] text-white">
            Polkam
          </span>
        </div>
        {showTagline && (
          <span className={`text-xs tracking-wide ${light ? 'text-slate-300' : 'text-slate-600'} font-medium`}>
            One Policy Source, Five Strategic Outputs
          </span>
        )}
      </div>
    </div>
  );
};
