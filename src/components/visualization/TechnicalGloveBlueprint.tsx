import React from 'react';

export const TechnicalGloveBlueprint: React.FC = () => {
  return (
    <div className="relative w-full rounded-xl border border-border bg-white/70 p-6 sm:p-8 overflow-hidden shadow-subtle tech-grid">
      {/* Blueprint Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-sm bg-brand-green" />
          <span className="font-mono text-xs font-semibold tracking-wider text-content-primary uppercase">
            PULSEMATE GLOVE
          </span>
        </div>
        <div className="font-mono text-[11px] text-content-secondary">
          MOTION-ASSISTED CPR GLOVE
        </div>
      </div>

      {/* SVG Hardware Glove Technical Drawing */}
      <div className="relative w-full aspect-[4/3] max-h-[360px] flex items-center justify-center">
        <svg
          viewBox="0 0 500 360"
          className="w-full h-full stroke-content-primary/75 fill-none text-content-secondary"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Subtle Grid Background */}
          <defs>
            <pattern id="cadGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E4E0D6" strokeWidth="0.75" />
            </pattern>
          </defs>
          <rect x="10" y="10" width="480" height="340" fill="url(#cadGrid)" stroke="#D8D4C9" strokeWidth="1" strokeDasharray="4 4" rx="4" />

          {/* Glove Contour Geometry */}
          <path
            d="M 170 310 
               L 165 230 
               C 160 210, 120 190, 110 170 
               C 100 150, 120 130, 140 145 
               L 175 180 
               L 180 90 
               C 180 75, 205 75, 205 90 
               L 205 175 
               L 215 65 
               C 215 50, 240 50, 240 65 
               L 240 175 
               L 250 80 
               C 250 65, 275 65, 275 80 
               L 275 180 
               L 285 120 
               C 285 105, 310 105, 310 120 
               L 305 230 
               L 300 310 
               Z"
            className="stroke-brand-green/80 fill-canvas-secondary/30"
            strokeWidth="2"
          />

          {/* Wrist Cuff Structure */}
          <rect x="165" y="300" width="140" height="30" rx="3" className="stroke-content-primary/60 fill-canvas-muted/50" />
          <line x1="165" y1="315" x2="305" y2="315" strokeDasharray="2 2" stroke="#68706B" />

          {/* Microcontroller on Wrist Cuff */}
          <rect x="205" y="305" width="60" height="20" rx="2" className="fill-brand-deep stroke-brand-green" />
          <text x="235" y="319" textAnchor="middle" className="font-mono text-[8px] fill-white font-medium stroke-none">
            CONTROLLER
          </text>

          {/* Motion Sensor on Palm */}
          <rect x="215" y="195" width="40" height="40" rx="4" className="fill-brand-green/10 stroke-brand-green" strokeWidth="2" />
          <circle cx="235" cy="215" r="4" className="fill-brand-burgundy/80 stroke-none" />
          <text x="235" y="211" textAnchor="middle" className="font-mono text-[7px] fill-brand-green font-semibold stroke-none">
            MOTION
          </text>
          <text x="235" y="226" textAnchor="middle" className="font-mono text-[6px] fill-content-secondary stroke-none">
            SENSOR
          </text>

          {/* Feedback Layer Nodes */}
          {/* Audio Indicator */}
          <circle cx="180" cy="245" r="9" className="fill-canvas-muted stroke-content-primary/70" />
          <path d="M 176 241 L 184 249 M 184 241 L 176 249" stroke="#68706B" strokeWidth="1" />
          
          {/* Vibration Node */}
          <circle cx="280" cy="250" r="10" className="fill-canvas-muted stroke-content-primary/70" />
          <circle cx="280" cy="250" r="4" className="fill-brand-mutedBurgundy/30 stroke-brand-burgundy" />

          {/* Visual Light Indicator */}
          <circle cx="192" cy="170" r="5" className="fill-emerald-400 stroke-brand-green" />

          {/* Simplified Callout Lines (Only: Motion Sensor, Controller, Feedback) */}
          {/* 1. Motion Sensor */}
          <line x1="255" y1="205" x2="375" y2="185" stroke="#68706B" strokeWidth="1" />
          <circle cx="375" cy="185" r="2" fill="#173F35" />
          <text x="382" y="184" className="font-mono text-[10px] font-semibold fill-content-primary stroke-none">MOTION SENSOR</text>
          <text x="382" y="196" className="font-mono text-[8.5px] fill-content-secondary stroke-none">Tracks movement & orientation</text>

          {/* 2. Feedback */}
          <line x1="290" y1="250" x2="375" y2="250" stroke="#68706B" strokeWidth="1" />
          <circle cx="375" cy="250" r="2" fill="#173F35" />
          <text x="382" y="248" className="font-mono text-[10px] font-semibold fill-content-primary stroke-none">FEEDBACK</text>
          <text x="382" y="260" className="font-mono text-[8.5px] fill-content-secondary stroke-none">Light · Sound · Vibration</text>

          {/* 3. Controller */}
          <line x1="205" y1="315" x2="70" y2="315" stroke="#68706B" strokeWidth="1" />
          <circle cx="70" cy="315" r="2" fill="#173F35" />
          <text x="65" y="313" textAnchor="end" className="font-mono text-[10px] font-semibold fill-content-primary stroke-none">CONTROLLER</text>
          <text x="65" y="325" textAnchor="end" className="font-mono text-[8.5px] fill-content-secondary stroke-none">Instant on-device processing</text>
        </svg>
      </div>

      {/* Simplified Footer Attributes */}
      <div className="mt-3 pt-3 border-t border-border/80 grid grid-cols-3 gap-3 text-[11px] font-mono text-content-secondary text-center">
        <div>
          <span className="text-content-muted block">SENSING</span>
          <span className="text-content-primary font-medium">Motion & Tilt</span>
        </div>
        <div>
          <span className="text-content-muted block">PROCESSING</span>
          <span className="text-content-primary font-medium">Instant Feedback</span>
        </div>
        <div>
          <span className="text-content-muted block">CUES</span>
          <span className="text-content-primary font-medium">Multi-sensory</span>
        </div>
      </div>
    </div>
  );
};
