import React, { useState, useEffect } from 'react';

/**
 * LiveCprHeroSignal — Final Polish
 *
 * Visual System:
 * 1. Dominant Visual: Solid CPR-red heart (#C83A3A) with subtle red atmospheric glow.
 * 2. Connected ECG Waveform: Passing horizontally directly THROUGH the heart.
 *    - Core dark green line (#173F35) + luminous green edge glow (#3D9B76).
 *    - Clipped to white (#F7EFE6) inside the heart.
 * 3. Synchronized Cardiac Event (112 BPM / 1.07s period):
 *    - ECG spike + Heart pulse (~3-5% expansion) + Heart glow + ECG glow all align.
 * 4. Compact Instrumentation Parameters Row below:
 *    - Primary: CPR RATE (112 /min) in status green (#3D765A).
 *    - Supporting: COMPRESSIONS (18 / 30), HAND POSITION (GOOD), MOTION (ACTIVE).
 *    - Labeled DEMO DATA.
 * 5. Full prefers-reduced-motion support.
 */
export const LiveCprHeroSignal: React.FC = () => {
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mq.matches);
    const handle = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, []);

  // ── ECG Waveform Path (Period = 280px, Net Δy = 0) ─────────────────────────
  //
  // Anatomy:
  //   flat lead-in (30) → P-wave (+16, Δy=0) → PR (14) → Q dip (+8, dy=+6)
  //   → R-spike UP (+12, dy=-58, reaches y=37) → S-wave (+16, dy=+58)
  //   → T-wave (+32, Δy=0) → rest (142) = 280px total width.
  //
  // Cumulative x to R-spike peak = 30 + 8 + 8 + 14 + 8 + 12 = 80px from cycle start.
  //
  const ecgCycle =
    'l 30 0 ' +   // flat lead-in
    'l 8 -4 ' +   // P-wave up
    'l 8 4 ' +    // P-wave down
    'l 14 0 ' +   // PR segment
    'l 8 6 ' +    // Q-wave dip
    'l 12 -58 ' + // R-spike — sharp upward peak (cardiac compression event)
    'l 8 52 ' +   // S-wave down
    'l 8 6 ' +    // S dip
    'l 10 -6 ' +  // return to baseline
    'l 16 -12 ' + // T-wave up
    'l 16 12 ' +  // T-wave down
    'l 142 0';    // baseline rest

  // Baseline at y=95.
  // Cycle 2 starts at waveStartX + 280.
  // R-spike of cycle 2 is at: waveStartX + 280 + 80 = waveStartX + 360.
  // Setting waveStartX = -130 places the R-spike peak at x = -130 + 360 = 230 (dead center).
  const waveStartX = -130;
  const waveBaseY = 95;

  const wavePath =
    `M ${waveStartX} ${waveBaseY} ` +
    `${ecgCycle} ${ecgCycle} ${ecgCycle} ${ecgCycle}`;

  // ── Heart Path (Centered at x=230, baseline at y=95) ──────────────────────
  //
  // Width: 156px (x=152 to 308). Height: 114px (y=38 to 152).
  // Center of mass ≈ (230, 95).
  // R-spike peak (y=37) aligns with top lobes (y=38), matching the reference visual.
  //
  const heartPath =
    'M 230 152 ' +
    'C 195 136, 152 110, 152 79 ' +
    'C 152 52, 170 38, 193 38 ' +
    'C 210 38, 224 50, 230 60 ' +
    'C 236 50, 250 38, 267 38 ' +
    'C 290 38, 308 52, 308 79 ' +
    'C 308 110, 265 136, 230 152 Z';

  const animate = !isReducedMotion;

  return (
    <div
      className="relative w-full rounded-xl border border-border"
      style={{ background: '#ECE8DE', overflow: 'hidden' }}
    >
      {/* Subtle instrument background grid */}
      <div className="absolute inset-0 tech-grid opacity-30 pointer-events-none" />

      {/* ── 1. Header ───────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-0 sm:px-6 sm:pt-5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-sm bg-brand-green" />
          <span className="font-mono text-xs font-bold tracking-wider text-content-primary uppercase">
            PULSEMATE LIVE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-border bg-canvas-primary text-[11px] font-mono font-medium text-content-primary">
            <span
              className={`w-1.5 h-1.5 rounded-full bg-status-success${animate ? ' animate-pulse' : ''}`}
            />
            LIVE
          </span>
          <span className="px-2 py-0.5 rounded border border-border text-[10px] font-mono text-content-secondary bg-canvas-primary/60 uppercase tracking-wide">
            DEMO SIGNAL
          </span>
        </div>
      </div>

      {/* ── 2. Dominant Heart + ECG Visual (SVG) ─────────────────────────────── */}
      <div className="relative z-10 px-2 py-2 sm:px-4 sm:py-3">
        <svg
          viewBox="0 0 460 190"
          style={{ display: 'block', width: '100%', overflow: 'hidden' }}
          role="img"
          aria-label="PULSEMATE CPR Heart and Live Synchronized ECG Waveform"
        >
          <defs>
            {/* Heart clip path for the interior white ECG trace */}
            <clipPath id="cpr-heart-clip">
              <path d={heartPath} />
            </clipPath>

            {/* Subtle soft red glow filter for the heart */}
            <filter id="cpr-heart-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="blur" />
              <feFlood floodColor="#C83A3A" floodOpacity="0.32" result="color" />
              <feComposite in2="blur" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Reference baseline and grid lines */}
          <line
            x1="0" y1="50" x2="460" y2="50"
            stroke="#C5C1B6" strokeWidth="0.5" strokeDasharray="3 9" opacity="0.4"
          />
          <line
            x1="0" y1={waveBaseY} x2="460" y2={waveBaseY}
            stroke="#B8B4A8" strokeWidth="0.75" opacity="0.5"
          />
          <line
            x1="0" y1="140" x2="460" y2="140"
            stroke="#C5C1B6" strokeWidth="0.5" strokeDasharray="3 9" opacity="0.4"
          />

          {/* ── LAYER 1: Exterior ECG Waveform (Green Glow + Core) ── */}
          {/* Green luminous edge glow */}
          <g className={animate ? 'cpr-wave-scroll' : undefined}>
            <path
              d={wavePath}
              fill="none"
              stroke="#3D9B76"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={animate ? 'cpr-ecg-glow-pulse' : undefined}
              opacity="0.35"
            />
            {/* Crisp core dark green line */}
            <path
              d={wavePath}
              fill="none"
              stroke="#173F35"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* ── LAYER 2: Solid CPR Red Heart (#C83A3A) ── */}
          {/* Positioned on top of Layer 1 to cover the green ECG inside the heart */}
          <g
            className={animate ? 'cpr-heart-pulse-glow' : undefined}
            style={{ transformOrigin: '230px 95px' }}
          >
            <path
              d={heartPath}
              fill="#C83A3A"
              stroke="#D94A4A"
              strokeWidth="1.2"
              filter="url(#cpr-heart-glow)"
            />
          </g>

          {/* ── LAYER 3: Interior ECG (White line clipped inside the heart) ── */}
          <g clipPath="url(#cpr-heart-clip)">
            <g className={animate ? 'cpr-wave-scroll' : undefined}>
              {/* Subtle white luminous glow */}
              <path
                d={wavePath}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.3"
              />
              {/* Crisp white core line */}
              <path
                d={wavePath}
                fill="none"
                stroke="#F7EFE6"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          </g>
        </svg>
      </div>

      {/* ── 3. Compact CPR Parameters Row (Instrumentation Style) ─────────────── */}
      <div className="relative z-10 border-t border-border/80 bg-canvas-primary/50 px-4 py-3 sm:px-6 sm:py-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-content-secondary">
              CPR PARAMETERS
            </span>
          </div>
          <span className="px-1.5 py-0.5 rounded border border-border text-[9px] font-mono text-content-secondary bg-canvas-secondary/80 uppercase tracking-wider">
            DEMO DATA
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-2">
          {/* PARAM 1: CPR RATE (Primary Metric) */}
          <div className="p-2 sm:p-2.5 rounded border border-border/70 bg-canvas-secondary/40">
            <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-content-secondary">
              CPR RATE
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono text-xl sm:text-2xl font-bold text-status-success">
                112
              </span>
              <span className="font-mono text-[11px] text-content-secondary">/min</span>
            </div>
            <div className="font-mono text-[9px] text-status-success font-medium mt-0.5">
              Target 100–120
            </div>
          </div>

          {/* PARAM 2: COMPRESSIONS */}
          <div className="p-2 sm:p-2.5 rounded border border-border/70 bg-canvas-secondary/40">
            <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-content-secondary">
              COMPRESSIONS
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-mono text-base sm:text-lg font-bold text-content-primary">
                18
              </span>
              <span className="font-mono text-[11px] text-content-secondary">/ 30</span>
            </div>
            <div className="font-mono text-[9px] text-content-secondary mt-0.5">
              Cycle 1
            </div>
          </div>

          {/* PARAM 3: HAND POSITION */}
          <div className="p-2 sm:p-2.5 rounded border border-border/70 bg-canvas-secondary/40">
            <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-content-secondary">
              HAND POSITION
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
              <span className="font-mono text-xs sm:text-sm font-bold text-status-success">
                GOOD
              </span>
            </div>
            <div className="font-mono text-[9px] text-content-secondary mt-0.5">
              Center Sternum
            </div>
          </div>

          {/* PARAM 4: MOTION */}
          <div className="p-2 sm:p-2.5 rounded border border-border/70 bg-canvas-secondary/40">
            <div className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-content-secondary">
              MOTION
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
              <span className="font-mono text-xs sm:text-sm font-bold text-status-success">
                ACTIVE
              </span>
            </div>
            <div className="font-mono text-[9px] text-content-secondary mt-0.5">
              In Rhythm
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. CSS Keyframe Animations (Synchronized at 112 BPM / 1.07s) ──────── */}
      <style>{`
        /* Waveform horizontal translation by exactly one periodic cycle (280px) */
        @keyframes cprWaveScroll {
          from { transform: translateX(0px); }
          to   { transform: translateX(-280px); }
        }

        /*
         * Synchronized Heart Pulse + Soft Red Glow:
         * Expands 3–4% as the R-spike passes through the heart at t=0,
         * with soft atmospheric glow intensifying, then smoothly settling.
         */
        @keyframes cprHeartPulseGlow {
          0%   {
            transform: scale(1);
            filter: drop-shadow(0 0 6px rgba(200, 58, 58, 0.25));
          }
          7%   {
            transform: scale(1.045);
            filter: drop-shadow(0 0 16px rgba(200, 58, 58, 0.55));
          }
          16%  {
            transform: scale(0.99);
            filter: drop-shadow(0 0 8px rgba(200, 58, 58, 0.3));
          }
          26%  {
            transform: scale(1.02);
            filter: drop-shadow(0 0 11px rgba(200, 58, 58, 0.38));
          }
          38%  {
            transform: scale(1);
            filter: drop-shadow(0 0 6px rgba(200, 58, 58, 0.25));
          }
          100% {
            transform: scale(1);
            filter: drop-shadow(0 0 6px rgba(200, 58, 58, 0.25));
          }
        }

        /*
         * ECG Luminous Edge Glow Pulse:
         * Intensifies subtly as the cardiac spike occurs, synchronized with the heart.
         */
        @keyframes cprEcgGlowPulse {
          0%   { opacity: 0.3; stroke-width: 5px; }
          7%   { opacity: 0.7; stroke-width: 7px; }
          16%  { opacity: 0.35; stroke-width: 5.5px; }
          26%  { opacity: 0.5; stroke-width: 6px; }
          38%  { opacity: 0.3; stroke-width: 5px; }
          100% { opacity: 0.3; stroke-width: 5px; }
        }

        .cpr-wave-scroll {
          animation: cprWaveScroll 1.07s linear infinite;
        }

        .cpr-heart-pulse-glow {
          animation: cprHeartPulseGlow 1.07s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
        }

        .cpr-ecg-glow-pulse {
          animation: cprEcgGlowPulse 1.07s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .cpr-wave-scroll,
          .cpr-heart-pulse-glow,
          .cpr-ecg-glow-pulse {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};
