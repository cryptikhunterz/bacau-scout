'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getPotentialColor, POTENTIAL_LABELS, PlayerGrade } from '@/lib/grades';
import { GradingForm } from '@/components/GradingForm';
import { RadarChart } from '@/components/RadarChart';
import { WyscoutRadars } from '@/components/WyscoutRadars';
import { getPositionTemplate, resolvePositionCategory } from '@/lib/positionAttributes';

interface AttachmentData {
  id: string;
  reportId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  label: string | null;
  createdAt: string;
}

interface ReportData {
  playerId: string;
  playerName: string;
  position: string;
  club: string;
  gradedAt: string;
  ability: number;
  potential: number;
  report: number;
  verdict: string;
  role: string;
  conclusion: string;
  notes: string;
  scoutName: string;
  scoutId: string;
  salary: string;
  transferFee: string;
  scoutingTags: string[];
  // Physical
  physStrength: number;
  physSpeed: number;
  physAgility: number;
  physCoordination: number;
  // Technique
  techControl: number;
  techShortPasses: number;
  techLongPasses: number;
  techAerial: number;
  techCrossing: number;
  techFinishing: number;
  techDribbling: number;
  techOneVsOneOffense: number;
  techOneVsOneDefense: number;
  // Tactic
  tacPositioning: number;
  tacTransition: number;
  tacDecisions: number;
  tacAnticipations: number;
  tacDuels: number;
  tacSetPieces: number;
  // Potential versions
  physStrengthPot?: number;
  physSpeedPot?: number;
  physAgilityPot?: number;
  physCoordinationPot?: number;
  techControlPot?: number;
  techShortPassesPot?: number;
  techLongPassesPot?: number;
  techAerialPot?: number;
  techCrossingPot?: number;
  techFinishingPot?: number;
  techDribblingPot?: number;
  techOneVsOneOffensePot?: number;
  techOneVsOneDefensePot?: number;
  tacPositioningPot?: number;
  tacTransitionPot?: number;
  tacDecisionsPot?: number;
  tacAnticipationsPot?: number;
  tacDuelsPot?: number;
  tacSetPiecesPot?: number;
  // Position-specific attributes (new system)
  positionCategory?: string | null;
  positionAttributes?: Record<string, number> | null;
  // Admin edit tracking
  editedBy?: string | null;
  editedById?: string | null;
  editedAt?: string | null;
}

const verdictColors: Record<string, string> = {
  'Sign': 'bg-green-600 text-white',
  'Monitor': 'bg-yellow-500 text-black',
  'Not a priority': 'bg-zinc-600 text-white',
  'Out of reach': 'bg-red-600 text-white',
  'Discard': 'bg-red-900 text-white',
};

function RatingBadge({ value, type = 'ability' }: { value: number; type?: 'ability' | 'potential' }) {
  return (
    <span className={`inline-flex items-center justify-center w-8 h-7 rounded font-bold text-sm ${getPotentialColor(value)}`}>
      {value}
    </span>
  );
}

function AttributeRow({ label, ability }: { label: string; ability: number }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-zinc-800/50 last:border-0">
      <span className="text-sm text-zinc-400">{label}</span>
      <RatingBadge value={ability} type="ability" />
    </div>
  );
}

