'use client';

import { useRouter } from 'next/router';

export default function AnalyzeDefensePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="container pt-24 pb-12">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">For our Defense</h1>
            <p className="text-zinc-400">Offensive tendencies from scout film and defensive data from Live Entry.</p>
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
            <div className="text-sm text-zinc-400 mb-2">Offensive tendencies</div>
            <div className="text-3xl font-bold">{summary.offense} offense plays</div>
            <p className="text-zinc-400 text-sm mt-2">What scout film says about their offense.</p>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400 mb-2">Live Entry defense</div>
            <div className="text-3xl font-bold">{summary.defense} defense plays</div>
            <p className="text-zinc-400 text-sm mt-2">What our live defensive entries are showing.</p>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400 mb-2">Adjustment</div>
            <div className="text-3xl font-bold text-emerald-400">{selectedGame.opponent}</div>
            <p className="text-zinc-400 text-sm mt-2">{selectedGame.label} on {selectedGame.date}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6">
          <h2 className="text-lg font-semibold mb-2">Tighten edges</h2>
          <p className="text-zinc-300 text-sm">Use the same games and plays tables to drive defensive scouting and live-game adjustment.</p>
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
            <div className="text-sm text-zinc-400 mb-2">Offensive tendencies</div>
            <div className="text-3xl font-bold">Run heavy</div>
            <p className="text-zinc-400 text-sm mt-2">What scout film says about their offense.</p>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400 mb-2">Live Entry defense</div>
            <div className="text-3xl font-bold">Coverage 42%</div>
            <p className="text-zinc-400 text-sm mt-2">What our live defensive entries are showing.</p>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="text-sm text-zinc-400 mb-2">Adjustment</div>
            <div className="text-3xl font-bold text-emerald-400">Tighten edges</div>
            <p className="text-zinc-400 text-sm mt-2">Plan based on scout film and live defensive data.</p>
          </div>
        </div>
      </div>
    </div>
  );
}