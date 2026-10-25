import React, { useEffect, useState } from 'react';

interface DispatchMemoModalProps {
  isOpen: boolean;
  initialSubject?: string;
  onClose: () => void;
}

const ADVISORY_TOPICS = [
  'Data engineering',
  'Applied AI',
  'Project collaboration',
  'Engineering opportunities',
  'Other conversation',
];

export const DispatchMemoModal: React.FC<DispatchMemoModalProps> = ({
  isOpen,
  initialSubject,
  onClose,
}) => {
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [topic, setTopic] = useState(ADVISORY_TOPICS[0]);
  const [timeSlot, setTimeSlot] = useState('Weekday Morning (10:00 - 12:00 IST)');
  const [memoBody, setMemoBody] = useState('');
  const [submittedReceipt, setSubmittedReceipt] = useState<string | null>(null);

  useEffect(() => {
    if (initialSubject) {
      setMemoBody((prev) =>
        prev ? prev : `Regarding ${initialSubject}:\nWe would like to discuss the project details and how I can help.`
      );
    }
  }, [initialSubject]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const receiptId = `DSP-${Math.floor(1000 + Math.random() * 9000)}`;
    setSubmittedReceipt(receiptId);
  };

  const handleResetAndClose = () => {
    setSubmittedReceipt(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-inverse-surface/60 backdrop-blur-sm"
      onClick={handleResetAndClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dispatch-modal-title"
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto deckled-card !bg-[#faf7f0] paper-texture p-space-lg rounded-xl border border-outline-variant shadow-2xl flex flex-col gap-space-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dual Pushpins & Washi Tape */}
        <div className="pushpin-3d pin-red top-3 left-6"></div>
        <div className="pushpin-3d pin-red top-3 right-14"></div>
        <div className="washi-tape -top-3 left-1/2 -translate-x-1/2 w-44 h-6 rotate-1">
          <span className="font-mono text-[8px] text-outline tracking-widest uppercase flex items-center justify-center h-full">
            DIRECT DISPATCH // MEMO
          </span>
        </div>

        <div className="flex items-center justify-between pt-4 border-b border-surface-container-high pb-3">
          <div className="flex items-center gap-2 pl-6">
            <span className="px-2 py-0.5 bg-surface-container-high text-on-surface font-mono text-[10px] uppercase tracking-wider rounded font-semibold">
              MEMO // DIRECT DISPATCH SPEC
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            data-cursor="CLOSE"
            className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-primary hover:text-on-primary text-on-surface flex items-center justify-center transition-colors"
            aria-label="Close dispatch modal"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {submittedReceipt ? (
          <div className="py-6 flex flex-col items-center text-center gap-4">
            <div className="distressed-stamp border-emerald-700 text-emerald-800 bg-emerald-50 text-xs py-1 px-3">
              DISPATCH STAMPED // {submittedReceipt}
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface">
              Message Prepared
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
              Your message is ready. You may open your mail client with the formatted brief.
            </p>
            <div className="w-full p-3 bg-surface-container-low rounded-lg border border-surface-container-high text-left font-mono text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-outline">RECEIPT ID:</span>
                <span className="text-on-surface font-bold">{submittedReceipt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">RECIPIENT:</span>
                <span className="text-secondary font-bold">pragatheshpragathesh@gmail.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">WINDOW:</span>
                <span className="text-on-surface">{timeSlot}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <a
                  href={`mailto:pragatheshpragathesh@gmail.com?subject=${encodeURIComponent(
                  `[${submittedReceipt}] ${topic}`
                )}&body=${encodeURIComponent(
                  `Sender: ${senderName || 'Your name'} (${senderEmail || 'N/A'})\nPreferred Time: ${timeSlot}\n\n${memoBody}`
                )}`}
                data-cursor="MAILTO"
                className="h-10 px-4 bg-primary text-on-primary rounded font-label-md text-label-md uppercase tracking-wider flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                Open in Email Client
              </a>
              <button
                type="button"
                onClick={handleResetAndClose}
                data-cursor="DONE"
                className="h-10 px-4 bg-surface-container-high text-on-surface rounded font-label-md text-label-md uppercase tracking-wider"
              >
                Return to Pinboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div>
              <h2
                id="dispatch-modal-title"
                className="font-headline-md text-headline-md text-on-surface leading-tight"
              >
                Send a Message to Pragatheesh
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Direct channel to Pragatheesh. Share a project, opportunity, or question.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] text-outline uppercase tracking-wider font-semibold">
                  YOUR NAME / ORGANIZATION
                </label>
                <input
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Your name"
                  className="h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded font-body-sm text-on-surface focus:outline-none focus:border-secondary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] text-outline uppercase tracking-wider font-semibold">
                  YOUR EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  required
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded font-body-sm text-on-surface focus:outline-none focus:border-secondary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] text-outline uppercase tracking-wider font-semibold">
                MESSAGE TOPIC
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded font-body-sm text-on-surface focus:outline-none focus:border-secondary"
              >
                {ADVISORY_TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] text-outline uppercase tracking-wider font-semibold">
                PREFERRED INTRO SLOT
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                {[
                  'Weekday Morning (10:00 - 12:00 IST)',
                  'Weekday Afternoon (14:00 - 17:00 IST)',
                ].map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTimeSlot(slot)}
                    className={`p-2 rounded border text-left transition-all ${
                      timeSlot === slot
                        ? 'bg-secondary-fixed/60 border-secondary text-on-secondary-fixed font-bold'
                        : 'bg-surface-container-lowest border-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] text-outline uppercase tracking-wider font-semibold">
                MESSAGE
              </label>
              <textarea
                rows={3}
                required
                value={memoBody}
                onChange={(e) => setMemoBody(e.target.value)}
                placeholder="Share the project details or question you would like to discuss..."
                className="p-3 bg-surface-container-lowest border border-outline-variant rounded font-body-sm text-on-surface focus:outline-none focus:border-secondary resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-surface-container-high">
              <span className="font-mono text-[10px] text-outline">
                CONTACT: pragatheshpragathesh@gmail.com
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="h-10 px-3.5 bg-surface-container text-on-surface rounded font-label-sm text-label-sm uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-cursor="STAMP"
                  className="h-10 px-4 bg-primary text-on-primary hover:bg-[#222] rounded font-label-md text-label-md uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  Stamp &amp; Dispatch Memo
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
