"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function Home() {
  const [slot, setSlot] = useState<string>("");
  const [count, setCount] = useState<number | null>(null);
  const [meta, setMeta] = useState<{ blockTime?: number | null; parentSlot?: number; blockhash?: string } | null>(null);
  const [commitment, setCommitment] = useState<'confirmed' | 'finalized'>('confirmed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explorer, setExplorer] = useState<'solscan' | 'solanafm' | 'explorer'>('solscan');
  const [isLive, setIsLive] = useState<boolean>(false);
  const [recent, setRecent] = useState<Array<{ slot: number; transactionCount: number }>>([]);
  const [history, setHistory] = useState<number[]>([]);
  const liveTimer = useRef<NodeJS.Timer | null>(null);

  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000", []);

  // Debounced fetch on slot change (typeahead)
  useEffect(() => {
    if (!slot) {
      setCount(null);
      setError(null);
      return;
    }
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiUrl}/block/${slot}/summary?commitment=${commitment}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { slot: number; transactionCount: number; blockTime?: number | null; parentSlot?: number; blockhash?: string };
        setCount(data.transactionCount);
        setMeta({ blockTime: data.blockTime ?? null, parentSlot: data.parentSlot, blockhash: data.blockhash });
        // Update history (unique, latest first, max 10)
        setHistory((prev) => {
          const n = Number(slot);
          const next = [n, ...prev.filter((s) => s !== n)].slice(0, 10);
          localStorage.setItem('history', JSON.stringify(next));
          return next;
        });
      } catch (err: any) {
        if (err.name !== "AbortError") setError(err.message ?? "Failed to fetch");
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => {
      controller.abort();
      clearTimeout(handle);
    };
  }, [slot, commitment, apiUrl]);

  const useLatest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/block/latest?commitment=${commitment}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { slot: number };
      setSlot(String(data.slot));
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch latest slot");
    } finally {
      setLoading(false);
    }
  };

  // Load persisted UI state
  useEffect(() => {
    try {
      const savedSlot = localStorage.getItem('slot');
      const savedCommit = localStorage.getItem('commitment');
      const savedExplorer = localStorage.getItem('explorer');
      const savedLive = localStorage.getItem('isLive');
      const savedHistory = localStorage.getItem('history');
      if (savedSlot) setSlot(savedSlot);
      if (savedCommit === 'confirmed' || savedCommit === 'finalized') setCommitment(savedCommit);
      if (savedExplorer === 'solscan' || savedExplorer === 'solanafm' || savedExplorer === 'explorer') setExplorer(savedExplorer);
      if (savedLive === 'true') setIsLive(true);
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch {}
    // Initial recent fetch
    void (async () => {
      try {
        const res = await fetch(`${apiUrl}/block/recent?limit=30&commitment=${commitment}`);
        if (res.ok) setRecent((await res.json()) as Array<{ slot: number; transactionCount: number }>);
      } catch {}
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist state
  useEffect(() => { localStorage.setItem('slot', slot); }, [slot]);
  useEffect(() => { localStorage.setItem('commitment', commitment); }, [commitment]);
  useEffect(() => { localStorage.setItem('explorer', explorer); }, [explorer]);
  useEffect(() => { localStorage.setItem('isLive', String(isLive)); }, [isLive]);

  // Live mode: poll latest slot periodically
  useEffect(() => {
    if (!isLive) {
      if (liveTimer.current) clearInterval(liveTimer.current as unknown as number);
      liveTimer.current = null;
      return;
    }
    // Immediately fetch once
    void useLatest();
    const id = setInterval(async () => {
      try {
        const latestRes = await fetch(`${apiUrl}/block/latest?commitment=${commitment}`);
        if (!latestRes.ok) return;
        const latest = (await latestRes.json()) as { slot: number };
        setSlot(String(latest.slot));
        // Refresh recent sparkline too
        const r = await fetch(`${apiUrl}/block/recent?limit=30&commitment=${commitment}`);
        if (r.ok) setRecent((await r.json()) as Array<{ slot: number; transactionCount: number }>);
      } catch {}
    }, 3000);
    liveTimer.current = id as unknown as NodeJS.Timer;
    return () => { clearInterval(id); };
  }, [isLive, apiUrl, commitment]);

  const copyApiUrl = async () => {
    const url = `${apiUrl}/block/${slot}/summary?commitment=${commitment}`;
    try { await navigator.clipboard.writeText(url); } catch {}
  };

  const maxRecent = recent.length > 0 ? Math.max(...recent.map(r => r.transactionCount)) : 0;
  const sparkBars = recent.slice().reverse();

  return (
    <div className="p-8 max-w-2xl mx-auto glass rounded-lg">
      <h1 className="text-2xl font-semibold mb-4">Solana Block Transaction Count</h1>
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Enter block slot"
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            className="input"
            min={0}
          />
          <select
            value={commitment}
            onChange={(e) => setCommitment(e.target.value as 'confirmed' | 'finalized')}
            className="input w-[160px]"
            title="Commitment"
          >
            <option value="confirmed">confirmed</option>
            <option value="finalized">finalized</option>
          </select>
          <button
            onClick={useLatest}
            className="btn-secondary"
            type="button"
          >
            Use latest slot
          </button>
          <label className="flex items-center gap-2 ml-2 text-sm" style={{ color: 'var(--sol-muted)' }}>
            <input type="checkbox" checked={isLive} onChange={(e) => setIsLive(e.target.checked)} /> Live (3s)
          </label>
        </div>
        <p className="text-sm" style={{ color: 'var(--sol-muted)' }}>Typing auto-fetches after 400ms. Old/missing slots may return 0. Choose commitment for consistency.</p>
      </div>
      {error && <p className="text-red-400">{error}</p>}

      {loading && slot && (
        <div className="rounded border p-4 skeleton" style={{ borderColor: 'var(--sol-border)' }}>
          <div className="flex items-baseline justify-between">
            <div className="h-4 w-28 rounded bg-[rgba(255,255,255,0.06)]" />
            <div className="h-5 w-14 rounded bg-[rgba(255,255,255,0.06)]" />
          </div>
          <div className="h-7 w-48 mt-3 rounded bg-[rgba(255,255,255,0.06)]" />
          <div className="mt-3 space-y-2">
            <div className="h-4 w-64 rounded bg-[rgba(255,255,255,0.06)]" />
            <div className="h-4 w-40 rounded bg-[rgba(255,255,255,0.06)]" />
            <div className="h-4 w-80 rounded bg-[rgba(255,255,255,0.06)]" />
          </div>
        </div>
      )}
      {count !== null && !loading && (
        <div className="rounded border p-4" style={{ borderColor: 'var(--sol-border)', background: '#0b1224' }}>
          <div className="flex items-baseline justify-between">
            <p className="text-lg font-medium">Slot {slot}</p>
            <span className="badge">{commitment}</span>
          </div>
          <p className="text-2xl mt-2" style={{ color: 'var(--sol-accent)' }}>{count.toLocaleString()} transactions</p>
          <div className="mt-2">
            <button className="btn-secondary" onClick={copyApiUrl} type="button">Copy API URL</button>
          </div>
          {meta && (
            <div className="mt-3 text-sm space-y-1" style={{ color: 'var(--sol-muted)' }}>
              {meta.blockTime !== undefined && (
                <p>Time: {meta.blockTime ? new Date(meta.blockTime * 1000).toLocaleString() : 'unknown'}</p>
              )}
              {meta.parentSlot !== undefined && <p>Parent slot: {meta.parentSlot}</p>}
              {meta.blockhash && (
                <p className="truncate">Blockhash: <span className="font-mono">{meta.blockhash}</span></p>
              )}
              <div className="flex items-center gap-2">
                <select
                  value={explorer}
                  onChange={(e) => setExplorer(e.target.value as any)}
                  className="input w-[150px]"
                >
                  <option value="solscan">Solscan</option>
                  <option value="solanafm">SolanaFM</option>
                  <option value="explorer">Explorer</option>
                </select>
                <a
                  className="text-blue-400 hover:underline"
                  href={explorer === 'solscan' ? `https://solscan.io/block/${slot}` : explorer === 'solanafm' ? `https://solana.fm/block/${slot}` : `https://explorer.solana.com/block/${slot}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open ↗
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent sparkline */}
      {recent.length > 0 && (
        <div className="rounded border p-4 mt-6" style={{ borderColor: 'var(--sol-border)', background: '#0b1224' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium">Recent slots</p>
            <span className="text-xs" style={{ color: 'var(--sol-muted)' }}>last {recent.length}</span>
          </div>
          <div className="flex items-end gap-[2px] h-20">
            {sparkBars.map((r, idx) => {
              const h = maxRecent ? Math.max(2, Math.round((r.transactionCount / maxRecent) * 72)) : 2;
              return (
                <div key={`${r.slot}-${idx}`} title={`slot ${r.slot}: ${r.transactionCount}`} style={{ height: `${h}px`, width: '6px', background: 'linear-gradient(180deg, var(--sol-accent), #0b1224)' }} />
              );
            })}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="rounded border p-4 mt-6" style={{ borderColor: 'var(--sol-border)', background: '#0b1224' }}>
          <p className="font-medium mb-2">Recent lookups</p>
          <div className="flex flex-wrap gap-2">
            {history.map((s) => (
              <button key={s} className="btn-secondary" onClick={() => setSlot(String(s))} type="button">{s}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
