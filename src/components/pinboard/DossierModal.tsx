import React, { useEffect, useState } from 'react';
import type { DossierItem } from '../../data/ledgerData';

interface DossierModalProps {
  item: DossierItem | null;
  onClose: () => void;
  onOpenDispatch: (subjectPrefix?: string) => void;
  onLaunchDemo?: (item: DossierItem) => void;
}

export const DossierModal: React.FC<DossierModalProps> = ({
  item,
  onClose,
  onOpenDispatch,
  onLaunchDemo,
}) => {
  const [copiedSpec, setCopiedSpec] = useState(false);

  useEffect(() => {
    if (!item) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const handleCopySpec = () => {
    const specText = `${item.title} (${item.code}) — ${item.subtitle} | Details: ${item.metrics
      .map((m) => `${m.label}: ${m.value}`)
      .join(', ')}`;
    navigator.clipboard.writeText(specText).then(() => {
      setCopiedSpec(true);
      setTimeout(() => setCopiedSpec(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-inverse-surface/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dossier-modal-title"
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto deckled-card !bg-[#fcf9f2] paper-texture p-space-lg rounded-xl border border-outline-variant shadow-2xl flex flex-col gap-space-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Washi Tape & 3D Pushpin */}
        <div className="washi-tape -top-3 left-1/2 -translate-x-1/2 w-44 h-6 -rotate-1">
          <span className="font-mono text-[8px] text-outline tracking-widest uppercase flex items-center justify-center h-full">
            ARCHIVAL DOSSIER // INSPECTOR
          </span>
        </div>
        <div className={`pushpin-3d ${item.pinColor} top-3 left-6`}></div>

        {/* Top Bar */}
        <div className="flex items-center justify-between pt-4 border-b border-surface-container-high pb-3">
          <div className="flex items-center gap-2 flex-wrap pl-6">
            <span className="px-2 py-0.5 bg-surface-container-high text-on-surface font-mono text-[10px] uppercase tracking-wider rounded font-semibold">
              {item.section}
            </span>
            <span className="font-mono text-[11px] text-secondary font-bold">
              {item.code}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="distressed-stamp !text-[9px] !py-0.5 hidden sm:inline-flex">
              {item.stamp}
            </span>
            <button
              type="button"
              onClick={onClose}
              data-cursor="CLOSE"
              className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface flex items-center justify-center transition-colors"
              aria-label="Close dossier modal"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="flex flex-col gap-1">
          <h2
            id="dossier-modal-title"
            className="font-headline-md text-headline-md text-on-surface leading-tight"
          >
            {item.title}
          </h2>
          <p className="font-mono text-label-sm text-secondary uppercase tracking-wider font-semibold">
            {item.subtitle}
          </p>
        </div>

        {/* Optional High-Res Schematic or Tactile Image */}
        {item.image && (
          <div className="relative w-full max-h-80 overflow-hidden rounded-lg bg-primary border border-surface-container-high flex items-center justify-center">
            <img
              src={item.image}
              alt={item.imageAlt || item.title}
              referrerPolicy="no-referrer"
              className="w-full h-full max-h-80 object-contain bg-[#161514]"
            />
            {item.imageBadge && (
              <div className="absolute bottom-3 left-3 px-2.5 py-1 bg-surface-container-lowest/95 backdrop-blur border border-surface-container-high text-on-surface font-mono text-[10px] rounded shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                <span>{item.imageBadge}</span>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          {item.summary}
        </p>

        {/* Verified Telemetry & Architectural Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
          {item.metrics.map((m, idx) => (
            <div
              key={idx}
              className="p-2.5 bg-surface-container-lowest rounded-lg border border-surface-container-high shadow-xs flex flex-col gap-0.5"
            >
              <span className="text-[9px] text-outline uppercase tracking-wider">
                {m.label}
              </span>
              <span className="text-[12px] text-on-surface font-bold tabular-nums">
                {m.value}
              </span>
            </div>
          ))}
        </div>

        {/* Detailed Architecture Notes */}
        <div className="p-space-md bg-surface-container-low rounded-lg border border-surface-container-high flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-surface-container-high pb-1.5">
            <span className="font-mono text-[10px] text-outline uppercase tracking-widest font-semibold">
              PROJECT &amp; IMPLEMENTATION DETAILS
            </span>
            <span className="font-mono text-[10px] text-secondary font-bold">
              IMPLEMENTATION NOTES
            </span>
          </div>
          <ul className="space-y-2 pt-1 font-mono text-[12px] text-on-surface">
            {item.architectureNotes.map((note, idx) => (
              <li key={idx} className="flex items-start gap-2 leading-relaxed">
                <span className="text-secondary font-bold select-none">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Technology Stack */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="font-mono text-[10px] text-outline uppercase mr-1">
            TECHNOLOGIES &amp; DETAILS:
          </span>
          {item.techStack.map((tech, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 bg-surface-container text-on-surface font-mono text-[11px] rounded border border-surface-container-high"
            >
              {tech}
            </span>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-surface-container-high">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySpec}
              data-cursor="COPY"
              className="h-9 px-3 bg-surface-container-lowest border border-surface-container-high hover:bg-surface-container text-on-surface rounded font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[15px] text-secondary">
                {copiedSpec ? 'check_circle' : 'content_copy'}
              </span>
              <span>{copiedSpec ? 'Citation Copied ✓' : 'Copy Archival Citation'}</span>
            </button>
            {['groundtruth', 'steadyagent', 'tokensense', 'smallwins'].includes(item.id) && onLaunchDemo && (
              <button type="button" onClick={() => onLaunchDemo(item)} className="h-9 px-3.5 bg-secondary text-on-secondary rounded font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1.5 transition-all">
                <span className="material-symbols-outlined text-[15px]">play_arrow</span><span>Try Demo</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDispatch(`Question about: ${item.title}`);
              }}
              data-cursor="MEMO"
              className="h-9 px-3.5 bg-primary text-on-primary hover:bg-[#222] rounded font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[15px]">mail</span>
              <span>Ask About This Detail</span>
            </button>
          </div>
          <span className="font-mono text-[10px] text-outline uppercase">
            {item.coordinates || 'BENGALURU, KARNATAKA, INDIA (IST / UTC+5:30)'}
          </span>
        </div>
      </div>
    </div>
  );
};
