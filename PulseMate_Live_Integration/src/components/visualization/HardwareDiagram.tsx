import React from 'react';
import { ArrowRight, Activity, Cpu, Sparkles } from 'lucide-react';

export const HardwareDiagram: React.FC = () => {
  return (
    <div className="w-full rounded-xl border border-border bg-white/80 p-6 sm:p-8 shadow-subtle">
      <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 relative">
        {/* Step 1: SENSE */}
        <div className="flex-1 p-5 rounded-lg bg-canvas-primary border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-canvas-muted text-content-secondary rounded">
                SENSE
              </span>
              <Activity className="w-4 h-4 text-brand-green" />
            </div>
            <h4 className="text-base font-bold text-content-primary tracking-tight">
              MPU6050
            </h4>
            <p className="text-xs text-content-secondary mt-1 leading-relaxed">
              Captures hand motion and tilt angle during chest compressions.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-border/70 font-mono text-[11px] text-content-muted">
            Motion Sensor
          </div>
        </div>

        {/* Transfer Arrow 1 */}
        <div className="hidden md:flex items-center justify-center text-content-muted">
          <ArrowRight className="w-5 h-5 stroke-[1.5]" />
        </div>

        {/* Step 2: PROCESS */}
        <div className="flex-1 p-5 rounded-lg bg-brand-green text-white border border-brand-deep flex flex-col justify-between shadow-subtle">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-brand-deep text-emerald-200 rounded">
                PROCESS
              </span>
              <Cpu className="w-4 h-4 text-emerald-300" />
            </div>
            <h4 className="text-base font-bold text-white tracking-tight">
              ESP32-S3
            </h4>
            <p className="text-xs text-emerald-100/90 mt-1 leading-relaxed">
              Processes motion on-device to calculate compression rhythm and positioning.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-brand-deep font-mono text-[11px] text-emerald-300">
            On-Device Controller
          </div>
        </div>

        {/* Transfer Arrow 2 */}
        <div className="hidden md:flex items-center justify-center text-content-muted">
          <ArrowRight className="w-5 h-5 stroke-[1.5]" />
        </div>

        {/* Step 3: FEEDBACK */}
        <div className="flex-1 p-5 rounded-lg bg-canvas-primary border border-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-canvas-muted text-content-secondary rounded">
                FEEDBACK
              </span>
              <Sparkles className="w-4 h-4 text-brand-burgundy" />
            </div>
            <h4 className="text-base font-bold text-content-primary tracking-tight">
              Instant Feedback
            </h4>
            
            <div className="mt-2 space-y-1.5 text-xs text-content-secondary">
              <p>• <strong>Light:</strong> Visual pacing cues</p>
              <p>• <strong>Sound:</strong> Rhythm metronome</p>
              <p>• <strong>Vibration:</strong> Tactile guidance</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/70 font-mono text-[11px] text-content-muted">
            Light · Sound · Vibration
          </div>
        </div>
      </div>
    </div>
  );
};
