import React, { useState } from 'react';
import { PageContainer } from '../components/common/PageContainer';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { useSession } from '../hooks/useSession';
import { CPRSession } from '../types/cpr';
import {
  History,
  Play,
  Filter,
  Trash2,
  X,
  CheckCircle2,
} from 'lucide-react';

interface SessionsPageProps {
  onNavigate: (path: string) => void;
}

export const SessionsPage: React.FC<SessionsPageProps> = ({ onNavigate }) => {
  const { sessions, deleteSession, clearSessions } = useSession();
  const [selectedSession, setSelectedSession] = useState<CPRSession | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const hasSessions = sessions.length > 0;

  return (
    <PageContainer
      eyebrow="HISTORY"
      title="Sessions"
      subtitle="Review completed CPR practice sessions, cadence stability, and hand orientation."
      actions={
        <div className="flex items-center gap-3">
          {hasSessions && (
            <button
              onClick={() => {
                if (window.confirm('Clear all recorded sessions from this browser?')) {
                  clearSessions();
                }
              }}
              className="text-xs font-mono text-content-muted hover:text-brand-burgundy px-2.5 py-1.5 rounded transition-colors"
            >
              Clear All
            </button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('/live')}
            icon={<Play className="w-3.5 h-3.5" />}
          >
            Start a Session
          </Button>
        </div>
      }
    >
      {/* Session List Container */}
      <div className="bg-white rounded-xl border border-border shadow-subtle overflow-hidden">
        {/* Top Header */}
        <div className="p-4 bg-canvas-secondary/60 border-b border-border flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-content-secondary">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold text-content-primary">
              SESSION HISTORY ({sessions.length} {sessions.length === 1 ? 'SESSION' : 'SESSIONS'})
            </span>
          </div>
          <span className="text-content-muted">SAVED LOCALLY IN BROWSER</span>
        </div>

        {/* Conditional Rendering: Empty State vs Sessions Table */}
        {!hasSessions ? (
          <div className="p-8 sm:p-14">
            <EmptyState
              icon={History}
              badgeText="NO DATA YET"
              title="No sessions recorded yet."
              description="Your completed CPR practice sessions will appear here automatically once recorded on the Live Monitor."
              actionLabel="Start a Session"
              onAction={() => onNavigate('/live')}
              secondaryActionLabel="Device Setup"
              onSecondaryAction={() => onNavigate('/device')}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs text-content-secondary">
              <thead className="bg-canvas-secondary/70 border-b border-border text-content-primary">
                <tr>
                  <th className="py-3 px-4 font-semibold">Session</th>
                  <th className="py-3 px-4 font-semibold">Date & Time</th>
                  <th className="py-3 px-4 font-semibold">Duration</th>
                  <th className="py-3 px-4 font-semibold">Compressions</th>
                  <th className="py-3 px-4 font-semibold">Avg Rate</th>
                  <th className="py-3 px-4 font-semibold">Target Range</th>
                  <th className="py-3 px-4 font-semibold">Avg Tilt</th>
                  <th className="py-3 px-4 font-semibold">Peak Accel</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sessions.map((session, index) => {
                  const sessionNum = String(sessions.length - index).padStart(3, '0');
                  return (
                    <tr
                      key={session.id}
                      onClick={() => setSelectedSession(session)}
                      className="hover:bg-canvas-primary/50 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-bold text-content-primary flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                        SESSION {sessionNum}
                      </td>
                      <td className="py-3.5 px-4 text-content-secondary whitespace-nowrap">
                        {formatDate(session.startedAt)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-content-primary whitespace-nowrap">
                        {formatDuration(session.duration)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-content-primary">
                        {session.totalCompressions}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-brand-green">
                        {session.averageRate} /min
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-status-success font-semibold border border-status-success/20">
                          {session.targetRangePercentage}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-content-primary">
                        {session.averageTilt}°
                      </td>
                      <td className="py-3.5 px-4 text-content-primary">
                        {session.peakAcceleration.toFixed(2)}g
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSession(session);
                            }}
                            className="text-xs font-semibold text-brand-green hover:underline py-1 px-2"
                          >
                            Details
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Delete this session record?')) {
                                deleteSession(session.id);
                              }
                            }}
                            className="text-content-muted hover:text-status-danger p-1 rounded hover:bg-red-50 transition-colors"
                            title="Delete session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl border border-border max-w-lg w-full p-6 shadow-elevated space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <span className="font-mono text-xs font-semibold uppercase text-brand-green tracking-wider block">
                  SESSION BREAKDOWN
                </span>
                <h3 className="text-lg font-bold text-content-primary">
                  {formatDate(selectedSession.startedAt)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="p-1 rounded-md text-content-muted hover:text-content-primary hover:bg-canvas-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 rounded-lg bg-canvas-primary/60 border border-border">
                <span className="text-[10px] text-content-secondary uppercase block">
                  TOTAL COMPRESSIONS
                </span>
                <span className="text-xl font-bold text-content-primary mt-0.5 block">
                  {selectedSession.totalCompressions}
                </span>
                <span className="text-[10px] text-content-muted">Completed in cycle</span>
              </div>

              <div className="p-3 rounded-lg bg-canvas-primary/60 border border-border">
                <span className="text-[10px] text-content-secondary uppercase block">
                  DURATION
                </span>
                <span className="text-xl font-bold text-content-primary mt-0.5 block">
                  {formatDuration(selectedSession.duration)}
                </span>
                <span className="text-[10px] text-content-muted">Active practice</span>
              </div>

              <div className="p-3 rounded-lg bg-canvas-primary/60 border border-border">
                <span className="text-[10px] text-content-secondary uppercase block">
                  AVERAGE CPR RATE
                </span>
                <span className="text-xl font-bold text-brand-green mt-0.5 block">
                  {selectedSession.averageRate} <span className="text-xs font-normal text-content-secondary">/min</span>
                </span>
                <span className="text-[10px] text-status-success font-medium">Target 100–120</span>
              </div>

              <div className="p-3 rounded-lg bg-canvas-primary/60 border border-border">
                <span className="text-[10px] text-content-secondary uppercase block">
                  TARGET RANGE ACCURACY
                </span>
                <span className="text-xl font-bold text-status-success mt-0.5 block">
                  {selectedSession.targetRangePercentage}%
                </span>
                <span className="text-[10px] text-content-muted">Within 100–120 CPM</span>
              </div>

              <div className="p-3 rounded-lg bg-canvas-primary/60 border border-border">
                <span className="text-[10px] text-content-secondary uppercase block">
                  AVERAGE PALM TILT
                </span>
                <span className="text-xl font-bold text-content-primary mt-0.5 block">
                  {selectedSession.averageTilt}°
                </span>
                <span className="text-[10px] text-content-muted">Off-vertical alignment</span>
              </div>

              <div className="p-3 rounded-lg bg-canvas-primary/60 border border-border">
                <span className="text-[10px] text-content-secondary uppercase block">
                  PEAK ACCELERATION
                </span>
                <span className="text-xl font-bold text-content-primary mt-0.5 block">
                  {selectedSession.peakAcceleration.toFixed(2)} g
                </span>
                <span className="text-[10px] text-content-muted">Max compression force</span>
              </div>
            </div>

            {/* Performance Review Summary */}
            <div className="p-4 rounded-lg bg-canvas-secondary/70 border border-border space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-success" />
                <span className="font-mono text-xs font-bold text-content-primary">
                  Evaluation: {selectedSession.status}
                </span>
              </div>
              <p className="text-xs text-content-secondary leading-relaxed">
                Cadence stayed consistent throughout the run. Average tilt remained within acceptable physiological margins for downward compression mechanics.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  deleteSession(selectedSession.id);
                  setSelectedSession(null);
                }}
                className="text-xs font-mono text-status-danger hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Delete Record
              </button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedSession(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
