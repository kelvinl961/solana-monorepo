"use client";

import { useState } from "react";

export default function Home() {
  const [slot, setSlot] = useState<string>("");
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCount(null);
    try {
      const url = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
      const res = await fetch(`${url}/block/${slot}/tx-count`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { slot: number; transactionCount: number };
      setCount(data.transactionCount);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Solana Block Transaction Count</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="number"
          placeholder="Enter block slot"
          value={slot}
          onChange={(e) => setSlot(e.target.value)}
          className="border px-3 py-2 rounded w-full"
          required
          min={0}
        />
        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={loading || !slot}
        >
          {loading ? "Loading..." : "Lookup"}
        </button>
      </form>
      {error && <p className="text-red-600">{error}</p>}
      {count !== null && (
        <p className="text-lg">Transactions in slot {slot}: {count}</p>
      )}
    </div>
  );
}
