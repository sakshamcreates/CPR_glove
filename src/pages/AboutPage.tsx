import React from 'react';
import { PageContainer } from '../components/common/PageContainer';
import { SectionHeading } from '../components/common/SectionHeading';
import { TechnicalGloveBlueprint } from '../components/visualization/TechnicalGloveBlueprint';
import { Cpu, Activity, Sparkles, ShieldAlert } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <PageContainer
      eyebrow="ABOUT"
      title="About SANJEEVANI"
      subtitle="The motivation and design behind the motion-assisted CPR feedback glove."
    >
      <div className="space-y-12">
        {/* Section 1: Product Overview & Motivation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-content-primary">
              What is SANJEEVANI?
            </h2>
            <p className="text-sm sm:text-base text-content-secondary leading-relaxed">
              SANJEEVANI is a smart wearable CPR feedback glove designed to help users practice rhythm, hand positioning, and consistency with immediate feedback.
            </p>
            <h3 className="text-base font-bold text-content-primary pt-2">
              Why does it exist?
            </h3>
            <p className="text-sm text-content-secondary leading-relaxed">
              During CPR practice, trainees often struggle with two critical factors: <strong>cadence drift</strong> (compressing too fast or slowing down due to fatigue) and <strong>hand tilt</strong> (compressing at an off-axis angle rather than straight downward).
            </p>
            <p className="text-sm text-content-secondary leading-relaxed">
              By combining motion sensing with synchronized visual, audio, and vibration feedback, SANJEEVANI gives rescuers instant feedback right on their hand.
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="p-6 rounded-xl border border-border bg-white shadow-subtle space-y-3">
              <span className="font-mono text-xs font-semibold text-brand-green uppercase tracking-wider block">
                CORE PRINCIPLES
              </span>
              <p className="text-xs text-content-secondary leading-relaxed">
                1. <strong>No Guesswork:</strong> Know your rhythm and position instantly.
              </p>
              <p className="text-xs text-content-secondary leading-relaxed">
                2. <strong>Immediate Feedback:</strong> Multi-sensory cues (light, sound, and vibration) keep you in the target range.
              </p>
              <p className="text-xs text-content-secondary leading-relaxed">
                3. <strong>Focused Practice:</strong> Build muscle memory and confidence through guided practice.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Component Breakdown */}
        <div className="border-t border-border pt-10">
          <SectionHeading
            eyebrow="SYSTEM OVERVIEW"
            title="How the Glove Works"
            description="A minimal, self-contained system built for immediate CPR feedback."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Component 1 */}
            <div className="p-5 rounded-lg border border-border bg-white shadow-subtle">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-5 h-5 text-brand-green" />
                <h4 className="text-base font-bold text-content-primary">ESP32-S3 Controller</h4>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Handles on-device movement calculations and synchronizes the light, sound, and vibration feedback cues.
              </p>
            </div>

            {/* Component 2 */}
            <div className="p-5 rounded-lg border border-border bg-white shadow-subtle">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-brand-green" />
                <h4 className="text-base font-bold text-content-primary">MPU6050 Motion Sensor</h4>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Tracks hand motion rhythm and palm orientation during each chest compression.
              </p>
            </div>

            {/* Component 3 */}
            <div className="p-5 rounded-lg border border-border bg-white shadow-subtle">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-brand-green" />
                <h4 className="text-base font-bold text-content-primary">Multi-Sensory Feedback</h4>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Combines an LED light for visual pacing, a gentle buzzer for rhythm cadence, and a vibration motor for tactile cues.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Technical Blueprint View */}
        <div className="border-t border-border pt-10">
          <SectionHeading
            eyebrow="PRODUCT SCHEMATIC"
            title="Glove Layout"
            description="Physical positioning of the motion sensor, controller, and feedback elements."
          />
          <TechnicalGloveBlueprint />
        </div>

        {/* Section 4: Clinical Limitation & Prototype Statement */}
        <div className="p-6 sm:p-8 rounded-xl border border-border bg-white shadow-subtle flex items-start gap-4">
          <div className="w-8 h-8 rounded bg-canvas-muted flex items-center justify-center text-brand-burgundy shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5 stroke-[1.75]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-content-primary">
              Prototype Notice
            </h3>
            <p className="text-sm text-content-secondary leading-relaxed">
              SANJEEVANI is a motion-based CPR feedback prototype designed for practice and simulated training. It is not intended to replace certified CPR training, clinical equipment, or medical-grade measurement.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
