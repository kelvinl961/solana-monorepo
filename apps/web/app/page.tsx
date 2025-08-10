"use client";

import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [slot, setSlot] = useState<string>("");
  const [count, setCount] = useState<number | null>(null);
  const [meta, setMeta] = useState<{ blockTime?: number | null; parentSlot?: number; blockhash?: string } | null>(null);
  const [commitment, setCommitment] = useState<'confirmed' | 'finalized'>('confirmed');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explorer, setExplorer] = useState<'solscan' | 'solanafm' | 'explorer'>('solscan');

  const apiUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000", []);

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
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
        } else {
          const message = err instanceof Error ? err.message : "Failed to fetch";
          setError(message);
        }
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
      const res = await fetch(`${apiUrl}/block/latest`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { slot: number };
      setSlot(String(data.slot));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch latest slot";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

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
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === 'solscan' || v === 'solanafm' || v === 'explorer') setExplorer(v);
                  }}
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
    </div>
  );
}
