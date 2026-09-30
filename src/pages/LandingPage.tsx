import React from 'react';
import { Button } from '../components/common/Button';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { SectionHeading } from '../components/common/SectionHeading';
import { LiveCprHeroSignal } from '../components/visualization/LiveCprHeroSignal';
import { DashboardMockup } from '../components/visualization/DashboardMockup';
import { HardwareDiagram } from '../components/visualization/HardwareDiagram';
import {
  Activity,
  ArrowRight,
  Compass,
  BarChart3,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* 1. HERO SECTION */}
      <section className="pt-6 sm:pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-6">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-canvas-secondary border border-border">
                <span className="w-2 h-2 rounded-full bg-brand-green" />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-brand-green">
                  SMART CPR GLOVE
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-content-primary leading-[1.12]">
                CPR shouldn't depend on guesswork.
              </h1>

              {/* Supporting Copy */}
              <p className="text-base sm:text-lg text-content-secondary leading-relaxed max-w-xl">
                SANJEEVANI is a smart CPR feedback glove designed to help users practice rhythm, hand positioning and consistency with immediate feedback.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => onNavigate('/live')}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Open Live Monitor
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => {
                    const el = document.getElementById('how-it-works');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Explore the System
                </Button>
              </div>

              {/* System Status Module */}
              <div className="pt-4">
                <div className="p-4 rounded-lg bg-canvas-secondary/70 border border-border max-w-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-content-primary">
                      SANJEEVANI SYSTEM
                    </span>
                    <StatusIndicator status="OFFLINE" label="DEVICE OFFLINE" size="sm" />
                  </div>
                  <p className="text-xs text-content-secondary leading-relaxed">
                    No device connected. Connect the glove to begin monitoring.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Live Signal Visualization Column */}
            <div className="lg:col-span-6">
              <LiveCprHeroSignal />
            </div>
          </div>
        </div>
      </section>

      {/* 2. PROBLEM SECTION */}
      <section className="bg-canvas-secondary/40 py-16 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="WHY IT MATTERS"
            title="During CPR, timing matters."
            description="Resuscitation guidelines focus on three critical physical factors that determine effective chest compressions."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            {/* Point 01 */}
            <div className="space-y-3 border-l-2 border-brand-green/40 pl-5">
              <div className="font-mono text-xs font-bold text-brand-green uppercase tracking-wider">
                01 · CADENCE
              </div>
              <h3 className="text-lg font-bold text-content-primary tracking-tight">
                Compression rhythm
              </h3>
              <p className="text-sm text-content-secondary leading-relaxed">
                Standard guidelines require 100 to 120 compressions per minute. Compressing too quickly or slowing down causes fatigue and reduces effectiveness.
              </p>
            </div>

            {/* Point 02 */}
            <div className="space-y-3 border-l-2 border-brand-green/40 pl-5">
              <div className="font-mono text-xs font-bold text-brand-green uppercase tracking-wider">
                02 · ORIENTATION
              </div>
              <h3 className="text-lg font-bold text-content-primary tracking-tight">
                Hand positioning
              </h3>
              <p className="text-sm text-content-secondary leading-relaxed">
                Off-axis palm tilt causes force to push sideways rather than directly downward onto the chest, reducing compression quality.
              </p>
            </div>

            {/* Point 03 */}
            <div className="space-y-3 border-l-2 border-brand-green/40 pl-5">
              <div className="font-mono text-xs font-bold text-brand-green uppercase tracking-wider">
                03 · ENDURANCE
              </div>
              <h3 className="text-lg font-bold text-content-primary tracking-tight">
                Consistency over time
              </h3>
              <p className="text-sm text-content-secondary leading-relaxed">
                Rescuers often experience fatigue within two minutes. Continuous pacing feedback helps maintain consistent compression rhythm throughout practice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="SYSTEM WORKFLOW"
          title="How it works"
          description="A continuous real-time loop capturing physical compression mechanics and translating them into immediate cues."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-2">
          {/* Step 1: SENSE */}
          <div className="space-y-2.5">
            <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-canvas-muted text-content-secondary rounded inline-block">
              01 SENSE
            </span>
            <h3 className="text-lg font-bold text-content-primary">
              Motion Capture
            </h3>
            <p className="text-sm text-content-secondary leading-relaxed">
              The glove captures motion data through onboard sensors, tracking movement rhythm and palm angle during compressions.
            </p>
          </div>

          {/* Step 2: INTERPRET */}
          <div className="space-y-2.5">
            <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-canvas-muted text-content-secondary rounded inline-block">
              02 INTERPRET
            </span>
            <h3 className="text-lg font-bold text-content-primary">
              Instant Processing
            </h3>
            <p className="text-sm text-content-secondary leading-relaxed">
              The system processes movement to estimate CPR rhythm and positioning directly on the device with zero perceivable delay.
            </p>
          </div>

          {/* Step 3: FEEDBACK */}
          <div className="space-y-2.5">
            <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-canvas-muted text-content-secondary rounded inline-block">
              03 FEEDBACK
            </span>
            <h3 className="text-lg font-bold text-content-primary">
              Multi-Sensory Cues
            </h3>
            <p className="text-sm text-content-secondary leading-relaxed">
              The user receives immediate visual, audio and vibration feedback to stay locked onto target CPR guidelines.
            </p>
          </div>
        </div>
      </section>

      {/* 4. LIVE MONITOR PREVIEW */}
      <section className="bg-canvas-secondary/50 py-16 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="TELEMETRY INTERFACE"
            title="See every compression as it happens."
            description="A dedicated clinical dashboard providing actionable rate, orientation, and motion indicators without distraction."
          />

          <DashboardMockup />
        </div>
      </section>

      {/* 5. CAPABILITIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="CORE CAPABILITIES"
          title="Built around the moments that matter."
          description="Engineered specifically to help rescuers master the core physical fundamentals of CPR."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-lg border border-border bg-white/80 shadow-subtle">
            <div className="w-9 h-9 rounded bg-canvas-muted flex items-center justify-center text-brand-green mb-4">
              <Activity className="w-5 h-5 stroke-[1.75]" />
            </div>
            <h4 className="text-base font-bold text-content-primary mb-1">
              CPR Rhythm
            </h4>
            <p className="text-xs text-content-secondary leading-relaxed">
              Monitor compression cadence in real time to prevent pace drift during extended practice.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-border bg-white/80 shadow-subtle">
            <div className="w-9 h-9 rounded bg-canvas-muted flex items-center justify-center text-brand-green mb-4">
              <Compass className="w-5 h-5 stroke-[1.75]" />
            </div>
            <h4 className="text-base font-bold text-content-primary mb-1">
              Hand Position
            </h4>
            <p className="text-xs text-content-secondary leading-relaxed">
              Track glove orientation and tilt to ensure downward compressions remain properly aligned.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-border bg-white/80 shadow-subtle">
            <div className="w-9 h-9 rounded bg-canvas-muted flex items-center justify-center text-brand-green mb-4">
              <Sparkles className="w-5 h-5 stroke-[1.75]" />
            </div>
            <h4 className="text-base font-bold text-content-primary mb-1">
              Immediate Feedback
            </h4>
            <p className="text-xs text-content-secondary leading-relaxed">
              Visual, audio and vibration feedback provide tactile and audible cues without having to look away.
            </p>
          </div>

          <div className="p-5 rounded-lg border border-border bg-white/80 shadow-subtle">
            <div className="w-9 h-9 rounded bg-canvas-muted flex items-center justify-center text-brand-green mb-4">
              <BarChart3 className="w-5 h-5 stroke-[1.75]" />
            </div>
            <h4 className="text-base font-bold text-content-primary mb-1">
              Session Review
            </h4>
            <p className="text-xs text-content-secondary leading-relaxed">
              Understand overall practice performance and consistency after each session.
            </p>
          </div>
        </div>
      </section>

      {/* 6. HARDWARE SECTION */}
      <section className="bg-canvas-secondary/40 py-16 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="HARDWARE ARCHITECTURE"
            title="A small system built for real-time feedback."
            description="Compact on-device compute integrating motion sensing with synchronized light, sound, and tactile feedback."
          />

          <HardwareDiagram />
        </div>
      </section>

      {/* 7. TRUST / LIMITATION SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-xl border border-border bg-white shadow-subtle flex items-start gap-4">
          <div className="w-8 h-8 rounded bg-canvas-muted flex items-center justify-center text-content-secondary shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-content-primary tracking-tight mb-2">
              Designed as a motion-based CPR feedback prototype.
            </h3>
            <p className="text-sm text-content-secondary leading-relaxed">
              SANJEEVANI uses motion sensing to provide feedback on CPR rhythm and positioning. It is not intended to replace certified CPR training, clinical equipment, or medical-grade measurement.
            </p>
          </div>
        </div>
      </section>

      {/* 8. FINAL CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-4">
        <div className="max-w-3xl mx-auto p-8 sm:p-12 rounded-xl bg-canvas-secondary border border-border shadow-subtle space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-content-primary">
            Practice with feedback. Improve with evidence.
          </h2>
          <p className="text-sm sm:text-base text-content-secondary max-w-xl mx-auto">
            Open the live monitor or inspect the device configuration.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => onNavigate('/live')}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Open Live Monitor
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => onNavigate('/device')}
            >
              Explore the System
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
