'use client';

import { useRouter } from 'next/router';

export default function LiveEntry() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container pt-24">
        <h1 className="text-3xl font-bold mb-4">Live Entry</h1>
        <p className="text-zinc-400 mb-6">This page will become the live play-entry SPA. For now, select a mode:</p>
        <div className="flex gap-4">
          <button onClick={() => router.push('/enter/offense')} className="px-4 py-2 bg-blue-600 rounded">Offense</button>
          <button onClick={() => router.push('/enter/defense')} className="px-4 py-2 bg-emerald-600 rounded">Defense</button>
        </div>
      </div>
    </div>
  );
}
