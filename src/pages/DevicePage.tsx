import React from 'react';
import { PageContainer } from '../components/common/PageContainer';
import { StatusIndicator } from '../components/common/StatusIndicator';
import { Button } from '../components/common/Button';
import { HardwareDiagram } from '../components/visualization/HardwareDiagram';
import { useCPRData } from '../hooks/useCPRData';
import { Radio, Sliders, AlertCircle, Cpu, Activity, Zap, Volume2, Bell, ChevronDown } from 'lucide-react';

export const DevicePage: React.FC = () => {
  const { adapterMode, connectionStatus } = useCPRData();
  const isLiveEsp32 = adapterMode === 'esp32';

  return (
    <PageContainer
      eyebrow="DEVICE"
      title="PULSEMATE Device"
      subtitle="Physical prototype hardware specifications, system architecture, and technical reference."
      actions={
        <div className="flex items-center gap-3">
          {isLiveEsp32 ? (
            <StatusIndicator status={connectionStatus} size="sm" />
          ) : (
            <StatusIndicator variant="demo" label="DEMO MODE" size="sm" />
          )}
        </div>
      }
    >
      {/* Top Device Specs Card */}
      <div className="bg-white rounded-xl border border-border shadow-subtle p-6 sm:p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-base font-bold text-content-primary">
                PULSEMATE-01
              </span>
              <span className="font-mono text-xs px-2 py-0.5 bg-canvas-muted text-content-secondary rounded border border-border">
                HARDWARE PROTOTYPE
              </span>
            </div>
            <p className="text-xs text-content-secondary">
              Smart Wearable CPR Feedback Glove
            </p>
          </div>

          {/* Action Buttons (Product-focused state) */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              disabled={true}
              icon={<Sliders className="w-4 h-4" />}
            >
              Calibrate (Offline)
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={true}
              icon={<Radio className="w-4 h-4" />}
            >
              Hardware Link
            </Button>
          </div>
        </div>

        {/* Simplified Device Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-6">
          <div className="p-3.5 rounded-lg bg-canvas-primary/60 border border-border/80">
            <span className="font-mono text-[11px] text-content-secondary uppercase block mb-1">
              COMMUNICATION
            </span>
            <span className="font-mono text-xs font-semibold text-content-primary flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-content-muted" />
              {isLiveEsp32 && connectionStatus === 'CONNECTED' ? 'WebSocket Active' : 'WebSocket / Demo Mode'}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-canvas-primary/60 border border-border/80">
            <span className="font-mono text-[11px] text-content-secondary uppercase block mb-1">
              CONTROLLER
            </span>
            <span className="font-mono text-sm font-semibold text-content-primary">
              ESP32-S3
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-canvas-primary/60 border border-border/80">
            <span className="font-mono text-[11px] text-content-secondary uppercase block mb-1">
              MOTION SENSOR
            </span>
            <span className="font-mono text-sm font-semibold text-content-primary">
              MPU6050
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-canvas-primary/60 border border-border/80">
            <span className="font-mono text-[11px] text-content-secondary uppercase block mb-1">
              FEEDBACK
            </span>
            <span className="font-mono text-sm font-semibold text-content-primary">
              RGB LED · Buzzer · Motor
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-canvas-primary/60 border border-border/80">
            <span className="font-mono text-[11px] text-content-secondary uppercase block mb-1">
              FIRMWARE
            </span>
            <span className="font-mono text-xs text-content-muted">
              Not available yet
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-canvas-primary/60 border border-border/80">
            <span className="font-mono text-[11px] text-content-secondary uppercase block mb-1">
              BATTERY
            </span>
            <span className="font-mono text-xs text-content-muted">
              Not available yet
            </span>
          </div>
        </div>
      </div>

      {/* Collapsible Technical Pinout Reference (Preserves clean public UI without prominent GPIO clutter) */}
      <details className="group bg-white rounded-xl border border-border shadow-subtle p-6 mb-8 transition-all">
        <summary className="cursor-pointer list-none flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-brand-green" />
            <h3 className="font-mono text-xs font-bold text-content-primary uppercase tracking-wide">
              Technical Reference: Prototype Circuit Pinout
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-content-muted group-hover:text-content-primary">
            <span>View Schematic Mapping</span>
            <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
          </div>
        </summary>

        <div className="pt-5 border-t border-border/70 mt-4 space-y-4">
          <p className="text-xs text-content-secondary">
            Confirmed circuit assignments for the ESP32-S3 38-pin prototype development glove:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border border-border rounded-lg overflow-hidden">
              <thead className="bg-canvas-secondary/70 border-b border-border text-content-primary">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Subsystem</th>
                  <th className="py-2.5 px-3 font-semibold">ESP32 Pin</th>
                  <th className="py-2.5 px-3 font-semibold">Target Component Connection</th>
                  <th className="py-2.5 px-3 font-semibold">Circuit Protection / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-content-secondary bg-white">
                {/* MPU6050 */}
                <tr className="hover:bg-canvas-primary/30">
                  <td className="py-2.5 px-3 font-semibold text-content-primary" rowSpan={4}>
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-brand-green" />
                      MPU6050 (I2C)
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-brand-green">GPIO 8</td>
                  <td className="py-2.5 px-3">SDA (I2C Data)</td>
                  <td className="py-2.5 px-3 text-content-muted">Direct I2C data</td>
                </tr>
                <tr className="hover:bg-canvas-primary/30">
                  <td className="py-2.5 px-3 font-bold text-brand-green">GPIO 9</td>
                  <td className="py-2.5 px-3">SCL (I2C Clock)</td>
                  <td className="py-2.5 px-3 text-content-muted">Direct I2C clock</td>
                </tr>
                <tr className="hover:bg-canvas-primary/30">
                  <td className="py-2.5 px-3 font-bold text-content-primary">3V3</td>
                  <td className="py-2.5 px-3">VCC</td>
                  <td className="py-2.5 px-3 text-content-muted">3.3V logic supply rail</td>
                </tr>
                <tr className="hover:bg-canvas-primary/30">
                  <td className="py-2.5 px-3 font-bold text-content-primary">GND</td>
                  <td className="py-2.5 px-3">GND</td>
                  <td className="py-2.5 px-3 text-content-muted">Common ground</td>
                </tr>

                {/* RGB LED */}
                <tr className="hover:bg-canvas-primary/30 bg-canvas-secondary/20">
                  <td className="py-2.5 px-3 font-semibold text-content-primary" rowSpan={4}>
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-status-success" />
                      RGB LED (Visual)
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-brand-green">GPIO 4</td>
                  <td className="py-2.5 px-3">Green LED Anode</td>
                  <td className="py-2.5 px-3 text-content-muted">Through 220Ω current-limiting resistor</td>
                </tr>
                <tr className="hover:bg-canvas-primary/30 bg-canvas-secondary/20">
                  <td className="py-2.5 px-3 font-bold text-brand-green">GPIO 7</td>
                  <td className="py-2.5 px-3">Red LED Anode</td>
                  <td className="py-2.5 px-3 text-content-muted">Through 220Ω current-limiting resistor</td>
                </tr>
                <tr className="hover:bg-canvas-primary/30 bg-canvas-secondary/20">
                  <td className="py-2.5 px-3 font-bold text-brand-green">GPIO 5</td>
                  <td className="py-2.5 px-3">Blue LED Anode</td>
                  <td className="py-2.5 px-3 text-content-muted">Through 220Ω current-limiting resistor</td>
                </tr>
                <tr className="hover:bg-canvas-primary/30 bg-canvas-secondary/20">
                  <td className="py-2.5 px-3 font-bold text-content-primary">GND</td>
                  <td className="py-2.5 px-3">Common Pin (Cathode)</td>
                  <td className="py-2.5 px-3 text-content-muted">Common ground reference</td>
                </tr>

                {/* Active Buzzer */}
                <tr className="hover:bg-canvas-primary/30">
                  <td className="py-2.5 px-3 font-semibold text-content-primary" rowSpan={2}>
                    <div className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-brand-green" />
                      Active Buzzer (Audio)
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-brand-green">GPIO 10</td>
                  <td className="py-2.5 px-3">Buzzer (+)</td>
                  <td className="py-2.5 px-3 text-content-muted">Active audio rhythm metronome</td>
                </tr>
                <tr className="hover:bg-canvas-primary/30">
                  <td className="py-2.5 px-3 font-bold text-content-primary">GND</td>
                  <td className="py-2.5 px-3">Buzzer (-)</td>
                  <td className="py-2.5 px-3 text-content-muted">Common ground</td>
                </tr>

                {/* Vibration Motor */}
                <tr className="hover:bg-canvas-primary/30 bg-canvas-secondary/20">
                  <td className="py-2.5 px-3 font-semibold text-content-primary" rowSpan={3}>
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-brand-burgundy" />
                      Vibration Motor (Haptic)
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-brand-green">GPIO 3</td>
                  <td className="py-2.5 px-3">220Ω Resistor → BC547 Base</td>
                  <td className="py-2.5 px-3 text-content-muted">Transistor base drive</td>
                </tr>
                <tr className="hover:bg-canvas-primary/30 bg-canvas-secondary/20">
                  <td className="py-2.5 px-3 font-bold text-content-primary">BC547 / Supply</td>
                  <td className="py-2.5 px-3">
                    Collector → Motor (-) | Emitter → GND<br />
                    Motor (+) → Battery supply
                  </td>
                  <td className="py-2.5 px-3 text-content-muted">Transistor low-side switch driver</td>
                </tr>
                <tr className="hover:bg-canvas-primary/30 bg-canvas-secondary/20">
                  <td className="py-2.5 px-3 font-bold text-content-primary">Diode</td>
                  <td className="py-2.5 px-3">1N4007 across motor terminals</td>
                  <td className="py-2.5 px-3 text-content-muted">Flyback diode: Cathode (stripe) → Motor (+), Anode → Motor (-)</td>
                </tr>

                {/* Unused Pin */}
                <tr className="hover:bg-canvas-primary/30">
                  <td className="py-2.5 px-3 font-semibold text-content-secondary">Reserved</td>
                  <td className="py-2.5 px-3 font-bold text-content-muted">GPIO 6</td>
                  <td className="py-2.5 px-3 text-content-muted">UNUSED</td>
                  <td className="py-2.5 px-3 text-content-muted">Not connected in current prototype</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </details>

      {/* Safety & Technical Limitation Statement */}
      <div className="p-6 sm:p-8 rounded-xl border border-border bg-white shadow-subtle flex items-start gap-4 mb-8">
        <div className="w-8 h-8 rounded bg-canvas-muted flex items-center justify-center text-brand-burgundy shrink-0 mt-0.5">
          <AlertCircle className="w-5 h-5 stroke-[1.75]" />
        </div>
        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-content-primary">
            Motion-Based Sensing Scope & Technical Limitation
          </h4>
          <p className="text-xs text-content-secondary leading-relaxed">
            PULSEMATE is a motion-based CPR feedback prototype. The onboard MPU6050 sensor estimates real-time rhythm cadence, linear acceleration, stroke consistency, and palm orientation/tilt. It does <strong>not</strong> directly measure actual physical compression force, true chest depth, or clinical resuscitation effectiveness. The device is designed for guided practice and muscle memory training, not as medical-grade diagnostic equipment.
          </p>
        </div>
      </div>

      {/* Visual Hardware Architecture */}
      <div className="space-y-4">
        <h3 className="font-mono text-xs font-semibold tracking-wider text-content-secondary uppercase">
          HARDWARE SYSTEM ARCHITECTURE
        </h3>
        <HardwareDiagram />
      </div>
    </PageContainer>
  );
};
