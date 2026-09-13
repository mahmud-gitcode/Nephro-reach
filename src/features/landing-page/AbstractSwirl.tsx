import React from "react";

export default function AbstractSwirl({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-full h-full overflow-hidden bg-slate-50 ${className}`}>
      {/* 3D Wave Abstract Mesh */}
      <svg
        className="w-full h-full object-cover opacity-85"
        viewBox="0 0 500 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="50%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>
          <linearGradient id="waveHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F8FAFC" />
            <stop offset="50%" stopColor="#E2E8F0" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#F1F5F9" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        
        {/* Soft shadow background */}
        <rect width="500" height="600" fill="#F8FAFC" />

        {/* Generate a series of overlapping wavy lines that curve together mimicking the screenshot swirl */}
        {Array.from({ length: 45 }).map((_, i) => {
          const offset = i * 14;
          const strokeWidth = 1.5 + (i * 0.05);
          const opacity = 0.9 - (i * 0.015);
          return (
            <path
              key={i}
              d={`M ${-150 + offset} 0 
                  C ${-50 + offset} 200, ${400 - offset * 0.5} 300, ${250 + offset * 0.3} 650 
                  S ${650 - offset * 0.2} 800, ${700} 900`}
              stroke="url(#waveGrad)"
              strokeWidth={strokeWidth}
              strokeOpacity={opacity}
              fill="none"
            />
          );
        })}

        {/* Highlight waves for depth */}
        {Array.from({ length: 15 }).map((_, i) => {
          const offset = i * 28;
          return (
            <path
              key={`hl-${i}`}
              d={`M ${-100 + offset} 0 
                  C ${0 + offset} 230, ${420 - offset * 0.5} 270, ${270 + offset * 0.3} 650 
                  S ${620 - offset * 0.2} 800, ${700} 900`}
              stroke="url(#waveHighlight)"
              strokeWidth={2}
              strokeOpacity={0.7}
              fill="none"
            />
          );
        })}
      </svg>
    </div>
  );
}
