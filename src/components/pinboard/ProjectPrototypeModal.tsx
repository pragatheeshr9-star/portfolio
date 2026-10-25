'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { GroundTruthWorkbench } from './GroundTruthWorkbench';

export type ProjectPrototypeId = 'groundtruth' | 'steadyagent' | 'tokensense' | 'smallwins';

type ProjectInfo = {
  name: string;
  subtitle: string;
  description: string;
  port: number;
  apiUrl: string;
  runCommand: string;
};

type ApiStatus = 'checking' | 'online' | 'offline';

type DemoResult = {
  headline: string;
  summary: string;
  details: string[];
};

type SteadyAgentResult = {
  status: string;
  outputs: { step: number; tool: string; result: Record<string, unknown> }[];
  trace: { step: number; tool: string; status: string; attempts: number; failure?: string; message?: string }[];
};

type TokenSenseResult = {
  model: string;
  choices: { message: { content: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
};

type SmallWinsResult = {
  candidates: {
    model: string;
    exact_match_rate: number;
    mean_token_f1: number;
    p50_latency_ms: number;
    p95_latency_ms: number;
    total_cost_usd: number;
    failed_cases: number;
    rows: { id: string; prediction: string | null; expected: string; error: string | null }[];
  }[];
  dataset: { cases: number };
};

const PROJECTS: Record<ProjectPrototypeId, ProjectInfo> = {
  groundtruth: {
    name: 'GroundTruth',
    subtitle: 'Find an answer in technical docs',
    description: 'Ask a question. The service returns supporting citations or tells you when the indexed documentation is not enough.',
    port: 8000,
    apiUrl: process.env.NEXT_PUBLIC_GROUNDTRUTH_API_URL || 'http://localhost:8000',
    runCommand: 'cd groundtruth; uv run uvicorn app.main:app --port 8000',
  },
  steadyagent: {
    name: 'SteadyAgent',
    subtitle: 'Calculate a support invoice total',
    description: 'Add three line items with a restricted calculator, then inspect the execution trace.',
    port: 8001,
    apiUrl: process.env.NEXT_PUBLIC_STEADYAGENT_API_URL || 'http://localhost:8001',
    runCommand: 'cd steadyagent; uv run uvicorn app.main:app --port 8001',
  },
  tokensense: {
    name: 'TokenSense',
    subtitle: 'Route a customer support prompt',
    description: 'Send a sample support request through the gateway and inspect its route, cache result, and token count.',
    port: 8002,
    apiUrl: process.env.NEXT_PUBLIC_TOKENSENSE_API_URL || 'http://localhost:8002',
    runCommand: 'cd tokensense; uv run uvicorn app.main:app --port 8002',
  },
  smallwins: {
    name: 'SmallWins',
    subtitle: 'Check a small answer-quality benchmark',
    description: 'Run three fixed documentation questions against the local baseline and review each answer.',
    port: 8003,
    apiUrl: process.env.NEXT_PUBLIC_SMALLWINS_API_URL || 'http://localhost:8003',
    runCommand: 'cd smallwins; uv run uvicorn app.main:app --port 8003',
  },
};

const API_ROOT = (projectId: ProjectPrototypeId) => {
  const apiUrl = PROJECTS[projectId].apiUrl;
  return apiUrl.startsWith('http') ? apiUrl : `https://${apiUrl}`;
};

async function postJson<T>(url: string, body: unknown): Promise<{ data: T; headers: Headers }> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null) as T | { detail?: string } | null;
  if (!response.ok) {
    const detail = data && typeof data === 'object' ? (data as { detail?: unknown }).detail : null;
    const message = typeof detail === 'string' ? detail : `Request failed (${response.status}).`;
    throw new Error(message);
  }
  if (!data) throw new Error('The API returned an empty response.');
  return { data: data as T, headers: response.headers };
}

interface ProjectPrototypeModalProps {
  projectId: ProjectPrototypeId;
  onClose: () => void;
}