export default function ReportViewPage({ params }: { params: Promise<{ playerId: string }> }) {
  const { data: session } = useSession();
  const [report, setReport] = useState<ReportData | null>(null);
  const [allReports, setAllReports] = useState<ReportData[]>([]);
  const [attachments, setAttachments] = useState<AttachmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [editingReport, setEditingReport] = useState<ReportData | null>(null);

  const isAdmin = session?.user?.role === 'admin';

  // ─── Compute radar chart data — split into Position Radar + Overall Radar ──
  const { positionRadar, overallRadar } = useMemo(() => {
    const empty = { positionRadar: null as { labels: string[]; values: number[]; title: string } | null, overallRadar: null as { labels: string[]; values: number[]; title: string } | null };
    if (!report) return empty;

    const positionGroupTitles = ['Defensive Actions', 'Offensive Actions', 'Technical'];

    // Case 1: New system — positionAttributes
    if (report.positionAttributes && Object.keys(report.positionAttributes).length > 0) {
      const template = getPositionTemplate(report.position);
      if (template.groups.length === 0) return empty;
      
      const posLabels: string[] = [];
      const posValues: number[] = [];
      const ovLabels: string[] = [];
      const ovValues: number[] = [];
      
      for (const group of template.groups) {
        const isPosition = positionGroupTitles.includes(group.title);
        for (const attr of group.attributes) {
          if (isPosition) {
            posLabels.push(attr);
            posValues.push(report.positionAttributes[attr] || 0);
          } else {
            ovLabels.push(attr);
            ovValues.push(report.positionAttributes[attr] || 0);
          }
        }
      }
      
      return {
        positionRadar: posLabels.length >= 3 ? { labels: posLabels, values: posValues, title: `${template.badge} POSITION RADAR` } : null,
        overallRadar: ovLabels.length >= 3 ? { labels: ovLabels, values: ovValues, title: 'OVERALL TRAITS' } : null,
      };
    }

    // Case 2: Legacy attributes — Physical = position-ish, Technique + Tactic = overall
    const posAttrs: { label: string; value: number }[] = [
      { label: 'Control', value: report.techControl },
      { label: 'Short Passes', value: report.techShortPasses },
      { label: 'Long Passes', value: report.techLongPasses },
      { label: 'Aerial', value: report.techAerial },
      { label: 'Crossing', value: report.techCrossing },
      { label: 'Finishing', value: report.techFinishing },
      { label: 'Dribbling', value: report.techDribbling },
      { label: '1v1 Offense', value: report.techOneVsOneOffense },
      { label: '1v1 Defense', value: report.techOneVsOneDefense },
    ];
    const ovAttrs: { label: string; value: number }[] = [
      { label: 'Strength', value: report.physStrength },
      { label: 'Speed', value: report.physSpeed },
      { label: 'Agility', value: report.physAgility },
      { label: 'Coordination', value: report.physCoordination },
      { label: 'Positioning', value: report.tacPositioning },
      { label: 'Transition', value: report.tacTransition },
      { label: 'Decisions', value: report.tacDecisions },
      { label: 'Anticipation', value: report.tacAnticipations },
      { label: 'Duels', value: report.tacDuels },
      { label: 'Set Pieces', value: report.tacSetPieces },
    ];

    const validPos = posAttrs.filter(a => a.value && a.value > 0);
    const validOv = ovAttrs.filter(a => a.value && a.value > 0);

    return {
      positionRadar: validPos.length >= 3 ? { labels: validPos.map(a => a.label), values: validPos.map(a => a.value), title: 'TECHNICAL RADAR' } : null,
      overallRadar: validOv.length >= 3 ? { labels: validOv.map(a => a.label), values: validOv.map(a => a.value), title: 'PHYSICAL & TACTICAL' } : null,
    };
  }, [report]);

  useEffect(() => {
    params.then(({ playerId: pid }) => {
      setPlayerId(pid);
      fetch(`/api/grades/${pid}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch report');
          return res.json();
        })
        .then(data => {
          if (!data) {
            setError('No report found for this player');
          } else {
            // API returns single object or array
            const first = Array.isArray(data) ? data[0] : data;
            setReport(first);
            if (Array.isArray(data)) {
              setAllReports(data);
            } else {
              setAllReports([data]);
            }
          }
          setLoading(false);
        })
        .catch(err => {
          setError(err.message);
          setLoading(false);
        });
    });
  }, [params]);

  const reloadReports = (pid: string) => {
    fetch(`/api/grades/${pid}`)
      .then(res => res.json())
      .then(data => {
        if (!data) return;
        const first = Array.isArray(data) ? data[0] : data;
        setReport(first);
        setAllReports(Array.isArray(data) ? data : [data]);
      })
      .catch(() => {});
  };

  const handleAdminEditSave = () => {
    setEditingReport(null);
    if (playerId) reloadReports(playerId);
  };

  // Fetch attachments when report changes
  useEffect(() => {
    if (!report?.scoutId || !playerId) return;
    const reportId = `${playerId}-${report.scoutId}`;
    fetch(`/api/attachments/${reportId}`)
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) setAttachments(data);
      })
      .catch(() => setAttachments([]));
  }, [report?.scoutId, playerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Loading report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">{error || 'Report not found'}</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Top bar */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          <Link href={`/player/${playerId}`} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            Open Player Profile →
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Report selector (when multiple scouts graded this player) */}
        {allReports.length > 1 && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500 mb-2">{allReports.length} scout reports for this player</p>
            <div className="flex flex-wrap gap-2">
              {allReports.map((r, i) => (
                <button
                  key={i}
                  onClick={() => setReport(r)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    report?.scoutId === r.scoutId && report?.scoutName === r.scoutName
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {r.scoutName || `Scout ${i + 1}`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Admin Edit Form */}
        {editingReport && (
          <div className="bg-zinc-900 rounded-xl border-2 border-amber-600 p-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-zinc-700">
              <span className="text-lg">✏️</span>
              <h2 className="text-lg font-bold text-amber-400">Admin Edit Mode</h2>
              <span className="text-sm text-zinc-400 ml-auto">Editing {editingReport.scoutName}&apos;s report</span>
            </div>
            <GradingForm
              player={{
                id: playerId,
                name: editingReport.playerName,
                position: editingReport.position,
                club: editingReport.club,
              }}
              existingGrade={editingReport as unknown as PlayerGrade}
              isAdminEdit={true}
              onSave={handleAdminEditSave}
              onCancel={() => setEditingReport(null)}
            />
          </div>
        )}

        {/* Header */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{report.playerName}</h1>
              <p className="text-sm text-zinc-400 mt-1">{report.position} • {report.club}</p>
              <p className="text-xs text-zinc-500 mt-2">
                Scouted by <span className="text-zinc-300">{report.scoutName || 'Unknown'}</span> • {new Date(report.gradedAt).toLocaleDateString()}
              </p>
              {/* Edited by indicator */}
              {report.editedBy && (
                <p className="text-xs text-amber-400/80 mt-1">
                  ✏️ Edited by <span className="font-medium text-amber-400">{report.editedBy}</span> on {report.editedAt ? new Date(report.editedAt).toLocaleDateString() : ''}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Admin Edit Button */}
              {isAdmin && !editingReport && (
                <button
                  onClick={() => setEditingReport(report)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm font-medium transition-colors"
                  title="Edit this report (Admin)"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Edit
                </button>
              )}
              <span className={`px-3 py-1.5 text-sm font-bold rounded ${verdictColors[report.verdict] || 'bg-zinc-600 text-white'}`}>
                {report.verdict}
              </span>
            </div>
          </div>

          {/* Overall Scores */}
          <div className="flex flex-wrap items-center gap-4 mt-5 pt-5 border-t border-zinc-800">
            <div>
              <p className="text-xs text-zinc-500 mb-1">Ability</p>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-lg font-bold text-sm ${getPotentialColor(report.ability)}`}>
                {POTENTIAL_LABELS[report.ability] || report.ability}
              </span>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-1">Potential</p>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-lg font-bold text-sm ${getPotentialColor(report.potential)}`}>
                {POTENTIAL_LABELS[report.potential] || report.potential}
              </span>
            </div>
            {report.salary && (
              <div className="text-center ml-auto">
                <p className="text-xs text-zinc-500 mb-1">Est. Salary</p>
                <p className="text-sm font-semibold text-green-400">{report.salary}</p>
              </div>
            )}
            {report.transferFee && (
              <div className="text-center">
                <p className="text-xs text-zinc-500 mb-1">Transfer Fee</p>
                <p className="text-sm font-semibold text-green-400">{report.transferFee}</p>
              </div>
            )}
          </div>
        </div>

        {/* Wyscout Advanced Metrics (above scout evaluation) */}
        <WyscoutRadars playerId={playerId} tmPosition={report.position} />

        {/* Scout evaluation radars removed — Wyscout radars above are sufficient */}

        {/* Position-Specific Attributes (new system) */}
        {report.positionAttributes && Object.keys(report.positionAttributes).length > 0 && (() => {
          const template = getPositionTemplate(report.position);
          if (template.groups.length === 0) return null;
          const toRoman = (n: number) => ['I','II','III','IV','V','VI','VII','VIII'][n - 1] || `${n}`;
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {template.groups.map((group, gi) => (
                <div key={gi} className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                    {toRoman(gi + 1)}. {group.title}
                  </h3>
                  {group.attributes.map(attr => (
                    <AttributeRow
                      key={attr}
                      label={attr}
                      ability={report.positionAttributes![attr] || 0}
                    />
                  ))}
                </div>
              ))}
            </div>
          );
        })()}

        {/* Legacy Attributes (shown when no positionAttributes) */}
        {(!report.positionAttributes || Object.keys(report.positionAttributes).length === 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Physical */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">I. Physical</h3>
            <AttributeRow label="Strength" ability={report.physStrength} />
            <AttributeRow label="Speed" ability={report.physSpeed} />
            <AttributeRow label="Agility" ability={report.physAgility} />
            <AttributeRow label="Coordination" ability={report.physCoordination} />
          </div>

          {/* Technique */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">II. Technique</h3>
            <AttributeRow label="Control" ability={report.techControl} />
            <AttributeRow label="Short passes" ability={report.techShortPasses} />
            <AttributeRow label="Long passes" ability={report.techLongPasses} />
            <AttributeRow label="Aerial" ability={report.techAerial} />
            <AttributeRow label="Crossing" ability={report.techCrossing} />
            <AttributeRow label="Finishing" ability={report.techFinishing} />
            <AttributeRow label="Dribbling" ability={report.techDribbling} />
            <AttributeRow label="1v1 Offense" ability={report.techOneVsOneOffense} />
            <AttributeRow label="1v1 Defense" ability={report.techOneVsOneDefense} />
          </div>

          {/* Tactic */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">III. Tactic</h3>
            <AttributeRow label="Positioning" ability={report.tacPositioning} />
            <AttributeRow label="Transition" ability={report.tacTransition} />
            <AttributeRow label="Decisions" ability={report.tacDecisions} />
            <AttributeRow label="Anticipation" ability={report.tacAnticipations} />
            <AttributeRow label="Duels" ability={report.tacDuels} />
            <AttributeRow label="Set pieces" ability={report.tacSetPieces} />
          </div>
        </div>
        )}

        {/* Tags */}
        {report.scoutingTags && report.scoutingTags.length > 0 && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Scouting Tags</h3>
            <div className="flex flex-wrap gap-2">
              {report.scoutingTags.map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Role, Conclusion, Notes */}
        {(report.role || report.conclusion || report.notes) && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
            {report.role && (
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Role</h3>
                <p className="text-sm text-white">{report.role}</p>
              </div>
            )}
            {report.conclusion && (
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Conclusion</h3>
                <p className="text-sm text-white whitespace-pre-wrap">{report.conclusion}</p>
              </div>
            )}
            {report.notes && (
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">Notes</h3>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">{report.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 space-y-4">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Attachments ({attachments.length})
            </h3>
            <div className="space-y-3">
              {attachments.map(att => {
                const isImage = att.fileType.startsWith('image/');
                const isVideo = att.fileType.startsWith('video/');
                const isPdf = att.fileType === 'application/pdf';

                return (
                  <div key={att.id} className="space-y-2">
                    {/* Image thumbnail */}
                    {isImage && (
                      <a href={att.url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={att.url}
                          alt={att.fileName}
                          className="w-full max-w-md rounded-lg border border-zinc-700 hover:border-blue-500 transition-colors"
                        />
                      </a>
                    )}

                    {/* Video player */}
                    {isVideo && (
                      <video
                        src={att.url}
                        controls
                        className="w-full max-w-lg rounded-lg border border-zinc-700"
                        preload="metadata"
                      />
                    )}

                    {/* File info row */}
                    <div className="flex items-center gap-3 p-2 bg-zinc-800/50 rounded-lg">
                      <span className="text-lg flex-shrink-0">
                        {isPdf ? '📄' : isVideo ? '🎬' : isImage ? '🖼️' : '📎'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-300 truncate block"
                        >
                          {att.fileName}
                        </a>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-zinc-500">
                            {att.fileSize < 1024 * 1024
                              ? `${(att.fileSize / 1024).toFixed(1)} KB`
                              : `${(att.fileSize / (1024 * 1024)).toFixed(1)} MB`
                            }
                          </span>
                          {att.label && (
                            <span className="text-xs text-zinc-400 bg-zinc-700 px-1.5 py-0.5 rounded">
                              {att.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* READ ONLY notice */}
        <div className="text-center py-4">
          <p className="text-xs text-zinc-600">Read-only view • <Link href={`/player/${playerId}`} className="text-blue-500 hover:text-blue-400">Open player profile to edit or create your own report</Link></p>
        </div>
      </div>
    </main>
  );
}
