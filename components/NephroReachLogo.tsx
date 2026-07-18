import React from "react";

export default function NephroReachLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* High-Fidelity SVG Icon */}
      <svg
        width="42"
        height="42"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Background Circle / Stethoscope frame */}
        <circle cx="50" cy="50" r="45" stroke="#1E40AF" strokeWidth="6" fill="white" />
        <circle cx="50" cy="50" r="38" stroke="#EF4444" strokeWidth="2" strokeDasharray="6 4" />
        
        {/* Kidneys representation */}
        {/* Left Kidney (Red) */}
        <path
          d="M44 32C35 32 30 40 30 50C30 60 35 68 44 68C47 68 48 64 48 50C48 36 47 32 44 32Z"
          fill="#EF4444"
          opacity="0.9"
        />
        {/* Right Kidney (Blue) */}
        <path
          d="M56 32C65 32 70 40 70 50C70 60 65 68 56 68C53 68 52 64 52 50C52 36 53 32 56 32Z"
          fill="#3B82F6"
          opacity="0.9"
        />
        
        {/* Connecting tubes/Heartline */}
        <path
          d="M43 50H57"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M48 45V55"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* Stethoscope handle/ring details */}
        <path
          d="M25 50C25 63.8 36.2 75 50 75C63.8 75 75 63.8 75 50"
          stroke="#1D4ED8"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* Magnifying Glass handle */}
        <rect
          x="72"
          y="72"
          width="8"
          height="20"
          rx="4"
          transform="rotate(-45 72 72)"
          fill="#1E40AF"
        />
      </svg>
      
      {/* Brand Text */}
      <div className="flex flex-col">
        <div className="flex items-center text-xl font-bold tracking-tight">
          <span className="text-[#EF4444]">Nephro</span>
          <span className="text-[#1E40AF]">Reach</span>
        </div>
        <span className="text-[7.5px] font-medium text-slate-500 uppercase tracking-widest leading-none">
          Nephrology Care & Research
        </span>
      </div>
    </div>
  );
}
