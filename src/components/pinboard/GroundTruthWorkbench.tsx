'use client';

import { useEffect, useState } from 'react';

type Citation = { heading: string; excerpt: string; url: string; score: number };
type Response = { answer: string; abstained: boolean; reason?: string; citations: Citation[]; telemetry: { latency_ms: number; cost_usd: number; embedding_provider: string } };

const API = process.env.NEXT_PUBLIC_GROUNDTRUTH_API_URL
  ? `https://${process.env.NEXT_PUBLIC_GROUNDTRUTH_API_URL.replace(/^https?:\/\//, '').replace(/\/$/, '')}`
  : 'http://localhost:8000';

export function GroundTruthWorkbench() {
  const [query, setQuery] = useState('What does len return?');
  const [result, setResult] = useState<Response | null>(null);
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        const response = await fetch(`${API}/health`, { cache: 'no-store' });
        const health = response.ok ? await response.json() as { status?: string } : null;
        if (mounted) setStatus(health?.status === 'ok' ? 'online' : 'offline');
      } catch {
        if (mounted) setStatus('offline');
      }
    };

    void checkHealth();
    const interval = window.setInterval(checkHealth, 5000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const runQuery = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/v1/query`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
      if (!response.ok) throw new Error('Query failed');
      setResult(await response.json() as Response);
      setStatus('online');
    } catch {
      setStatus('offline');
    } finally {
      setLoading(false);
    }
  };

  return <div className="flex flex-col gap-4">
    <div className="flex items-center justify-between"><div><h2 className="font-headline-md text-on-surface">GroundTruth Live Query</h2><p className="font-body-sm text-on-surface-variant">Cited technical-documentation retrieval with explicit abstention.</p></div><span className={`font-mono text-[10px] px-2 py-1 rounded ${status === 'online' ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-container-high text-outline'}`}>{status === 'online' ? 'API ONLINE' : status === 'checking' ? 'CHECKING API' : 'API OFFLINE'}</span></div>
    <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container-high flex flex-col gap-2"><label className="font-mono text-[10px] text-outline uppercase">Technical documentation question</label><textarea value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-20 p-3 rounded bg-surface-container-lowest border border-outline-variant text-on-surface font-body-sm" /><button type="button" onClick={runQuery} disabled={loading || !query.trim()} className="self-start h-9 px-4 bg-primary text-on-primary rounded font-label-sm uppercase tracking-wider disabled:opacity-50">{loading ? 'Retrieving…' : 'Run grounded query'}</button></div>
    {status === 'offline' && !result && <div className="p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 font-body-sm">Start the local API first: <code className="font-mono text-xs">cd groundtruth; uv run uvicorn app.main:app --port 8000</code></div>}
    {result && <div className="p-4 rounded-lg border border-surface-container-high bg-surface-container-low flex flex-col gap-3"><span className={`font-mono text-[10px] uppercase ${result.abstained ? 'text-amber-800' : 'text-emerald-800'}`}>{result.abstained ? `Abstained: ${result.reason}` : 'Evidence found'}</span><p className="font-body-md text-on-surface">{result.answer}</p>{result.citations.map((citation) => <a key={`${citation.url}-${citation.heading}`} href={citation.url} target="_blank" rel="noreferrer" className="p-3 rounded bg-surface-container-lowest border border-surface-container-high text-on-surface hover:border-secondary"><span className="font-mono text-[10px] text-secondary uppercase">{citation.heading} · score {citation.score.toFixed(3)}</span><p className="font-body-sm mt-1">{citation.excerpt}</p></a>)}<span className="font-mono text-[10px] text-outline">{result.telemetry.latency_ms} ms · ${result.telemetry.cost_usd.toFixed(4)} · {result.telemetry.embedding_provider}</span></div>}
  </div>;
}