export function ProjectPrototypeModal({ projectId, onClose }: ProjectPrototypeModalProps) {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoResult, setDemoResult] = useState<DemoResult | null>(null);
  const [toolName, setToolName] = useState<'calculate' | 'search_notes'>('calculate');
  const [expression, setExpression] = useState('(19.95 * 3) + 12.50');
  const [searchQuery, setSearchQuery] = useState('grounded answers');
  const [chatPrompt, setChatPrompt] = useState('Explain what makes an answer grounded.');

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_ROOT(projectId)}/health`, { cache: 'no-store' });
        if (mounted) setApiStatus(response.ok ? 'online' : 'offline');
      } catch {
        if (mounted) setApiStatus('offline');
      }
    };
    void checkHealth();
    const interval = window.setInterval(checkHealth, 5000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [projectId]);

  const runPrototype = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setDemoResult(null);
    try {
      if (projectId === 'steadyagent') {
        const args = toolName === 'calculate' ? { expression } : { query: searchQuery };
        const { data } = await postJson<SteadyAgentResult & { goal: string }>(`${API_ROOT(projectId)}/v1/run`, {
          goal: toolName === 'calculate' ? 'Calculate the entered expression' : 'Search the project notes',
          steps: [{ tool: toolName, arguments: args }],
        });
        const output = data.outputs[0]?.result;
        const amount = output?.value;
        const matches = output?.matches;
        setDemoResult({
          headline: data.status === 'succeeded' ? 'Task completed' : `Task ${data.status}`,
          summary: typeof amount === 'number'
            ? `Invoice total: $${amount.toFixed(2)}`
            : Array.isArray(matches)
              ? `${matches.length} note${matches.length === 1 ? '' : 's'} found.`
              : data.trace[0]?.message ?? 'No output was returned.',
          details: data.trace.map((step) => `Step ${step.step + 1}: ${step.tool} ${step.status}${step.failure ? ` (${step.failure})` : ''} · ${step.attempts} attempt(s)`),
        });
      } else if (projectId === 'tokensense') {
        const { data, headers } = await postJson<TokenSenseResult>(`${API_ROOT(projectId)}/v1/chat/completions`, {
          model: 'auto',
          messages: [{ role: 'user', content: chatPrompt }],
          max_tokens: 160,
          temperature: 0.2,
        });
        setDemoResult({
          headline: data.model,
          summary: data.choices[0]?.message.content ?? 'The gateway returned no message.',
          details: [
            `Cache: ${headers.get('X-TokenSense-Cache') ?? 'unknown'}`,
            `Route: ${headers.get('X-TokenSense-Route') ?? data.model}`,
            `Tokens: ${data.usage?.total_tokens ?? 'not reported'}`,
          ],
        });
      } else if (projectId === 'smallwins') {
        const { data } = await postJson<SmallWinsResult>(`${API_ROOT(projectId)}/v1/evaluate`, {});
        const baseline = data.candidates[0];
        if (!baseline) throw new Error('The benchmark returned no candidate results.');
        setDemoResult({
          headline: `${baseline.model} · ${data.dataset.cases} sample questions`,
          summary: `Exact match ${(baseline.exact_match_rate * 100).toFixed(0)}% · token F1 ${(baseline.mean_token_f1 * 100).toFixed(0)}%`,
          details: [
            `Median response time: ${baseline.p50_latency_ms.toFixed(2)} ms`,
            `95th percentile: ${baseline.p95_latency_ms.toFixed(2)} ms`,
            `Estimated cost: $${baseline.total_cost_usd.toFixed(6)}`,
            `Failed cases: ${baseline.failed_cases}`,
            ...baseline.rows.map((row) => `${row.id}: ${row.error ? 'failed' : row.prediction === row.expected ? 'matched reference' : 'partial match'}`),
          ],
        });
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The request failed.');
      setApiStatus('offline');
    } finally {
      setBusy(false);
    }
  };

  const project = PROJECTS[projectId];
  const scenarioSurface = projectId === 'groundtruth'
    ? 'border-[#cad9ce] bg-[#edf3ee]'
    : projectId === 'steadyagent'
      ? 'border-[#e3d7bc] bg-[#f5f0e5]'
      : projectId === 'tokensense'
        ? 'border-[#36534a] bg-[#1e302b] text-[#e4f2e9]'
        : 'border-[#e1cdbd] bg-[#f5ece5]';

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6 bg-inverse-surface/65 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-prototype-title"
    >
      <section
        className="relative flex h-[min(88vh,900px)] min-h-[560px] w-full max-w-7xl flex-col overflow-hidden deckled-card !bg-[#fcf9f2] paper-texture rounded-xl border border-outline-variant shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-surface-container-high px-5 py-4 pr-14 sm:px-8 sm:py-5">
          <div className="min-w-0">
            <p className="font-mono text-[10px] text-outline uppercase tracking-wider">Interactive project scenario</p>
            <h2 id="project-prototype-title" className="font-headline-md text-headline-md text-on-surface">{project.name}</h2>
            <p className="font-body-sm text-on-surface-variant">{project.description}</p>
          </div>
          <span className={`shrink-0 font-mono text-[10px] px-2 py-1 rounded ${apiStatus === 'online' ? 'bg-emerald-100 text-emerald-800' : apiStatus === 'checking' ? 'bg-surface-container-high text-outline' : 'bg-amber-100 text-amber-900'}`}>
            {apiStatus === 'checking' ? 'CONNECTING' : apiStatus === 'online' ? 'READY' : 'API OFFLINE'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 w-9 h-9 rounded-full bg-surface-container-high hover:bg-primary hover:text-on-primary flex items-center justify-center"
            aria-label="Close project prototype"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        {projectId === 'groundtruth' ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-7">
            <GroundTruthWorkbench />
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 overflow-y-auto xl:grid-cols-[0.9fr_1.1fr]">
            <form onSubmit={runPrototype} className="flex flex-col gap-5 border-b border-surface-container-high p-5 sm:p-8 xl:border-b-0 xl:border-r">
              <div className={`rounded-lg border p-4 sm:p-5 ${scenarioSurface}`}>
                <p className="font-mono text-[10px] uppercase tracking-wider opacity-70">Live scenario · {project.name}</p>
                <h3 className="mt-2 font-headline-sm text-headline-sm">{project.subtitle}</h3>
              </div>

              {projectId === 'steadyagent' && (
                <>
                  <label htmlFor="steady-tool" className="font-mono text-[10px] uppercase text-outline">Scenario action</label>
                  <select id="steady-tool" value={toolName} onChange={(event) => setToolName(event.target.value as typeof toolName)} className="h-11 px-3 rounded border border-outline-variant bg-surface-container-lowest text-on-surface">
                    <option value="calculate">Add invoice line items</option>
                    <option value="search_notes">Search notes</option>
                  </select>
                  <label htmlFor="steady-input" className="font-mono text-[10px] uppercase text-outline">{toolName === 'calculate' ? 'Line items' : 'Search the project notes'}</label>
                  <input id="steady-input" value={toolName === 'calculate' ? expression : searchQuery} onChange={(event) => toolName === 'calculate' ? setExpression(event.target.value) : setSearchQuery(event.target.value)} className="h-11 px-3 rounded border border-outline-variant bg-surface-container-lowest text-on-surface" required />
                  <p className="font-body-sm text-on-surface-variant">Only the approved calculator or notes search can run. Every action is recorded in the trace.</p>
                </>
              )}

              {projectId === 'tokensense' && (
                <>
                  <label htmlFor="tokensense-prompt" className="font-mono text-[10px] uppercase text-outline">Customer support request</label>
                  <textarea id="tokensense-prompt" value={chatPrompt} onChange={(event) => setChatPrompt(event.target.value)} className="min-h-36 p-3 rounded border border-outline-variant bg-surface-container-lowest text-on-surface" maxLength={1000} required />
                  <p className="font-body-sm text-on-surface-variant">Local demo mode echoes the request; no model provider or API key is used.</p>
                </>
              )}

              {projectId === 'smallwins' && (
                <div className="flex flex-col gap-3 border-y border-surface-container-high py-4">
                  <div><p className="font-mono text-[10px] uppercase text-outline">Fixed sample set</p><p className="font-body-sm text-on-surface">3 question-and-reference pairs about technical documentation.</p></div>
                  <p className="font-mono text-[11px] text-on-surface-variant">Scores are automatic comparisons against the sample references, not human quality judgments.</p>
                </div>
              )}

              {apiStatus === 'offline' && (
                <div className="p-3 rounded border border-amber-300 bg-amber-50 text-amber-900">
                  <p className="font-body-sm">Start this project API in a terminal:</p>
                  <code className="block mt-1 break-all font-mono text-[11px]">{project.runCommand}</code>
                </div>
              )}

              {error && <p role="alert" className="font-body-sm text-red-800">{error}</p>}
              <button type="submit" disabled={busy || apiStatus !== 'online'} className="self-start h-11 px-5 bg-primary text-on-primary rounded font-label-sm uppercase tracking-wider disabled:opacity-50">
                {busy ? 'Running…' : projectId === 'smallwins' ? 'Run sample benchmark' : projectId === 'steadyagent' ? 'Run scenario' : 'Route support request'}
              </button>
            </form>

            <section className="min-h-72 bg-surface-container-lowest/70 p-5 sm:p-8" aria-live="polite" aria-label="Scenario result">
              <p className="font-mono text-[10px] uppercase tracking-wider text-outline">Scenario result</p>
              {demoResult ? (
                <div className="mt-3 flex flex-col gap-2">
                  <p className="font-headline-sm text-headline-sm text-on-surface">{demoResult.headline}</p>
                  <p className="font-body-sm text-on-surface-variant whitespace-pre-wrap break-words">{demoResult.summary}</p>
                  {demoResult.details.map((detail) => <p key={detail} className="font-mono text-[11px] text-on-surface-variant">{detail}</p>)}
                </div>
              ) : (
                <div className="mt-5 flex min-h-48 items-center justify-center border border-dashed border-outline-variant p-5 text-center">
                  <p className="max-w-sm font-body-sm text-on-surface-variant">Run the scenario to see its real API response and supporting details here.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </div>
  );
}