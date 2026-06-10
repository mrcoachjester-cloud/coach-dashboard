'use client';

import { useRouter } from 'next/router';

export default function AnalyzeOffensePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container pt-24 pb-12">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">For our Offense</h1>
            <p className="text-zinc-400">Live defensive data and defensive data from past film.</p>
          </div>
          <button onClick={() => router.push('/analyze')} className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition-colors">
            Back to Analyze
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <label className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2">
            <span className="text-sm text-zinc-400 whitespace-nowrap">Choose Game</span>
            <select value={selectedGameId} onChange={(event) => setSelectedGameId(event.target.value)} className="bg-transparent text-sm outline-none">
              {gameOptions.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.label} - {game.opponent} ({game.date})
                </option>
              ))}
            </select>
          </label>
          <span className="text-xs uppercase tracking-wide text-zinc-500">{status}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400 mb-2">Live defensive data</div>
            <div className="text-3xl font-bold">{summary.defense} plays</div>
            <p className="text-zinc-400 text-sm mt-2">What we are seeing right now in live entry.</p>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400 mb-2">Past film defense</div>
            <div className="text-3xl font-bold">{summary.total} total</div>
            <p className="text-zinc-400 text-sm mt-2">What the film said they like to call.</p>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400 mb-2">Game</div>
            <div className="text-3xl font-bold text-emerald-400">{selectedGame.label}</div>
            <p className="text-zinc-400 text-sm mt-2">{selectedGame.opponent} on {selectedGame.date}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-6">
          <h2 className="text-lg font-semibold mb-2">Adjustment</h2>
          <p className="text-zinc-300 text-sm">Use the plays table for defensive tendencies and live game reaction.</p>
        </div>
      </div>
    </div>
  );
}
          </div>
          <button onClick={() => router.push('/analyze')} className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 transition-colors">
            Back to Analyze
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400 mb-2">Live defensive data</div>
            <div className="text-3xl font-bold">Base 54%</div>
            <p className="text-zinc-400 text-sm mt-2">What we are seeing right now in live entry.</p>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400 mb-2">Past film defense</div>
            <div className="text-3xl font-bold">Pressure 31%</div>
            <p className="text-zinc-400 text-sm mt-2">What the film said they like to call.</p>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400 mb-2">Adjustment</div>
            <div className="text-3xl font-bold text-emerald-400">Slide help</div>
            <p className="text-zinc-400 text-sm mt-2">Plan based on the difference between live and film.</p>
          </div>
        </div>
      </div>
    </div>
  );
}